"use client";

import { NoteReminderPopover } from "@workspace/core/components/notes/note-reminder-popover";
import { SaveStatus } from "@workspace/core/components/notes/save-status";
import type { DecryptedNote } from "@workspace/core/features/notes/domain/note-types";
import { useStickyAdapterStore } from "@workspace/core/features/notes/sticky/sticky-adapter";
import { useNotesStore } from "@workspace/core/stores/notes-store";
import { useLocale, useTranslations } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  FilePlus2,
  FileText,
  MoreHorizontal,
  Star,
  StarOff,
  StickyNote,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

const ICON_CHOICES = [
  "📝",
  "📒",
  "📌",
  "💡",
  "⭐",
  "✅",
  "📅",
  "📖",
  "💼",
  "🏠",
  "🎯",
  "🧠",
  "🔬",
  "🎨",
  "✈️",
  "❤️",
];

function buildBreadcrumb(
  notes: Record<string, DecryptedNote>,
  note: DecryptedNote
): DecryptedNote[] {
  const chain: DecryptedNote[] = [];
  let current: DecryptedNote | undefined = note;
  while (current?.parentId) {
    const parent: DecryptedNote | undefined = notes[current.parentId];
    if (!parent || chain.length > 16) {
      break;
    }
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}

export function NoteHeader({ note }: { note: DecryptedNote }) {
  const t = useTranslations("Notes");
  const locale = useLocale();
  const notes = useNotesStore((s) => s.notes);
  const updateNoteTitle = useNotesStore((s) => s.updateNoteTitle);
  const updateNoteIcon = useNotesStore((s) => s.updateNoteIcon);
  const toggleFavorite = useNotesStore((s) => s.toggleFavorite);
  const moveToTrash = useNotesStore((s) => s.moveToTrash);
  const restoreFromTrash = useNotesStore((s) => s.restoreFromTrash);
  const createNote = useNotesStore((s) => s.createNote);
  const selectNote = useNotesStore((s) => s.selectNote);
  const stickyAdapter = useStickyAdapterStore((s) => s.adapter);

  const breadcrumb = buildBreadcrumb(notes, note);
  const updatedLabel = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(note.updatedAt));

  return (
    // data-tauri-drag-region lets the header move the native window (inert
    // on web). Room for the Windows/Linux window controls is reserved on the
    // whole content area via `.titlebar-win-pad`, so no per-header padding is
    // needed here.
    <div
      className="flex flex-col gap-1 border-border border-b px-4 py-3 md:px-8"
      data-tauri-drag-region={true}
    >
      {breadcrumb.length > 0 && (
        <nav
          aria-label={t("header.breadcrumb")}
          className="flex items-center gap-1 overflow-x-auto text-muted-foreground text-xs"
        >
          {breadcrumb.map((ancestor) => (
            <span className="flex items-center gap-1" key={ancestor.id}>
              <button
                className="max-w-40 truncate rounded-sm hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => selectNote(ancestor.id)}
                type="button"
              >
                {ancestor.title || t("untitled")}
              </button>
              <span aria-hidden="true">/</span>
            </span>
          ))}
          <span className="max-w-40 truncate text-foreground">
            {note.title || t("untitled")}
          </span>
        </nav>
      )}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild={true}>
            <Button
              aria-label={t("header.changeIcon")}
              className="size-9 text-xl"
              size="icon"
              type="button"
              variant="ghost"
            >
              {note.icon ?? (
                <FileText className="size-5 text-muted-foreground" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56">
            <div className="grid grid-cols-8 gap-1">
              {ICON_CHOICES.map((icon) => (
                <button
                  className="rounded-md p-1 text-lg hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                  key={icon}
                  onClick={() => updateNoteIcon(note.id, icon)}
                  type="button"
                >
                  {icon}
                </button>
              ))}
            </div>
            <Button
              className="mt-2 w-full"
              onClick={() => updateNoteIcon(note.id, undefined)}
              size="sm"
              type="button"
              variant="ghost"
            >
              {t("header.removeIcon")}
            </Button>
          </PopoverContent>
        </Popover>

        <input
          aria-label={t("header.titleLabel")}
          className="min-w-0 flex-1 bg-transparent font-bold text-2xl text-foreground outline-none placeholder:text-muted-foreground"
          maxLength={200}
          onChange={(event) => updateNoteTitle(note.id, event.target.value)}
          placeholder={t("untitled")}
          value={note.title}
        />

        <NoteReminderPopover note={note} />

        {stickyAdapter && (
          <Button
            aria-label={t("header.openAsSticky")}
            onClick={() => {
              stickyAdapter.openSticky(note.id).catch(() => {
                // Native window errors are non-fatal for the main editor.
              });
            }}
            size="icon"
            type="button"
            variant="ghost"
          >
            <StickyNote />
          </Button>
        )}

        <SaveStatus />

        <DropdownMenu>
          <DropdownMenuTrigger asChild={true}>
            <Button
              aria-label={t("header.noteMenu")}
              size="icon"
              type="button"
              variant="ghost"
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => toggleFavorite(note.id)}>
              {note.isFavorite ? <StarOff /> : <Star />}
              {note.isFavorite
                ? t("header.removeFavorite")
                : t("header.addFavorite")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                createNote(note.id).catch(() => {
                  // Surfaced through saveStatus.
                });
              }}
            >
              <FilePlus2 />
              {t("header.addSubpage")}
            </DropdownMenuItem>
            {stickyAdapter && (
              <DropdownMenuItem
                onClick={() => {
                  stickyAdapter.openSticky(note.id).catch(() => {
                    // Native window errors are non-fatal for the main editor.
                  });
                }}
              >
                <StickyNote />
                {t("header.openAsSticky")}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                moveToTrash(note.id);
                toast(t("trash.movedToTrash"), {
                  action: {
                    label: t("common.undo"),
                    onClick: () => restoreFromTrash(note.id),
                  },
                });
              }}
              variant="destructive"
            >
              <Trash2 />
              {t("header.moveToTrash")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="text-muted-foreground text-xs">
        {t("header.lastUpdated", { date: updatedLabel })}
      </p>
    </div>
  );
}
