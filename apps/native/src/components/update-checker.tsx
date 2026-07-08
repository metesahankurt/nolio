"use client";

import { useAppUpdater } from "@workspace/core/hooks/use-app-updater";
import { useEffect } from "react";

/**
 * Invisible component that checks for a new Tauri release on mount.
 * Rendered only inside the native app layout.
 */
export function UpdateChecker() {
  const { checkForUpdates } = useAppUpdater();

  useEffect(() => {
    // Small delay so the app window is fully visible before any dialog appears
    const timer = setTimeout(() => {
      checkForUpdates(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [checkForUpdates]);

  return null;
}
