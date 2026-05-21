"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertCircle, Clock, User, Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskForm } from "@/components/tasks/task-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateTask, deleteTask } from "@/app/(dashboard)/tasks/actions";
import type { TaskWithRelations, TaskStatus, Project, Profile } from "@/lib/types";
import { isOverdue, isDueToday, cn } from "@/lib/utils";

interface MiDiaViewProps {
  tasks: TaskWithRelations[];
  projects: Project[];
  profiles: Profile[];
  userId: string;
}

export function MiDiaView({ tasks, projects, profiles, userId }: MiDiaViewProps) {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<TaskWithRelations | null>(null);

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);

  const criticalTasks = useMemo(
    () => tasks.filter((t) => t.status !== "Completado" && t.priority === "Urgente"),
    [tasks]
  );
  const overdueTasks = useMemo(
    () => tasks.filter((t) => isOverdue(t.due_date, t.status)),
    [tasks]
  );
  const dueTodayTasks = useMemo(
    () => tasks.filter((t) => isDueToday(t.due_date) && t.status !== "Completado"),
    [tasks]
  );
  const inProgressTasks = useMemo(
    () => tasks.filter((t) => t.status === "En progreso"),
    [tasks]
  );

  const handleStatusUpdate = async (id: string, status: TaskStatus) => {
    await updateTask({ id, status });
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Eliminar esta tarea?")) {
      await deleteTask(id);
      router.refresh();
    }
  };

  const handleEdit = (task: TaskWithRelations) => {
    setEditTask(task);
    setIsFormOpen(true);
  };

  const Section = ({
    title,
    icon: Icon,
    tasks: sectionTasks,
    color,
    emptyText,
  }: {
    title: string;
    icon: React.ElementType;
    tasks: TaskWithRelations[];
    color: string;
    emptyText: string;
  }) => (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("w-4 h-4", color)} />
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-xs border",
            sectionTasks.length > 0
              ? color.includes("red")
                ? "bg-red-500/10 text-red-400 border-red-500/20"
                : color.includes("yellow")
                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                : color.includes("indigo")
                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
              : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
          )}
        >
          {sectionTasks.length}
        </Badge>
      </div>
      <div className="p-4">
        {sectionTasks.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">{emptyText}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sectionTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={handleStatusUpdate}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header
        title="Mi Día"
        subtitle={todayCapitalized}
        action={
          <Button
            size="sm"
            onClick={() => { setEditTask(null); setIsFormOpen(true); }}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Nueva tarea
          </Button>
        }
      />

      <div className="p-6 space-y-4">
        {/* Summary bar */}
        <div className="flex items-center gap-4 px-5 py-3 bg-card border border-border rounded-xl text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Total asignadas:</span>
            <span className="font-semibold text-foreground">{tasks.length}</span>
          </div>
          {overdueTasks.length > 0 && (
            <div className="flex items-center gap-1.5 text-red-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="font-medium">{overdueTasks.length} vencidas</span>
            </div>
          )}
          {criticalTasks.length > 0 && (
            <div className="flex items-center gap-1.5 text-yellow-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="font-medium">{criticalTasks.length} urgentes</span>
            </div>
          )}
        </div>

        <Section title="Tareas urgentes" icon={AlertCircle} tasks={criticalTasks} color="text-red-400" emptyText="Sin tareas urgentes asignadas." />
        <Section title="Vencidas" icon={Clock} tasks={overdueTasks} color="text-yellow-400" emptyText="Sin tareas vencidas. ¡Todo al día!" />
        <Section title="Vencen hoy" icon={Clock} tasks={dueTodayTasks} color="text-yellow-400" emptyText="Sin tareas con vencimiento hoy." />
        <Section title="En progreso" icon={User} tasks={inProgressTasks} color="text-indigo-400" emptyText="Sin tareas en progreso actualmente." />
      </div>

      <TaskForm
        open={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditTask(null); }}
        editTask={editTask}
        projects={projects}
        profiles={profiles}
        userId={userId}
      />
    </div>
  );
}
