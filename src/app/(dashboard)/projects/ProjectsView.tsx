"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectForm } from "@/components/projects/project-form";
import { Button } from "@/components/ui/button";
import { deleteProject } from "./actions";
import type { ProjectWithStats } from "@/lib/types";

interface ProjectsViewProps {
  projectsWithStats: ProjectWithStats[];
  userId: string;
}

export function ProjectsView({ projectsWithStats, userId }: ProjectsViewProps) {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editProject, setEditProject] = useState<ProjectWithStats | null>(null);

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
        subtitle={`${projectsWithStats.length} proyecto${projectsWithStats.length !== 1 ? "s" : ""}`}
        action={
          <Button
            size="sm"
            onClick={() => {
              setEditProject(null);
              setIsFormOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Nuevo proyecto
          </Button>
        }
      />

      <div className="p-6">
        {projectsWithStats.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-sm mb-3">
              No hay proyectos aún. ¡Crea el primero!
            </p>
            <Button
              size="sm"
              onClick={() => {
                setEditProject(null);
                setIsFormOpen(true);
              }}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Nuevo proyecto
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projectsWithStats.map((project) => (
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
        onClose={() => {
          setIsFormOpen(false);
          setEditProject(null);
        }}
        editProject={editProject}
        userId={userId}
      />
    </div>
  );
}
