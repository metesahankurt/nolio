"use client";

import { useEffect } from "react";

// Dynamically import Tauri plugins — only available in native app builds.
// On web these imports will fail gracefully and the component does nothing.
async function checkForUpdates() {
  try {
    const { check } = await import("@tauri-apps/plugin-updater");
    const { relaunch } = await import("@tauri-apps/plugin-process");

    const update = await check();
    if (!update) {
      return;
    }

    const version = update.version;

    const { ask } = await import("@tauri-apps/plugin-dialog");
    const yes = await ask(
      `Nolio ${version} sürümü mevcut.\n\nŞimdi indirip yüklemek ister misin?`,
      {
        title: "Güncelleme Mevcut",
        kind: "info",
        okLabel: "İndir ve Yükle",
        cancelLabel: "Daha Sonra",
      }
    );

    if (!yes) {
      return;
    }

    await update.downloadAndInstall();
    await relaunch();
  } catch {
    // Silently ignore — running on web where plugins are absent.
  }
}

/**
 * Invisible component that checks for a new Tauri release on mount.
 * Rendered only inside the native app layout.
 */
export function UpdateChecker() {
  useEffect(() => {
    // Small delay so the app window is fully visible before any dialog appears
    const timer = setTimeout(() => {
      checkForUpdates();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}
