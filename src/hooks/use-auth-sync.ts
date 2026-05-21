"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Escucha cambios de sesión de Supabase en el cliente.
 * - SIGNED_OUT: redirige a /auth/login (cubre cierre de sesión en otra pestaña)
 * - TOKEN_REFRESHED: fuerza un refresh de Server Components para que
 *   el servidor lea el token renovado desde las cookies.
 */
export function useAuthSync() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.push("/auth/login");
      }
      // TOKEN_REFRESHED is intentionally ignored — the proxy.ts
      // already refreshes the token on every server request. Calling router.refresh()
      // here blocks the Next.js router while hooks have isFetchingRef.current = true,
      // causing navigation to hang and the new view's hooks to never load.
    });

    return () => subscription.unsubscribe();
  }, [router]);
}
