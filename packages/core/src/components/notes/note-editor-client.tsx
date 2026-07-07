"use client";

import "@blocknote/shadcn/style.css";
import "@workspace/ui/blocknote.css";

import type { Dictionary } from "@blocknote/core";
import {
  filterSuggestionItems,
  insertOrUpdateBlockForSlashMenu,
} from "@blocknote/core";
import { de, en, es, fr, it, ja, pt, ru, zh } from "@blocknote/core/locales";
import type { DefaultReactSuggestionItem } from "@blocknote/react";
import { SuggestionMenuController, useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import type { DecryptedNote } from "@workspace/core/features/notes/domain/note-types";
import type { NoteEditor } from "@workspace/core/features/notes/editor/note-schema";
import {
  editorDocumentToNoteContent,
  noteContentToPartialBlocks,
  noteEditorSchema,
} from "@workspace/core/features/notes/editor/note-schema";
import { useTheme } from "@workspace/core/providers/theme-provider";
import { useNotesStore } from "@workspace/core/stores/notes-store";
import { useLocale, useTranslations } from "@workspace/i18n";
import {
  Calendar1,
  CircleAlert,
  Code,
  FilePlus2,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  Pilcrow,
  Table,
  TextQuote,
} from "lucide-react";

/**
 * BlockNote has no Turkish dictionary yet; Turkish users get the English
 * editor chrome while every slash-menu entry below is fully translated
 * through @workspace/i18n (searchable with Turkish AND English aliases).
 */
const blockNoteDictionaries: Record<string, Dictionary | undefined> = {
  de,
  en,
  es,
  fr,
  it,
  ja,
  pt,
  ru,
  zh,
};

function resolveDictionary(locale: string): Dictionary | undefined {
  return blockNoteDictionaries[locale] ?? blockNoteDictionaries.en;
}

type Translate = ReturnType<typeof useTranslations<"Notes">>;

type SlashKey =
  | "text"
  | "heading1"
  | "heading2"
  | "heading3"
  | "bulletList"
  | "numberedList"
  | "checkList"
  | "quote"
  | "code"
  | "table"
  | "divider"
  | "callout"
  | "date"
  | "page";

function buildSlashItems(
  editor: NoteEditor,
  t: Translate,
  locale: string,
  createSubpage: () => Promise<string>
): DefaultReactSuggestionItem[] {
  const group = t("editor.slashGroup");
  const item = (
    key: SlashKey,
    aliases: string[],
    icon: React.JSX.Element,
    onItemClick: () => void
  ): DefaultReactSuggestionItem => ({
    title: t(`editor.slash.${key}`),
    aliases,
    group,
    icon,
    onItemClick,
  });
  type InsertableBlock = Parameters<
    typeof insertOrUpdateBlockForSlashMenu<
      typeof noteEditorSchema.blockSchema,
      typeof noteEditorSchema.inlineContentSchema,
      typeof noteEditorSchema.styleSchema
    >
  >[1];
  const insert = (block: InsertableBlock) => () => {
    insertOrUpdateBlockForSlashMenu(editor, block);
  };

  return [
    item(
      "text",
      ["metin", "paragraf", "text", "paragraph", "p"],
      <Pilcrow />,
      insert({ type: "paragraph" })
    ),
    item(
      "heading1",
      ["başlık", "başlık1", "heading", "h1"],
      <Heading1 />,
      insert({ type: "heading", props: { level: 1 } })
    ),
    item(
      "heading2",
      ["başlık2", "heading2", "h2"],
      <Heading2 />,
      insert({ type: "heading", props: { level: 2 } })
    ),
    item(
      "heading3",
      ["başlık3", "heading3", "h3"],
      <Heading3 />,
      insert({ type: "heading", props: { level: 3 } })
    ),
    item(
      "bulletList",
      ["madde", "liste", "bullet", "list", "ul"],
      <List />,
      insert({ type: "bulletListItem" })
    ),
    item(
      "numberedList",
      ["numaralı", "numbered", "ordered", "ol"],
      <ListOrdered />,
      insert({ type: "numberedListItem" })
    ),
    item(
      "checkList",
      ["yapılacak", "todo", "task", "görev", "check"],
      <ListChecks />,
      insert({ type: "checkListItem" })
    ),
    item(
      "quote",
      ["alıntı", "quote", "blockquote"],
      <TextQuote />,
      insert({ type: "quote" })
    ),
    item(
      "code",
      ["kod", "code", "codeblock"],
      <Code />,
      insert({ type: "codeBlock" })
    ),
    item(
      "table",
      ["tablo", "table"],
      <Table />,
      insert({
        type: "table",
        content: {
          type: "tableContent",
          rows: [{ cells: ["", "", ""] }, { cells: ["", "", ""] }],
        },
      })
    ),
    item(
      "divider",
      ["ayırıcı", "divider", "separator", "hr"],
      <Minus />,
      insert({ type: "divider" })
    ),
    item(
      "callout",
      ["uyarı", "callout", "bilgi", "info", "not"],
      <CircleAlert />,
      insert({ type: "callout" })
    ),
    item("date", ["tarih", "date", "bugün", "today"], <Calendar1 />, () => {
      const formatted = new Intl.DateTimeFormat(locale, {
        dateStyle: "long",
      }).format(new Date());
      editor.insertInlineContent(formatted);
    }),
    item(
      "page",
      ["sayfa", "page", "subpage", "alt sayfa"],
      <FilePlus2 />,
      () => {
        createSubpage()
          .then((noteId) => {
            insertOrUpdateBlockForSlashMenu(editor, {
              type: "pageLink",
              props: { noteId },
            });
          })
          .catch(() => {
            // Creation failure already surfaces through saveStatus.
          });
      }
    ),
  ];
}

interface NoteEditorClientProps {
  note: DecryptedNote;
}

export function NoteEditorClient({ note }: NoteEditorClientProps) {
  const t = useTranslations("Notes");
  const locale = useLocale();
  const { resolvedTheme } = useTheme();
  const updateNoteContent = useNotesStore((s) => s.updateNoteContent);
  const createNote = useNotesStore((s) => s.createNote);

  // The parent keys this component by note.id, so a note switch mounts a
  // fresh editor and stale content can never bleed into another note.
  const editor = useCreateBlockNote(
    {
      schema: noteEditorSchema,
      initialContent: noteContentToPartialBlocks(note.content),
      dictionary: resolveDictionary(locale),
    },
    [note.id]
  );

  return (
    <BlockNoteView
      editor={editor}
      onChange={() => {
        updateNoteContent(
          note.id,
          editorDocumentToNoteContent(editor.document)
        );
      }}
      slashMenu={false}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
    >
      <SuggestionMenuController
        getItems={(query) =>
          Promise.resolve(
            filterSuggestionItems(
              buildSlashItems(editor, t, locale, () =>
                createNote(note.id, { select: false })
              ),
              query
            )
          )
        }
        triggerCharacter="/"
      />
    </BlockNoteView>
  );
}
