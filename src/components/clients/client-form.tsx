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
  Client,
  ClientStatus,
  ClientPriority,
  ClientActionType,
  ClientServiceInterest,
  ClientLeadSource,
} from "@/lib/types";

interface ClientFormProps {
  open: boolean;
  onClose: () => void;
  editClient?: Client | null;
  userId: string;
}

const DEFAULT_STATUS: ClientStatus = "prospecto";
const DEFAULT_PRIORITY: ClientPriority = "medium";

export function ClientForm({
  open,
  onClose,
  editClient,
  userId,
}: ClientFormProps) {
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [status, setStatus] = useState<ClientStatus>(DEFAULT_STATUS);
  const [priority, setPriority] = useState<ClientPriority>(DEFAULT_PRIORITY);
  const [estimatedValue, setEstimatedValue] = useState("");
  const [serviceInterest, setServiceInterest] = useState<
    ClientServiceInterest | ""
  >("");
  const [leadSource, setLeadSource] = useState<ClientLeadSource | "">("");
  const [nextActionType, setNextActionType] = useState<ClientActionType | "">(
    "",
  );
  const [nextActionDate, setNextActionDate] = useState<string>("");
  const [nextActionNotes, setNextActionNotes] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editClient) {
      setCompanyName(editClient.company_name ?? editClient.name ?? "");
      setContactName(editClient.contact_name ?? "");
      setEmail(editClient.email ?? "");
      setPhone(editClient.phone ?? "");
      setWhatsapp(editClient.whatsapp ?? "");
      setWebsite(editClient.website ?? "");
      setIndustry(editClient.industry ?? "");
      setStatus(editClient.status);
      setPriority(editClient.priority ?? "medium");
      setEstimatedValue(editClient.estimated_value?.toString() ?? "");
      setServiceInterest(editClient.service_interest ?? "");
      setLeadSource(editClient.lead_source ?? "");
      setNextActionType(editClient.next_action_type ?? "");
      setNextActionDate(editClient.next_action_date ?? "");
      setNextActionNotes(editClient.next_action_notes ?? "");
      setNotes(editClient.notes ?? "");
    } else {
      setCompanyName("");
      setContactName("");
      setEmail("");
      setPhone("");
      setWhatsapp("");
      setWebsite("");
      setIndustry("");
      setStatus(DEFAULT_STATUS);
      setPriority(DEFAULT_PRIORITY);
      setEstimatedValue("");
      setServiceInterest("");
      setLeadSource("");
      setNextActionType("");
      setNextActionDate("");
      setNextActionNotes("");
      setNotes("");
    }
    setError(null);
  }, [editClient, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError("El nombre de la empresa es requerido.");
      return;
    }
    setLoading(true);
    setError(null);

    const payload = {
      company_name: companyName.trim(),
      contact_name: contactName.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      whatsapp: whatsapp.trim() || undefined,
      website: website.trim() || undefined,
      industry: industry.trim() || undefined,
      status,
      priority,
      estimated_value: estimatedValue ? parseFloat(estimatedValue) : undefined,
      service_interest: (serviceInterest as ClientServiceInterest) || undefined,
      lead_source: (leadSource as ClientLeadSource) || undefined,
      next_action_type: (nextActionType as ClientActionType) || undefined,
      next_action_date: nextActionDate || undefined,
      next_action_notes: nextActionNotes.trim() || undefined,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

          {/* Section: Empresa */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Empresa
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="company-name">Nombre de la empresa *</Label>
                  <span
                    className={`text-xs ${companyName.length > 90 ? "text-yellow-400" : "text-muted-foreground"}`}
                  >
                    {companyName.length}/100
                  </span>
                </div>
                <Input
                  id="company-name"
                  placeholder="Ej: Acme S.A., Juan García"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value.slice(0, 100))}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="industry">Industria / Rubro</Label>
                <Input
                  id="industry"
                  placeholder="Ej: Retail, Gastronomía..."
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Servicio de interés</Label>
                <Select
                  value={serviceInterest || "none"}
                  onValueChange={(v) =>
                    setServiceInterest(
                      v === "none" ? "" : (v as ClientServiceInterest),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin especificar</SelectItem>
                    <SelectItem value="landing_page">Landing Page</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="sistema_pos">Sistema POS</SelectItem>
                    <SelectItem value="crm">CRM</SelectItem>
                    <SelectItem value="automatizacion">
                      Automatización
                    </SelectItem>
                    <SelectItem value="branding">Branding</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Fuente del lead</Label>
                <Select
                  value={leadSource || "none"}
                  onValueChange={(v) =>
                    setLeadSource(v === "none" ? "" : (v as ClientLeadSource))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin especificar</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="referido">Referido</SelectItem>
                    <SelectItem value="web">Web</SelectItem>
                    <SelectItem value="manual">Manual / Directo</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="website">Sitio web</Label>
                <Input
                  id="website"
                  placeholder="https://empresa.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section: Contacto */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Contacto
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="contact-name">Persona de contacto</Label>
                <Input
                  id="contact-name"
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
                <Label htmlFor="client-whatsapp">WhatsApp</Label>
                <Input
                  id="client-whatsapp"
                  placeholder="+54 11 1234-5678"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section: Pipeline */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Pipeline comercial
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Estado</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as ClientStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospecto">Prospecto</SelectItem>
                    <SelectItem value="contactado">Contactado</SelectItem>
                    <SelectItem value="reunion_agendada">
                      Reunión agendada
                    </SelectItem>
                    <SelectItem value="en_negociacion">
                      En negociación
                    </SelectItem>
                    <SelectItem value="propuesta_enviada">
                      Propuesta enviada
                    </SelectItem>
                    <SelectItem value="esperando_respuesta">
                      Esperando respuesta
                    </SelectItem>
                    <SelectItem value="cerrado_ganado">
                      Cerrado ganado
                    </SelectItem>
                    <SelectItem value="cerrado_perdido">
                      Cerrado perdido
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Prioridad</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as ClientPriority)}
                >
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
                <Label htmlFor="estimated-value">
                  Valor estimado del contrato
                </Label>
                <Input
                  id="estimated-value"
                  type="number"
                  placeholder="Ej: 15000"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  min={0}
                />
                <p className="text-[11px] text-muted-foreground">
                  ¿Cuánto pagaría este cliente si cierra? Sirve para calcular el
                  valor total del pipeline.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Próxima acción */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Próxima acción
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipo de acción</Label>
                <Select
                  value={nextActionType || "none"}
                  onValueChange={(v) =>
                    setNextActionType(
                      v === "none" ? "" : (v as ClientActionType),
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin acción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin acción</SelectItem>
                    <SelectItem value="llamada">Llamada</SelectItem>
                    <SelectItem value="reunion">Reunión</SelectItem>
                    <SelectItem value="seguimiento">Seguimiento</SelectItem>
                    <SelectItem value="propuesta">Propuesta</SelectItem>
                    <SelectItem value="entrega">Entrega</SelectItem>
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
                        ? new Date(
                            nextActionDate + "T00:00:00",
                          ).toLocaleDateString("es-AR", {
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
                      className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => dateInputRef.current?.showPicker()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <CalendarDays className="w-4 h-4" />
                  </button>
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={nextActionDate}
                    onChange={(e) => setNextActionDate(e.target.value)}
                    className="sr-only"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="action-notes">Notas de la acción</Label>
                <span
                  className={`text-xs ${nextActionNotes.length > 180 ? "text-yellow-400" : "text-muted-foreground"}`}
                >
                  {nextActionNotes.length}/200
                </span>
              </div>
              <Textarea
                id="action-notes"
                placeholder="Qué se acordó, qué hay que preparar..."
                value={nextActionNotes}
                onChange={(e) =>
                  setNextActionNotes(e.target.value.slice(0, 200))
                }
                rows={2}
              />
            </div>
          </div>

          {/* Section: Notas internas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="client-notes">Notas internas</Label>
              <span
                className={`text-xs ${notes.length > 450 ? "text-yellow-400" : "text-muted-foreground"}`}
              >
                {notes.length}/500
              </span>
            </div>
            <Textarea
              id="client-notes"
              placeholder="Observaciones del equipo, contexto de negocio..."
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 500))}
              rows={3}
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
