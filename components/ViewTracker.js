"use client";

import { useEffect } from "react";

export default function ViewTracker({ claimId }) {
  useEffect(() => {
    if (!claimId) return;
    const key = `arena_viewed_${claimId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch("/api/views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ claimId }),
    }).catch(() => {});
  }, [claimId]);

  return null;
}
