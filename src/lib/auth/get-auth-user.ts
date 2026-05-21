/**
 * Helper de autenticación para Server Components y Server Actions.
 *
 * Obtiene el usuario autenticado validando contra el servidor de Supabase.
 * Redirige a /auth/login si no hay sesión válida.
 *
 * POR QUÉ getUser() y no getSession():
 *   - getSession() lee el token desde las cookies locales sin validarlo.
 *     Si el token expiró, puede devolver una sesión "válida" que en realidad
 *     ya no lo es, causando errores 401 en llamadas posteriores.
 *   - getUser() siempre hace un round-trip al servidor de Supabase para
 *     verificar que el token siga siendo válido. Es la única forma segura.
 *
 * USO:
 *   const user = await getAuthenticatedUser()
 *   // user.id, user.email, user.user_metadata, etc.
 */

import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';

export async function getAuthenticatedUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  return user;
}
