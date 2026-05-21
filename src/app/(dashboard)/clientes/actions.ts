"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  ClientStatus,
  ClientPriority,
  ClientActionType,
  ClientServiceInterest,
  ClientLeadSource,
  ClientActivityType,
  DocumentType,
} from "@/lib/types";

// ---- CREATE CLIENT ----

interface CreateClientInput {
  company_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  industry?: string;
  status: ClientStatus;
  priority?: ClientPriority;
  estimated_value?: number;
  service_interest?: ClientServiceInterest;
  lead_source?: ClientLeadSource;
  next_action_type?: ClientActionType;
  next_action_date?: string;
  next_action_notes?: string;
  notes?: string;
  created_by: string;
}

export async function createClient(input: CreateClientInput) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("clients")
    .insert([
      {
        company_name: input.company_name,
        name: input.company_name, // keep legacy column in sync
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

  if (error) return { error: error.message };
  revalidatePath("/clientes");
  return { data };
}

// ---- UPDATE CLIENT ----

interface UpdateClientInput {
  id: string;
  company_name?: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  industry?: string | null;
  status?: ClientStatus;
  priority?: ClientPriority;
  estimated_value?: number | null;
  service_interest?: ClientServiceInterest | null;
  lead_source?: ClientLeadSource | null;
  next_action_type?: ClientActionType | null;
  next_action_date?: string | null;
  next_action_notes?: string | null;
  notes?: string | null;
  last_contact_at?: string | null;
}

export async function updateClient(input: UpdateClientInput) {
  const { id, ...rest } = input;
  const patch: Record<string, unknown> = { ...rest };

  // Keep legacy column in sync
  if (input.company_name) patch.name = input.company_name;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("clients")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return { data };
}

// ---- DELETE CLIENT ----

export async function deleteClient(id: string) {
  const supabase = await createServerClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/clientes");
  return { success: true };
}

// ---- CLIENT ACTIVITIES ----

interface CreateActivityInput {
  client_id: string;
  type: ClientActivityType;
  message: string;
  metadata?: Record<string, unknown>;
  created_by: string;
}

export async function createClientActivity(input: CreateActivityInput) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("client_activities")
    .insert([
      {
        client_id: input.client_id,
        type: input.type,
        message: input.message,
        metadata: input.metadata ?? null,
        created_by: input.created_by,
      },
    ])
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/clientes/${input.client_id}`);
  return { data };
}

export async function deleteClientActivity(id: string, clientId: string) {
  const supabase = await createServerClient();
  const { error } = await supabase.from("client_activities").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/clientes/${clientId}`);
  return { success: true };
}

// ---- CLIENT DOCUMENTS ----

interface CreateDocumentInput {
  client_id: string;
  type: DocumentType;
  name: string;
  file_url?: string;
  notes?: string;
  uploaded_by: string;
}

export async function createClientDocument(input: CreateDocumentInput) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("client_documents")
    .insert([
      {
        client_id: input.client_id,
        type: input.type,
        name: input.name,
        file_url: input.file_url ?? null,
        notes: input.notes ?? null,
        uploaded_by: input.uploaded_by,
      },
    ])
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/clientes/${input.client_id}`);
  return { data };
}

export async function deleteClientDocument(id: string, clientId: string) {
  const supabase = await createServerClient();
  const { error } = await supabase.from("client_documents").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/clientes/${clientId}`);
  return { success: true };
}
