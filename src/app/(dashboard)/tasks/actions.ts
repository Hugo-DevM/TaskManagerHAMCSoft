"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { TaskPriority, TaskStatus } from "@/lib/types";

interface CreateTaskInput {
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to?: string;
  project_id?: string;
  due_date?: string;
  created_by: string;
}

interface UpdateTaskInput {
  id: string;
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  assigned_to?: string | null;
  project_id?: string | null;
  due_date?: string | null;
}

export async function createTask(input: CreateTaskInput) {
  const supabase = await createServerClient();
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

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { data };
}

export async function updateTask(input: UpdateTaskInput) {
  const { id, ...rest } = input;
  const patch: Record<string, unknown> = { ...rest };
  if ("assigned_to" in input) patch.assigned_to = input.assigned_to ?? null;
  if ("project_id" in input) patch.project_id = input.project_id ?? null;
  if ("due_date" in input) patch.due_date = input.due_date ?? null;

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { data };
}

export async function deleteTask(id: string) {
  const supabase = await createServerClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { success: true };
}
