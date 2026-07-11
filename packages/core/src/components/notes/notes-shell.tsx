"use client";

import { NoteCommandMenu } from "@workspace/core/components/notes/note-command-menu";
import { NoteEditor } from "@workspace/core/components/notes/note-editor";
import { NoteHeader } from "@workspace/core/components/notes/note-header";
import { NoteListView } from "@workspace/core/components/notes/note-list-views";
import { NoteSidebar } from "@workspace/core/components/notes/note-sidebar";
import { NotesSettingsView } from "@workspace/core/components/notes/notes-settings-view";
import { useNotesStore } from "@workspace/core/stores/notes-store";
import { useVaultStore } from "@workspace/core/stores/vault-store";
import { useTranslations } from "@workspace/i18n";
import {
  Empty,
  EmptyDescription,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";

/**
 * Notion-like application shell: sidebar (inline on desktop, Sheet on
 * mobile), note header and rich text editor. Only ever mounted while the
 * vault is unlocked.
 *
 * Hotkeys: Cmd/Ctrl+K opens the command palette; Cmd/Ctrl+Shift+L locks
 * the vault. Cmd+Shift+L is not reserved by Chromium/WebKit/WebView2 for
 * anything critical (unlike e.g. Cmd+L which focuses the address bar), so
 * it is safe across the web and Tauri targets.
 */
export function NotesShell() {
  const t = useTranslations("Notes");
  const lock = useVaultStore((s) => s.lock);
  const view = useNotesStore((s) => s.view);
  const setView = useNotesStore((s) => s.setView);
  const notes = useNotesStore((s) => s.notes);
  const selectedNoteId = useNotesStore((s) => s.selectedNoteId);
  const corruptedCount = useNotesStore((s) => s.corruptedCount);
  const applyDueReminders = useNotesStore((s) => s.applyDueReminders);

  const [commandOpen, setCommandOpen] = useState(false);

  // Settings opens as a full page in the main content area (like the
  // original Catalyzer settings page), not as a modal dialog.
  const openSettings = () => setView("settings");

  // Warn once per unlock if any stored record failed to decrypt/validate.
  // Corrupted records are never dropped from storage, so this is advisory.
  const warnedRef = useRef(false);
  useEffect(() => {
    if (corruptedCount > 0 && !warnedRef.current) {
      warnedRef.current = true;
      toast.error(t("error.corruptRecords", { count: corruptedCount }));
    }
  }, [corruptedCount, t]);

  useEffect(() => {
    if (view) {
      window.scrollTo({ top: 0, left: 0 });
    }
  }, [view]);

  useEffect(() => {
    applyDueReminders().catch(() => {
      // Reminder reset failures surface through the save status.
    });
    const interval = window.setInterval(() => {
      applyDueReminders().catch(() => {
        // Reminder reset failures surface through the save status.
      });
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [applyDueReminders]);

  useHotkeys(
    "mod+k",
    (event: KeyboardEvent) => {
      event.preventDefault();
      setCommandOpen((open) => !open);
    },
    { enableOnFormTags: true, enableOnContentEditable: true }
  );
  useHotkeys(
    "mod+shift+l",
    (event: KeyboardEvent) => {
      event.preventDefault();
      lock();
    },
    { enableOnFormTags: true, enableOnContentEditable: true }
  );

  const selectedNote = selectedNoteId ? notes[selectedNoteId] : undefined;
  const activeNote =
    selectedNote && selectedNote.deletedAt === null ? selectedNote : undefined;

  return (
    <TooltipProvider>
      {/* select-none: app chrome is not selectable text; the editor body and
          form fields opt back in (see the input/contenteditable rule in
          globals.css and select-text on the editor wrapper below). */}
      <SidebarProvider className="h-full min-h-0 w-full select-none overflow-hidden">
        <NoteSidebar
          onOpenSearch={() => setCommandOpen(true)}
          onOpenSettings={openSettings}
        />

        <SidebarInset className="titlebar-win-pad min-w-0 overflow-hidden">
          {/* Grab bar over the space titlebar-win-pad reserves for the
              Windows/Linux window controls (see globals.css). Inert on web
              and macOS. */}
          <div
            aria-hidden="true"
            className="titlebar-drag-strip"
            data-tauri-drag-region={true}
          />
          <div className="flex items-center border-border border-b px-2 py-1.5 md:hidden">
            <SidebarTrigger aria-label={t("shell.openSidebar")} />
          </div>

          {view === "settings" && (
            <div className="min-h-0 flex-1 overflow-hidden">
              <NotesSettingsView />
            </div>
          )}
          {view !== "note" && view !== "settings" && (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <NoteListView view={view} />
            </div>
          )}
          {view === "note" && activeNote && (
            <div className="flex min-h-0 flex-1 flex-col">
              <NoteHeader note={activeNote} />
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-3xl select-text px-4 py-4 md:px-8">
                  <NoteEditor key={activeNote.id} note={activeNote} />
                </div>
              </div>
            </div>
          )}
          {view === "note" && !activeNote && (
            <div className="flex flex-1 items-center justify-center p-8">
              <Empty>
                <EmptyTitle>{t("shell.noNoteTitle")}</EmptyTitle>
                <EmptyDescription>
                  {t("shell.noNoteDescription")}
                </EmptyDescription>
              </Empty>
            </div>
          )}
        </SidebarInset>

        <NoteCommandMenu
          onOpenChange={setCommandOpen}
          onOpenSettings={openSettings}
          open={commandOpen}
        />
      </SidebarProvider>
    </TooltipProvider>
  );
}
