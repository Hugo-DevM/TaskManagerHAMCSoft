"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  Project,
  ProjectWithStats,
  CreateProjectInput,
  UpdateProjectInput,
} from "@/lib/types";

interface UseProjectsReturn {
  projects: Project[];
  projectsWithStats: ProjectWithStats[];
  loading: boolean;
  error: string | null;
  createProject: (
    input: CreateProjectInput & { created_by: string }
  ) => Promise<Project | null>;
  updateProject: (input: UpdateProjectInput) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useProjects(): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsWithStats, setProjectsWithStats] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useRef(createClient()).current;
  const channelName = useRef(`realtime-projects-${Math.random()}`).current;
  const isFetchingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProjects = useCallback(async (silent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!silent) setLoading(true);

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

        const projectQuery = supabase
          .from("projects")
          .select(
            `
            *,
            creator:profiles!projects_created_by_fkey(*)
          `
          )
          .order("created_at", { ascending: false });

        const taskQuery = supabase.from("tasks").select("project_id, status");

        const [projectResult, taskResult] = await Promise.race([
          Promise.all([projectQuery, taskQuery]),
          timeout,
        ]);

        const { data: projectData, error: projectError } = projectResult;

        if (projectError) {
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }
          setProjects((prev) => {
            if (prev.length === 0) setError(projectError.message);
            return prev;
          });
          break;
        }

        const rawProjects = projectData ?? [];
        setProjects(rawProjects as Project[]);

        const tasksByProject: Record<
          string,
          { total: number; completed: number; pending: number; inProgress: number }
        > = {};

        (taskResult.data ?? []).forEach((task) => {
          if (!task.project_id) return;
          if (!tasksByProject[task.project_id]) {
            tasksByProject[task.project_id] = {
              total: 0,
              completed: 0,
              pending: 0,
              inProgress: 0,
            };
          }
          tasksByProject[task.project_id].total++;
          if (task.status === "Completado") tasksByProject[task.project_id].completed++;
          if (task.status === "Pendiente") tasksByProject[task.project_id].pending++;
          if (task.status === "En progreso") tasksByProject[task.project_id].inProgress++;
        });

        const withStats: ProjectWithStats[] = rawProjects.map((p: Record<string, unknown>) => {
          const stats = tasksByProject[p.id as string] ?? {
            total: 0,
            completed: 0,
            pending: 0,
            inProgress: 0,
          };
          return {
            ...(p as unknown as Project),
            creator: (p.creator as ProjectWithStats["creator"]) ?? null,
            task_count: stats.total,
            completed_task_count: stats.completed,
          };
        });

        setProjectsWithStats(withStats);
        setError(null);
        succeeded = true;
        break;
      } catch (err) {
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }
        setProjects((prev) => {
          if (prev.length === 0) {
            const isTimeout = err instanceof Error && err.message === "__timeout__";
            setError(
              isTimeout
                ? "No se pudo conectar con Supabase. El proyecto puede estar pausado (plan gratuito) o sin internet."
                : "Error al cargar los proyectos."
            );
          }
          return prev;
        });
      }
    }

    isFetchingRef.current = false;
    setLoading(false);

    if (!succeeded) {
      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = null;
        fetchProjects(true);
      }, 20000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchProjects();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchProjects(true);
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => fetchProjects(true), 400);
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

  const createProject = useCallback(
    async (input: CreateProjectInput & { created_by: string }): Promise<Project | null> => {
      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            name: input.name,
            description: input.description ?? null,
            status: input.status,
            created_by: input.created_by,
          },
        ])
        .select()
        .single();

      if (error) {
        setError(error.message);
        return null;
      }
      return data as Project;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const updateProject = useCallback(
    async (input: UpdateProjectInput): Promise<Project | null> => {
      const { id, ...rest } = input;
      const { data, error } = await supabase
        .from("projects")
        .update(rest)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        setError(error.message);
        return null;
      }
      return data as Project;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const deleteProject = useCallback(
    async (id: string): Promise<boolean> => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
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
    projects,
    projectsWithStats,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  };
}
