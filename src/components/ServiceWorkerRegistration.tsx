"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("[SW] registered, scope:", reg.scope);
      })
      .catch((err) => {
        console.error("[SW] registration failed:", err);
      });
  }, []);

  return null;
}
