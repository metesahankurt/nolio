"use client";

import { NotesPage } from "@workspace/core/pages/notes-page";
import { NativeBackupFiles } from "../../../components/native-backup-files";
import { NativeNotesProvider } from "../../../components/native-notes-provider";
import { StickyNotesBridge } from "../../../components/sticky-notes-bridge";

export default function Notes() {
  return (
    <NativeNotesProvider>
      <StickyNotesBridge />
      <NativeBackupFiles />
      <NotesPage />
    </NativeNotesProvider>
  );
}
