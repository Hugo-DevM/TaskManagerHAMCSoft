"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sun,
  Columns3,
  CheckSquare,
  FolderKanban,
  LogOut,
  Users,
  Bug,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useAuthSync } from "@/hooks/use-auth-sync";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/mi-dia",
    label: "Mi Día",
    icon: Sun,
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: Users,
  },
  {
    href: "/kanban",
    label: "Kanban",
    icon: Columns3,
  },
  {
    href: "/tasks",
    label: "Tareas",
    icon: CheckSquare,
  },
  {
    href: "/projects",
    label: "Proyectos",
    icon: FolderKanban,
  },
  {
    href: "/bugs",
    label: "Bugs",
    icon: Bug,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  useAuthSync();

  return (
    <aside className="flex flex-col w-60 h-full bg-card border-r border-border">
      {/* Logo */}
      <div className="flex items-center justify-center gap-2 px-4 border-b border-border" style={{ height: '98px' }}>
        <Image src="/logo-icon.png" alt="HAMCSoft" width={34} height={34} className="shrink-0" />
        <Image src="/logo-letras.png" alt="HAMCSoft" width={115} height={26} className="shrink-0" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-indigo-600/10 text-indigo-400 border border-indigo-500/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0",
                  isActive ? "text-indigo-400" : "text-muted-foreground"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 pb-4">
        <Separator className="mb-3" />
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-accent/50">
          <Avatar className="w-7 h-7">
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs bg-indigo-600/20 text-indigo-400">
              {profile
                ? getInitials(profile.full_name, profile.email)
                : user?.email?.slice(0, 2).toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              {profile?.full_name ?? user?.email?.split("@")[0]}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
            title="Cerrar sesión"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
