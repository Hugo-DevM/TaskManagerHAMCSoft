"use server";

import { createServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type {
  ProjectStatus,
  ProjectType,
  ProjectPriority,
  ProjectActivityType,
  ProjectFileType,
} from "@/lib/types";

// ---- CREATE PROJECT ----

interface CreateProjectInput {
  name: string;
  description?: string;
  client_id?: string;
  type?: ProjectType;
  status: ProjectStatus;
  priority?: ProjectPriority;
  start_date?: string;
  due_date?: string;
  estimated_hours?: number;
  budget?: number;
  repository_url?: string;
  staging_url?: string;
  production_url?: string;
  progress?: number;
  created_by: string;
}

export async function createProject(input: CreateProjectInput) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("projects")
    .insert([
      {
        name: input.name,
        description: input.description ?? null,
        client_id: input.client_id ?? null,
        type: input.type ?? null,
        status: input.status,
        priority: input.priority ?? "medium",
        start_date: input.start_date ?? null,
        due_date: input.due_date ?? null,
        estimated_hours: input.estimated_hours ?? null,
        budget: input.budget ?? null,
        repository_url: input.repository_url ?? null,
        staging_url: input.staging_url ?? null,
        production_url: input.production_url ?? null,
        progress: input.progress ?? 0,
        created_by: input.created_by,
      },
    ])
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { data };
}

// ---- UPDATE PROJECT ----

interface UpdateProjectInput {
  id: string;
  name?: string;
  description?: string | null;
  client_id?: string | null;
  type?: ProjectType | null;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  start_date?: string | null;
  due_date?: string | null;
  estimated_hours?: number | null;
  tracked_hours?: number;
  budget?: number | null;
  final_cost?: number | null;
  repository_url?: string | null;
  staging_url?: string | null;
  production_url?: string | null;
  progress?: number;
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
  revalidatePath(`/projects/${id}`);
  return { data };
}

// ---- DELETE PROJECT ----

export async function deleteProject(id: string) {
  const supabase = await createServerClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { success: true };
}

// ---- PROJECT ACTIVITIES ----

interface CreateProjectActivityInput {
  project_id: string;
  type: ProjectActivityType;
  message: string;
  metadata?: Record<string, unknown>;
  created_by: string;
}

export async function createProjectActivity(input: CreateProjectActivityInput) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("project_activities")
    .insert([
      {
        project_id: input.project_id,
        type: input.type,
        message: input.message,
        metadata: input.metadata ?? null,
        created_by: input.created_by,
      },
    ])
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/projects/${input.project_id}`);
  return { data };
}

export async function deleteProjectActivity(id: string, projectId: string) {
  const supabase = await createServerClient();
  const { error } = await supabase.from("project_activities").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

// ---- PROJECT FILES ----

interface CreateProjectFileInput {
  project_id: string;
  name: string;
  type: ProjectFileType;
  file_url?: string;
  notes?: string;
  uploaded_by: string;
}

export async function createProjectFile(input: CreateProjectFileInput) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("project_files")
    .insert([
      {
        project_id: input.project_id,
        name: input.name,
        type: input.type,
        file_url: input.file_url ?? null,
        notes: input.notes ?? null,
        uploaded_by: input.uploaded_by,
      },
    ])
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/projects/${input.project_id}`);
  return { data };
}

export async function deleteProjectFile(id: string, projectId: string) {
  const supabase = await createServerClient();
  const { error } = await supabase.from("project_files").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
