"use client";

import { NotesRepositoryProvider } from "@workspace/core/providers/notes-repository-provider";
import { createIndexedDbNotesRepository } from "../lib/notes/indexeddb-notes-repository";

interface WebNotesProviderProps {
  children: React.ReactNode;
}

/** Injects the IndexedDB repository for the web/PWA build. */
export function WebNotesProvider({ children }: WebNotesProviderProps) {
  return (
    <NotesRepositoryProvider createRepository={createIndexedDbNotesRepository}>
      {children}
    </NotesRepositoryProvider>
  );
}
