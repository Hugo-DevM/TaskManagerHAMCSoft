/**
 * Supabase Auth Callback Route
 *
 * Maneja dos flujos de autenticación:
 *
 *  1. PKCE (mismo dispositivo)
 *     Cuando el usuario hace clic en un magic link o completa OAuth en el
 *     mismo dispositivo, Supabase redirige aquí con ?code=xxx.
 *     Se intercambia el code por una sesión via exchangeCodeForSession().
 *
 *  2. OTP / token hash (cross-device)
 *     Cuando el link se abre en un dispositivo diferente al que inició el
 *     flujo (ej: email abierto en el celular, flow iniciado en PC), Supabase
 *     manda ?token_hash=xxx&type=yyy.
 *     Se verifica con verifyOtp().
 *
 * El parámetro `next` controla a dónde redirigir después del auth.
 * Por defecto: /dashboard
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code      = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type      = searchParams.get('type') as EmailOtpType | null;
  const next      = searchParams.get('next') ?? '/dashboard';

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // ── Flujo 1: PKCE (magic link / OAuth en mismo dispositivo) ──────────────
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // ── Flujo 2: OTP hash (confirmación de email cross-device) ───────────────
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Si ningún flujo funcionó, redirigir al login con error
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
