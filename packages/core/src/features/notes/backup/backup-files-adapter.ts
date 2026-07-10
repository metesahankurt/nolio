import { create } from "zustand";

/**
 * Platform file dialogs for backup export/import.
 *
 * On desktop the native app registers an adapter backed by the Tauri
 * dialog + fs plugins, so the user picks where the backup is saved (and
 * which file to restore) through real OS dialogs. On the web no adapter is
 * registered and the backup UI falls back to the browser download anchor /
 * file input. Core stays free of Tauri imports.
 */

export interface BackupFilesAdapter {
  /**
   * Prompts for a file and returns its text content.
   * Resolves null when the user cancels the dialog.
   */
  openTextFile(): Promise<string | null>;
  /**
   * Prompts for a destination and writes the file there.
   * Resolves false when the user cancels the dialog.
   */
  saveTextFile(suggestedName: string, contents: string): Promise<boolean>;
}

interface BackupFilesAdapterState {
  adapter: BackupFilesAdapter | null;
  setAdapter(adapter: BackupFilesAdapter | null): void;
}

export const useBackupFilesAdapterStore = create<BackupFilesAdapterState>()(
  (set) => ({
    adapter: null,
    setAdapter: (adapter) => set({ adapter }),
  })
);
