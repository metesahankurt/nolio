"use client";

import { searchNotes } from "@workspace/core/features/notes/services/search-service";
import { useTheme } from "@workspace/core/providers/theme-provider";
import type { NotesView } from "@workspace/core/stores/notes-store";
import { useNotesStore } from "@workspace/core/stores/notes-store";
import { useVaultStore } from "@workspace/core/stores/vault-store";
import { useTranslations } from "@workspace/i18n";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@workspace/ui/components/command";
import {
  Clock,
  FilePlus2,
  FileStack,
  FileText,
  Lock,
  Moon,
  Plus,
  Settings,
  Star,
  Sun,
  Trash2,
} from "lucide-react";
import { useState } from "react";

interface NoteCommandMenuProps {
  onOpenChange: (open: boolean) => void;
  onOpenSettings: () => void;
  open: boolean;
}

/**
 * Global command palette for the notes shell (Cmd/Ctrl+K). Search results
 * come from the in-memory index that only exists while unlocked; the query
 * and results are plain component state and vanish on close/lock.
 */
export function NoteCommandMenu({
  open,
  onOpenChange,
  onOpenSettings,
}: NoteCommandMenuProps) {
  const t = useTranslations("Notes");
  const { resolvedTheme, setTheme } = useTheme();
  const lock = useVaultStore((s) => s.lock);
  const createNote = useNotesStore((s) => s.createNote);
  const selectNote = useNotesStore((s) => s.selectNote);
  const setView = useNotesStore((s) => s.setView);
  const selectedNoteId = useNotesStore((s) => s.selectedNoteId);
  const [query, setQuery] = useState("");

  const results = query.trim().length > 0 ? searchNotes(query) : [];

  const runAndClose = (action: () => void) => () => {
    action();
    setQuery("");
    onOpenChange(false);
  };

  const goView = (view: Exclude<NotesView, "note">) =>
    runAndClose(() => setView(view));

  return (
    <CommandDialog
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setQuery("");
        }
        onOpenChange(nextOpen);
      }}
      open={open}
      title={t("command.title")}
    >
      <Command shouldFilter={query.trim().length === 0}>
        <CommandInput
          autoFocus={true}
          onValueChange={setQuery}
          placeholder={t("command.placeholder")}
          value={query}
        />
        <CommandList>
          <CommandEmpty>{t("command.empty")}</CommandEmpty>
          {results.length > 0 && (
            <CommandGroup heading={t("command.results")}>
              {results.map((result) => (
                <CommandItem
                  key={result.noteId}
                  onSelect={runAndClose(() => selectNote(result.noteId))}
                  value={`${result.noteId}`}
                >
                  <FileText />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">
                      {result.title || t("untitled")}
                    </span>
                    {result.snippet && (
                      <span className="truncate text-muted-foreground text-xs">
                        {result.snippet}
                      </span>
                    )}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          <CommandGroup heading={t("command.actions")}>
            <CommandItem
              onSelect={runAndClose(() => {
                createNote(null).catch(() => {
                  // Surfaced through saveStatus.
                });
              })}
            >
              <Plus />
              {t("command.newNote")}
            </CommandItem>
            {selectedNoteId && (
              <CommandItem
                onSelect={runAndClose(() => {
                  createNote(selectedNoteId).catch(() => {
                    // Surfaced through saveStatus.
                  });
                })}
              >
                <FilePlus2 />
                {t("command.newSubpage")}
              </CommandItem>
            )}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading={t("command.navigation")}>
            <CommandItem onSelect={goView("all")}>
              <FileStack />
              {t("sidebar.allNotes")}
            </CommandItem>
            <CommandItem onSelect={goView("favorites")}>
              <Star />
              {t("sidebar.favorites")}
            </CommandItem>
            <CommandItem onSelect={goView("recent")}>
              <Clock />
              {t("sidebar.recent")}
            </CommandItem>
            <CommandItem onSelect={goView("trash")}>
              <Trash2 />
              {t("sidebar.trash")}
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading={t("command.general")}>
            <CommandItem
              onSelect={runAndClose(() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              )}
            >
              {resolvedTheme === "dark" ? <Sun /> : <Moon />}
              {t("command.toggleMode")}
            </CommandItem>
            <CommandItem onSelect={runAndClose(onOpenSettings)}>
              <Settings />
              {t("sidebar.settings")}
            </CommandItem>
            <CommandItem onSelect={runAndClose(() => lock())}>
              <Lock />
              {t("sidebar.lockVault")}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
