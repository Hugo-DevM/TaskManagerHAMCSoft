"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, X } from "lucide-react";
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
import { createProject, updateProject } from "@/app/(dashboard)/projects/actions";
import type { ProjectStatus, ProjectType, ProjectPriority, ProjectWithStats, Client } from "@/lib/types";

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  editProject?: ProjectWithStats | null;
  clients?: Client[];
  userId: string;
  defaultClientId?: string;
}

export function ProjectForm({
  open,
  onClose,
  editProject,
  clients = [],
  userId,
  defaultClientId,
}: ProjectFormProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState<string>("");
  const [type, setType] = useState<ProjectType | "">("");
  const [status, setStatus] = useState<ProjectStatus>("planeacion");
  const [priority, setPriority] = useState<ProjectPriority>("medium");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [budget, setBudget] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [stagingUrl, setStagingUrl] = useState("");
  const [productionUrl, setProductionUrl] = useState("");
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startDateRef = useRef<HTMLInputElement>(null);
  const dueDateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editProject) {
      setName(editProject.name);
      setDescription(editProject.description ?? "");
      setClientId(editProject.client_id ?? "");
      setType(editProject.type ?? "");
      setStatus(editProject.status);
      setPriority(editProject.priority ?? "medium");
      setStartDate(editProject.start_date ?? "");
      setDueDate(editProject.due_date ?? "");
      setEstimatedHours(editProject.estimated_hours?.toString() ?? "");
      setBudget(editProject.budget?.toString() ?? "");
      setRepositoryUrl(editProject.repository_url ?? "");
      setStagingUrl(editProject.staging_url ?? "");
      setProductionUrl(editProject.production_url ?? "");
      setProgress(editProject.progress ?? 0);
    } else {
      setName("");
      setDescription("");
      setClientId(defaultClientId ?? "");
      setType("");
      setStatus("planeacion");
      setPriority("medium");
      setStartDate("");
      setDueDate("");
      setEstimatedHours("");
      setBudget("");
      setRepositoryUrl("");
      setStagingUrl("");
      setProductionUrl("");
      setProgress(0);
    }
    setError(null);
  }, [editProject, open, defaultClientId]);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr + "T00:00:00").toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre del proyecto es requerido.");
      return;
    }
    setLoading(true);
    setError(null);

    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      client_id: clientId || undefined,
      type: (type as ProjectType) || undefined,
      status,
      priority,
      start_date: startDate || undefined,
      due_date: dueDate || undefined,
      estimated_hours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      budget: budget ? parseFloat(budget) : undefined,
      repository_url: repositoryUrl.trim() || undefined,
      staging_url: stagingUrl.trim() || undefined,
      production_url: productionUrl.trim() || undefined,
      progress,
    };

    const result = editProject
      ? await updateProject({ id: editProject.id, ...payload })
      : await createProject({ ...payload, created_by: userId });

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editProject ? "Editar proyecto" : "Nuevo proyecto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Section: Básico */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proyecto</p>

            <div className="space-y-1.5">
              <Label htmlFor="project-name">Nombre *</Label>
              <Input
                id="project-name"
                placeholder="Ej: HAMCSoft Platform, E-commerce Acme..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="project-desc">Descripción</Label>
              <Textarea
                id="project-desc"
                placeholder="Descripción del proyecto..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {clients.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Cliente</Label>
                  <Select
                    value={clientId || "none"}
                    onValueChange={(v) => setClientId(v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin cliente</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.company_name ?? c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label>Tipo de proyecto</Label>
                <Select
                  value={type || "none"}
                  onValueChange={(v) => setType(v === "none" ? "" : (v as ProjectType))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin especificar</SelectItem>
                    <SelectItem value="landing_page">🌐 Landing Page</SelectItem>
                    <SelectItem value="ecommerce">🛒 E-commerce</SelectItem>
                    <SelectItem value="sistema_pos">🖥️ Sistema POS</SelectItem>
                    <SelectItem value="crm">👥 CRM</SelectItem>
                    <SelectItem value="automatizacion">⚙️ Automatización</SelectItem>
                    <SelectItem value="branding">🎨 Branding</SelectItem>
                    <SelectItem value="otro">📦 Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section: Estado */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado y prioridad</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planeacion">Planeación</SelectItem>
                    <SelectItem value="diseno">Diseño</SelectItem>
                    <SelectItem value="desarrollo">Desarrollo</SelectItem>
                    <SelectItem value="testing">Testing</SelectItem>
                    <SelectItem value="correcciones">Correcciones</SelectItem>
                    <SelectItem value="deploy">Deploy</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                    <SelectItem value="finalizado">Finalizado</SelectItem>
                    <SelectItem value="pausado">Pausado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Prioridad</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as ProjectPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="low">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="progress">Progreso ({progress}%)</Label>
                <input
                  id="progress"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full h-2 accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Section: Fechas */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fechas</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Start date */}
              <div className="space-y-1.5">
                <Label>Fecha de inicio</Label>
                <div className="relative">
                  <Input
                    readOnly
                    value={formatDateDisplay(startDate)}
                    placeholder="Seleccionar"
                    className="cursor-pointer pr-16"
                    onClick={() => startDateRef.current?.showPicker()}
                  />
                  {startDate && (
                    <button type="button" onClick={() => setStartDate("")} className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button type="button" onClick={() => startDateRef.current?.showPicker()} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <CalendarDays className="w-4 h-4" />
                  </button>
                  <input ref={startDateRef} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="sr-only" />
                </div>
              </div>

              {/* Due date */}
              <div className="space-y-1.5">
                <Label>Fecha límite</Label>
                <div className="relative">
                  <Input
                    readOnly
                    value={formatDateDisplay(dueDate)}
                    placeholder="Seleccionar"
                    className="cursor-pointer pr-16"
                    onClick={() => dueDateRef.current?.showPicker()}
                  />
                  {dueDate && (
                    <button type="button" onClick={() => setDueDate("")} className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button type="button" onClick={() => dueDateRef.current?.showPicker()} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <CalendarDays className="w-4 h-4" />
                  </button>
                  <input ref={dueDateRef} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="sr-only" />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Recursos */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recursos</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="estimated-hours">Horas estimadas</Label>
                <Input
                  id="estimated-hours"
                  type="number"
                  placeholder="0"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  min={0}
                  step={0.5}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="budget">Presupuesto del proyecto (MXN)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="0"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  min={0}
                />
              </div>
            </div>
          </div>

          {/* Section: URLs */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">URLs</p>
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label htmlFor="repo-url">Repositorio</Label>
                <Input
                  id="repo-url"
                  placeholder="https://github.com/org/repo"
                  value={repositoryUrl}
                  onChange={(e) => setRepositoryUrl(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="staging-url">Vista previa (cliente)</Label>
                  <Input
                    id="staging-url"
                    placeholder="https://staging.proyecto.com"
                    value={stagingUrl}
                    onChange={(e) => setStagingUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="production-url">Producción</Label>
                  <Input
                    id="production-url"
                    placeholder="https://proyecto.com"
                    value={productionUrl}
                    onChange={(e) => setProductionUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : editProject ? "Guardar cambios" : "Crear proyecto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
