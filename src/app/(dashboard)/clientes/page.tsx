import { getAuthenticatedUser } from "@/lib/auth/get-auth-user";
import { createServerClient } from "@/lib/supabase/server";
import { ClientesView } from "./ClientesView";
import type { ClientWithRelations, Project } from "@/lib/types";

export default async function ClientesPage() {
  const user = await getAuthenticatedUser();
  const supabase = await createServerClient();

  const [{ data: clients }, { data: projects }] = await Promise.all([
    supabase
      .from("clients")
      .select("*, project:projects(id, name, status)")
      .order("created_at", { ascending: false }),
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
  ]);

  return (
    <ClientesView
      clients={(clients as ClientWithRelations[]) ?? []}
      projects={(projects as Project[]) ?? []}
      userId={user.id}
    />
  );
}
