/**
 * Next.js 16 Proxy — corre antes de cada request que coincida con el matcher.
 *
 * ─── POR QUÉ ESTE ARCHIVO ES CRÍTICO ───────────────────────────────────────
 *
 * Sin este archivo, el token JWT de Supabase expira silenciosamente. Cuando
 * el usuario vuelve a la app después de un tiempo:
 *   1. El Server Component intenta leer la sesión → ve un token expirado
 *   2. La página se queda en estado de carga indefinido, o
 *   3. Supabase devuelve un 401 y la app no sabe cómo reaccionar
 *
 * Este proxy soluciona eso: en CADA request, antes de que Next.js renderice
 * nada, llama supabase.auth.getUser(). Supabase detecta si el access token
 * expiró y lo renueva usando el refresh token. Las cookies actualizadas se
 * escriben en el response via setAll(), y el browser las guarda.
 *
 * Resultado: el usuario nunca pierde la sesión mientras el refresh token
 * siga siendo válido (por defecto, 7 días en Supabase).
 *
 * ─── FLUJO ──────────────────────────────────────────────────────────────────
 *
 * Request → proxy.ts → [refresca token si expiró] → [auth guard] → página
 *
 * ─── RUNTIME ────────────────────────────────────────────────────────────────
 *
 * Corre en Edge Runtime — sin Node.js APIs, sin acceso directo a DB.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Response inicial — puede ser reemplazado por setAll si el token se renueva
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // ── Refresh de sesión ────────────────────────────────────────────────────
  //
  // IMPORTANTE — el patrón de setAll aquí es específico para middleware/proxy:
  //
  //   1. request.cookies.set()  → escribe el nuevo token en el request actual
  //      para que el Server Component lo vea en este mismo ciclo.
  //
  //   2. response = NextResponse.next({ request })  → recrea el response
  //      con el request actualizado (incluyendo las nuevas cookies).
  //
  //   3. response.cookies.set()  → escribe el nuevo token en el response
  //      para que el browser lo guarde (cookie de larga duración).
  //
  // Si alguno de estos pasos falta, el token se actualiza en memoria pero
  // no llega ni al Server Component ni al browser → la sesión se pierde.

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Paso 1: actualizar cookies en el request
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Paso 2: recrear el response con el request actualizado
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          // Paso 3: escribir cookies en el response para el browser
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() valida contra el servidor de Supabase — no usa caché local.
  // Esta llamada también dispara el refresh del token si es necesario.
  // El try-catch silencia el error cuando el refresh token ya no existe
  // (cookies viejas de una sesión anterior) — es comportamiento esperado.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // refresh_token_not_found u otros errores de auth → tratar como no autenticado
  }

  // ── Auth guard: rutas protegidas ─────────────────────────────────────────
  //
  // El proxy redirige ANTES de que Next.js intente renderizar la página.
  // Esto evita el estado de carga/suspense en rutas protegidas cuando
  // el usuario no está autenticado.

  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/mi-dia') ||
    pathname.startsWith('/kanban') ||
    pathname.startsWith('/tasks') ||
    pathname.startsWith('/projects') ||
    pathname.startsWith('/bugs') ||
    pathname.startsWith('/clientes');

  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/auth/login', request.url);
    // Guardar la ruta original para redirigir después del login
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Evitar que usuarios autenticados vean login ───────────────────────────
  //
  // Sin esto, un usuario logueado que visite /auth/login vería el formulario
  // y si hace submit, quedaría en un estado raro (ya estaba autenticado).

  const isAuthOnlyRoute = pathname.startsWith('/auth/login');

  if (isAuthOnlyRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Matchear todos los paths EXCEPTO:
     *   - _next/static  → archivos estáticos de Next.js
     *   - _next/image   → optimización de imágenes
     *   - favicon.ico
     *   - archivos de imagen (svg, png, jpg, etc.)
     *
     * El proxy NO debe correr en assets estáticos porque:
     *   1. No tienen cookies → getUser() siempre falla
     *   2. Agrega latencia innecesaria a cada imagen/font/css
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
};
