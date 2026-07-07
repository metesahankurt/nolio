"use client";

import { NotesPage } from "@workspace/core/pages/notes-page";
import { NativeNotesProvider } from "../../../components/native-notes-provider";

export default function Notes() {
  return (
    <NativeNotesProvider>
      <NotesPage />
    </NativeNotesProvider>
  );
}
