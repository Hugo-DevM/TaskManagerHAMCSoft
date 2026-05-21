"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectForm } from "@/components/projects/project-form";
import { Button } from "@/components/ui/button";
import { deleteProject } from "./actions";
import type { ProjectWithStats, ProjectStatus, Client } from "@/lib/types";
import { cn } from "@/lib/utils";

type FilterValue = ProjectStatus | "todos" | "activos";

const FILTER_TABS: { value: FilterValue; label: string }[] = [
  { value: "todos",        label: "Todos" },
  { value: "activos",      label: "Activos" },
  { value: "planeacion",   label: "Planeación" },
  { value: "diseno",       label: "Diseño" },
  { value: "desarrollo",   label: "Desarrollo" },
  { value: "testing",      label: "Testing" },
  { value: "correcciones", label: "Correcciones" },
  { value: "deploy",       label: "Deploy" },
  { value: "mantenimiento",label: "Mantenimiento" },
  { value: "finalizado",   label: "Finalizado" },
  { value: "pausado",      label: "Pausado" },
];

const ACTIVE_STATUSES: ProjectStatus[] = [
  "planeacion", "diseno", "desarrollo", "testing", "correcciones", "deploy", "mantenimiento",
];

interface ProjectsViewProps {
  projectsWithStats: ProjectWithStats[];
  clients: Client[];
  userId: string;
}

export function ProjectsView({ projectsWithStats, clients, userId }: ProjectsViewProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterValue>("todos");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editProject, setEditProject] = useState<ProjectWithStats | null>(null);

  const filteredProjects = useMemo(() => {
    if (activeFilter === "todos") return projectsWithStats;
    if (activeFilter === "activos") return projectsWithStats.filter((p) => ACTIVE_STATUSES.includes(p.status));
    return projectsWithStats.filter((p) => p.status === activeFilter);
  }, [projectsWithStats, activeFilter]);

  const handleEdit = (project: ProjectWithStats) => {
    setEditProject(project);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("¿Eliminar este proyecto? Las tareas relacionadas quedarán sin proyecto.")) {
      await deleteProject(id);
      router.refresh();
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header
        title="Proyectos"
        subtitle={`${projectsWithStats.length} proyecto${projectsWithStats.length !== 1 ? "s" : ""} · Producción`}
        action={
          <Button
            size="sm"
            onClick={() => { setEditProject(null); setIsFormOpen(true); }}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Nuevo proyecto
          </Button>
        }
      />

      <div className="p-6 space-y-5">
        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {FILTER_TABS.map((tab) => {
            const count =
              tab.value === "todos"
                ? projectsWithStats.length
                : tab.value === "activos"
                ? projectsWithStats.filter((p) => ACTIVE_STATUSES.includes(p.status)).length
                : projectsWithStats.filter((p) => p.status === tab.value).length;

            return (
              <button
                key={tab.value}
                onClick={() => setActiveFilter(tab.value)}
                className={cn(
                  "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  activeFilter === tab.value
                    ? "bg-indigo-600 text-white"
                    : "bg-accent/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                <span className="ml-1.5 opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-sm mb-3">
              {activeFilter === "todos"
                ? "No hay proyectos aún. ¡Crea el primero!"
                : `No hay proyectos en estado "${activeFilter}".`}
            </p>
            {activeFilter === "todos" && (
              <Button size="sm" onClick={() => { setEditProject(null); setIsFormOpen(true); }} className="gap-1.5">
                <Plus className="w-4 h-4" />
                Nuevo proyecto
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <ProjectForm
        open={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditProject(null); }}
        editProject={editProject}
        clients={clients}
        userId={userId}
      />
    </div>
  );
}
