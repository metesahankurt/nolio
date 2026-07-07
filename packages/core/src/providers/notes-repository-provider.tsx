"use client";

import type { NotesRepository } from "@workspace/core/features/notes/repositories/notes-repository";
import { setNotesRepository } from "@workspace/core/features/notes/repositories/notes-repository";
import { useVaultStore } from "@workspace/core/stores/vault-store";
import { useEffect, useRef } from "react";

interface NotesRepositoryProviderProps {
  children: React.ReactNode;
  /**
   * Platform factory (IndexedDB on web, SQLite on native). Called once;
   * a rejection puts the vault store into its error state so the UI can
   * show a storage failure instead of hanging on "initializing".
   */
  createRepository: () => Promise<NotesRepository>;
}

export function NotesRepositoryProvider({
  createRepository,
  children,
}: NotesRepositoryProviderProps) {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;
    createRepository()
      .then((repository) => {
        setNotesRepository(repository);
        return useVaultStore.getState().initialize();
      })
      .catch(() => {
        useVaultStore.setState({ status: "error", error: "storage" });
      });
  }, [createRepository]);

  return <>{children}</>;
}
