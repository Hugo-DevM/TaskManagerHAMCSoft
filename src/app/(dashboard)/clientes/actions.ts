"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ClientStatus, ClientActionType } from "@/lib/types";

interface CreateClientInput {
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  status: ClientStatus;
  next_action_type?: ClientActionType;
  next_action_date?: string;
  next_action_notes?: string;
  project_id?: string;
  requirements?: string;
  notes?: string;
  created_by: string;
}

interface UpdateClientInput {
  id: string;
  name?: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: ClientStatus;
  next_action_type?: ClientActionType | null;
  next_action_date?: string | null;
  next_action_notes?: string | null;
  project_id?: string | null;
  requirements?: string | null;
  notes?: string | null;
}

export async function createClient(input: CreateClientInput) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("clients")
    .insert([
      {
        name: input.name,
        contact_name: input.contact_name ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        status: input.status,
        next_action_type: input.next_action_type ?? null,
        next_action_date: input.next_action_date ?? null,
        next_action_notes: input.next_action_notes ?? null,
        project_id: input.project_id ?? null,
        requirements: input.requirements ?? null,
        notes: input.notes ?? null,
        created_by: input.created_by,
      },
    ])
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/clientes");
  return { data };
}

export async function updateClient(input: UpdateClientInput) {
  const { id, ...rest } = input;
  const patch: Record<string, unknown> = { ...rest };
  if ("contact_name" in input) patch.contact_name = input.contact_name ?? null;
  if ("email" in input) patch.email = input.email ?? null;
  if ("phone" in input) patch.phone = input.phone ?? null;
  if ("next_action_type" in input) patch.next_action_type = input.next_action_type ?? null;
  if ("next_action_date" in input) patch.next_action_date = input.next_action_date ?? null;
  if ("next_action_notes" in input) patch.next_action_notes = input.next_action_notes ?? null;
  if ("project_id" in input) patch.project_id = input.project_id ?? null;
  if ("requirements" in input) patch.requirements = input.requirements ?? null;
  if ("notes" in input) patch.notes = input.notes ?? null;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("clients")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/clientes");
  return { data };
}

export async function deleteClient(id: string) {
  const supabase = await createServerClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/clientes");
  return { success: true };
}
