"use client";

import { useState } from "react";
import { Calendar, MoreHorizontal, Pencil, Trash2, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TaskWithRelations, TaskStatus } from "@/lib/types";
import {
  cn,
  PRIORITY_CONFIG,
  STATUS_CONFIG,
  formatDueDate,
  isOverdue,
  getInitials,
} from "@/lib/utils";

interface TaskCardProps {
  task: TaskWithRelations;
  onUpdate: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (task: TaskWithRelations) => void;
  showProject?: boolean;
}

const STATUS_OPTIONS: TaskStatus[] = [
  "Pendiente",
  "En progreso",
  "En revisión",
  "Completado",
];

export function TaskCard({
  task,
  onUpdate,
  onDelete,
  onEdit,
  showProject = true,
}: TaskCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const statusConfig = STATUS_CONFIG[task.status];
  const overdue = isOverdue(task.due_date, task.status);
  const dueDateText = formatDueDate(task.due_date);

  return (
    <>
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("taskId", task.id);
          e.dataTransfer.setData("taskStatus", task.status);
          e.dataTransfer.effectAllowed = "move";
          setIsDragging(true);
        }}
        onDragEnd={() => setIsDragging(false)}
        className={cn(
          "group relative bg-card border rounded-xl p-4 hover:border-border/80 transition-all duration-150 cursor-grab active:cursor-grabbing",
          task.status === "Completado"
            ? "opacity-60 border-border/40"
            : "border-border hover:shadow-sm",
          isDragging && "opacity-40 scale-95"
        )}
      >
        {/* Priority indicator bar */}
        <div
          className={cn(
            "absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full",
            task.priority === "Urgente"
              ? "bg-red-500"
              : task.priority === "Normal"
              ? "bg-yellow-500"
              : "bg-blue-500"
          )}
        />

        <div className="pl-2">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3
              className={cn(
                "text-sm font-medium text-foreground leading-snug flex-1",
                task.status === "Completado" && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  Editar tarea
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">
                    Mover a...
                  </p>
                  {STATUS_OPTIONS.filter((s) => s !== task.status).map((s) => (
                    <button
                      key={s}
                      onClick={() => onUpdate(task.id, s)}
                      className="flex items-center gap-2 w-full px-1 py-1 text-xs rounded hover:bg-accent text-foreground"
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          STATUS_CONFIG[s].color
                            .replace("text-", "bg-")
                            .split(" ")[0]
                        )}
                      />
                      {s}
                    </button>
                  ))}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(task.id)}
                  className="text-red-400 focus:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Badges row */}
          <div className="flex items-center flex-wrap gap-1.5 mb-3">
            <Badge
              className={cn(
                "text-xs px-1.5 py-0 border",
                priorityConfig.bgColor
              )}
              variant="outline"
            >
              {task.priority}
            </Badge>
            <Badge
              className={cn(
                "text-xs px-1.5 py-0 border",
                statusConfig.bgColor
              )}
              variant="outline"
            >
              {task.status}
            </Badge>
          </div>

          {/* Footer row */}
          <div className="flex items-center justify-between gap-2">
            {/* Project */}
            {showProject && task.project && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground min-w-0">
                <FolderOpen className="w-3 h-3 shrink-0" />
                <span className="truncate">{task.project.name}</span>
              </div>
            )}
            {!showProject && <div />}

            <div className="flex items-center gap-2 shrink-0">
              {/* Due date */}
              {dueDateText && (
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    overdue ? "text-red-400" : "text-muted-foreground"
                  )}
                >
                  <Calendar className="w-3 h-3" />
                  <span>{dueDateText}</span>
                </div>
              )}

              {/* Assignee */}
              {task.assignee && (
                <Avatar className="w-5 h-5" title={task.assignee.full_name ?? task.assignee.email}>
                  <AvatarImage src={task.assignee.avatar_url ?? undefined} />
                  <AvatarFallback className="text-[9px] bg-indigo-600/20 text-indigo-400">
                    {getInitials(
                      task.assignee.full_name,
                      task.assignee.email
                    )}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        </div>
      </div>

    </>
  );
}
