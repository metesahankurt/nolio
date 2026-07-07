"use client";

import type { DecryptedNote } from "@workspace/core/features/notes/domain/note-types";
import { useNotesStore } from "@workspace/core/stores/notes-store";
import { useTranslations } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { ChevronRight, FileText, Plus } from "lucide-react";
import { useState } from "react";

function childrenOf(
  notes: Record<string, DecryptedNote>,
  parentId: string | null
): DecryptedNote[] {
  return Object.values(notes)
    .filter((note) => note.deletedAt === null && note.parentId === parentId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

interface NoteTreeItemProps {
  depth: number;
  note: DecryptedNote;
}

function NoteTreeItem({ note, depth }: NoteTreeItemProps) {
  const t = useTranslations("Notes");
  const notes = useNotesStore((s) => s.notes);
  const selectedNoteId = useNotesStore((s) => s.selectedNoteId);
  const view = useNotesStore((s) => s.view);
  const selectNote = useNotesStore((s) => s.selectNote);
  const createNote = useNotesStore((s) => s.createNote);
  const [expanded, setExpanded] = useState(false);

  const children = childrenOf(notes, note.id);
  const isSelected = view === "note" && selectedNoteId === note.id;

  return (
    <li>
      <div
        className={cn(
          "group/tree-item flex items-center gap-0.5 rounded-md pr-1 hover:bg-sidebar-accent",
          isSelected && "bg-sidebar-accent text-sidebar-accent-foreground"
        )}
        style={{ paddingLeft: `${depth * 12}px` }}
      >
        <Button
          aria-expanded={expanded}
          aria-label={expanded ? t("tree.collapse") : t("tree.expand")}
          className={cn(
            "size-5 shrink-0 text-muted-foreground",
            children.length === 0 && "invisible"
          )}
          onClick={() => setExpanded((value) => !value)}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <ChevronRight
            className={cn("transition-transform", expanded && "rotate-90")}
          />
        </Button>
        <button
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded-sm py-1 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => selectNote(note.id)}
          type="button"
        >
          {note.icon ? (
            <span aria-hidden="true" className="shrink-0 text-sm">
              {note.icon}
            </span>
          ) : (
            <FileText
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground"
            />
          )}
          <span className="truncate">{note.title || t("untitled")}</span>
        </button>
        <Button
          aria-label={t("tree.addSubpage")}
          className="size-5 shrink-0 text-muted-foreground opacity-0 focus-visible:opacity-100 group-hover/tree-item:opacity-100"
          onClick={() => {
            setExpanded(true);
            createNote(note.id).catch(() => {
              // Surfaced through saveStatus.
            });
          }}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <Plus />
        </Button>
      </div>
      {expanded && children.length > 0 && (
        <ul className="m-0 list-none p-0">
          {children.map((child) => (
            <NoteTreeItem depth={depth + 1} key={child.id} note={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function NoteTree() {
  const t = useTranslations("Notes");
  const notes = useNotesStore((s) => s.notes);
  const roots = childrenOf(notes, null);

  if (roots.length === 0) {
    return (
      <p className="px-2 py-1 text-muted-foreground text-xs">
        {t("tree.empty")}
      </p>
    );
  }
  return (
    <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
      {roots.map((note) => (
        <NoteTreeItem depth={0} key={note.id} note={note} />
      ))}
    </ul>
  );
}
