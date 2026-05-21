import { getAuthenticatedUser } from "@/lib/auth/get-auth-user";
import { createServerClient } from "@/lib/supabase/server";
import { MiDiaView } from "./MiDiaView";
import type { TaskWithRelations, Project, Profile } from "@/lib/types";

export default async function MiDiaPage() {
  const user = await getAuthenticatedUser();
  const supabase = await createServerClient();

  const [{ data: tasks }, { data: projects }, { data: profiles }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, assignee:profiles!tasks_assigned_to_fkey(*), project:projects(*)")
      .eq("assigned_to", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("*").order("full_name"),
  ]);

  return (
    <MiDiaView
      tasks={(tasks as TaskWithRelations[]) ?? []}
      projects={(projects as Project[]) ?? []}
      profiles={(profiles as Profile[]) ?? []}
      userId={user.id}
    />
  );
}
