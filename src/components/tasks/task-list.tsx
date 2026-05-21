"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskCard } from "./task-card";
import { TaskForm } from "./task-form";
import { deleteTask, updateTask } from "@/app/(dashboard)/tasks/actions";
import type { TaskWithRelations, TaskStatus, TaskPriority, Project, Profile } from "@/lib/types";

interface TaskListProps {
  tasks: TaskWithRelations[];
  projects: Project[];
  profiles: Profile[];
  userId: string;
  filterProjectId?: string;
  filterAssigneeId?: string;
  showAddButton?: boolean;
}

export function TaskList({
  tasks,
  projects,
  profiles,
  userId,
  filterProjectId,
  filterAssigneeId,
  showAddButton = true,
}: TaskListProps) {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editTask, setEditTask] = useState<TaskWithRelations | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");

  const filtered = tasks.filter((t) => {
    if (filterProjectId && t.project_id !== filterProjectId) return false;
    if (filterAssigneeId && t.assigned_to !== filterAssigneeId) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
    if (
      search &&
      !t.title.toLowerCase().includes(search.toLowerCase()) &&
      !t.description?.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

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

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tareas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as TaskStatus | "all")}
            >
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="En progreso">En progreso</SelectItem>
                <SelectItem value="En revisión">En revisión</SelectItem>
                <SelectItem value="Completado">Completado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select
            value={priorityFilter}
            onValueChange={(v) => setPriorityFilter(v as TaskPriority | "all")}
          >
            <SelectTrigger className="w-32 h-9">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Urgente">Urgente</SelectItem>
              <SelectItem value="Normal">Normal</SelectItem>
              <SelectItem value="Baja">Baja</SelectItem>
            </SelectContent>
          </Select>

          {showAddButton && (
            <Button
              size="sm"
              onClick={() => {
                setEditTask(null);
                setIsFormOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Nueva tarea
            </Button>
          )}
        </div>
      </div>

      {/* Task grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">
            {search || statusFilter !== "all" || priorityFilter !== "all"
              ? "No hay tareas con los filtros aplicados."
              : "No hay tareas aún. ¡Crea la primera!"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((task) => (
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

      <TaskForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditTask(null);
        }}
        editTask={editTask}
        defaultProjectId={filterProjectId}
        projects={projects}
        profiles={profiles}
        userId={userId}
      />
    </div>
  );
}
