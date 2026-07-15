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
 * - Windows: `tauri.windows.conf.json` creates the main window without native
 *   decorations, so there is never a native control layer over the WebView.
 *   We draw our own controls in the top-right corner instead.
 * - Linux: there is no overlay mode, so native decorations are dropped at
 *   runtime and the same custom controls are used. The main content reserves
 *   room for them (`.titlebar-win-pad`).
 *
 * The window is dragged via the app chrome (sidebar/note headers carry
 * `data-tauri-drag-region`). Tauri's built-in drag-region listener only
 * fires when the mousedown target is the *exact* element carrying the
 * attribute, so headers full of buttons/text would only be draggable in the
 * thin gaps between children. The delegated mousedown listener below fixes
 * that: any press inside a drag region that is not on an interactive
 * element starts a native drag (double press toggles maximize).
 */

// Elements that must keep normal pointer behavior inside a drag region.
const INTERACTIVE_SELECTOR =
  "button, a, input, select, textarea, [contenteditable='true'], [role='button'], [role='menuitem'], [data-no-drag]";

const DRAG_HANDLE_SELECTOR = "[data-window-drag]";

// The WebView's native context menu (Look Up / Translate / Inspect…) only
// makes sense where text is actually editable; on app chrome it exposes
// browser internals, so it is suppressed there.
function onContextMenu(event: MouseEvent) {
  const target = event.target;
  if (
    target instanceof Element &&
    target.closest("input, textarea, [contenteditable='true']")
  ) {
    return;
  }
  event.preventDefault();
}

function onDragRegionMouseDown(event: MouseEvent) {
  if (event.button !== 0) {
    return;
  }
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }
  const explicitDragHandle = target.closest(DRAG_HANDLE_SELECTOR);
  if (explicitDragHandle && !target.closest("[data-no-drag]")) {
    event.preventDefault();
    const appWindow = getCurrentWindow();
    const action =
      event.detail === 2
        ? appWindow.toggleMaximize()
        : appWindow.startDragging();
    action.catch(() => {
      // Dragging is cosmetic; ignore missing permissions.
    });
    return;
  }
  // Direct hits on the region are handled by Tauri's injected listener.
  if (target.hasAttribute("data-tauri-drag-region")) {
    return;
  }
  if (
    !target.closest("[data-tauri-drag-region]") ||
    target.closest(INTERACTIVE_SELECTOR)
  ) {
    return;
  }
  event.preventDefault();
  const appWindow = getCurrentWindow();
  const action =
    event.detail === 2 ? appWindow.toggleMaximize() : appWindow.startDragging();
  action.catch(() => {
    // Dragging is cosmetic; ignore missing permissions.
  });
}

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
  const [isMainWindow, setIsMainWindow] = useState(false);

  useEffect(() => {
    const inTauri =
      typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
    setIsTauri(inTauri);
    if (!inTauri) {
      return;
    }

    // Secondary windows (sticky-note widgets) are created frameless with
    // their own chrome; they still get the delegated drag / context-menu
    // handling below, but not the main window's floating controls.
    const isMain = getCurrentWindow().label === "main";
    setIsMainWindow(isMain);

    const detected = detectOs();
    setOs(detected);
    // Tagging the document lets app chrome reserve room for the frameless
    // title bar. Only set inside Tauri so a browser never picks up the rule.
    document.documentElement.dataset.tauriOs = detected;

    if (detected === "linux") {
      getCurrentWindow()
        .setDecorations(false)
        .catch(() => {
          // If the permission is missing we keep native decorations.
        });
    }

    document.addEventListener("mousedown", onDragRegionMouseDown);
    document.addEventListener("contextmenu", onContextMenu);
    return () => {
      document.removeEventListener("mousedown", onDragRegionMouseDown);
      document.removeEventListener("contextmenu", onContextMenu);
    };
  }, []);

  // macOS uses native traffic lights; mobile/web have no custom controls;
  // widget windows draw their own.
  if (!(isTauri && isMainWindow) || (os !== "windows" && os !== "linux")) {
    return null;
  }

  const appWindow = getCurrentWindow();
  const control =
    "flex h-8 w-11 cursor-pointer items-center justify-center text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground";

  return (
    <div className="titlebar-window-controls" data-no-drag={true}>
      <button
        aria-label="Minimize"
        className={control}
        data-no-drag={true}
        onClick={() => appWindow.minimize()}
        onMouseDown={(event) => event.stopPropagation()}
        type="button"
      >
        <Minus className="size-4" />
      </button>
      <button
        aria-label="Maximize"
        className={control}
        data-no-drag={true}
        onClick={() => appWindow.toggleMaximize()}
        onMouseDown={(event) => event.stopPropagation()}
        type="button"
      >
        <Square className="size-3.5" />
      </button>
      <button
        aria-label="Close"
        className="flex h-8 w-11 cursor-pointer items-center justify-center text-muted-foreground outline-none transition-colors hover:bg-destructive hover:text-destructive-foreground"
        data-no-drag={true}
        onClick={() => appWindow.close()}
        onMouseDown={(event) => event.stopPropagation()}
        type="button"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
