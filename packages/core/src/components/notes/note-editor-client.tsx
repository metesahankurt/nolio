"use client";

import type { DecryptedNote } from "@workspace/core/features/notes/domain/note-types";
import {
  noteDocumentToPlateValue,
  plateValueToNoteDocument,
} from "@workspace/core/features/notes/editor/plate-note-content";
import { useNotesStore } from "@workspace/core/stores/notes-store";
import { useTranslations } from "@workspace/i18n";
import {
  RichTextEditor,
  type RichTextValue,
} from "@workspace/ui/components/rich-text-editor";

interface NoteEditorClientProps {
  note: DecryptedNote;
}

export function NoteEditorClient({ note }: NoteEditorClientProps) {
  const t = useTranslations("HomePage");
  const updateNoteContent = useNotesStore((s) => s.updateNoteContent);

  return (
    <RichTextEditor
      aria-label={t("editorLabel")}
      className="min-h-full flex-1 rounded-none border-0 shadow-none"
      initialValue={noteDocumentToPlateValue(note.content) as RichTextValue}
      onChange={(value) => {
        updateNoteContent(
          note.id,
          plateValueToNoteDocument(value as typeof note.content)
        );
      }}
      placeholder={t("placeholder")}
    />
  );
}
