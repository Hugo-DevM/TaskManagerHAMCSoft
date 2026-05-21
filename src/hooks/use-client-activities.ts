"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ClientActivityWithProfile } from "@/lib/types";

interface UseClientActivitiesReturn {
  activities: ClientActivityWithProfile[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useClientActivities(clientId: string): UseClientActivitiesReturn {
  const [activities, setActivities] = useState<ClientActivityWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useRef(createClient()).current;
  const channelName = useRef(`client-activities-${clientId}-${Math.random()}`).current;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFetchingRef = useRef(false);

  const fetchActivities = useCallback(async (silent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!silent) setLoading(true);

    const { data, error: fetchError } = await supabase
      .from("client_activities")
      .select(`*, creator:profiles!client_activities_created_by_fkey(*)`)
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setActivities((data as ClientActivityWithProfile[]) ?? []);
      setError(null);
    }

    isFetchingRef.current = false;
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    fetchActivities();

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "client_activities", filter: `client_id=eq.${clientId}` },
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
  }, [clientId]);

  return { activities, loading, error, refetch: fetchActivities };
}
