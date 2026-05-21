import { getAuthenticatedUser } from "@/lib/auth/get-auth-user";
import { createServerClient } from "@/lib/supabase/server";
import { ProjectsView } from "./ProjectsView";
import type { Project, ProjectWithStats, Client } from "@/lib/types";

export default async function ProjectsPage() {
  const user = await getAuthenticatedUser();
  const supabase = await createServerClient();

  const [{ data: projects, error: projectsError }, { data: tasks }, { data: clients }] = await Promise.all([
    supabase
      .from("projects")
      .select("*, creator:profiles!projects_created_by_fkey(*), client:clients(*)")
      .order("created_at", { ascending: false }),
    supabase.from("tasks").select("project_id, status"),
    supabase.from("clients").select("*").order("created_at", { ascending: false }),
  ]);

  // Si el join con clients falla (migración no aplicada), caemos a select simple
  const rawProjectData = projectsError
    ? (await supabase.from("projects").select("*, creator:profiles!projects_created_by_fkey(*)").order("created_at", { ascending: false })).data
    : projects;

  const rawProjects = (rawProjectData ?? []) as (Project & {
    creator: ProjectWithStats["creator"];
    client: ProjectWithStats["client"];
  })[];

  const tasksByProject: Record<string, { total: number; completed: number }> = {};
  (tasks ?? []).forEach((t) => {
    if (!t.project_id) return;
    if (!tasksByProject[t.project_id]) tasksByProject[t.project_id] = { total: 0, completed: 0 };
    tasksByProject[t.project_id].total++;
    if (t.status === "Completado") tasksByProject[t.project_id].completed++;
  });

  const projectsWithStats: ProjectWithStats[] = rawProjects.map((p) => {
    const stats = tasksByProject[p.id] ?? { total: 0, completed: 0 };
    return { ...p, task_count: stats.total, completed_task_count: stats.completed };
  });

  return (
    <ProjectsView
      projectsWithStats={projectsWithStats}
      clients={(clients as Client[]) ?? []}
      userId={user.id}
    />
  );
}
