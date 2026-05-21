"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import type {
  Client,
  ClientWithRelations,
  CreateClientInput,
  UpdateClientInput,
} from "@/lib/types";

interface UseClientsReturn {
  clients: ClientWithRelations[];
  loading: boolean;
  error: string | null;
  createClient: (input: CreateClientInput & { created_by: string }) => Promise<Client | null>;
  updateClient: (input: UpdateClientInput) => Promise<Client | null>;
  deleteClient: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useClients(): UseClientsReturn {
  const [clients, setClients] = useState<ClientWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = useRef(createSupabaseClient()).current;
  const channelName = useRef(`realtime-clients-${Math.random()}`).current;
  const isFetchingRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchClients = useCallback(async (silent = false) => {
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
          .from("clients")
          .select("*")
          .order("created_at", { ascending: false });

        const { data, error: fetchError } = await Promise.race([query, timeout]);

        if (fetchError) {
          if (attempt < 3) {
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }
          setClients((prev) => {
            if (prev.length === 0) setError(fetchError.message);
            return prev;
          });
          break;
        }
        setClients((data as ClientWithRelations[]) ?? []);
        setError(null);
        succeeded = true;
        break;
      } catch (err) {
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, 5000));
          continue;
        }
        setClients((prev) => {
          if (prev.length === 0) {
            const isTimeout = err instanceof Error && err.message === "__timeout__";
            setError(
              isTimeout
                ? "No se pudo conectar con Supabase. El proyecto puede estar pausado (plan gratuito) o sin internet."
                : (err instanceof Error ? err.message : "Error al cargar los clientes.")
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
        fetchClients(true);
      }, 20000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchClients();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchClients(true);
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clients" },
        () => {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => fetchClients(true), 400);
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

  const createClient = useCallback(
    async (input: CreateClientInput & { created_by: string }): Promise<Client | null> => {
      const { data, error } = await supabase
        .from("clients")
        .insert([
          {
            company_name: input.company_name,
            name: input.company_name,
            contact_name: input.contact_name ?? null,
            email: input.email ?? null,
            phone: input.phone ?? null,
            whatsapp: input.whatsapp ?? null,
            website: input.website ?? null,
            industry: input.industry ?? null,
            status: input.status,
            priority: input.priority ?? "medium",
            estimated_value: input.estimated_value ?? null,
            service_interest: input.service_interest ?? null,
            lead_source: input.lead_source ?? null,
            next_action_type: input.next_action_type ?? null,
            next_action_date: input.next_action_date ?? null,
            next_action_notes: input.next_action_notes ?? null,
            notes: input.notes ?? null,
            created_by: input.created_by,
          },
        ])
        .select()
        .single();

      if (error) {
        setError(error.message);
        return null;
      }
      return data as Client;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const updateClient = useCallback(
    async (input: UpdateClientInput): Promise<Client | null> => {
      const { id, ...rest } = input;
      const patch: Record<string, unknown> = { ...rest };
      if (input.company_name) patch.name = input.company_name;

      const { data, error } = await supabase
        .from("clients")
        .update(patch)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        setError(error.message);
        return null;
      }
      return data as Client;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const deleteClient = useCallback(
    async (id: string): Promise<boolean> => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
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
    clients,
    loading,
    error,
    createClient,
    updateClient,
    deleteClient,
    refetch: fetchClients,
  };
}
