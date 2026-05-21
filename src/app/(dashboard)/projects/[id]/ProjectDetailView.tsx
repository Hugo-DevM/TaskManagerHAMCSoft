"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Clock,
  Plus,
  Loader2,
  ExternalLink,
  GitBranch,
  Globe,
  Rocket,
  FileText,
  Bug,
  CheckCircle2,
  User,
  CalendarDays,
  AlertTriangle,
  DollarSign,
  Timer,
} from "lucide-react";
import { Header } from "@/components/layout/header";
import { TaskList } from "@/components/tasks/task-list";
import { ProjectForm } from "@/components/projects/project-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteProject, createProjectActivity, deleteProjectActivity, createProjectFile, deleteProjectFile } from "@/app/(dashboard)/projects/actions";
import { useProjectActivities } from "@/hooks/use-project-activities";
import type {
  TaskWithRelations,
  ProjectWithStats,
  Project,
  Profile,
  BugWithRelations,
  ProjectActivityType,
  ProjectFileType,
  Client,
} from "@/lib/types";
import {
  PROJECT_STATUS_CONFIG,
  PROJECT_PRIORITY_CONFIG,
  PROJECT_TYPE_CONFIG,
  PROJECT_ACTIVITY_TYPE_CONFIG,
  cn,
  formatRelativeDate,
  formatDueDate,
  formatDateTime,
  formatCurrency,
  isDateOverdue,
  isDueSoon,
} from "@/lib/utils";

type Tab = "overview" | "tasks" | "bugs" | "timeline" | "files" | "deploy";

interface ProjectDetailViewProps {
  project: ProjectWithStats;
  client: Client | null;
  tasks: TaskWithRelations[];
  bugs: BugWithRelations[];
  projects: Project[];
  profiles: Profile[];
  clients: Client[];
  userId: string;
}

export function ProjectDetailView({
  project,
  client,
  tasks,
  bugs,
  projects,
  profiles,
  clients,
  userId,
}: ProjectDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { activities, loading: activitiesLoading } = useProjectActivities(project.id);

  const taskStats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "Completado").length,
    inProgress: tasks.filter((t) => t.status === "En progreso").length,
    pending: tasks.filter((t) => t.status === "Pendiente").length,
  }), [tasks]);

  const completionPct =
    taskStats.total > 0
      ? Math.round((taskStats.completed / taskStats.total) * 100)
      : project.progress ?? 0;

  const statusCfg = PROJECT_STATUS_CONFIG[project.status];
  const priorityCfg = PROJECT_PRIORITY_CONFIG[project.priority ?? "medium"];
  const typeCfg = project.type ? PROJECT_TYPE_CONFIG[project.type] : null;

  const isOverdue = isDateOverdue(project.due_date);
  const dueSoon = isDueSoon(project.due_date, 7) && !isOverdue;

  const handleDelete = async () => {
    if (window.confirm("¿Eliminar este proyecto? Las tareas quedarán sin proyecto.")) {
      await deleteProject(project.id);
      router.push("/projects");
    }
  };

  const openBugs = bugs.filter((b) => b.status !== "Resuelto").length;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview",  label: "Overview",          icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    { id: "tasks",     label: `Tareas (${tasks.length})`, icon: <Clock className="w-3.5 h-3.5" /> },
    { id: "bugs",      label: `Bugs${openBugs > 0 ? ` (${openBugs})` : ""}`, icon: <Bug className="w-3.5 h-3.5" /> },
    { id: "timeline",  label: "Timeline",           icon: <Clock className="w-3.5 h-3.5" /> },
    { id: "files",     label: "Archivos",           icon: <FileText className="w-3.5 h-3.5" /> },
    { id: "deploy",    label: "Deploy",             icon: <Rocket className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header
        title={project.name}
        subtitle={`${statusCfg.label} · Creado ${formatRelativeDate(project.created_at)}`}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push("/projects")} className="gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)} className="gap-1.5">
              <Pencil className="w-3.5 h-3.5" />
              Editar
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete}
              className="gap-1.5 text-red-400 hover:text-red-400 border-red-500/20 hover:bg-red-500/10">
              <Trash2 className="w-3.5 h-3.5" />
              Eliminar
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-5">
        {/* Header strip */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className={cn("w-3 h-3 rounded-full", statusCfg.barColor)} />
          <Badge variant="outline" className={cn("border text-xs", statusCfg.bgColor)}>{statusCfg.label}</Badge>
          <Badge variant="outline" className={cn("border text-xs", priorityCfg.bgColor)}>{priorityCfg.label}</Badge>
          {typeCfg && <span className="text-sm">{typeCfg.icon} <span className="text-xs text-muted-foreground">{typeCfg.label}</span></span>}
          {client && (
            <Link href={`/clientes/${client.id}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-indigo-400 ml-auto transition-colors">
              <User className="w-3 h-3" />
              {client.company_name ?? client.name}
              <ExternalLink className="w-3 h-3" />
            </Link>
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
              {tab.id === "bugs" && openBugs > 0 && (
                <span className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5 rounded-full">
                  {openBugs}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "overview" && (
          <OverviewTab
            project={project}
            taskStats={taskStats}
            completionPct={completionPct}
            isOverdue={isOverdue}
            dueSoon={dueSoon}
          />
        )}

        {activeTab === "tasks" && (
          <TaskList
            tasks={tasks}
            projects={projects}
            profiles={profiles}
            userId={userId}
            filterProjectId={project.id}
          />
        )}

        {activeTab === "bugs" && (
          <BugsTab bugs={bugs} />
        )}

        {activeTab === "timeline" && (
          <TimelineTab
            projectId={project.id}
            activities={activities}
            loading={activitiesLoading}
            userId={userId}
            onRefresh={() => router.refresh()}
          />
        )}

        {activeTab === "files" && (
          <FilesTab
            projectId={project.id}
            userId={userId}
            onRefresh={() => router.refresh()}
          />
        )}

        {activeTab === "deploy" && (
          <DeployTab project={project} />
        )}
      </div>

      <ProjectForm
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        editProject={project}
        clients={clients}
        userId={userId}
      />
    </div>
  );
}

// ---- TAB: OVERVIEW ----
function OverviewTab({
  project,
  taskStats,
  completionPct,
  isOverdue,
  dueSoon,
}: {
  project: ProjectWithStats;
  taskStats: { total: number; completed: number; inProgress: number; pending: number };
  completionPct: number;
  isOverdue: boolean;
  dueSoon: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Project info card */}
      <div className="bg-card border border-border rounded-xl p-5">
        {project.description && (
          <p className="text-sm text-muted-foreground mb-4">{project.description}</p>
        )}

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Progreso general</span>
            <span className="text-sm font-semibold text-foreground">{completionPct}%</span>
          </div>
          <div className="h-2 bg-accent rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                completionPct === 100 ? "bg-emerald-500" : "bg-indigo-500"
              )}
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        {/* Task stats */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "Total",       value: taskStats.total,     color: "text-foreground" },
            { label: "Pendientes",  value: taskStats.pending,   color: "text-zinc-400" },
            { label: "En progreso", value: taskStats.inProgress, color: "text-indigo-400" },
            { label: "Completadas", value: taskStats.completed,  color: "text-emerald-400" },
          ].map((s) => (
            <div key={s.label} className="text-center p-3 bg-accent/40 rounded-lg">
              <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Dates + resources */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {project.start_date && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CalendarDays className="w-3.5 h-3.5 shrink-0" />
              <span>Inicio: {formatDueDate(project.start_date)}</span>
            </div>
          )}
          {project.due_date && (
            <div className={cn(
              "flex items-center gap-1.5",
              isOverdue ? "text-red-400" : dueSoon ? "text-yellow-400" : "text-muted-foreground"
            )}>
              {isOverdue ? <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> : <CalendarDays className="w-3.5 h-3.5 shrink-0" />}
              <span>Límite: {formatDueDate(project.due_date)}</span>
              {isOverdue && <span className="font-medium">· Vencido</span>}
            </div>
          )}
          {project.estimated_hours != null && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Timer className="w-3.5 h-3.5 shrink-0" />
              <span>{project.tracked_hours ?? 0} / {project.estimated_hours}h</span>
            </div>
          )}
          {project.budget != null && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <DollarSign className="w-3.5 h-3.5 shrink-0" />
              <span>
                {project.final_cost != null
                  ? `${formatCurrency(project.final_cost)} / ${formatCurrency(project.budget)}`
                  : `Presupuesto: ${formatCurrency(project.budget)}`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- TAB: BUGS ----
function BugsTab({ bugs }: { bugs: BugWithRelations[] }) {
  const openBugs = bugs.filter((b) => b.status !== "Resuelto");
  const resolvedBugs = bugs.filter((b) => b.status === "Resuelto");

  const SEVERITY_COLOR: Record<string, string> = {
    "Crítico": "bg-red-500/10 text-red-400 border-red-500/20",
    "Alto":    "bg-orange-500/10 text-orange-400 border-orange-500/20",
    "Medio":   "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    "Bajo":    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  if (bugs.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Sin bugs reportados en este proyecto.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {openBugs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Bug className="w-3.5 h-3.5 text-red-400" />
            Abiertos ({openBugs.length})
          </h3>
          {openBugs.map((bug) => (
            <BugRow key={bug.id} bug={bug} severityColor={SEVERITY_COLOR[bug.severity] ?? ""} />
          ))}
        </div>
      )}

      {resolvedBugs.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Resueltos ({resolvedBugs.length})
          </h3>
          {resolvedBugs.map((bug) => (
            <BugRow key={bug.id} bug={bug} severityColor={SEVERITY_COLOR[bug.severity] ?? ""} resolved />
          ))}
        </div>
      )}
    </div>
  );
}

function BugRow({ bug, severityColor, resolved = false }: {
  bug: BugWithRelations;
  severityColor: string;
  resolved?: boolean;
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 bg-card border rounded-xl transition-colors",
      resolved ? "border-border/40 opacity-60" : "border-border hover:border-border/60"
    )}>
      <div className={cn("w-1.5 h-8 rounded-full shrink-0", severityColor.includes("red") ? "bg-red-500" : severityColor.includes("orange") ? "bg-orange-500" : severityColor.includes("yellow") ? "bg-yellow-500" : "bg-blue-500")} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{bug.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", severityColor)}>
            {bug.severity}
          </Badge>
          <span className="text-xs text-muted-foreground">{bug.status}</span>
          {bug.system_name && <span className="text-xs text-muted-foreground">· {bug.system_name}</span>}
        </div>
      </div>
    </div>
  );
}

// ---- TAB: TIMELINE ----
function TimelineTab({
  projectId,
  activities,
  loading,
  userId,
  onRefresh,
}: {
  projectId: string;
  activities: ReturnType<typeof useProjectActivities>["activities"];
  loading: boolean;
  userId: string;
  onRefresh: () => void;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ProjectActivityType>("nota");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!message.trim()) return;
    setSaving(true);
    await createProjectActivity({
      project_id: projectId,
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
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registrar actividad</h3>
        <div className="flex gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ProjectActivityType)}
            className="text-xs bg-accent border border-border rounded-lg px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500 shrink-0"
          >
            {(Object.keys(PROJECT_ACTIVITY_TYPE_CONFIG) as ProjectActivityType[]).map((t) => (
              <option key={t} value={t}>
                {PROJECT_ACTIVITY_TYPE_CONFIG[t].icon} {PROJECT_ACTIVITY_TYPE_CONFIG[t].label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Qué pasó en el proyecto..."
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">Sin actividades aún. Registra la primera.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border ml-[7px]" />
          <div className="space-y-1">
            {activities.map((activity) => {
              const cfg = PROJECT_ACTIVITY_TYPE_CONFIG[activity.type];
              return (
                <div key={activity.id} className="relative flex gap-4 pl-12 py-3 group">
                  <div className={cn("absolute left-4 top-4 w-3.5 h-3.5 rounded-full border-2 border-background flex items-center justify-center text-[8px]", cfg.bgColor)}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm text-foreground">{activity.message}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", cfg.bgColor)}>{cfg.label}</span>
                          <span className="text-xs text-muted-foreground">{formatDateTime(activity.created_at)}</span>
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
                            await deleteProjectActivity(activity.id, activity.project_id);
                            onRefresh();
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400"
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

// ---- TAB: FILES ----
function FilesTab({
  projectId,
  userId,
  onRefresh,
}: {
  projectId: string;
  userId: string;
  onRefresh: () => void;
}) {
  const [files, setFiles] = useState<{ id: string; name: string; type: ProjectFileType; file_url: string | null; notes: string | null; uploaded_by: string | null }[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState<ProjectFileType>("document");
  const [fileUrl, setFileUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const FILE_TYPE_LABELS: Record<ProjectFileType, string> = {
    design: "Diseño", document: "Documento", image: "Imagen",
    video: "Video", code: "Código", other: "Otro",
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await createProjectFile({
      project_id: projectId,
      name: name.trim(),
      type,
      file_url: fileUrl.trim() || undefined,
      uploaded_by: userId,
    });
    setName("");
    setFileUrl("");
    setSaving(false);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agregar archivo</h3>
        <div className="grid grid-cols-2 gap-2">
          <input type="text" placeholder="Nombre del archivo *" value={name} onChange={(e) => setName(e.target.value)}
            className="col-span-2 text-sm bg-accent border border-border rounded-lg px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          <select value={type} onChange={(e) => setType(e.target.value as ProjectFileType)}
            className="text-xs bg-accent border border-border rounded-lg px-2 py-1.5 text-foreground focus:outline-none">
            {(Object.keys(FILE_TYPE_LABELS) as ProjectFileType[]).map((t) => (
              <option key={t} value={t}>{FILE_TYPE_LABELS[t]}</option>
            ))}
          </select>
          <input type="url" placeholder="URL del archivo" value={fileUrl} onChange={(e) => setFileUrl(e.target.value)}
            className="text-sm bg-accent border border-border rounded-lg px-3 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none" />
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={handleAdd} disabled={saving || !name.trim()} className="gap-1.5">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Agregar
          </Button>
        </div>
      </div>

      <div className="text-center py-8 text-sm text-muted-foreground">
        Los archivos se cargarán aquí después de aplicar la migración SQL.
      </div>
    </div>
  );
}

// ---- TAB: DEPLOY ----
function DeployTab({ project }: { project: ProjectWithStats }) {
  const hasAnyUrl = project.repository_url || project.staging_url || project.production_url;

  return (
    <div className="space-y-4">
      {!hasAnyUrl ? (
        <div className="text-center py-12">
          <Rocket className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-1">Sin URLs configuradas.</p>
          <p className="text-xs text-muted-foreground">Edita el proyecto para agregar repositorio, staging y producción.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {project.repository_url && (
            <DeployUrlCard
              icon={<GitBranch className="w-4 h-4" />}
              label="Repositorio"
              url={project.repository_url}
              color="text-zinc-400"
            />
          )}
          {project.staging_url && (
            <DeployUrlCard
              icon={<Globe className="w-4 h-4" />}
              label="Staging / Preview"
              url={project.staging_url}
              color="text-yellow-400"
            />
          )}
          {project.production_url && (
            <DeployUrlCard
              icon={<Rocket className="w-4 h-4" />}
              label="Producción"
              url={project.production_url}
              color="text-emerald-400"
            />
          )}
        </div>
      )}

      {/* Deploy stats */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Estado del proyecto</h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-muted-foreground">Estado actual</p>
            <p className="font-medium text-foreground mt-0.5">{PROJECT_STATUS_CONFIG[project.status].label}</p>
          </div>
          {project.production_url && (
            <div>
              <p className="text-muted-foreground">Producción</p>
              <p className="font-medium text-emerald-400 mt-0.5">En vivo</p>
            </div>
          )}
          {project.due_date && (
            <div>
              <p className="text-muted-foreground">Fecha límite</p>
              <p className="font-medium text-foreground mt-0.5">{formatDueDate(project.due_date)}</p>
            </div>
          )}
          {project.budget != null && (
            <div>
              <p className="text-muted-foreground">Presupuesto</p>
              <p className="font-medium text-foreground mt-0.5">{formatCurrency(project.budget)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DeployUrlCard({
  icon,
  label,
  url,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  url: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl hover:border-border/60 transition-colors">
      <div className={cn("shrink-0", color)}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground truncate">{url}</p>
      </div>
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
        <ExternalLink className="w-4 h-4" />
      </a>
    </div>
  );
}
