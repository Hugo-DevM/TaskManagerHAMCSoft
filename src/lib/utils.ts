import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { TaskPriority, TaskStatus, ProjectStatus, BugSeverity, BugStatus } from "./types";

// ---- Tailwind Class Utility ----
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ---- Priority Helpers ----

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

// ---- Status Helpers ----

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
  { label: string; bgColor: string }
> = {
  activo: {
    label: "Activo",
    bgColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  pausado: {
    label: "Pausado",
    bgColor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
  completado: {
    label: "Completado",
    bgColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  archivado: {
    label: "Archivado",
    bgColor: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20",
  },
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

export function isDueToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return isToday(parseISO(dateStr));
}

export function formatRelativeDate(dateStr: string): string {
  return format(parseISO(dateStr), "d 'de' MMMM, yyyy", { locale: es });
}

export function formatDateTime(dateStr: string): string {
  return format(parseISO(dateStr), "d MMM yyyy HH:mm", { locale: es });
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
