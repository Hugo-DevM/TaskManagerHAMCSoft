"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Mail,
  Phone,
  MessageCircle,
  Globe,
  Building2,
  TrendingUp,
  Clock,
  Plus,
  FolderKanban,
  FileText,
  Calendar,
  User,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClientForm } from "@/components/clients/client-form";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectForm } from "@/components/projects/project-form";
import { deleteClient, createClientActivity, deleteClientActivity, createClientDocument, deleteClientDocument } from "@/app/(dashboard)/clientes/actions";
import { deleteProject } from "@/app/(dashboard)/projects/actions";
import { useClientActivities } from "@/hooks/use-client-activities";
import type {
  Client,
  ProjectWithStats,
  ClientDocument,
  ClientActivityType,
  DocumentType,
} from "@/lib/types";
import {
  cn,
  formatRelativeDate,
  formatDateTime,
  formatCurrency,
  CLIENT_STATUS_CONFIG,
  CLIENT_PRIORITY_CONFIG,
  CLIENT_ACTIVITY_TYPE_CONFIG,
  CLIENT_ACTION_TYPE_LABEL,
  formatDueDate,
  isDateOverdue,
} from "@/lib/utils";

type Tab = "resumen" | "actividad" | "proyectos" | "documentos" | "notas";

interface ClientDetailViewProps {
  client: Client;
  projects: ProjectWithStats[];
  documents: ClientDocument[];
  userId: string;
}

export function ClientDetailView({
  client,
  projects,
  documents,
  userId,
}: ClientDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("resumen");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);

  const { activities, loading: activitiesLoading } = useClientActivities(client.id);

  const statusCfg = CLIENT_STATUS_CONFIG[client.status];
  const priorityCfg = CLIENT_PRIORITY_CONFIG[client.priority ?? "medium"];
  const displayName = client.company_name ?? client.name ?? "";
  const isClosed = client.status === "cerrado_ganado" || client.status === "cerrado_perdido";

  const handleDelete = async () => {
    if (!window.confirm(`¿Eliminar a "${displayName}"? Esta acción no se puede deshacer.`)) return;
    await deleteClient(client.id);
    router.push("/clientes");
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm("¿Eliminar este proyecto?")) return;
    await deleteProject(id);
    router.refresh();
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "resumen",    label: "Resumen",    icon: <User className="w-3.5 h-3.5" /> },
    { id: "actividad",  label: "Actividad",  icon: <Clock className="w-3.5 h-3.5" /> },
    { id: "proyectos",  label: `Proyectos (${projects.length})`, icon: <FolderKanban className="w-3.5 h-3.5" /> },
    { id: "documentos", label: `Docs (${documents.length})`,     icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "notas",      label: "Notas",      icon: <Pencil className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header
        title={displayName}
        subtitle={statusCfg.label}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/clientes")} className="gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)} className="gap-1.5">
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="gap-1.5 text-red-400 hover:text-red-400 border-red-500/20 hover:bg-red-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-5">
        {/* Status + priority strip */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className={cn("w-3 h-3 rounded-full", statusCfg.barColor)} />
          <Badge variant="outline" className={cn("border text-xs px-2 py-0.5", statusCfg.bgColor)}>
            {statusCfg.label}
          </Badge>
          <Badge variant="outline" className={cn("border text-xs px-2 py-0.5", priorityCfg.bgColor)}>
            {priorityCfg.label} prioridad
          </Badge>
          {client.estimated_value != null && (
            <div className="flex items-center gap-1 text-sm text-emerald-400 font-medium ml-auto">
              <TrendingUp className="w-4 h-4" />
              {formatCurrency(client.estimated_value)}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-border overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "resumen" && (
          <ResumenTab client={client} isClosed={isClosed} />
        )}

        {activeTab === "actividad" && (
          <ActividadTab
            clientId={client.id}
            activities={activities}
            loading={activitiesLoading}
            userId={userId}
            onRefresh={() => router.refresh()}
          />
        )}

        {activeTab === "proyectos" && (
          <ProyectosTab
            projects={projects}
            onEdit={() => {}}
            onDelete={handleDeleteProject}
            onNew={() => setIsProjectFormOpen(true)}
          />
        )}

        {activeTab === "documentos" && (
          <DocumentosTab
            clientId={client.id}
            documents={documents}
            userId={userId}
            onRefresh={() => router.refresh()}
          />
        )}

        {activeTab === "notas" && (
          <NotasTab client={client} />
        )}
      </div>

      <ClientForm
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        editClient={client}
        userId={userId}
      />

      <ProjectForm
        open={isProjectFormOpen}
        onClose={() => setIsProjectFormOpen(false)}
        clients={[client]}
        defaultClientId={client.id}
        userId={userId}
      />
    </div>
  );
}

// ---- TAB: RESUMEN ----
function ResumenTab({ client, isClosed }: { client: Client; isClosed: boolean }) {
  const hasNextAction = !!client.next_action_date;
  const actionOverdue = hasNextAction && isDateOverdue(client.next_action_date) && !isClosed;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Empresa */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Empresa</h3>
        <InfoRow icon={<Building2 className="w-3.5 h-3.5" />} label="Empresa" value={client.company_name ?? client.name} />
        {client.industry && <InfoRow icon={<Building2 className="w-3.5 h-3.5" />} label="Industria" value={client.industry} />}
        {client.website && (
          <InfoRow
            icon={<Globe className="w-3.5 h-3.5" />}
            label="Web"
            value={
              <a href={client.website} target="_blank" rel="noopener noreferrer"
                className="text-indigo-400 hover:underline truncate">
                {client.website}
              </a>
            }
          />
        )}
      </div>

      {/* Contacto */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contacto</h3>
        {client.contact_name && <InfoRow icon={<User className="w-3.5 h-3.5" />} label="Persona" value={client.contact_name} />}
        {client.email && (
          <InfoRow icon={<Mail className="w-3.5 h-3.5" />} label="Email"
            value={<a href={`mailto:${client.email}`} className="text-indigo-400 hover:underline">{client.email}</a>}
          />
        )}
        {client.phone && <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="Teléfono" value={client.phone} />}
        {client.whatsapp && (
          <InfoRow icon={<MessageCircle className="w-3.5 h-3.5" />} label="WhatsApp"
            value={
              <a href={`https://wa.me/${client.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                className="text-emerald-400 hover:underline">
                {client.whatsapp}
              </a>
            }
          />
        )}
      </div>

      {/* Pipeline */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pipeline comercial</h3>
        {client.service_interest && <InfoRow icon={<TrendingUp className="w-3.5 h-3.5" />} label="Interés" value={client.service_interest.replace(/_/g, " ")} />}
        {client.lead_source && <InfoRow icon={<Globe className="w-3.5 h-3.5" />} label="Fuente" value={client.lead_source} />}
        {client.estimated_value != null && <InfoRow icon={<TrendingUp className="w-3.5 h-3.5" />} label="Valor estimado" value={formatCurrency(client.estimated_value)} />}
        <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Creado" value={formatRelativeDate(client.created_at)} />
        {client.last_contact_at && <InfoRow icon={<Clock className="w-3.5 h-3.5" />} label="Último contacto" value={formatDateTime(client.last_contact_at)} />}
      </div>

      {/* Próxima acción */}
      {hasNextAction && !isClosed && (
        <div className={cn(
          "bg-card border rounded-xl p-4 space-y-3",
          actionOverdue ? "border-red-500/30" : "border-border"
        )}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Próxima acción</h3>
          {client.next_action_type && (
            <InfoRow icon={<Clock className="w-3.5 h-3.5" />} label="Tipo"
              value={CLIENT_ACTION_TYPE_LABEL[client.next_action_type]}
            />
          )}
          <InfoRow
            icon={<Calendar className="w-3.5 h-3.5" />}
            label="Fecha"
            value={
              <span className={actionOverdue ? "text-red-400 font-medium" : ""}>
                {formatDueDate(client.next_action_date)}
                {actionOverdue && " · Vencida"}
              </span>
            }
          />
          {client.next_action_notes && (
            <p className="text-xs text-muted-foreground">{client.next_action_notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-muted-foreground mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground leading-none mb-0.5">{label}</p>
        <div className="text-sm text-foreground">{value}</div>
      </div>
    </div>
  );
}

// ---- TAB: ACTIVIDAD ----
function ActividadTab({
  clientId,
  activities,
  loading,
  userId,
  onRefresh,
}: {
  clientId: string;
  activities: ReturnType<typeof useClientActivities>["activities"];
  loading: boolean;
  userId: string;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ClientActivityType>("nota");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!message.trim()) return;
    setSaving(true);
    await createClientActivity({
      client_id: clientId,
      type,
      message: message.trim(),
      created_by: userId,
    });
    setMessage("");
    setSaving(false);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Add activity */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registrar actividad</h3>
        <div className="flex gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ClientActivityType)}
            className="text-xs bg-accent border border-border rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500 shrink-0"
          >
            {(Object.keys(CLIENT_ACTIVITY_TYPE_CONFIG) as ClientActivityType[]).map((t) => (
              <option key={t} value={t}>
                {CLIENT_ACTIVITY_TYPE_CONFIG[t].icon} {CLIENT_ACTIVITY_TYPE_CONFIG[t].label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Descripción de la actividad..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="flex-1 text-sm bg-accent border border-border rounded-lg px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <Button size="sm" onClick={handleAdd} disabled={saving || !message.trim()} className="gap-1.5 shrink-0">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Agregar
          </Button>
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">Sin actividades aún. Registra la primera.</p>
        </div>
      ) : (
        <div className="relative space-y-0">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border ml-[7px]" />
          <div className="space-y-1">
            {activities.map((activity) => {
              const cfg = CLIENT_ACTIVITY_TYPE_CONFIG[activity.type];
              return (
                <div key={activity.id} className="relative flex gap-4 pl-12 py-3 group">
                  {/* Dot */}
                  <div className={cn("absolute left-4 top-4 w-3.5 h-3.5 rounded-full border-2 border-background flex items-center justify-center text-[8px] shrink-0", cfg.bgColor)}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm text-foreground">{activity.message}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", cfg.bgColor)}>
                            {cfg.label}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(activity.created_at)}
                          </span>
                          {activity.creator && (
                            <span className="text-xs text-muted-foreground">
                              · {activity.creator.full_name ?? activity.creator.email}
                            </span>
                          )}
                        </div>
                      </div>
                      {activity.created_by === userId && (
                        <button
                          onClick={async () => {
                            await deleteClientActivity(activity.id, activity.client_id);
                            onRefresh();
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400 shrink-0"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- TAB: PROYECTOS ----
function ProyectosTab({
  projects,
  onEdit,
  onDelete,
  onNew,
}: {
  projects: ProjectWithStats[];
  onEdit: (p: ProjectWithStats) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {projects.length} {projects.length === 1 ? "proyecto" : "proyectos"} vinculados
        </p>
        <Button size="sm" onClick={onNew} className="gap-1.5">
          <Plus className="w-4 h-4" />
          Nuevo proyecto
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground mb-3">Sin proyectos vinculados.</p>
          <Button size="sm" variant="outline" onClick={onNew} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Crear primer proyecto
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---- TAB: DOCUMENTOS ----
function DocumentosTab({
  clientId,
  documents,
  userId,
  onRefresh,
}: {
  clientId: string;
  documents: ClientDocument[];
  userId: string;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<DocumentType>("other");
  const [fileUrl, setFileUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const DOC_TYPE_LABELS: Record<DocumentType, string> = {
    proposal:     "Propuesta",
    contract:     "Contrato",
    invoice:      "Factura",
    nda:          "NDA",
    brief:        "Brief",
    requirements: "Requerimientos",
    other:        "Otro",
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await createClientDocument({
      client_id: clientId,
      type,
      name: name.trim(),
      file_url: fileUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      uploaded_by: userId,
    });
    setName("");
    setFileUrl("");
    setNotes("");
    setSaving(false);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Add doc form */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agregar documento</h3>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            placeholder="Nombre del documento *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="col-span-2 text-sm bg-accent border border-border rounded-lg px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as DocumentType)}
            className="text-xs bg-accent border border-border rounded-lg px-2 py-1.5 text-foreground focus:outline-none"
          >
            {(Object.keys(DOC_TYPE_LABELS) as DocumentType[]).map((t) => (
              <option key={t} value={t}>{DOC_TYPE_LABELS[t]}</option>
            ))}
          </select>
          <input
            type="url"
            placeholder="URL del archivo (opcional)"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            className="text-sm bg-accent border border-border rounded-lg px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <input
            type="text"
            placeholder="Notas opcionales"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="col-span-2 text-sm bg-accent border border-border rounded-lg px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={handleAdd} disabled={saving || !name.trim()} className="gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Agregar
          </Button>
        </div>
      </div>

      {/* Doc list */}
      {documents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">Sin documentos cargados.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="group flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl hover:border-border/60 transition-colors">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs bg-accent px-1.5 py-0.5 rounded text-muted-foreground">
                    {DOC_TYPE_LABELS[doc.type]}
                  </span>
                  {doc.notes && (
                    <span className="text-xs text-muted-foreground truncate">{doc.notes}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {doc.file_url && (
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    Abrir
                  </a>
                )}
                <button
                  onClick={async () => {
                    await deleteClientDocument(doc.id, clientId);
                    onRefresh();
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- TAB: NOTAS ----
function NotasTab({ client }: { client: Client }) {
  return (
    <div className="space-y-4">
      {client.notes ? (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Notas internas</h3>
          <p className="text-sm text-foreground whitespace-pre-wrap">{client.notes}</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">Sin notas. Edita el cliente para agregar notas.</p>
        </div>
      )}

      {/* Legacy requirements */}
      {client.requirements && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Requerimientos</h3>
          <p className="text-sm text-foreground whitespace-pre-wrap">{client.requirements}</p>
        </div>
      )}
    </div>
  );
}
