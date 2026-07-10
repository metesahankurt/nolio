"use client";

import { emitTo, listen, type UnlistenFn } from "@tauri-apps/api/event";
import {
  getAllWebviewWindows,
  WebviewWindow,
} from "@tauri-apps/api/webviewWindow";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  STICKY_EVENTS,
  STICKY_LABEL_PREFIX,
  type StickyReadyPayload,
  type StickyTitlePayload,
  type StickyUpdatePayload,
  useStickyAdapterStore,
} from "@workspace/core/features/notes/sticky/sticky-adapter";
import { useNotesStore } from "@workspace/core/stores/notes-store";
import { useVaultStore } from "@workspace/core/stores/vault-store";
import { useLocale } from "@workspace/i18n";
import { useEffect } from "react";

/**
 * Main-window side of the sticky-note widgets.
 *
 * Sticky windows never unlock the vault themselves: this bridge answers
 * their `ready` event with the already-decrypted note snapshot and applies
 * their edits through the regular notes store, so persistence stays
 * encrypted and the key never leaves this window. Consequently the widgets
 * are only alive while the main window is open and unlocked — they are
 * closed on lock, when their note is trashed, and when this window closes.
 */

// Window operations are best-effort: the target window may already be gone.
function ignore(): void {
  // Intentionally empty.
}

const STICKY_WIDTH = 340;
const STICKY_HEIGHT = 380;
const STICKY_MIN_WIDTH = 260;
const STICKY_MIN_HEIGHT = 240;

async function closeAllStickyWindows(): Promise<void> {
  const windows = await getAllWebviewWindows();
  await Promise.all(
    windows
      .filter((w) => w.label.startsWith(STICKY_LABEL_PREFIX))
      .map((w) => w.close().catch(ignore))
  );
}

export function StickyNotesBridge() {
  const locale = useLocale();

  useEffect(() => {
    if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) {
      return;
    }

    // Labels of widgets opened by this window instance; used to react to a
    // note being trashed without polling the window list on every change.
    const openLabels = new Set<string>();

    useStickyAdapterStore.getState().setAdapter({
      async openSticky(noteId: string) {
        const label = `${STICKY_LABEL_PREFIX}${noteId}`;
        const existing = await WebviewWindow.getByLabel(label);
        if (existing) {
          await existing.unminimize().catch(ignore);
          await existing.setFocus().catch(ignore);
          return;
        }
        const sticky = new WebviewWindow(label, {
          url: `/${locale}/sticky/?noteId=${encodeURIComponent(noteId)}`,
          title: "Nolio",
          width: STICKY_WIDTH,
          height: STICKY_HEIGHT,
          minWidth: STICKY_MIN_WIDTH,
          minHeight: STICKY_MIN_HEIGHT,
          resizable: true,
          maximizable: true,
          minimizable: true,
          decorations: false,
        });
        openLabels.add(label);
        sticky.once("tauri://destroyed", () => {
          openLabels.delete(label);
        });
        sticky.once("tauri://error", () => {
          openLabels.delete(label);
        });
      },
    });

    const unlistens: Promise<UnlistenFn>[] = [
      // A widget mounted: hand it the decrypted snapshot, or tell it to
      // close if its note is gone (locked vault, trashed, deleted).
      listen<StickyReadyPayload>(STICKY_EVENTS.ready, (event) => {
        const { label, noteId } = event.payload;
        const note = useNotesStore.getState().notes[noteId];
        if (!note || note.deletedAt !== null) {
          emitTo(label, STICKY_EVENTS.close).catch(ignore);
          return;
        }
        emitTo(label, STICKY_EVENTS.note, {
          id: note.id,
          title: note.title,
          content: note.content,
        }).catch(ignore);
      }),
      listen<StickyUpdatePayload>(STICKY_EVENTS.update, (event) => {
        const { noteId, content } = event.payload;
        useNotesStore.getState().updateNoteContent(noteId, content);
      }),
      listen<StickyTitlePayload>(STICKY_EVENTS.title, (event) => {
        const { noteId, title } = event.payload;
        useNotesStore.getState().updateNoteTitle(noteId, title);
      }),
    ];

    // Widgets show decrypted content, so they must not outlive the session:
    // lock → close them all (covers auto-lock and manual lock).
    const unsubscribeVault = useVaultStore.subscribe((state, previous) => {
      if (previous.status === "unlocked" && state.status !== "unlocked") {
        closeAllStickyWindows().catch(ignore);
      }
    });

    // Close a widget whose note was trashed or permanently deleted.
    const unsubscribeNotes = useNotesStore.subscribe((state, previous) => {
      if (openLabels.size === 0 || state.notes === previous.notes) {
        return;
      }
      for (const label of openLabels) {
        const noteId = label.slice(STICKY_LABEL_PREFIX.length);
        const note = state.notes[noteId];
        if (!note || note.deletedAt !== null) {
          emitTo(label, STICKY_EVENTS.close).catch(ignore);
          openLabels.delete(label);
        }
      }
    });

    // Widgets cannot save without this window; take them down with it.
    const unlistenClose = getCurrentWindow().onCloseRequested(() =>
      closeAllStickyWindows().catch(ignore)
    );

    return () => {
      useStickyAdapterStore.getState().setAdapter(null);
      for (const unlisten of unlistens) {
        unlisten.then((fn) => fn()).catch(ignore);
      }
      unsubscribeVault();
      unsubscribeNotes();
      unlistenClose.then((fn) => fn()).catch(ignore);
    };
  }, [locale]);

  return null;
}
