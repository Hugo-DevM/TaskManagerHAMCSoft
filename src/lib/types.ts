// ============================================================
// HAMCSoft Task Management System - TypeScript Types
// ============================================================

// ---- Enums / Union Types ----

export type TaskPriority = "Urgente" | "Normal" | "Baja";

export type TaskStatus =
  | "Pendiente"
  | "En progreso"
  | "En revisión"
  | "Completado";

export type ProjectStatus = "activo" | "pausado" | "completado" | "archivado";

// ---- Database Row Types (mirror Supabase tables) ----

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to: string | null;
  project_id: string | null;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ---- Joined / Extended Types ----

export interface TaskWithRelations extends Task {
  assignee: Profile | null;
  project: Project | null;
}

export interface ProjectWithStats extends Project {
  creator: Profile | null;
  task_count: number;
  completed_task_count: number;
}

// ---- Form Input Types ----

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to?: string;
  project_id?: string;
  due_date?: string;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {
  id: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  status: ProjectStatus;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  id: string;
}

// ---- Dashboard Stats Types ----

export interface DashboardStats {
  pending: number;
  inProgress: number;
  inReview: number;
  completed: number;
  overdue: number;
  dueToday: number;
  totalTasks: number;
}

export interface UserTaskSummary {
  profile: Profile;
  pending: number;
  inProgress: number;
  completed: number;
  total: number;
}

export interface ProjectTaskSummary {
  project: Project;
  pending: number;
  inProgress: number;
  completed: number;
  total: number;
  completionPercent: number;
}

// ---- Kanban Types ----

export type KanbanColumn = {
  id: TaskStatus;
  title: string;
  tasks: TaskWithRelations[];
};

// ---- Bug Types ----

export type BugSeverity = "Crítico" | "Alto" | "Medio" | "Bajo";

export type BugStatus =
  | "Reportado"
  | "En análisis"
  | "En corrección"
  | "En pruebas"
  | "Resuelto";

export interface Bug {
  id: string;
  title: string;
  description: string | null;
  severity: BugSeverity;
  status: BugStatus;
  system_name: string | null;
  steps_to_reproduce: string | null;
  assigned_to: string | null;
  reported_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BugWithRelations extends Bug {
  assignee: Profile | null;
  reporter: Profile | null;
}

export interface CreateBugInput {
  title: string;
  description?: string;
  severity: BugSeverity;
  status: BugStatus;
  system_name?: string;
  steps_to_reproduce?: string;
  assigned_to?: string;
}

export interface UpdateBugInput extends Partial<CreateBugInput> {
  id: string;
}

export type BugKanbanColumn = {
  id: BugStatus;
  title: string;
  bugs: BugWithRelations[];
};

// ---- Auth Types ----

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
}

// ---- Client (CRM) Types ----

export type ClientStatus =
  | "prospecto"
  | "contactado"
  | "en_negociacion"
  | "propuesta_enviada"
  | "cerrado"
  | "perdido";

export type ClientActionType =
  | "llamada"
  | "reunion"
  | "entrega"
  | "seguimiento"
  | "propuesta"
  | "otro";

export interface Client {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  status: ClientStatus;
  next_action_type: ClientActionType | null;
  next_action_date: string | null;
  next_action_notes: string | null;
  project_id: string | null;
  requirements: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientWithRelations extends Client {
  project: Project | null;
}

export interface CreateClientInput {
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  status: ClientStatus;
  next_action_type?: ClientActionType;
  next_action_date?: string;
  next_action_notes?: string;
  project_id?: string;
  requirements?: string;
  notes?: string;
}

export interface UpdateClientInput extends Partial<CreateClientInput> {
  id: string;
}
