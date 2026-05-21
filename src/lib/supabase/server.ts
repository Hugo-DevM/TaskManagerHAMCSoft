/**
 * Clientes de Supabase para server-side (Server Components, API Routes, Server Actions).
 *
 * REGLA: Llamar createServerClient() una vez por request — nunca compartir
 * instancias entre requests. El cookies() ata el cliente a la sesión del
 * request actual, evitando que tokens se crucen entre usuarios.
 */
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Cliente autenticado con las cookies del request actual.
 * Usar en Server Components, API Routes y Server Actions.
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll puede ser llamado desde Server Components donde mutar
            // cookies no está permitido — ignorar es seguro. El proxy.ts
            // es quien realmente escribe las cookies del token refresh.
          }
        },
      },
    }
  );
}

/**
 * Cliente con Service Role Key — bypasea Row Level Security.
 *
 * SOLO usar en contextos de servidor de confianza:
 *   - Onboarding de usuarios (asignar metadata via admin API)
 *   - Jobs de administración
 *   - Webhooks de terceros (Stripe, etc.)
 *
 * NUNCA exponer SUPABASE_SERVICE_ROLE_KEY al browser.
 */
export function createServiceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }

  // require() en lugar de import para que Next.js no lo incluya en bundles del cliente
  const { createClient } = require('@supabase/supabase-js') as typeof import('@supabase/supabase-js');

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
