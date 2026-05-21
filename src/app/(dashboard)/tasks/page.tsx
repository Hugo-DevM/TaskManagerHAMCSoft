import { getAuthenticatedUser } from "@/lib/auth/get-auth-user";
import { createServerClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { TaskList } from "@/components/tasks/task-list";
import { TaskPageActions } from "./TaskPageActions";
import type { TaskWithRelations, Project, Profile } from "@/lib/types";

export default async function TasksPage() {
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
        title="Tareas"
        subtitle="Todas las tareas del equipo"
        action={
          <TaskPageActions
            projects={projects as Project[] ?? []}
            profiles={profiles as Profile[] ?? []}
            userId={user.id}
          />
        }
      />
      <div className="p-6">
        <TaskList
          tasks={(tasks as TaskWithRelations[]) ?? []}
          projects={(projects as Project[]) ?? []}
          profiles={(profiles as Profile[]) ?? []}
          userId={user.id}
          showAddButton={false}
        />
      </div>
    </div>
  );
}
