import { getAuthenticatedUser } from "@/lib/auth/get-auth-user";
import { createServerClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/header";
import { BugKanbanBoard } from "@/components/bugs/bug-kanban-board";
import type { BugWithRelations, Profile } from "@/lib/types";

export default async function BugsPage() {
  const user = await getAuthenticatedUser();
  const supabase = await createServerClient();

  const [{ data: bugs }, { data: profiles }] = await Promise.all([
    supabase
      .from("bugs")
      .select("*, assignee:profiles!bugs_assigned_to_fkey(*), reporter:profiles!bugs_reported_by_fkey(*)")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("*").order("full_name"),
  ]);

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header
        title="Bugs"
        subtitle="Seguimiento de errores en los sistemas desarrollados"
      />
      <div className="p-6 flex-1">
        <BugKanbanBoard
          bugs={(bugs as BugWithRelations[]) ?? []}
          profiles={(profiles as Profile[]) ?? []}
          userId={user.id}
        />
      </div>
    </div>
  );
}
