import { getAuthenticatedUser } from "@/lib/auth/get-auth-user";
import { createServerClient } from "@/lib/supabase/server";
import { ClientesView } from "./ClientesView";
import type { Client } from "@/lib/types";

export default async function ClientesPage() {
  const user = await getAuthenticatedUser();
  const supabase = await createServerClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <ClientesView
      clients={(clients as Client[]) ?? []}
      userId={user.id}
    />
  );
}
