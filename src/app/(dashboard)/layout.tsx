import { getAuthenticatedUser } from "@/lib/auth/get-auth-user";
import { Sidebar } from "@/components/layout/sidebar";
import { VisibilityRefresher } from "@/components/layout/visibility-refresher";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side second line of defense — redirects to /auth/login if no valid session
  await getAuthenticatedUser();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <VisibilityRefresher />
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
