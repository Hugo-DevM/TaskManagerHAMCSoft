import {
  CheckSquare,
  AlertCircle,
  Clock,
  Loader2,
  CheckCircle2,
  FolderKanban,
  Users,
  TrendingUp,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAuthenticatedUser } from "@/lib/auth/get-auth-user";
import { createServerClient } from "@/lib/supabase/server";
import type { TaskWithRelations, Project } from "@/lib/types";
import {
  isOverdue,
  isDueToday,
  getInitials,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  formatDueDate,
  cn,
  PROJECT_STATUS_CONFIG,
} from "@/lib/utils";

export default async function DashboardPage() {
  await getAuthenticatedUser();
  const supabase = await createServerClient();

  const [{ data: rawTasks }, { data: rawProjects }, { data: rawTasksForProjects }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("*, assignee:profiles!tasks_assigned_to_fkey(*), project:projects(*)")
        .order("created_at", { ascending: false }),
      supabase
        .from("projects")
        .select("*, creator:profiles!projects_created_by_fkey(*)")
        .order("created_at", { ascending: false }),
      supabase.from("tasks").select("project_id, status"),
    ]);

  const tasks = (rawTasks as TaskWithRelations[]) ?? [];

  // Compute task stats
  const pending = tasks.filter((t) => t.status === "Pendiente").length;
  const inProgress = tasks.filter((t) => t.status === "En progreso").length;
  const inReview = tasks.filter((t) => t.status === "En revisión").length;
  const completed = tasks.filter((t) => t.status === "Completado").length;
  const overdue = tasks.filter((t) => isOverdue(t.due_date, t.status)).length;
  const dueToday = tasks.filter(
    (t) => isDueToday(t.due_date) && t.status !== "Completado"
  ).length;

  // Group tasks by user
  const userMap = new Map<string, { profile: TaskWithRelations["assignee"]; total: number; completed: number; inProgress: number }>();
  tasks.forEach((t) => {
    if (!t.assignee) return;
    const key = t.assigned_to!;
    if (!userMap.has(key)) userMap.set(key, { profile: t.assignee, total: 0, completed: 0, inProgress: 0 });
    const entry = userMap.get(key)!;
    entry.total++;
    if (t.status === "Completado") entry.completed++;
    if (t.status === "En progreso") entry.inProgress++;
  });
  const userSummaries = Array.from(userMap.values()).sort((a, b) => b.total - a.total);

  // Critical tasks
  const criticalTasks = tasks
    .filter((t) => t.status !== "Completado" && (t.priority === "Urgente" || isOverdue(t.due_date, t.status)))
    .slice(0, 5);

  // Projects with stats
  const tasksByProject: Record<string, { total: number; completed: number }> = {};
  (rawTasksForProjects ?? []).forEach((t) => {
    if (!t.project_id) return;
    if (!tasksByProject[t.project_id]) tasksByProject[t.project_id] = { total: 0, completed: 0 };
    tasksByProject[t.project_id].total++;
    if (t.status === "Completado") tasksByProject[t.project_id].completed++;
  });
  const projectsWithStats = ((rawProjects ?? []) as Project[]).map((p) => {
    const stats = tasksByProject[p.id] ?? { total: 0, completed: 0 };
    return { ...p, task_count: stats.total, completed_task_count: stats.completed };
  });

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title="Dashboard" subtitle="Resumen general del equipo HAMCSoft" />

      <div className="p-6 space-y-8">
        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatsCard title="Pendientes" value={pending} icon={CheckSquare} color="default" />
          <StatsCard title="En progreso" value={inProgress} icon={Loader2} color="indigo" />
          <StatsCard title="En revisión" value={inReview} icon={Clock} color="purple" />
          <StatsCard title="Completadas" value={completed} icon={CheckCircle2} color="emerald" />
          <StatsCard title="Vencidas" value={overdue} icon={AlertCircle} color="red" />
          <StatsCard title="Vencen hoy" value={dueToday} icon={TrendingUp} color="yellow" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Critical Tasks */}
          <div className="lg:col-span-2 bg-card border border-border rounded-xl">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <h2 className="text-sm font-semibold">Tareas críticas / vencidas</h2>
              </div>
              <Badge variant="outline" className="text-xs border bg-red-500/10 text-red-400 border-red-500/20">
                {criticalTasks.length}
              </Badge>
            </div>
            <div className="p-4 space-y-2">
              {criticalTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Sin tareas críticas. ¡Buen trabajo!</p>
                </div>
              ) : (
                criticalTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className={cn("w-1 h-8 rounded-full shrink-0", task.priority === "Urgente" ? "bg-red-500" : "bg-yellow-500")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className={cn("text-xs px-1 py-0 border", PRIORITY_CONFIG[task.priority].bgColor)}>
                          {task.priority}
                        </Badge>
                        {task.due_date && (
                          <span className={cn("text-xs", isOverdue(task.due_date, task.status) ? "text-red-400" : "text-muted-foreground")}>
                            {formatDueDate(task.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("text-xs border shrink-0", STATUS_CONFIG[task.status].bgColor)}>
                      {task.status}
                    </Badge>
                    {task.assignee && (
                      <Avatar className="w-6 h-6 shrink-0">
                        <AvatarImage src={task.assignee.avatar_url ?? undefined} />
                        <AvatarFallback className="text-[9px] bg-indigo-600/20 text-indigo-400">
                          {getInitials(task.assignee.full_name, task.assignee.email)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* User Summary */}
          <div className="bg-card border border-border rounded-xl">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold">Resumen por persona</h2>
            </div>
            <div className="p-4 space-y-3">
              {userSummaries.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Sin tareas asignadas aún.</p>
              ) : (
                userSummaries.map(({ profile, total, completed: comp, inProgress: inp }) => {
                  if (!profile) return null;
                  const pct = total > 0 ? Math.round((comp / total) * 100) : 0;
                  return (
                    <div key={profile.id} className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={profile.avatar_url ?? undefined} />
                        <AvatarFallback className="text-xs bg-indigo-600/20 text-indigo-400">
                          {getInitials(profile.full_name, profile.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-medium text-foreground truncate">
                            {profile.full_name ?? profile.email.split("@")[0]}
                          </p>
                          <span className="text-xs text-muted-foreground shrink-0 ml-2">{comp}/{total}</span>
                        </div>
                        <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{inp} en progreso</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Project summaries */}
        <div className="bg-card border border-border rounded-xl">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-semibold">Resumen por proyecto</h2>
          </div>
          <div className="p-4">
            {projectsWithStats.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Sin proyectos creados aún.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {projectsWithStats.map((project) => {
                  const pct = project.task_count > 0
                    ? Math.round((project.completed_task_count / project.task_count) * 100)
                    : 0;
                  return (
                    <div key={project.id} className="bg-accent/40 rounded-lg p-4 border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                        <Badge variant="outline" className={cn("text-xs border ml-2 shrink-0", PROJECT_STATUS_CONFIG[project.status].bgColor)}>
                          {PROJECT_STATUS_CONFIG[project.status].label}
                        </Badge>
                      </div>
                      <div className="h-1.5 bg-card rounded-full overflow-hidden mb-2">
                        <div
                          className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-emerald-500" : "bg-indigo-500")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{project.task_count} tareas</span>
                        <span>{pct}% completado</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
