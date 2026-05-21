/**
 * Logout Route Handler
 *
 * POST /auth/logout
 *
 * Cierra la sesión en Supabase y borra las cookies de sesión.
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(
    new URL('/auth/login', process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
    { status: 302 }
  );
}
