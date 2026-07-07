"use client";

import type { DecryptedNote } from "@workspace/core/features/notes/domain/note-types";
import type { NotesView } from "@workspace/core/stores/notes-store";
import { useNotesStore } from "@workspace/core/stores/notes-store";
import { useLocale, useTranslations } from "@workspace/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { ArchiveRestore, FileText, Trash2 } from "lucide-react";
import { useState } from "react";

const RECENT_LIMIT = 10;

function useViewNotes(view: Exclude<NotesView, "note">): DecryptedNote[] {
  const notes = useNotesStore((s) => s.notes);
  const all = Object.values(notes);
  switch (view) {
    case "all":
      return all
        .filter((n) => n.deletedAt === null)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    case "favorites":
      return all
        .filter((n) => n.deletedAt === null && n.isFavorite)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    case "recent":
      return all
        .filter((n) => n.deletedAt === null)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, RECENT_LIMIT);
    case "trash":
      return all
        .filter((n) => n.deletedAt !== null)
        .sort((a, b) => (b.deletedAt ?? "").localeCompare(a.deletedAt ?? ""));
    default:
      return [];
  }
}

export function NoteListView({ view }: { view: Exclude<NotesView, "note"> }) {
  const t = useTranslations("Notes");
  const locale = useLocale();
  const listed = useViewNotes(view);
  const selectNote = useNotesStore((s) => s.selectNote);
  const restoreFromTrash = useNotesStore((s) => s.restoreFromTrash);
  const deletePermanently = useNotesStore((s) => s.deletePermanently);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const titles = {
    all: t("sidebar.allNotes"),
    favorites: t("sidebar.favorites"),
    recent: t("sidebar.recent"),
    trash: t("sidebar.trash"),
  } as const;

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-6 md:px-8">
      <h1 className="font-bold text-xl">{titles[view]}</h1>
      {listed.length === 0 ? (
        <Empty>
          <EmptyTitle>{t("list.emptyTitle")}</EmptyTitle>
          <EmptyDescription>{t("list.emptyDescription")}</EmptyDescription>
        </Empty>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {listed.map((note) => (
            <li
              className="flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 hover:bg-muted"
              key={note.id}
            >
              {view === "trash" ? (
                <span className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                  {note.icon ? (
                    <span aria-hidden="true">{note.icon}</span>
                  ) : (
                    <FileText
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                  )}
                  <span className="truncate">
                    {note.title || t("untitled")}
                  </span>
                </span>
              ) : (
                <button
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-sm text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => selectNote(note.id)}
                  type="button"
                >
                  {note.icon ? (
                    <span aria-hidden="true">{note.icon}</span>
                  ) : (
                    <FileText
                      aria-hidden="true"
                      className="size-4 shrink-0 text-muted-foreground"
                    />
                  )}
                  <span className="truncate">
                    {note.title || t("untitled")}
                  </span>
                </button>
              )}
              <span className="shrink-0 text-muted-foreground text-xs">
                {formatDate(note.updatedAt)}
              </span>
              {view === "trash" && (
                <span className="flex shrink-0 gap-1">
                  <Button
                    aria-label={t("trash.restore")}
                    onClick={() => restoreFromTrash(note.id)}
                    size="icon-xs"
                    type="button"
                    variant="ghost"
                  >
                    <ArchiveRestore />
                  </Button>
                  <Button
                    aria-label={t("trash.deleteForever")}
                    onClick={() => setPendingDeleteId(note.id)}
                    size="icon-xs"
                    type="button"
                    variant="destructive"
                  >
                    <Trash2 />
                  </Button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteId(null);
          }
        }}
        open={pendingDeleteId !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("trash.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("trash.confirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDeleteId) {
                  deletePermanently(pendingDeleteId).catch(() => {
                    // Surfaced through saveStatus.
                  });
                }
              }}
            >
              {t("trash.deleteForever")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
