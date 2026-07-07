"use client";

import { NotesRepositoryProvider } from "@workspace/core/providers/notes-repository-provider";
import { createSqliteNotesRepository } from "../lib/notes/sqlite-notes-repository";

interface NativeNotesProviderProps {
  children: React.ReactNode;
}

/** Injects the SQLite (Tauri SQL plugin) repository for desktop/mobile. */
export function NativeNotesProvider({ children }: NativeNotesProviderProps) {
  return (
    <NotesRepositoryProvider createRepository={createSqliteNotesRepository}>
      {children}
    </NotesRepositoryProvider>
  );
}
