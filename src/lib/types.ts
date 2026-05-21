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

// ---- Project Types ----

export type ProjectStatus =
  | "planeacion"
  | "diseno"
  | "desarrollo"
  | "testing"
  | "correcciones"
  | "deploy"
  | "mantenimiento"
  | "finalizado"
  | "pausado";

export type ProjectType =
  | "landing_page"
  | "ecommerce"
  | "sistema_pos"
  | "crm"
  | "automatizacion"
  | "branding"
  | "otro";

export type ProjectPriority = "low" | "medium" | "high";

// ---- Client Types ----

export type ClientStatus =
  | "prospecto"
  | "contactado"
  | "reunion_agendada"
  | "en_negociacion"
  | "propuesta_enviada"
  | "esperando_respuesta"
  | "cerrado_ganado"
  | "cerrado_perdido";

export type ClientActionType =
  | "llamada"
  | "reunion"
  | "entrega"
  | "seguimiento"
  | "propuesta"
  | "otro";

export type ClientPriority = "low" | "medium" | "high";

export type ClientServiceInterest =
  | "landing_page"
  | "ecommerce"
  | "sistema_pos"
  | "crm"
  | "automatizacion"
  | "branding"
  | "otro";

export type ClientLeadSource =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "referido"
  | "web"
  | "manual"
  | "otro";

// ---- Activity Types ----

export type ClientActivityType =
  | "nota"
  | "llamada"
  | "reunion"
  | "propuesta_enviada"
  | "seguimiento"
  | "estado_cambiado"
  | "proyecto_vinculado"
  | "documento_agregado"
  | "otro";

export type ProjectActivityType =
  | "nota"
  | "deploy"
  | "bug_resuelto"
  | "feature_completada"
  | "estado_cambiado"
  | "cliente_aprobo"
  | "entrega"
  | "reunion"
  | "otro";

export type DocumentType =
  | "proposal"
  | "contract"
  | "invoice"
  | "nda"
  | "brief"
  | "requirements"
  | "other";

export type ProjectFileType = "design" | "document" | "image" | "video" | "code" | "other";

// ---- Database Row Types ----

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
  client_id: string | null;
  name: string;
  description: string | null;
  type: ProjectType | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string | null;
  due_date: string | null;
  estimated_hours: number | null;
  tracked_hours: number;
  budget: number | null;
  final_cost: number | null;
  progress: number;
  repository_url: string | null;
  staging_url: string | null;
  production_url: string | null;
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

export interface Client {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  industry: string | null;
  status: ClientStatus;
  priority: ClientPriority;
  estimated_value: number | null;
  service_interest: ClientServiceInterest | null;
  lead_source: ClientLeadSource | null;
  next_action_type: ClientActionType | null;
  next_action_date: string | null;
  next_action_notes: string | null;
  last_contact_at: string | null;
  notes: string | null;
  // Legacy fields (kept for DB compat, not used in new UI)
  name?: string;
  project_id?: string | null;
  requirements?: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientActivity {
  id: string;
  client_id: string;
  type: ClientActivityType;
  message: string;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
}

export interface ClientDocument {
  id: string;
  client_id: string;
  type: DocumentType;
  name: string;
  file_url: string | null;
  notes: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface ProjectActivity {
  id: string;
  project_id: string;
  type: ProjectActivityType;
  message: string;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  name: string;
  type: ProjectFileType;
  file_url: string | null;
  notes: string | null;
  uploaded_by: string | null;
  created_at: string;
}

// ---- Joined / Extended Types ----

export interface TaskWithRelations extends Task {
  assignee: Profile | null;
  project: Project | null;
}

export interface ProjectWithStats extends Project {
  creator: Profile | null;
  client: Client | null;
  task_count: number;
  completed_task_count: number;
}

export interface ClientWithRelations extends Client {
  projects?: ProjectWithStats[];
  project_count?: number;
}

export interface ClientActivityWithProfile extends ClientActivity {
  creator: Profile | null;
}

export interface ProjectActivityWithProfile extends ProjectActivity {
  creator: Profile | null;
}

export interface ClientDocumentWithProfile extends ClientDocument {
  uploader: Profile | null;
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
  client_id?: string;
  type?: ProjectType;
  status: ProjectStatus;
  priority?: ProjectPriority;
  start_date?: string;
  due_date?: string;
  estimated_hours?: number;
  budget?: number;
  repository_url?: string;
  staging_url?: string;
  production_url?: string;
  progress?: number;
}

export interface UpdateProjectInput extends Partial<CreateProjectInput> {
  id: string;
  tracked_hours?: number;
  final_cost?: number;
}

export interface CreateClientInput {
  company_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  industry?: string;
  status: ClientStatus;
  priority?: ClientPriority;
  estimated_value?: number;
  service_interest?: ClientServiceInterest;
  lead_source?: ClientLeadSource;
  next_action_type?: ClientActionType;
  next_action_date?: string;
  next_action_notes?: string;
  notes?: string;
}

export interface UpdateClientInput extends Partial<CreateClientInput> {
  id: string;
  last_contact_at?: string | null;
}

export interface CreateClientActivityInput {
  client_id: string;
  type: ClientActivityType;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface CreateProjectActivityInput {
  project_id: string;
  type: ProjectActivityType;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface CreateClientDocumentInput {
  client_id: string;
  type: DocumentType;
  name: string;
  file_url?: string;
  notes?: string;
}

export interface CreateProjectFileInput {
  project_id: string;
  name: string;
  type: ProjectFileType;
  file_url?: string;
  notes?: string;
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
  project_id: string | null;
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
  project_id?: string;
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
