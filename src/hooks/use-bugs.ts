"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  Bug,
  BugWithRelations,
  CreateBugInput,
  UpdateBugInput,
} from "@/lib/types";

interface UseBugsReturn {
  bugs: BugWithRelations[];
  loading: boolean;
  error: string | null;
  createBug: (input: CreateBugInput & { reported_by: string }) => Promise<Bug | null>;
  updateBug: (input: UpdateBugInput) => Promise<Bug | null>;
  deleteBug: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useBugs(): UseBugsReturn {
  const [bugs, setBugs] = useState<BugWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useRef(createClient()).current;
  const channelName = useRef(`realtime-bugs-${Math.random()}`).current;
  const isFetchingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchBugs = useCallback(async (silent = false) => {
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
        const query = supabase
          .from("bugs")
          .select(
            `
            *,
            assignee:profiles!bugs_assigned_to_fkey(*),
            reporter:profiles!bugs_reported_by_fkey(*)
          `
          )
          .order("created_at", { ascending: false });

        const { data, error: fetchError } = await Promise.race([query, timeout]);

        if (fetchError) {
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }
          setBugs((prev) => {
            if (prev.length === 0) setError(fetchError.message);
            return prev;
          });
          break;
        }
        setBugs((data as BugWithRelations[]) ?? []);
        setError(null);
        succeeded = true;
        break;
      } catch (err) {
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }
        setBugs((prev) => {
          if (prev.length === 0) {
            const isTimeout = err instanceof Error && err.message === "__timeout__";
            setError(
              isTimeout
                ? "No se pudo conectar con Supabase. El proyecto puede estar pausado (plan gratuito) o sin internet."
                : (err instanceof Error ? err.message : "Error al cargar los bugs.")
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
        fetchBugs(true);
      }, 20000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchBugs();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchBugs(true);
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bugs" },
        () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => fetchBugs(true), 400);
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

  const createBug = useCallback(
    async (input: CreateBugInput & { reported_by: string }): Promise<Bug | null> => {
      const { data, error } = await supabase
        .from("bugs")
        .insert([
          {
            title: input.title,
            description: input.description ?? null,
            severity: input.severity,
            status: input.status,
            system_name: input.system_name ?? null,
            steps_to_reproduce: input.steps_to_reproduce ?? null,
            assigned_to: input.assigned_to ?? null,
            reported_by: input.reported_by,
          },
        ])
        .select()
        .single();

      if (error) {
        setError(error.message);
        return null;
      }
      return data as Bug;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const updateBug = useCallback(
    async (input: UpdateBugInput): Promise<Bug | null> => {
      const { id, ...rest } = input;
      const patch: Record<string, unknown> = { ...rest };
      if ("assigned_to" in input) patch.assigned_to = input.assigned_to ?? null;
      if ("system_name" in input) patch.system_name = input.system_name ?? null;
      if ("steps_to_reproduce" in input) patch.steps_to_reproduce = input.steps_to_reproduce ?? null;

      const { data, error } = await supabase
        .from("bugs")
        .update(patch)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        setError(error.message);
        return null;
      }
      return data as Bug;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const deleteBug = useCallback(
    async (id: string): Promise<boolean> => {
      const { error } = await supabase.from("bugs").delete().eq("id", id);
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
    bugs,
    loading,
    error,
    createBug,
    updateBug,
    deleteBug,
    refetch: fetchBugs,
  };
}
