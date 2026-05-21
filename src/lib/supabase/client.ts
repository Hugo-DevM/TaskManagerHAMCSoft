/**
 * Cliente de Supabase para el browser (Client Components).
 *
 * Una instancia por sesión de browser — nunca lleva contexto de tenant,
 * el aislamiento se maneja server-side y via RLS.
 *
 * USO: importar createClient() y llamarlo dentro del componente.
 */
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
