"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Clock } from "lucide-react";
import { Header } from "@/components/layout/header";
import { TaskList } from "@/components/tasks/task-list";
import { ProjectForm } from "@/components/projects/project-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteProject } from "@/app/(dashboard)/projects/actions";
import type { TaskWithRelations, ProjectWithStats, Project, Profile } from "@/lib/types";
import { PROJECT_STATUS_CONFIG, cn, formatRelativeDate } from "@/lib/utils";

interface ProjectDetailViewProps {
  project: ProjectWithStats;
  tasks: TaskWithRelations[];
  projects: Project[];
  profiles: Profile[];
  userId: string;
}

export function ProjectDetailView({ project, tasks, projects, profiles, userId }: ProjectDetailViewProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "Completado").length,
    inProgress: tasks.filter((t) => t.status === "En progreso").length,
    pending: tasks.filter((t) => t.status === "Pendiente").length,
  }), [tasks]);

  const completionPct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const statusConfig = PROJECT_STATUS_CONFIG[project.status];

  const handleDelete = async () => {
    if (window.confirm("¿Eliminar este proyecto?")) {
      await deleteProject(project.id);
      router.push("/projects");
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header
        title={project.name}
        subtitle={`Creado el ${formatRelativeDate(project.created_at)}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/projects")} className="gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)} className="gap-1.5">
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="gap-1.5 text-red-400 hover:text-red-400 border-red-500/20 hover:bg-red-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Project info card */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              {project.description && (
                <p className="text-sm text-muted-foreground">{project.description}</p>
              )}
            </div>
            <Badge variant="outline" className={cn("text-xs border shrink-0", statusConfig.bgColor)}>
              {statusConfig.label}
            </Badge>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Progreso general</span>
              <span className="text-sm font-semibold text-foreground">{completionPct}%</span>
            </div>
            <div className="h-2 bg-accent rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", completionPct === 100 ? "bg-emerald-500" : "bg-indigo-500")}
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total", value: stats.total, color: "text-foreground" },
              { label: "Pendientes", value: stats.pending, color: "text-zinc-400" },
              { label: "En progreso", value: stats.inProgress, color: "text-indigo-400" },
              { label: "Completadas", value: stats.completed, color: "text-emerald-400" },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-3 bg-accent/40 rounded-lg">
                <p className={cn("text-xl font-bold", stat.color)}>{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Tareas del proyecto
          </h2>
          <TaskList
            tasks={tasks}
            projects={projects}
            profiles={profiles}
            userId={userId}
            filterProjectId={project.id}
          />
        </div>
      </div>

      <ProjectForm
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        editProject={project}
        userId={userId}
      />
    </div>
  );
}
