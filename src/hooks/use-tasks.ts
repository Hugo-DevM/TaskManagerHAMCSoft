"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  Task,
  TaskWithRelations,
  CreateTaskInput,
  UpdateTaskInput,
} from "@/lib/types";

interface UseTasksReturn {
  tasks: TaskWithRelations[];
  loading: boolean;
  error: string | null;
  createTask: (input: CreateTaskInput & { created_by: string }) => Promise<Task | null>;
  updateTask: (input: UpdateTaskInput) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useRef(createClient()).current;
  const channelName = useRef(`realtime-tasks-${Math.random()}`).current;
  const isFetchingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTasks = useCallback(async (silent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!silent) setLoading(true);

    // Cancel any pending auto-retry
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    let succeeded = false;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const timeoutMs = attempt === 1 ? 15000 : attempt === 2 ? 25000 : 35000;
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("__timeout__")), timeoutMs)
        );
        const query = supabase
          .from("tasks")
          .select(
            `
            *,
            assignee:profiles!tasks_assigned_to_fkey(*),
            project:projects(*)
          `
          )
          .order("created_at", { ascending: false });

        const { data, error: fetchError } = await Promise.race([query, timeout]);

        if (fetchError) {
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }
          // Only show error if we have no data at all
          setTasks((prev) => {
            if (prev.length === 0) setError(fetchError.message);
            return prev;
          });
          break;
        }
        setTasks((data as TaskWithRelations[]) ?? []);
        setError(null);
        succeeded = true;
        break;
      } catch (err) {
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }
        // All attempts failed — keep existing data if any; retry in background
        setTasks((prev) => {
          if (prev.length === 0) {
            const isTimeout = err instanceof Error && err.message === "__timeout__";
            setError(
              isTimeout
                ? "No se pudo conectar con Supabase. El proyecto puede estar pausado (plan gratuito) o sin internet."
                : (err instanceof Error ? err.message : "Error al cargar las tareas.")
            );
          }
          return prev;
        });
      }
    }

    isFetchingRef.current = false;
    setLoading(false);

    // If we failed and there IS existing data, retry silently in 20s
    if (!succeeded) {
      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = null;
        fetchTasks(true);
      }, 20000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTasks();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchTasks(true);
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => fetchTasks(true), 400);
        }
      )
      .subscribe();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createTask = useCallback(
    async (input: CreateTaskInput & { created_by: string }): Promise<Task | null> => {
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            title: input.title,
            description: input.description ?? null,
            priority: input.priority,
            status: input.status,
            assigned_to: input.assigned_to ?? null,
            project_id: input.project_id ?? null,
            due_date: input.due_date ?? null,
            created_by: input.created_by,
          },
        ])
        .select()
        .single();

      if (error) {
        setError(error.message);
        return null;
      }
      return data as Task;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const updateTask = useCallback(
    async (input: UpdateTaskInput): Promise<Task | null> => {
      const { id, ...rest } = input;
      const patch: Record<string, unknown> = { ...rest };
      if ("assigned_to" in input) patch.assigned_to = input.assigned_to ?? null;
      if ("project_id" in input) patch.project_id = input.project_id ?? null;
      if ("due_date" in input) patch.due_date = input.due_date ?? null;
      const { data, error } = await supabase
        .from("tasks")
        .update(patch)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        setError(error.message);
        return null;
      }
      return data as Task;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const deleteTask = useCallback(
    async (id: string): Promise<boolean> => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) {
        setError(error.message);
        return false;
      }
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
  };
}
