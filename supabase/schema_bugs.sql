-- ============================================================
-- HAMCSoft Task Management System — Bugs Schema
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.bugs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  severity      TEXT NOT NULL DEFAULT 'Medio'
                  CHECK (severity IN ('Crítico', 'Alto', 'Medio', 'Bajo')),
  status        TEXT NOT NULL DEFAULT 'Reportado'
                  CHECK (status IN ('Reportado', 'En análisis', 'En corrección', 'En pruebas', 'Resuelto')),
  system_name   TEXT,
  steps_to_reproduce TEXT,
  assigned_to   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reported_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bugs_status_idx      ON public.bugs(status);
CREATE INDEX IF NOT EXISTS bugs_severity_idx    ON public.bugs(severity);
CREATE INDEX IF NOT EXISTS bugs_assigned_to_idx ON public.bugs(assigned_to);
CREATE INDEX IF NOT EXISTS bugs_reported_by_idx ON public.bugs(reported_by);
CREATE INDEX IF NOT EXISTS bugs_created_at_idx  ON public.bugs(created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bugs_set_updated_at ON public.bugs;
CREATE TRIGGER bugs_set_updated_at
  BEFORE UPDATE ON public.bugs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.bugs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bugs_select_authenticated"
  ON public.bugs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "bugs_insert_authenticated"
  ON public.bugs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "bugs_update_authenticated"
  ON public.bugs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "bugs_delete_reporter"
  ON public.bugs FOR DELETE
  TO authenticated
  USING (auth.uid() = reported_by);

ALTER PUBLICATION supabase_realtime ADD TABLE public.bugs;
