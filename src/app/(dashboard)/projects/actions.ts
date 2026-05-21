"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ProjectStatus } from "@/lib/types";

interface CreateProjectInput {
  name: string;
  description?: string;
  status: ProjectStatus;
  created_by: string;
}

interface UpdateProjectInput {
  id: string;
  name?: string;
  description?: string;
  status?: ProjectStatus;
}

export async function createProject(input: CreateProjectInput) {
  const supabase = await createServerClient();
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

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { data };
}

export async function updateProject(input: UpdateProjectInput) {
  const { id, ...rest } = input;
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("projects")
    .update(rest)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { data };
}

export async function deleteProject(id: string) {
  const supabase = await createServerClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { success: true };
}
