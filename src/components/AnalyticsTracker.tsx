"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { recordVisit } from "@/app/actions/analytics";

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Only run in browser
    if (typeof window !== "undefined") {
      const referrer = document.referrer;
      // Record visit, non-blocking
      recordVisit(pathname, referrer).catch(console.error);
    }
  }, [pathname]);

  return null; // Render nothing
}
