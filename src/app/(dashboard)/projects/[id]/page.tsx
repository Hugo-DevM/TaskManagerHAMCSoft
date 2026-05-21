import { notFound } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/get-auth-user";
import { createServerClient } from "@/lib/supabase/server";
import { ProjectDetailView } from "./ProjectDetailView";
import type { TaskWithRelations, ProjectWithStats, Project, Profile } from "@/lib/types";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  const supabase = await createServerClient();

  const [
    { data: rawProject },
    { data: tasks },
    { data: allTasks },
    { data: projects },
    { data: profiles },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("*, creator:profiles!projects_created_by_fkey(*)")
      .eq("id", id)
      .single(),
    supabase
      .from("tasks")
      .select("*, assignee:profiles!tasks_assigned_to_fkey(*), project:projects(*)")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("tasks").select("project_id, status").eq("project_id", id),
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("*").order("full_name"),
  ]);

  if (!rawProject) notFound();

  const projectTasks = (allTasks ?? []);
  const projectWithStats: ProjectWithStats = {
    ...(rawProject as Project & { creator: ProjectWithStats["creator"] }),
    task_count: projectTasks.length,
    completed_task_count: projectTasks.filter((t) => t.status === "Completado").length,
  };

  return (
    <ProjectDetailView
      project={projectWithStats}
      tasks={(tasks as TaskWithRelations[]) ?? []}
      projects={(projects as Project[]) ?? []}
      profiles={(profiles as Profile[]) ?? []}
      userId={user.id}
    />
  );
}
