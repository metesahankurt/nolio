"use client";

import type { DecryptedNote } from "@workspace/core/features/notes/domain/note-types";
import { useStickyAdapterStore } from "@workspace/core/features/notes/sticky/sticky-adapter";
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
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
  Empty,
  EmptyDescription,
  EmptyTitle,
} from "@workspace/ui/components/empty";
import { cn } from "@workspace/ui/lib/utils";
import {
  ArchiveRestore,
  Bell,
  FileText,
  StickyNote,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const RECENT_LIMIT = 10;

function useViewNotes(
  view: Exclude<NotesView, "note" | "settings">
): DecryptedNote[] {
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
    case "reminders":
      return all
        .filter((n) => n.deletedAt === null && n.reminder?.enabled)
        .sort((a, b) => {
          const left = a.reminder?.resetTime ?? "";
          const right = b.reminder?.resetTime ?? "";
          return (
            left.localeCompare(right) || b.updatedAt.localeCompare(a.updatedAt)
          );
        });
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

interface NoteListRowProps {
  formatDate: (iso: string) => string;
  formatReminder: (note: DecryptedNote) => string;
  hasSelection: boolean;
  isSelected: boolean;
  note: DecryptedNote;
  onDeleteForeverClick: (id: string) => void;
  onRestore: (id: string) => void;
  onSelect: (id: string) => void;
  onToggleSelected: (id: string) => void;
  view: Exclude<NotesView, "note" | "settings">;
}

function NoteListRow({
  formatDate,
  formatReminder,
  hasSelection,
  isSelected,
  note,
  onDeleteForeverClick,
  onRestore,
  onSelect,
  onToggleSelected,
  view,
}: NoteListRowProps) {
  const t = useTranslations("Notes");
  const stickyAdapter = useStickyAdapterStore((s) => s.adapter);
  const isTrash = view === "trash";

  const icon = note.icon ? (
    <span aria-hidden="true">{note.icon}</span>
  ) : (
    <FileText
      aria-hidden="true"
      className="size-4 shrink-0 text-muted-foreground"
    />
  );

  return (
    <li
      className="group/note-row flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 hover:bg-muted"
      key={note.id}
    >
      {view === "all" && (
        <Checkbox
          aria-label={t("list.selectNote")}
          checked={isSelected}
          className={cn(
            "shrink-0 opacity-0 transition-opacity focus-visible:opacity-100 group-hover/note-row:opacity-100 data-[state=checked]:opacity-100",
            hasSelection && "opacity-100"
          )}
          onCheckedChange={() => onToggleSelected(note.id)}
        />
      )}
      {isTrash ? (
        <span className="flex min-w-0 flex-1 items-center gap-2 text-sm">
          {icon}
          <span className="truncate">{note.title || t("untitled")}</span>
        </span>
      ) : (
        <button
          className="flex min-w-0 flex-1 items-center gap-2 rounded-sm text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => onSelect(note.id)}
          type="button"
        >
          {icon}
          <span className="truncate">{note.title || t("untitled")}</span>
        </button>
      )}
      <span className="shrink-0 text-muted-foreground text-xs">
        {view === "reminders"
          ? formatReminder(note)
          : formatDate(note.updatedAt)}
      </span>
      {view === "reminders" && (
        <Bell
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground"
        />
      )}
      {stickyAdapter && !isTrash && (
        <Button
          aria-label={t("header.openAsSticky")}
          className="opacity-0 transition-opacity focus-visible:opacity-100 group-hover/note-row:opacity-100"
          onClick={() => {
            stickyAdapter.openSticky(note.id).catch(() => {
              // Native window errors are non-fatal for the list.
            });
          }}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <StickyNote />
        </Button>
      )}
      {isTrash && (
        <span className="flex shrink-0 gap-1">
          <Button
            aria-label={t("trash.restore")}
            onClick={() => onRestore(note.id)}
            size="icon-xs"
            type="button"
            variant="ghost"
          >
            <ArchiveRestore />
          </Button>
          <Button
            aria-label={t("trash.deleteForever")}
            onClick={() => onDeleteForeverClick(note.id)}
            size="icon-xs"
            type="button"
            variant="destructive"
          >
            <Trash2 />
          </Button>
        </span>
      )}
    </li>
  );
}

export function NoteListView({
  view,
}: {
  view: Exclude<NotesView, "note" | "settings">;
}) {
  const t = useTranslations("Notes");
  const locale = useLocale();
  const listed = useViewNotes(view);
  const notes = useNotesStore((s) => s.notes);
  const selectNote = useNotesStore((s) => s.selectNote);
  const moveToTrash = useNotesStore((s) => s.moveToTrash);
  const restoreFromTrash = useNotesStore((s) => s.restoreFromTrash);
  const deletePermanently = useNotesStore((s) => s.deletePermanently);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Bulk selection (All Notes only). Stored ids are re-checked against the
  // listed notes so entries removed elsewhere never linger in the set.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectionView, setSelectionView] = useState(view);
  if (selectionView !== view) {
    setSelectionView(view);
    setSelected(new Set());
  }
  const selectedNotes =
    view === "all" ? listed.filter((n) => selected.has(n.id)) : [];
  const hasSelection = selectedNotes.length > 0;

  let selectAllState: boolean | "indeterminate" = false;
  if (hasSelection) {
    selectAllState =
      selectedNotes.length === listed.length ? true : "indeterminate";
  }

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected(
      selectedNotes.length === listed.length
        ? new Set()
        : new Set(listed.map((n) => n.id))
    );
  };

  const deleteSelected = () => {
    const idSet = new Set(selectedNotes.map((n) => n.id));
    // Only trash the top-most selected notes: moveToTrash carries
    // descendants along, and restoring a child whose parent is still
    // trashed would re-root it to the top level on undo.
    const roots = [...idSet].filter((id) => {
      let parentId = notes[id]?.parentId ?? null;
      while (parentId) {
        if (idSet.has(parentId)) {
          return false;
        }
        parentId = notes[parentId]?.parentId ?? null;
      }
      return true;
    });
    for (const id of roots) {
      moveToTrash(id);
    }
    setSelected(new Set());
    toast(t("trash.movedToTrashMany", { count: idSet.size }), {
      action: {
        label: t("common.undo"),
        onClick: () => {
          for (const id of roots) {
            restoreFromTrash(id);
          }
        },
      },
    });
  };

  const titles = {
    all: t("sidebar.allNotes"),
    favorites: t("sidebar.favorites"),
    reminders: t("sidebar.reminders"),
    recent: t("sidebar.recent"),
    trash: t("sidebar.trash"),
  } as const;

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));

  const formatReminder = (note: DecryptedNote) => {
    const reminder = note.reminder;
    if (!reminder?.enabled) {
      return "";
    }
    if (reminder.frequency === "daily") {
      return t("reminders.dailyAt", { time: reminder.resetTime });
    }
    const days = reminder.daysOfWeek
      .map((day) =>
        new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
          new Date(2024, 0, day === 0 ? 7 : day)
        )
      )
      .join(", ");
    return t("reminders.weeklyAt", {
      days,
      time: reminder.resetTime,
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-6 md:px-8">
      <h1 className="font-bold text-xl">{titles[view]}</h1>
      {view === "all" && listed.length > 0 && (
        <div className="flex h-9 items-center gap-3 px-2">
          <Checkbox
            aria-label={t("list.selectAll")}
            checked={selectAllState}
            onCheckedChange={toggleSelectAll}
          />
          {hasSelection ? (
            <>
              <span className="text-muted-foreground text-sm">
                {t("list.selectedCount", { count: selectedNotes.length })}
              </span>
              <Button
                onClick={deleteSelected}
                size="sm"
                type="button"
                variant="destructive"
              >
                <Trash2 />
                {t("list.deleteSelected")}
              </Button>
            </>
          ) : (
            <span className="text-muted-foreground text-sm">
              {t("list.selectAll")}
            </span>
          )}
        </div>
      )}
      {listed.length === 0 ? (
        <Empty>
          <EmptyTitle>{t("list.emptyTitle")}</EmptyTitle>
          <EmptyDescription>{t("list.emptyDescription")}</EmptyDescription>
        </Empty>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {listed.map((note) => (
            <NoteListRow
              formatDate={formatDate}
              formatReminder={formatReminder}
              hasSelection={hasSelection}
              isSelected={selected.has(note.id)}
              key={note.id}
              note={note}
              onDeleteForeverClick={setPendingDeleteId}
              onRestore={restoreFromTrash}
              onSelect={selectNote}
              onToggleSelected={toggleSelected}
              view={view}
            />
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
