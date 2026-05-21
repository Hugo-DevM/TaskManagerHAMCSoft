"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ProjectActivityWithProfile } from "@/lib/types";

interface UseProjectActivitiesReturn {
  activities: ProjectActivityWithProfile[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProjectActivities(projectId: string): UseProjectActivitiesReturn {
  const [activities, setActivities] = useState<ProjectActivityWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useRef(createClient()).current;
  const channelName = useRef(`project-activities-${projectId}-${Math.random()}`).current;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFetchingRef = useRef(false);

  const fetchActivities = useCallback(async (silent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!silent) setLoading(true);

    const { data, error: fetchError } = await supabase
      .from("project_activities")
      .select(`*, creator:profiles!project_activities_created_by_fkey(*)`)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setActivities((data as ProjectActivityWithProfile[]) ?? []);
      setError(null);
    }

    isFetchingRef.current = false;
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    fetchActivities();

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_activities", filter: `project_id=eq.${projectId}` },
        () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => fetchActivities(true), 300);
        }
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return { activities, loading, error, refetch: fetchActivities };
}
