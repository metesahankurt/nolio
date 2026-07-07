"use client";

import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Frameless, screen-integrated window chrome for the desktop app.
 *
 * - macOS: the window uses `titleBarStyle: "Overlay"` (see tauri.conf.json),
 *   so the native traffic lights float over the content and there is no
 *   separate, theme-colored title bar. This component renders no buttons
 *   there; it only tags the document so the UI can pad for the traffic
 *   lights. The app is dragged via `data-tauri-drag-region` regions.
 * - Windows/Linux: there is no overlay mode, so we drop the native
 *   decorations at runtime and draw our own minimal controls that follow
 *   the app theme instead of the OS chrome.
 */

type DesktopOs = "macos" | "windows" | "linux" | "other";

function detectOs(): DesktopOs {
  if (typeof navigator === "undefined") {
    return "other";
  }
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) {
    return "macos";
  }
  if (ua.includes("win")) {
    return "windows";
  }
  if (ua.includes("linux") || ua.includes("x11")) {
    return "linux";
  }
  return "other";
}

export function NativeTitleBar() {
  const [os, setOs] = useState<DesktopOs>("other");

  useEffect(() => {
    const detected = detectOs();
    setOs(detected);
    document.documentElement.dataset.tauriOs = detected;

    // On Windows/Linux, remove the native (theme-colored) title bar so the
    // window blends into the app. macOS keeps its overlay title bar.
    if (detected === "windows" || detected === "linux") {
      getCurrentWindow()
        .setDecorations(false)
        .catch(() => {
          // If the permission is missing we simply keep native decorations.
        });
    }
  }, []);

  if (os !== "windows" && os !== "linux") {
    return null;
  }

  const appWindow = getCurrentWindow();
  const control =
    "flex h-8 w-11 items-center justify-center text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground";

  // Only the control buttons are rendered as an overlay (top-right). The
  // window is dragged via the app's own chrome (sidebar/note headers carry
  // data-tauri-drag-region), so no full-width strip covers — and blocks —
  // the content beneath.
  return (
    <div className="fixed top-0 right-0 z-[60] flex">
      <button
        aria-label="Minimize"
        className={control}
        onClick={() => appWindow.minimize()}
        type="button"
      >
        <Minus className="size-4" />
      </button>
      <button
        aria-label="Maximize"
        className={control}
        onClick={() => appWindow.toggleMaximize()}
        type="button"
      >
        <Square className="size-3.5" />
      </button>
      <button
        aria-label="Close"
        className="flex h-8 w-11 items-center justify-center text-muted-foreground outline-none transition-colors hover:bg-destructive hover:text-destructive-foreground"
        onClick={() => appWindow.close()}
        type="button"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
