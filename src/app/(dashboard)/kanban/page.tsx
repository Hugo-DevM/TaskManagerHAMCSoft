import { getAuthenticatedUser } from "@/lib/auth/get-auth-user";
import { createServerClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { KanbanBoard } from "@/components/tasks/kanban-board";
import type { TaskWithRelations, Project, Profile } from "@/lib/types";

export default async function KanbanPage() {
  const user = await getAuthenticatedUser();
  const supabase = await createServerClient();

  const [{ data: tasks }, { data: projects }, { data: profiles }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, assignee:profiles!tasks_assigned_to_fkey(*), project:projects(*)")
      .order("created_at", { ascending: false }),
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("*").order("full_name"),
  ]);

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header
        title="Kanban"
        subtitle="Vista del flujo de trabajo por estado"
      />
      <div className="p-6 flex-1">
        <KanbanBoard
          tasks={(tasks as TaskWithRelations[]) ?? []}
          projects={(projects as Project[]) ?? []}
          profiles={(profiles as Profile[]) ?? []}
          userId={user.id}
        />
      </div>
    </div>
  );
}
