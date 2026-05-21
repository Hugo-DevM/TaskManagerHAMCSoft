"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskCard } from "./task-card";
import { TaskForm } from "./task-form";
import { updateTask, deleteTask } from "@/app/(dashboard)/tasks/actions";
import type { TaskWithRelations, TaskStatus, Project, Profile } from "@/lib/types";
import { STATUS_CONFIG, TASK_STATUS_ORDER, cn } from "@/lib/utils";

const COLUMN_COLORS: Record<TaskStatus, string> = {
  Pendiente: "border-t-zinc-500",
  "En progreso": "border-t-indigo-500",
  "En revisión": "border-t-purple-500",
  Completado: "border-t-emerald-500",
};

interface KanbanBoardProps {
  tasks: TaskWithRelations[];
  projects: Project[];
  profiles: Profile[];
  userId: string;
}

export function KanbanBoard({ tasks, projects, profiles, userId }: KanbanBoardProps) {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<TaskWithRelations | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("Pendiente");
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);
  const [expandedColumns, setExpandedColumns] = useState<Set<TaskStatus>>(new Set());

  const VISIBLE_LIMIT = 5;

  const toggleColumn = (status: TaskStatus) => {
    setExpandedColumns((prev) => {
      const next = new Set(prev);
      next.has(status) ? next.delete(status) : next.add(status);
      return next;
    });
  };

  const tasksByStatus = TASK_STATUS_ORDER.reduce<Record<TaskStatus, TaskWithRelations[]>>(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status);
      return acc;
    },
    { Pendiente: [], "En progreso": [], "En revisión": [], Completado: [] }
  );

  const handleStatusUpdate = async (id: string, status: TaskStatus) => {
    await updateTask({ id, status });
    router.refresh();
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStatus(status);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverStatus(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverStatus(null);
    const taskId = e.dataTransfer.getData("taskId");
    const currentStatus = e.dataTransfer.getData("taskStatus") as TaskStatus;
    if (taskId && currentStatus !== targetStatus) {
      await handleStatusUpdate(taskId, targetStatus);
    }
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

  const handleAddToColumn = (status: TaskStatus) => {
    setEditTask(null);
    setDefaultStatus(status);
    setIsFormOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 h-full">
        {TASK_STATUS_ORDER.map((status) => {
          const columnTasks = tasksByStatus[status];
          const config = STATUS_CONFIG[status];
          const isExpanded = expandedColumns.has(status);
          const hasMore = columnTasks.length > VISIBLE_LIMIT;
          const visibleTasks = hasMore && !isExpanded
            ? columnTasks.slice(0, VISIBLE_LIMIT)
            : columnTasks;
          const hiddenCount = columnTasks.length - VISIBLE_LIMIT;

          return (
            <div
              key={status}
              className="flex flex-col min-h-0"
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
            >
              {/* Column header */}
              <div
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-t-xl bg-card border border-border border-t-2",
                  COLUMN_COLORS[status]
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">{status}</span>
                  <Badge variant="outline" className={cn("text-xs border", config.bgColor)}>
                    {columnTasks.length}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={() => handleAddToColumn(status)}
                  title={`Agregar tarea en ${status}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Column body */}
              <div
                className={cn(
                  "border border-t-0 rounded-b-xl p-2 space-y-2 min-h-[200px] transition-colors duration-150",
                  dragOverStatus === status
                    ? "bg-accent/50 border-indigo-500/40"
                    : "bg-accent/20 border-border"
                )}
              >
                {columnTasks.length === 0 ? (
                  <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
                    Sin tareas
                  </div>
                ) : (
                  <>
                    {visibleTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onUpdate={handleStatusUpdate}
                        onDelete={handleDelete}
                        onEdit={handleEdit}
                      />
                    ))}
                    {hasMore && (
                      <button
                        onClick={() => toggleColumn(status)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/60 rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <><ChevronUp className="w-3.5 h-3.5" />Ver menos</>
                        ) : (
                          <><ChevronDown className="w-3.5 h-3.5" />Ver {hiddenCount} más</>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditTask(null);
        }}
        editTask={editTask}
        defaultStatus={defaultStatus}
        projects={projects}
        profiles={profiles}
        userId={userId}
      />
    </>
  );
}
