import { notFound } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/get-auth-user";
import { createServerClient } from "@/lib/supabase/server";
import { ProjectDetailView } from "./ProjectDetailView";
import type {
  TaskWithRelations,
  ProjectWithStats,
  Project,
  Profile,
  BugWithRelations,
  Client,
} from "@/lib/types";

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
    { data: bugs },
    { data: clients },
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("*, creator:profiles!projects_created_by_fkey(*), client:clients(*)")
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
    supabase
      .from("bugs")
      .select("*, assignee:profiles!bugs_assigned_to_fkey(*), reporter:profiles!bugs_reported_by_fkey(*)")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("*").order("company_name"),
  ]);

  if (!rawProject) notFound();

  const projectTasks = allTasks ?? [];
  const projectWithStats: ProjectWithStats = {
    ...(rawProject as Project & {
      creator: ProjectWithStats["creator"];
      client: ProjectWithStats["client"];
    }),
    task_count: projectTasks.length,
    completed_task_count: projectTasks.filter((t) => t.status === "Completado").length,
  };

  const client = (rawProject as { client?: Client | null }).client ?? null;

  return (
    <ProjectDetailView
      project={projectWithStats}
      client={client}
      tasks={(tasks as TaskWithRelations[]) ?? []}
      bugs={(bugs as BugWithRelations[]) ?? []}
      projects={(projects as Project[]) ?? []}
      profiles={(profiles as Profile[]) ?? []}
      clients={(clients as Client[]) ?? []}
      userId={user.id}
    />
  );
}
