"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Invisible component that calls router.refresh() when the tab becomes visible.
 * This tells Next.js to re-run all active Server Components, fetching fresh data
 * without a full page reload — solving the stale-data-on-tab-return problem.
 */
export function VisibilityRefresher() {
  const router = useRouter();

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [router]);

  return null;
}
