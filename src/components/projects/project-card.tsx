"use client";

import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2, CheckCircle2 } from "lucide-react";
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
import { PROJECT_STATUS_CONFIG, cn, formatRelativeDate } from "@/lib/utils";

interface ProjectCardProps {
  project: ProjectWithStats;
  onEdit: (project: ProjectWithStats) => void;
  onDelete: (id: string) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const statusConfig = PROJECT_STATUS_CONFIG[project.status];
  const completionPercent =
    project.task_count > 0
      ? Math.round((project.completed_task_count / project.task_count) * 100)
      : 0;

  return (
    <div className="group bg-card border border-border rounded-xl p-5 hover:shadow-sm hover:border-border/80 transition-all duration-150">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <Link
            href={`/projects/${project.id}`}
            className="text-sm font-semibold text-foreground hover:text-indigo-400 transition-colors truncate block"
          >
            {project.name}
          </Link>
          {project.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
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

      {/* Status badge */}
      <Badge
        variant="outline"
        className={cn("text-xs px-2 py-0.5 border mb-4", statusConfig.bgColor)}
      >
        {statusConfig.label}
      </Badge>

      {/* Progress bar */}
      {project.task_count > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Progreso</span>
            <span className="text-xs font-medium text-foreground">
              {completionPercent}%
            </span>
          </div>
          <div className="h-1.5 bg-accent rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                completionPercent === 100
                  ? "bg-emerald-500"
                  : "bg-indigo-500"
              )}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>{project.task_count} tareas</span>
          {project.completed_task_count > 0 && (
            <div className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>{project.completed_task_count} completadas</span>
            </div>
          )}
        </div>
        <span>{formatRelativeDate(project.created_at)}</span>
      </div>
    </div>
  );
}
