"use client";

import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Frameless, screen-integrated window chrome for the desktop app.
 *
 * There is deliberately NO full-width title bar band: the shadcn Sidebar is
 * `position: fixed`, so a top band would overlap and clip the sidebar
 * header. Instead the app goes edge to edge (Notion/Linear style):
 *
 * - macOS: `titleBarStyle: "Overlay"` (tauri.conf.json) keeps the native
 *   traffic lights floating over the top-left of the sidebar. The sidebar
 *   header reserves vertical room for them (see the `.titlebar-mac-pad`
 *   rule in globals.css). This component renders nothing on macOS.
 * - Windows/Linux: there is no overlay mode, so the native (theme-colored)
 *   decorations are dropped at runtime and we draw our own controls in the
 *   top-right corner. The main content reserves room for them
 *   (`.titlebar-win-pad`).
 *
 * The window is dragged via the app chrome (sidebar/note headers carry
 * `data-tauri-drag-region`).
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
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    const inTauri =
      typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
    setIsTauri(inTauri);
    if (!inTauri) {
      return;
    }

    const detected = detectOs();
    setOs(detected);
    // Tagging the document lets app chrome reserve room for the frameless
    // title bar. Only set inside Tauri so a browser never picks up the rule.
    document.documentElement.dataset.tauriOs = detected;

    if (detected === "windows" || detected === "linux") {
      getCurrentWindow()
        .setDecorations(false)
        .catch(() => {
          // If the permission is missing we keep native decorations.
        });
    }
  }, []);

  // macOS uses native traffic lights; mobile/web have no custom controls.
  if (!isTauri || (os !== "windows" && os !== "linux")) {
    return null;
  }

  const appWindow = getCurrentWindow();
  const control =
    "flex h-8 w-11 cursor-pointer items-center justify-center text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground";

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
        className="flex h-8 w-11 cursor-pointer items-center justify-center text-muted-foreground outline-none transition-colors hover:bg-destructive hover:text-destructive-foreground"
        onClick={() => appWindow.close()}
        type="button"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
