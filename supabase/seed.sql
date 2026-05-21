-- ============================================================
-- HAMCSoft Task Management System - Seed Data
-- Run this AFTER schema.sql and AFTER creating your auth users
-- ============================================================

INSERT INTO public.projects (id, name, description, status, created_by)
SELECT
  uuid_generate_v4(),
  'HAMCSoft Platform',
  'Main product platform development and maintenance',
  'activo',
  id
FROM public.profiles
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.projects (id, name, description, status, created_by)
SELECT
  uuid_generate_v4(),
  'Marketing Q2 2026',
  'Marketing campaigns and content strategy for Q2',
  'activo',
  id
FROM public.profiles
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.projects (id, name, description, status, created_by)
SELECT
  uuid_generate_v4(),
  'Infrastructure Update',
  'Server upgrades, CI/CD pipeline improvements and DevOps tasks',
  'pausado',
  id
FROM public.profiles
LIMIT 1
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  project1_id UUID;
  project2_id UUID;
  project3_id UUID;
  user1_id UUID;
  user2_id UUID;
BEGIN
  SELECT id INTO project1_id FROM public.projects WHERE name = 'HAMCSoft Platform' LIMIT 1;
  SELECT id INTO project2_id FROM public.projects WHERE name = 'Marketing Q2 2026' LIMIT 1;
  SELECT id INTO project3_id FROM public.projects WHERE name = 'Infrastructure Update' LIMIT 1;
  SELECT id INTO user1_id FROM public.profiles ORDER BY created_at ASC LIMIT 1;
  SELECT id INTO user2_id FROM public.profiles ORDER BY created_at ASC OFFSET 1 LIMIT 1;

  IF user2_id IS NULL THEN
    user2_id := user1_id;
  END IF;

  INSERT INTO public.tasks (title, description, priority, status, assigned_to, project_id, due_date, created_by)
  VALUES
    (
      'Implement user authentication flow',
      'Set up Supabase Auth with email/password login, handle sessions and protected routes.',
      'Urgente',
      'Completado',
      user1_id,
      project1_id,
      CURRENT_DATE - INTERVAL '2 days',
      user1_id
    ),
    (
      'Design dashboard layout',
      'Create the main dashboard with stats cards, task summary and activity feed.',
      'Normal',
      'En progreso',
      user1_id,
      project1_id,
      CURRENT_DATE + INTERVAL '3 days',
      user1_id
    ),
    (
      'Set up PostgreSQL schema',
      'Define all tables, relationships, indexes and RLS policies in Supabase.',
      'Urgente',
      'Completado',
      user2_id,
      project1_id,
      CURRENT_DATE - INTERVAL '5 days',
      user1_id
    ),
    (
      'Create Kanban board component',
      'Build drag-and-drop Kanban board with task cards organized by status columns.',
      'Normal',
      'En revisión',
      user1_id,
      project1_id,
      CURRENT_DATE + INTERVAL '1 day',
      user1_id
    ),
    (
      'Write Q2 blog post series',
      'Plan and write 4 blog posts for the Q2 marketing campaign on product updates.',
      'Normal',
      'Pendiente',
      user2_id,
      project2_id,
      CURRENT_DATE + INTERVAL '7 days',
      user2_id
    ),
    (
      'Update CI/CD pipeline',
      'Migrate from GitHub Actions v3 to v4 actions and optimize build times.',
      'Normal',
      'Pendiente',
      user1_id,
      project3_id,
      CURRENT_DATE - INTERVAL '1 day',
      user1_id
    ),
    (
      'Review pull request: API endpoints',
      'Code review for the new REST API endpoints added in the latest feature branch.',
      'Urgente',
      'En revisión',
      user2_id,
      project1_id,
      CURRENT_DATE,
      user1_id
    );

END $$;
