"use client";

import { NoteCommandMenu } from "@workspace/core/components/notes/note-command-menu";
import { NoteEditor } from "@workspace/core/components/notes/note-editor";
import { NoteHeader } from "@workspace/core/components/notes/note-header";
import { NoteListView } from "@workspace/core/components/notes/note-list-views";
import { NoteSidebar } from "@workspace/core/components/notes/note-sidebar";
import { NotesSettingsDialog } from "@workspace/core/components/notes/notes-settings-dialog";
import { useNotesStore } from "@workspace/core/stores/notes-store";
import { useVaultStore } from "@workspace/core/stores/vault-store";
import { useTranslations } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { PanelLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";

/**
 * Notion-like application shell: sidebar (inline on desktop, Sheet on
 * mobile), note header and BlockNote editor. Only ever mounted while the
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
  const notes = useNotesStore((s) => s.notes);
  const selectedNoteId = useNotesStore((s) => s.selectedNoteId);
  const corruptedCount = useNotesStore((s) => s.corruptedCount);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Warn once per unlock if any stored record failed to decrypt/validate.
  // Corrupted records are never dropped from storage, so this is advisory.
  const warnedRef = useRef(false);
  useEffect(() => {
    if (corruptedCount > 0 && !warnedRef.current) {
      warnedRef.current = true;
      toast.error(t("error.corruptRecords", { count: corruptedCount }));
    }
  }, [corruptedCount, t]);

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
    <div className="flex h-full w-full overflow-hidden bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 border-border border-r md:block">
        <NoteSidebar
          onOpenSearch={() => setCommandOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </aside>

      <Sheet onOpenChange={setMobileSidebarOpen} open={mobileSidebarOpen}>
        <SheetContent className="w-72 p-0" side="left">
          <SheetHeader className="sr-only">
            <SheetTitle>{t("sidebar.pages")}</SheetTitle>
          </SheetHeader>
          <NoteSidebar
            onNavigate={() => setMobileSidebarOpen(false)}
            onOpenSearch={() => {
              setMobileSidebarOpen(false);
              setCommandOpen(true);
            }}
            onOpenSettings={() => {
              setMobileSidebarOpen(false);
              setSettingsOpen(true);
            }}
          />
        </SheetContent>
      </Sheet>

      <main className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center border-border border-b px-2 py-1.5 md:hidden">
          <Button
            aria-label={t("shell.openSidebar")}
            onClick={() => setMobileSidebarOpen(true)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <PanelLeft />
          </Button>
        </div>

        {view !== "note" && (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <NoteListView view={view} />
          </div>
        )}
        {view === "note" && activeNote && (
          <div className="flex min-h-0 flex-1 flex-col">
            <NoteHeader note={activeNote} />
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-3xl px-4 py-4 md:px-8">
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
      </main>

      <NoteCommandMenu
        onOpenChange={setCommandOpen}
        onOpenSettings={() => setSettingsOpen(true)}
        open={commandOpen}
      />
      <NotesSettingsDialog onOpenChange={setSettingsOpen} open={settingsOpen} />
    </div>
  );
}
