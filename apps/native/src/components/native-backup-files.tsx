"use client";

import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { useBackupFilesAdapterStore } from "@workspace/core/features/notes/backup/backup-files-adapter";
import { useEffect } from "react";

/**
 * Registers the desktop implementation of the backup file dialogs: the OS
 * save/open pickers via the Tauri dialog plugin, with the fs plugin doing
 * the actual read/write. Paths chosen through the dialog plugin are
 * automatically allowed in the fs scope, so no broad filesystem permission
 * is needed.
 */

const BACKUP_FILTER = [{ name: "Nolio backup", extensions: ["json"] }];

export function NativeBackupFiles() {
  useEffect(() => {
    if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) {
      return;
    }

    useBackupFilesAdapterStore.getState().setAdapter({
      async saveTextFile(suggestedName, contents) {
        const path = await save({
          defaultPath: suggestedName,
          filters: BACKUP_FILTER,
        });
        if (!path) {
          return false;
        }
        await writeTextFile(path, contents);
        return true;
      },
      async openTextFile() {
        const path = await open({
          multiple: false,
          directory: false,
          filters: BACKUP_FILTER,
        });
        if (typeof path !== "string") {
          return null;
        }
        return await readTextFile(path);
      },
    });

    return () => {
      useBackupFilesAdapterStore.getState().setAdapter(null);
    };
  }, []);

  return null;
}
