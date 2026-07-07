"use client";

import { SaveStatus } from "@workspace/core/components/notes/save-status";
import type { DecryptedNote } from "@workspace/core/features/notes/domain/note-types";
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
  Trash2,
} from "lucide-react";

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
  const createNote = useNotesStore((s) => s.createNote);
  const selectNote = useNotesStore((s) => s.selectNote);

  const breadcrumb = buildBreadcrumb(notes, note);
  const updatedLabel = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(note.updatedAt));

  return (
    // win-titlebar-pad reserves space on the right for the custom window
    // controls on Windows/Linux; data-tauri-drag-region lets the header be
    // used to move the window (both are inert on web).
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
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => moveToTrash(note.id)}
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
