"use client";

import { getCurrentWindow } from "@tauri-apps/api/window";
import { Logo } from "@workspace/ui/components/landing/logo";
import { Minus, Square, X } from "lucide-react";
import { useEffect, useState } from "react";

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
    const detected = detectOs();
    setOs(detected);
    document.documentElement.dataset.tauriOs = detected;
    setIsTauri(
      typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
    );

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

  if (!isTauri) {
    return null;
  }

  const appWindow = getCurrentWindow();
  const control =
    "flex h-8 w-11 items-center justify-center text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground cursor-pointer";

  return (
    <div
      className="fixed top-0 right-0 left-0 z-50 flex h-8 select-none items-center border-b bg-sidebar"
      data-tauri-drag-region={true}
    >
      <div
        className={`flex h-8 items-center justify-center gap-1.5 px-3 ${os === "macos" ? "pl-20" : ""}`}
        data-tauri-drag-region={true}
      >
        <Logo className="size-4" />
        <span className="font-semibold text-muted-foreground text-xs">
          Nolio
        </span>
      </div>
      <div className="h-8 flex-1" data-tauri-drag-region={true} />

      {(os === "windows" || os === "linux") && (
        <div className="flex items-center">
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
      )}
    </div>
  );
}
