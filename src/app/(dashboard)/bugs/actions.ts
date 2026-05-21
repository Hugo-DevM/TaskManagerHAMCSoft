"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { BugSeverity, BugStatus } from "@/lib/types";

interface CreateBugInput {
  title: string;
  description?: string;
  severity: BugSeverity;
  status: BugStatus;
  system_name?: string;
  steps_to_reproduce?: string;
  assigned_to?: string;
  reported_by: string;
}

interface UpdateBugInput {
  id: string;
  title?: string;
  description?: string;
  severity?: BugSeverity;
  status?: BugStatus;
  system_name?: string | null;
  steps_to_reproduce?: string | null;
  assigned_to?: string | null;
}

export async function createBug(input: CreateBugInput) {
  const supabase = await createServerClient();
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

  if (error) return { error: error.message };
  revalidatePath("/bugs");
  return { data };
}

export async function updateBug(input: UpdateBugInput) {
  const { id, ...rest } = input;
  const patch: Record<string, unknown> = { ...rest };
  if ("assigned_to" in input) patch.assigned_to = input.assigned_to ?? null;
  if ("system_name" in input) patch.system_name = input.system_name ?? null;
  if ("steps_to_reproduce" in input) patch.steps_to_reproduce = input.steps_to_reproduce ?? null;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("bugs")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/bugs");
  return { data };
}

export async function deleteBug(id: string) {
  const supabase = await createServerClient();
  const { error } = await supabase.from("bugs").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/bugs");
  return { success: true };
}
