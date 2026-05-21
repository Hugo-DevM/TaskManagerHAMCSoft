import { notFound } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/get-auth-user";
import { createServerClient } from "@/lib/supabase/server";
import { ClientDetailView } from "./ClientDetailView";
import type { Client, ProjectWithStats, ClientDocument } from "@/lib/types";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getAuthenticatedUser();
  const supabase = await createServerClient();

  const [
    { data: rawClient },
    { data: rawProjects },
    { data: tasks },
    { data: rawDocuments },
  ] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    supabase
      .from("projects")
      .select("*, creator:profiles!projects_created_by_fkey(*)")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase.from("tasks").select("project_id, status"),
    supabase
      .from("client_documents")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!rawClient) notFound();

  // Compute task stats per project
  const tasksByProject: Record<string, { total: number; completed: number }> = {};
  (tasks ?? []).forEach((t) => {
    if (!t.project_id) return;
    if (!tasksByProject[t.project_id]) tasksByProject[t.project_id] = { total: 0, completed: 0 };
    tasksByProject[t.project_id].total++;
    if (t.status === "Completado") tasksByProject[t.project_id].completed++;
  });

  const projectsWithStats: ProjectWithStats[] = ((rawProjects ?? []) as ProjectWithStats[]).map((p) => {
    const stats = tasksByProject[p.id] ?? { total: 0, completed: 0 };
    return { ...p, client: rawClient as ProjectWithStats["client"], task_count: stats.total, completed_task_count: stats.completed };
  });

  return (
    <ClientDetailView
      client={rawClient as Client}
      projects={projectsWithStats}
      documents={(rawDocuments as ClientDocument[]) ?? []}
      userId={user.id}
    />
  );
}
