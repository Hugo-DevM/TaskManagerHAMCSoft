-- ============================================================
-- HAMCSoft Task Manager - Migration V2
-- Reestructuración de Clientes y Proyectos
-- Fecha: 2026-05-21
--
-- INSTRUCCIONES:
-- 1. Ejecutar este script en el SQL Editor de Supabase
-- 2. Verificar que no haya errores antes de continuar
-- 3. Este script es IDEMPOTENTE (puede ejecutarse múltiples veces de forma segura)
-- ============================================================

BEGIN;

-- ============================================================
-- PASO 1: TABLA CLIENTS - Nuevas columnas
-- ============================================================

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS service_interest TEXT,
  ADD COLUMN IF NOT EXISTS lead_source TEXT,
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ;

-- Migrar name → company_name (preserva datos existentes)
UPDATE public.clients
SET company_name = name
WHERE company_name IS NULL OR company_name = '';

-- ============================================================
-- PASO 2: CLIENTS - Actualizar CHECK constraints
-- Nota: PostgreSQL nombra constraints inline como {tabla}_{col}_check
-- ============================================================

-- Eliminar constraints anteriores (usando DO block para compatibilidad)
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Eliminar constraints de status de clients
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.clients'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%'
  LOOP
    EXECUTE 'ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;

  -- Eliminar constraints de next_action_type de clients
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.clients'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%next_action_type%'
  LOOP
    EXECUTE 'ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- Migrar valores de status ANTES de agregar nuevo constraint
UPDATE public.clients SET status = 'cerrado_ganado' WHERE status = 'cerrado';
UPDATE public.clients SET status = 'cerrado_perdido' WHERE status = 'perdido';

-- Agregar nuevos constraints
ALTER TABLE public.clients
  ADD CONSTRAINT clients_status_check
    CHECK (status IN (
      'prospecto',
      'contactado',
      'reunion_agendada',
      'en_negociacion',
      'propuesta_enviada',
      'esperando_respuesta',
      'cerrado_ganado',
      'cerrado_perdido'
    ));

ALTER TABLE public.clients
  ADD CONSTRAINT clients_next_action_type_check
    CHECK (next_action_type IN ('llamada', 'reunion', 'entrega', 'seguimiento', 'propuesta', 'otro')
      OR next_action_type IS NULL);

ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_priority_check;
ALTER TABLE public.clients
  ADD CONSTRAINT clients_priority_check
    CHECK (priority IN ('low', 'medium', 'high'));

ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_service_interest_check;
ALTER TABLE public.clients
  ADD CONSTRAINT clients_service_interest_check
    CHECK (service_interest IN (
      'landing_page', 'ecommerce', 'sistema_pos', 'crm',
      'automatizacion', 'branding', 'otro'
    ) OR service_interest IS NULL);

ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_lead_source_check;
ALTER TABLE public.clients
  ADD CONSTRAINT clients_lead_source_check
    CHECK (lead_source IN (
      'facebook', 'instagram', 'tiktok', 'referido', 'web', 'manual', 'otro'
    ) OR lead_source IS NULL);

-- ============================================================
-- PASO 3: TABLA PROJECTS - Nuevas columnas
-- ============================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(8,2),
  ADD COLUMN IF NOT EXISTS tracked_hours DECIMAL(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS budget DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS final_cost DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS progress INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS repository_url TEXT,
  ADD COLUMN IF NOT EXISTS staging_url TEXT,
  ADD COLUMN IF NOT EXISTS production_url TEXT;

-- ============================================================
-- PASO 4: PROJECTS - Migrar clients.project_id → projects.client_id
-- ============================================================
UPDATE public.projects p
SET client_id = c.id
FROM public.clients c
WHERE c.project_id = p.id
  AND p.client_id IS NULL;

-- ============================================================
-- PASO 5: PROJECTS - Actualizar CHECK constraints
-- ============================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Eliminar constraints de status de projects
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.projects'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%'
  LOOP
    EXECUTE 'ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- Migrar valores de status ANTES de agregar nuevo constraint
UPDATE public.projects SET status = 'desarrollo'  WHERE status = 'activo';
UPDATE public.projects SET status = 'finalizado'  WHERE status = 'completado';
UPDATE public.projects SET status = 'finalizado'  WHERE status = 'archivado';

-- Agregar nuevos constraints
ALTER TABLE public.projects
  ADD CONSTRAINT projects_status_check
    CHECK (status IN (
      'planeacion', 'diseno', 'desarrollo', 'testing',
      'correcciones', 'deploy', 'mantenimiento', 'finalizado', 'pausado'
    ));

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_priority_check;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_priority_check
    CHECK (priority IN ('low', 'medium', 'high'));

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_type_check;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_type_check
    CHECK (type IN (
      'landing_page', 'ecommerce', 'sistema_pos', 'crm',
      'automatizacion', 'branding', 'otro'
    ) OR type IS NULL);

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_progress_check;
ALTER TABLE public.projects
  ADD CONSTRAINT projects_progress_check
    CHECK (progress >= 0 AND progress <= 100);

-- ============================================================
-- PASO 6: TABLA BUGS - Agregar project_id (sin romper datos existentes)
-- ============================================================

ALTER TABLE public.bugs
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bugs_project_id ON public.bugs(project_id);

-- ============================================================
-- PASO 7: TABLA CLIENT_ACTIVITIES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.client_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'nota',
    'llamada',
    'reunion',
    'propuesta_enviada',
    'seguimiento',
    'estado_cambiado',
    'proyecto_vinculado',
    'documento_agregado',
    'otro'
  )),
  message TEXT NOT NULL,
  metadata JSONB,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_activities_client_id
  ON public.client_activities(client_id);
CREATE INDEX IF NOT EXISTS idx_client_activities_created_at
  ON public.client_activities(created_at DESC);

ALTER TABLE public.client_activities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'client_activities' AND policyname = 'client_activities_select'
  ) THEN
    CREATE POLICY "client_activities_select"
      ON public.client_activities FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'client_activities' AND policyname = 'client_activities_insert'
  ) THEN
    CREATE POLICY "client_activities_insert"
      ON public.client_activities FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = created_by);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'client_activities' AND policyname = 'client_activities_delete_own'
  ) THEN
    CREATE POLICY "client_activities_delete_own"
      ON public.client_activities FOR DELETE TO authenticated
      USING (auth.uid() = created_by);
  END IF;
END $$;

-- ============================================================
-- PASO 8: TABLA CLIENT_DOCUMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.client_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'other' CHECK (type IN (
    'proposal', 'contract', 'invoice', 'nda', 'brief', 'requirements', 'other'
  )),
  name TEXT NOT NULL,
  file_url TEXT,
  notes TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_documents_client_id
  ON public.client_documents(client_id);

ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'client_documents' AND policyname = 'client_documents_select'
  ) THEN
    CREATE POLICY "client_documents_select"
      ON public.client_documents FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'client_documents' AND policyname = 'client_documents_insert'
  ) THEN
    CREATE POLICY "client_documents_insert"
      ON public.client_documents FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = uploaded_by);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'client_documents' AND policyname = 'client_documents_update'
  ) THEN
    CREATE POLICY "client_documents_update"
      ON public.client_documents FOR UPDATE TO authenticated
      USING (auth.uid() = uploaded_by);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'client_documents' AND policyname = 'client_documents_delete_own'
  ) THEN
    CREATE POLICY "client_documents_delete_own"
      ON public.client_documents FOR DELETE TO authenticated
      USING (auth.uid() = uploaded_by);
  END IF;
END $$;

-- ============================================================
-- PASO 9: TABLA PROJECT_ACTIVITIES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'nota',
    'deploy',
    'bug_resuelto',
    'feature_completada',
    'estado_cambiado',
    'cliente_aprobo',
    'entrega',
    'reunion',
    'otro'
  )),
  message TEXT NOT NULL,
  metadata JSONB,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_activities_project_id
  ON public.project_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_project_activities_created_at
  ON public.project_activities(created_at DESC);

ALTER TABLE public.project_activities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'project_activities' AND policyname = 'project_activities_select'
  ) THEN
    CREATE POLICY "project_activities_select"
      ON public.project_activities FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'project_activities' AND policyname = 'project_activities_insert'
  ) THEN
    CREATE POLICY "project_activities_insert"
      ON public.project_activities FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = created_by);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'project_activities' AND policyname = 'project_activities_delete_own'
  ) THEN
    CREATE POLICY "project_activities_delete_own"
      ON public.project_activities FOR DELETE TO authenticated
      USING (auth.uid() = created_by);
  END IF;
END $$;

-- ============================================================
-- PASO 10: TABLA PROJECT_FILES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.project_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other' CHECK (type IN (
    'design', 'document', 'image', 'video', 'code', 'other'
  )),
  file_url TEXT,
  notes TEXT,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_files_project_id
  ON public.project_files(project_id);

ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'project_files' AND policyname = 'project_files_select'
  ) THEN
    CREATE POLICY "project_files_select"
      ON public.project_files FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'project_files' AND policyname = 'project_files_insert'
  ) THEN
    CREATE POLICY "project_files_insert"
      ON public.project_files FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = uploaded_by);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'project_files' AND policyname = 'project_files_update'
  ) THEN
    CREATE POLICY "project_files_update"
      ON public.project_files FOR UPDATE TO authenticated
      USING (auth.uid() = uploaded_by);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'project_files' AND policyname = 'project_files_delete_own'
  ) THEN
    CREATE POLICY "project_files_delete_own"
      ON public.project_files FOR DELETE TO authenticated
      USING (auth.uid() = uploaded_by);
  END IF;
END $$;

-- ============================================================
-- PASO 11: ÍNDICES ADICIONALES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_projects_client_id   ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_priority     ON public.projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_due_date     ON public.projects(due_date);
CREATE INDEX IF NOT EXISTS idx_projects_start_date   ON public.projects(start_date);
CREATE INDEX IF NOT EXISTS idx_clients_priority      ON public.clients(priority);
CREATE INDEX IF NOT EXISTS idx_clients_lead_source   ON public.clients(lead_source);
CREATE INDEX IF NOT EXISTS idx_clients_estimated_val ON public.clients(estimated_value);

-- ============================================================
-- PASO 12: HABILITAR REALTIME PARA NUEVAS TABLAS
-- ============================================================

DO $$
DECLARE
  tables TEXT[] := ARRAY['client_activities', 'client_documents', 'project_activities', 'project_files'];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND tablename = t
    ) THEN
      EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.' || quote_ident(t);
    END IF;
  END LOOP;
END $$;

COMMIT;

-- ============================================================
-- VERIFICACIÓN (ejecutar luego del COMMIT para confirmar)
-- ============================================================
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'clients' ORDER BY ordinal_position;
--
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'projects' ORDER BY ordinal_position;
--
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
