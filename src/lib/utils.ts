import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type {
  TaskPriority,
  TaskStatus,
  ProjectStatus,
  ProjectPriority,
  ProjectType,
  BugSeverity,
  BugStatus,
  ClientStatus,
  ClientPriority,
  ClientActivityType,
  ProjectActivityType,
} from "./types";

// ---- Tailwind Class Utility ----
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---- Priority Helpers (Tasks) ----

export const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  Urgente: {
    label: "Urgente",
    color: "text-red-400",
    bgColor: "bg-red-500/10 text-red-400 border-red-500/20",
    dotColor: "bg-red-400",
  },
  Normal: {
    label: "Normal",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    dotColor: "bg-yellow-400",
  },
  Baja: {
    label: "Baja",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    dotColor: "bg-blue-400",
  },
};

// ---- Status Helpers (Tasks) ----

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string; bgColor: string }
> = {
  Pendiente: {
    label: "Pendiente",
    color: "text-zinc-400",
    bgColor: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  },
  "En progreso": {
    label: "En progreso",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  },
  "En revisión": {
    label: "En revisión",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  Completado: {
    label: "Completado",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
};

// ---- Project Status Helpers ----

export const PROJECT_STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; bgColor: string; barColor: string }
> = {
  planeacion: {
    label: "Planeación",
    bgColor: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    barColor: "bg-zinc-400",
  },
  diseno: {
    label: "Diseño",
    bgColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    barColor: "bg-purple-400",
  },
  desarrollo: {
    label: "Desarrollo",
    bgColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    barColor: "bg-indigo-400",
  },
  testing: {
    label: "Testing",
    bgColor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    barColor: "bg-yellow-400",
  },
  correcciones: {
    label: "Correcciones",
    bgColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    barColor: "bg-orange-400",
  },
  deploy: {
    label: "Deploy",
    bgColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    barColor: "bg-blue-400",
  },
  mantenimiento: {
    label: "Mantenimiento",
    bgColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    barColor: "bg-cyan-400",
  },
  finalizado: {
    label: "Finalizado",
    bgColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    barColor: "bg-emerald-400",
  },
  pausado: {
    label: "Pausado",
    bgColor: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
    barColor: "bg-zinc-500",
  },
};

export const PROJECT_PRIORITY_CONFIG: Record<
  ProjectPriority,
  { label: string; bgColor: string; dotColor: string }
> = {
  high: {
    label: "Alta",
    bgColor: "bg-red-500/10 text-red-400 border-red-500/20",
    dotColor: "bg-red-400",
  },
  medium: {
    label: "Media",
    bgColor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    dotColor: "bg-yellow-400",
  },
  low: {
    label: "Baja",
    bgColor: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    dotColor: "bg-zinc-400",
  },
};

export const PROJECT_TYPE_CONFIG: Record<
  ProjectType,
  { label: string; icon: string }
> = {
  landing_page:  { label: "Landing Page",    icon: "🌐" },
  ecommerce:     { label: "E-commerce",      icon: "🛒" },
  sistema_pos:   { label: "Sistema POS",     icon: "🖥️" },
  crm:           { label: "CRM",             icon: "👥" },
  automatizacion:{ label: "Automatización",  icon: "⚙️" },
  branding:      { label: "Branding",        icon: "🎨" },
  otro:          { label: "Otro",            icon: "📦" },
};

// ---- Client Status Helpers ----

export const CLIENT_STATUS_CONFIG: Record<
  ClientStatus,
  { label: string; bgColor: string; barColor: string; pipelineOrder: number }
> = {
  prospecto: {
    label: "Prospecto",
    bgColor: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    barColor: "bg-zinc-400",
    pipelineOrder: 1,
  },
  contactado: {
    label: "Contactado",
    bgColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    barColor: "bg-blue-400",
    pipelineOrder: 2,
  },
  reunion_agendada: {
    label: "Reunión agendada",
    bgColor: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    barColor: "bg-violet-400",
    pipelineOrder: 3,
  },
  en_negociacion: {
    label: "En negociación",
    bgColor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    barColor: "bg-yellow-400",
    pipelineOrder: 4,
  },
  propuesta_enviada: {
    label: "Propuesta enviada",
    bgColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    barColor: "bg-indigo-400",
    pipelineOrder: 5,
  },
  esperando_respuesta: {
    label: "Esperando respuesta",
    bgColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    barColor: "bg-orange-400",
    pipelineOrder: 6,
  },
  cerrado_ganado: {
    label: "Cerrado ganado",
    bgColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    barColor: "bg-emerald-400",
    pipelineOrder: 7,
  },
  cerrado_perdido: {
    label: "Cerrado perdido",
    bgColor: "bg-red-500/10 text-red-400 border-red-500/20",
    barColor: "bg-red-400",
    pipelineOrder: 8,
  },
};

export const CLIENT_PRIORITY_CONFIG: Record<
  ClientPriority,
  { label: string; bgColor: string; dotColor: string }
> = {
  high: {
    label: "Alta",
    bgColor: "bg-red-500/10 text-red-400 border-red-500/20",
    dotColor: "bg-red-400",
  },
  medium: {
    label: "Media",
    bgColor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    dotColor: "bg-yellow-400",
  },
  low: {
    label: "Baja",
    bgColor: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    dotColor: "bg-zinc-400",
  },
};

export const CLIENT_ACTION_TYPE_LABEL: Record<string, string> = {
  llamada: "Llamada",
  reunion: "Reunión",
  entrega: "Entrega",
  seguimiento: "Seguimiento",
  propuesta: "Propuesta",
  otro: "Otro",
};

export const CLIENT_ACTIVITY_TYPE_CONFIG: Record<
  ClientActivityType,
  { label: string; icon: string; bgColor: string }
> = {
  nota:              { label: "Nota",              icon: "📝", bgColor: "bg-zinc-500/10 text-zinc-400" },
  llamada:           { label: "Llamada",           icon: "📞", bgColor: "bg-blue-500/10 text-blue-400" },
  reunion:           { label: "Reunión",           icon: "🤝", bgColor: "bg-violet-500/10 text-violet-400" },
  propuesta_enviada: { label: "Propuesta enviada", icon: "📄", bgColor: "bg-indigo-500/10 text-indigo-400" },
  seguimiento:       { label: "Seguimiento",       icon: "🔔", bgColor: "bg-yellow-500/10 text-yellow-400" },
  estado_cambiado:   { label: "Estado cambiado",   icon: "🔄", bgColor: "bg-orange-500/10 text-orange-400" },
  proyecto_vinculado:{ label: "Proyecto vinculado",icon: "🔗", bgColor: "bg-cyan-500/10 text-cyan-400" },
  documento_agregado:{ label: "Documento agregado",icon: "📎", bgColor: "bg-purple-500/10 text-purple-400" },
  otro:              { label: "Otro",              icon: "💬", bgColor: "bg-zinc-500/10 text-zinc-400" },
};

export const PROJECT_ACTIVITY_TYPE_CONFIG: Record<
  ProjectActivityType,
  { label: string; icon: string; bgColor: string }
> = {
  nota:              { label: "Nota",             icon: "📝", bgColor: "bg-zinc-500/10 text-zinc-400" },
  deploy:            { label: "Deploy",           icon: "🚀", bgColor: "bg-blue-500/10 text-blue-400" },
  bug_resuelto:      { label: "Bug resuelto",     icon: "🐛", bgColor: "bg-emerald-500/10 text-emerald-400" },
  feature_completada:{ label: "Feature lista",    icon: "✅", bgColor: "bg-indigo-500/10 text-indigo-400" },
  estado_cambiado:   { label: "Estado cambiado",  icon: "🔄", bgColor: "bg-orange-500/10 text-orange-400" },
  cliente_aprobo:    { label: "Cliente aprobó",   icon: "👍", bgColor: "bg-emerald-500/10 text-emerald-400" },
  entrega:           { label: "Entrega",          icon: "📦", bgColor: "bg-yellow-500/10 text-yellow-400" },
  reunion:           { label: "Reunión",          icon: "🤝", bgColor: "bg-violet-500/10 text-violet-400" },
  otro:              { label: "Otro",             icon: "💬", bgColor: "bg-zinc-500/10 text-zinc-400" },
};

// ---- Date Helpers ----

export function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = parseISO(dateStr);
  if (isToday(date)) return "Hoy";
  if (isTomorrow(date)) return "Mañana";
  return format(date, "d MMM yyyy", { locale: es });
}

export function isOverdue(dateStr: string | null, status: TaskStatus): boolean {
  if (!dateStr || status === "Completado") return false;
  const date = parseISO(dateStr);
  return isPast(date) && !isToday(date);
}

export function isDateOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const date = parseISO(dateStr);
  return isPast(date) && !isToday(date);
}

export function isDueToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return isToday(parseISO(dateStr));
}

export function isDueSoon(dateStr: string | null, days = 7): boolean {
  if (!dateStr) return false;
  const date = parseISO(dateStr);
  const now = new Date();
  const diff = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= days;
}

export function formatRelativeDate(dateStr: string): string {
  return format(parseISO(dateStr), "d 'de' MMMM, yyyy", { locale: es });
}

export function formatDateTime(dateStr: string): string {
  return format(parseISO(dateStr), "d MMM yyyy HH:mm", { locale: es });
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "-";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

// ---- String Helpers ----

export function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}

// ---- Task Status Order (for Kanban) ----

export const TASK_STATUS_ORDER: TaskStatus[] = [
  "Pendiente",
  "En progreso",
  "En revisión",
  "Completado",
];

// ---- Priority Order ----
export const PRIORITY_ORDER: TaskPriority[] = ["Urgente", "Normal", "Baja"];

// ---- Bug Severity Helpers ----

export const BUG_SEVERITY_CONFIG: Record<
  BugSeverity,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  Crítico: {
    label: "Crítico",
    color: "text-red-400",
    bgColor: "bg-red-500/10 text-red-400 border-red-500/20",
    dotColor: "bg-red-400",
  },
  Alto: {
    label: "Alto",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    dotColor: "bg-orange-400",
  },
  Medio: {
    label: "Medio",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    dotColor: "bg-yellow-400",
  },
  Bajo: {
    label: "Bajo",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    dotColor: "bg-blue-400",
  },
};

// ---- Bug Status Helpers ----

export const BUG_STATUS_CONFIG: Record<
  BugStatus,
  { label: string; color: string; bgColor: string }
> = {
  Reportado: {
    label: "Reportado",
    color: "text-zinc-400",
    bgColor: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  },
  "En análisis": {
    label: "En análisis",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  "En corrección": {
    label: "En corrección",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  "En pruebas": {
    label: "En pruebas",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  Resuelto: {
    label: "Resuelto",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
};

export const BUG_STATUS_ORDER: BugStatus[] = [
  "Reportado",
  "En análisis",
  "En corrección",
  "En pruebas",
  "Resuelto",
];
