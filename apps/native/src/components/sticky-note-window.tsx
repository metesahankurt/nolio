"use client";

import { emitTo, type UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { NoteDocument } from "@workspace/core/features/notes/domain/note-types";
import {
  noteDocumentToPlateValue,
  plateValueToNoteDocument,
} from "@workspace/core/features/notes/editor/plate-note-content";
import {
  STICKY_EVENTS,
  type StickySnapshotPayload,
} from "@workspace/core/features/notes/sticky/sticky-adapter";
import { useTranslations } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import {
  RichTextEditor,
  type RichTextValue,
} from "@workspace/ui/components/rich-text-editor";
import { Loader2, Pin, PinOff, X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Content of a floating sticky-note widget window (frameless, created by
 * the main window's StickyNotesBridge). It holds no vault state: the note
 * arrives decrypted over a window-targeted event and every edit is sent
 * back to the main window, which persists it encrypted. If the main window
 * locks or the note is trashed it receives `close` and shuts down.
 *
 * The header is a drag region (the delegated handler in NativeTitleBar
 * makes the whole strip draggable); min size and resizability are set at
 * window creation. Slash commands stay available — the toolbar is hidden
 * to keep the widget compact.
 */

// Window/IPC operations are best-effort: the peer may already be gone.
function ignore(): void {
  // Intentionally empty.
}

export function StickyNoteWindow() {
  const t = useTranslations("Notes");
  const [snapshot, setSnapshot] = useState<StickySnapshotPayload | null>(null);
  const [title, setTitle] = useState("");
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) {
      return;
    }
    const noteId = new URLSearchParams(window.location.search).get("noteId");
    const stickyWindow = getCurrentWebviewWindow();
    if (!noteId) {
      stickyWindow.close().catch(ignore);
      return;
    }

    const unlistens: Promise<UnlistenFn>[] = [
      stickyWindow.listen<StickySnapshotPayload>(
        STICKY_EVENTS.note,
        (event) => {
          setSnapshot(event.payload);
          setTitle(event.payload.title);
        }
      ),
      stickyWindow.listen(STICKY_EVENTS.close, () => {
        stickyWindow.close().catch(ignore);
      }),
    ];

    emitTo("main", STICKY_EVENTS.ready, {
      label: stickyWindow.label,
      noteId,
    }).catch(ignore);

    return () => {
      for (const unlisten of unlistens) {
        unlisten.then((fn) => fn()).catch(ignore);
      }
    };
  }, []);

  const sendTitle = (value: string) => {
    setTitle(value);
    if (snapshot) {
      emitTo("main", STICKY_EVENTS.title, {
        noteId: snapshot.id,
        title: value,
      }).catch(ignore);
    }
  };

  const sendContent = (value: RichTextValue) => {
    if (snapshot) {
      emitTo("main", STICKY_EVENTS.update, {
        noteId: snapshot.id,
        content: plateValueToNoteDocument(value as NoteDocument),
      }).catch(ignore);
    }
  };

  const togglePin = () => {
    const next = !pinned;
    setPinned(next);
    getCurrentWebviewWindow()
      .setAlwaysOnTop(next)
      .catch(() => {
        setPinned(!next);
      });
  };

  const control = "size-6 shrink-0 text-muted-foreground hover:text-foreground";

  return (
    <div className="flex h-full select-none flex-col overflow-hidden bg-background">
      <header
        className="flex h-9 shrink-0 items-center gap-1 border-border border-b bg-muted/40 pr-1 pl-3"
        data-tauri-drag-region={true}
      >
        <input
          aria-label={t("header.titleLabel")}
          className="min-w-0 flex-1 bg-transparent font-medium text-foreground text-sm outline-none placeholder:text-muted-foreground"
          maxLength={200}
          onChange={(event) => sendTitle(event.target.value)}
          placeholder={t("untitled")}
          value={title}
        />
        <Button
          aria-label={pinned ? t("sticky.unpin") : t("sticky.pin")}
          aria-pressed={pinned}
          className={control}
          onClick={togglePin}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          {pinned ? <PinOff /> : <Pin />}
        </Button>
        <Button
          aria-label={t("sticky.close")}
          className="size-6 shrink-0 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => {
            getCurrentWebviewWindow().close().catch(ignore);
          }}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <X />
        </Button>
      </header>

      {snapshot ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <RichTextEditor
            aria-label={t("header.titleLabel")}
            className="min-h-full flex-1 rounded-none border-0 shadow-none"
            hideToolbar={true}
            initialValue={
              noteDocumentToPlateValue(snapshot.content) as RichTextValue
            }
            key={snapshot.id}
            onChange={sendContent}
          />
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center gap-2 text-muted-foreground text-sm">
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          {t("sticky.loading")}
        </div>
      )}
    </div>
  );
}
