"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskForm } from "@/components/tasks/task-form";
import type { Project, Profile } from "@/lib/types";

interface TaskPageActionsProps {
  projects: Project[];
  profiles: Profile[];
  userId: string;
}

export function TaskPageActions({ projects, profiles, userId }: TaskPageActionsProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setIsFormOpen(true)} className="gap-1.5">
        <Plus className="w-4 h-4" />
        Nueva tarea
      </Button>
      <TaskForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        projects={projects}
        profiles={profiles}
        userId={userId}
      />
    </>
  );
}
