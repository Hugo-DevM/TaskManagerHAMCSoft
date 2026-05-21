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
import { createClient, updateClient } from "@/app/(dashboard)/clientes/actions";
import type {
  ClientStatus,
  ClientActionType,
  ClientWithRelations,
  Project,
} from "@/lib/types";

interface ClientFormProps {
  open: boolean;
  onClose: () => void;
  editClient?: ClientWithRelations | null;
  projects: Project[];
  userId: string;
}

export function ClientForm({ open, onClose, editClient, projects, userId }: ClientFormProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<ClientStatus>("prospecto");
  const [projectId, setProjectId] = useState<string>("");
  const [nextActionType, setNextActionType] = useState<ClientActionType | "">("");
  const [nextActionDate, setNextActionDate] = useState<string>("");
  const [nextActionNotes, setNextActionNotes] = useState("");
  const [requirements, setRequirements] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editClient) {
      setName(editClient.name);
      setContactName(editClient.contact_name ?? "");
      setEmail(editClient.email ?? "");
      setPhone(editClient.phone ?? "");
      setStatus(editClient.status);
      setProjectId(editClient.project_id ?? "");
      setNextActionType(editClient.next_action_type ?? "");
      setNextActionDate(editClient.next_action_date ?? "");
      setNextActionNotes(editClient.next_action_notes ?? "");
      setRequirements(editClient.requirements ?? "");
      setNotes(editClient.notes ?? "");
    } else {
      setName("");
      setContactName("");
      setEmail("");
      setPhone("");
      setStatus("prospecto");
      setProjectId("");
      setNextActionType("");
      setNextActionDate(new Date().toISOString().split("T")[0]);
      setNextActionNotes("");
      setRequirements("");
      setNotes("");
    }
    setError(null);
  }, [editClient, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("El nombre del cliente es requerido.");
      return;
    }
    setLoading(true);
    setError(null);

    const payload = {
      name: name.trim(),
      contact_name: contactName.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      status,
      next_action_type: (nextActionType as ClientActionType) || undefined,
      next_action_date: nextActionDate || undefined,
      next_action_notes: nextActionNotes.trim() || undefined,
      project_id: projectId || undefined,
      requirements: requirements.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const result = editClient
      ? await updateClient({ id: editClient.id, ...payload })
      : await createClient({ ...payload, created_by: userId });

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
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editClient ? "Editar cliente" : "Nuevo cliente"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="client-name">Nombre del cliente *</Label>
              <span className={`text-xs ${name.length > 90 ? "text-yellow-400" : "text-muted-foreground"}`}>
                {name.length}/100
              </span>
            </div>
            <Input
              id="client-name"
              placeholder="Ej: Empresa Acme S.A."
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 100))}
              autoFocus
              maxLength={100}
            />
          </div>

          {/* Contact name & Email */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="client-contact">Persona de contacto</Label>
              <Input
                id="client-contact"
                placeholder="Ej: Juan Pérez"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="client-email">Email</Label>
              <Input
                id="client-email"
                type="email"
                placeholder="correo@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Phone & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="client-phone">Teléfono</Label>
              <Input
                id="client-phone"
                placeholder="+54 11 1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ClientStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospecto">Prospecto</SelectItem>
                  <SelectItem value="contactado">Contactado</SelectItem>
                  <SelectItem value="en_negociacion">En negociación</SelectItem>
                  <SelectItem value="propuesta_enviada">Propuesta enviada</SelectItem>
                  <SelectItem value="cerrado">Cerrado</SelectItem>
                  <SelectItem value="perdido">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Linked project */}
          <div className="space-y-1.5">
            <Label>Proyecto vinculado</Label>
            <Select
              value={projectId || "none"}
              onValueChange={(v) => setProjectId(v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin proyecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin proyecto</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Next action — type + date side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo de próxima acción</Label>
              <Select
                value={nextActionType || "none"}
                onValueChange={(v) =>
                  setNextActionType(v === "none" ? "" : (v as ClientActionType))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin acción" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin acción</SelectItem>
                  <SelectItem value="llamada">Llamada</SelectItem>
                  <SelectItem value="reunion">Reunión</SelectItem>
                  <SelectItem value="entrega">Entrega</SelectItem>
                  <SelectItem value="seguimiento">Seguimiento</SelectItem>
                  <SelectItem value="propuesta">Propuesta</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Fecha de la acción</Label>
              <div className="relative">
                <Input
                  readOnly
                  value={
                    nextActionDate
                      ? new Date(nextActionDate + "T00:00:00").toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : ""
                  }
                  placeholder="Seleccionar fecha"
                  className="cursor-pointer pr-16"
                  onClick={() => dateInputRef.current?.showPicker()}
                />
                {nextActionDate && (
                  <button
                    type="button"
                    onClick={() => setNextActionDate("")}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    title="Quitar fecha"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => dateInputRef.current?.showPicker()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Abrir calendario"
                >
                  <CalendarDays className="w-4 h-4" />
                </button>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={nextActionDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setNextActionDate(e.target.value)}
                  className="sr-only"
                />
              </div>
            </div>
          </div>

          {/* Next action notes */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="client-action-notes">Notas de la acción</Label>
              <span className={`text-xs ${nextActionNotes.length > 180 ? "text-yellow-400" : "text-muted-foreground"}`}>
                {nextActionNotes.length}/200
              </span>
            </div>
            <Textarea
              id="client-action-notes"
              placeholder="Qué se acordó, qué hay que preparar..."
              value={nextActionNotes}
              onChange={(e) => setNextActionNotes(e.target.value.slice(0, 200))}
              rows={2}
              maxLength={200}
            />
          </div>

          {/* Requirements */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="client-requirements">Requerimientos / Lo que necesita</Label>
              <span className={`text-xs ${requirements.length > 450 ? "text-yellow-400" : "text-muted-foreground"}`}>
                {requirements.length}/500
              </span>
            </div>
            <Textarea
              id="client-requirements"
              placeholder="Descripción de lo que el cliente necesita o pidió..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value.slice(0, 500))}
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Internal notes */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="client-notes">Notas internas</Label>
              <span className={`text-xs ${notes.length > 270 ? "text-yellow-400" : "text-muted-foreground"}`}>
                {notes.length}/300
              </span>
            </div>
            <Textarea
              id="client-notes"
              placeholder="Observaciones internas del equipo..."
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 300))}
              rows={2}
              maxLength={300}
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
                : editClient
                ? "Guardar cambios"
                : "Crear cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
