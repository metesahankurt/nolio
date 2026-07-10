"use client";

import { getCurrentWindow } from "@tauri-apps/api/window";
import { useAppUpdater } from "@workspace/core/hooks/use-app-updater";
import { useEffect } from "react";

/**
 * Invisible component that checks for a new Tauri release on mount.
 * Rendered only inside the native app layout, and only acts in the main
 * window — sticky-note widget windows must not spawn duplicate update
 * dialogs.
 */
export function UpdateChecker() {
  const { checkForUpdates } = useAppUpdater();

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "__TAURI_INTERNALS__" in window &&
      getCurrentWindow().label !== "main"
    ) {
      return;
    }
    // Small delay so the app window is fully visible before any dialog appears
    const timer = setTimeout(() => {
      checkForUpdates(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [checkForUpdates]);

  return null;
}
