"use client";

import Link from "next/link";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  CalendarDays,
  User,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProjectWithStats } from "@/lib/types";
import {
  PROJECT_STATUS_CONFIG,
  PROJECT_PRIORITY_CONFIG,
  PROJECT_TYPE_CONFIG,
  cn,
  formatDueDate,
  isDateOverdue,
  isDueSoon,
} from "@/lib/utils";

interface ProjectCardProps {
  project: ProjectWithStats;
  onEdit: (project: ProjectWithStats) => void;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const statusCfg = PROJECT_STATUS_CONFIG[project.status];
  const priorityCfg = PROJECT_PRIORITY_CONFIG[project.priority ?? "medium"];
  const typeCfg = project.type ? PROJECT_TYPE_CONFIG[project.type] : null;

  const completionPercent =
    project.task_count > 0
      ? Math.round((project.completed_task_count / project.task_count) * 100)
      : project.progress ?? 0;

  const isOverdue = isDateOverdue(project.due_date);
  const dueSoon = isDueSoon(project.due_date, 7) && !isOverdue;
  const isFinished = project.status === "finalizado";

  return (
    <div className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:border-border/60 transition-all duration-150">
      {/* Top status stripe */}
      <div className={cn("h-[3px] w-full", statusCfg.barColor)} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              {typeCfg && (
                <span className="text-sm" title={typeCfg.label}>
                  {typeCfg.icon}
                </span>
              )}
              <Link
                href={`/projects/${project.id}`}
                className="text-sm font-semibold text-foreground hover:text-indigo-400 transition-colors truncate block"
              >
                {project.name}
              </Link>
            </div>
            {project.client && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {project.client.company_name ?? project.client.name}
                </span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <div
              className={cn("w-2 h-2 rounded-full", priorityCfg.dotColor)}
              title={`Prioridad ${priorityCfg.label}`}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onEdit(project)}>
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(project.id)}
                  className="text-red-400 focus:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Status + description */}
        <div className="mb-3">
          <Badge
            variant="outline"
            className={cn("text-xs px-2 py-0.5 border mb-2", statusCfg.bgColor)}
          >
            {statusCfg.label}
          </Badge>
          {project.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Progreso</span>
            <span className="text-xs font-medium text-foreground">{completionPercent}%</span>
          </div>
          <div className="h-1.5 bg-accent rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                isFinished || completionPercent === 100
                  ? "bg-emerald-500"
                  : "bg-indigo-500"
              )}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {project.task_count > 0 && (
              <span>{project.task_count} tareas</span>
            )}
            {project.completed_task_count > 0 && (
              <div className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>{project.completed_task_count}</span>
              </div>
            )}
          </div>

          {project.due_date && (
            <div
              className={cn(
                "flex items-center gap-1",
                isOverdue
                  ? "text-red-400"
                  : dueSoon
                  ? "text-yellow-400"
                  : "text-muted-foreground"
              )}
            >
              {isOverdue ? (
                <AlertTriangle className="w-3 h-3" />
              ) : (
                <CalendarDays className="w-3 h-3" />
              )}
              <span>{formatDueDate(project.due_date)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
