"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { createBug, updateBug } from "@/app/(dashboard)/bugs/actions";
import type { BugSeverity, BugStatus, BugWithRelations, Profile } from "@/lib/types";

interface BugFormProps {
  open: boolean;
  onClose: () => void;
  editBug?: BugWithRelations | null;
  defaultStatus?: BugStatus;
  profiles: Profile[];
  userId: string;
}

export function BugForm({
  open,
  onClose,
  editBug,
  defaultStatus = "Reportado",
  profiles,
  userId,
}: BugFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<BugSeverity>("Medio");
  const [status, setStatus] = useState<BugStatus>(defaultStatus);
  const [systemName, setSystemName] = useState("");
  const [stepsToReproduce, setStepsToReproduce] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editBug) {
      setTitle(editBug.title);
      setDescription(editBug.description ?? "");
      setSeverity(editBug.severity);
      setStatus(editBug.status);
      setSystemName(editBug.system_name ?? "");
      setStepsToReproduce(editBug.steps_to_reproduce ?? "");
      setAssignedTo(editBug.assigned_to ?? "");
    } else {
      setTitle("");
      setDescription("");
      setSeverity("Medio");
      setStatus(defaultStatus);
      setSystemName("");
      setStepsToReproduce("");
      setAssignedTo("");
    }
    setError(null);
  }, [editBug, defaultStatus, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("El título es requerido.");
      return;
    }
    setLoading(true);
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      severity,
      status,
      system_name: systemName.trim() || undefined,
      steps_to_reproduce: stepsToReproduce.trim() || undefined,
      assigned_to: assignedTo || undefined,
    };

    const result = editBug
      ? await updateBug({ id: editBug.id, ...payload })
      : await createBug({ ...payload, reported_by: userId });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.refresh();
    onClose();
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editBug ? "Editar bug" : "Reportar bug"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="bug-title">Título *</Label>
              <span className={`text-xs ${title.length > 90 ? "text-yellow-400" : "text-muted-foreground"}`}>
                {title.length}/100
              </span>
            </div>
            <Input
              id="bug-title"
              placeholder="Ej: Login falla cuando el email tiene mayúsculas..."
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              autoFocus
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="bug-desc">Descripción</Label>
            <Textarea
              id="bug-desc"
              placeholder="¿Qué ocurre? ¿Cuál es el comportamiento esperado?"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Severity & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Severidad</Label>
              <Select
                value={severity}
                onValueChange={(v) => setSeverity(v as BugSeverity)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Crítico">Crítico</SelectItem>
                  <SelectItem value="Alto">Alto</SelectItem>
                  <SelectItem value="Medio">Medio</SelectItem>
                  <SelectItem value="Bajo">Bajo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as BugStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Reportado">Reportado</SelectItem>
                  <SelectItem value="En análisis">En análisis</SelectItem>
                  <SelectItem value="En corrección">En corrección</SelectItem>
                  <SelectItem value="En pruebas">En pruebas</SelectItem>
                  <SelectItem value="Resuelto">Resuelto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* System name & Assignee */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bug-system">Sistema afectado</Label>
              <Input
                id="bug-system"
                placeholder="Ej: Portal clientes"
                value={systemName}
                onChange={(e) => setSystemName(e.target.value.slice(0, 60))}
                maxLength={60}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Asignado a</Label>
              <Select
                value={assignedTo || "none"}
                onValueChange={(v) => setAssignedTo(v === "none" ? "" : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name ?? p.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Steps to reproduce */}
          <div className="space-y-1.5">
            <Label htmlFor="bug-steps">Pasos para reproducir</Label>
            <Textarea
              id="bug-steps"
              placeholder={"1. Ir a la pantalla de login\n2. Ingresar email con mayúsculas\n3. Hacer clic en Entrar\n4. Observar el error"}
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value.slice(0, 800))}
              rows={4}
              maxLength={800}
              className="font-mono text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Guardando..."
                : editBug
                ? "Guardar cambios"
                : "Reportar bug"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
