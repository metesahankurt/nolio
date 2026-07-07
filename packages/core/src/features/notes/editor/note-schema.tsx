"use client";

import type { Block, BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import type { BlockNoteDocument } from "@workspace/core/features/notes/domain/note-types";
import { useNotesStore } from "@workspace/core/stores/notes-store";
import { useTranslations } from "@workspace/i18n";
import {
  CircleAlert,
  CircleCheck,
  CircleX,
  FileText,
  Info,
  Unlink,
} from "lucide-react";

/**
 * Editor schema for encrypted notes. Media blocks (image, video, audio,
 * file) are intentionally excluded: the MVP has no encrypted attachment
 * store, and files must never be written to disk unencrypted.
 */

export const CALLOUT_TYPES = ["info", "warning", "success", "error"] as const;
export type CalloutType = (typeof CALLOUT_TYPES)[number];

const calloutIcons = {
  info: Info,
  warning: CircleAlert,
  success: CircleCheck,
  error: CircleX,
} as const;

// Status is conveyed by both icon shape and text content, never color alone.
const calloutIconClasses = {
  info: "text-primary",
  warning: "text-destructive",
  success: "text-primary",
  error: "text-destructive",
} as const;

const CalloutBlock = createReactBlockSpec(
  {
    type: "callout",
    propSchema: {
      calloutType: { default: "info", values: [...CALLOUT_TYPES] },
    },
    content: "inline",
  },
  {
    render: (props) => {
      const calloutType = props.block.props.calloutType as CalloutType;
      const IconComponent = calloutIcons[calloutType];
      const nextType =
        CALLOUT_TYPES[
          (CALLOUT_TYPES.indexOf(calloutType) + 1) % CALLOUT_TYPES.length
        ] ?? "info";
      return (
        <div
          className="my-1 flex w-full items-start gap-2 rounded-md border border-border bg-muted/50 p-3"
          data-callout-type={calloutType}
        >
          <button
            className="mt-0.5 shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            contentEditable={false}
            onClick={() =>
              props.editor.updateBlock(props.block, {
                props: { calloutType: nextType },
              })
            }
            title={calloutType}
            type="button"
          >
            <IconComponent
              className={`size-4.5 ${calloutIconClasses[calloutType]}`}
            />
          </button>
          <div className="min-w-0 flex-1" ref={props.contentRef} />
        </div>
      );
    },
  }
);

function PageLinkContent({ noteId }: { noteId: string }) {
  const t = useTranslations("Notes");
  const note = useNotesStore((s) => s.notes[noteId]);
  const selectNote = useNotesStore((s) => s.selectNote);
  const isBroken = !note || note.deletedAt !== null;

  if (isBroken) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md border border-border border-dashed px-2 py-1 text-muted-foreground text-sm">
        <Unlink aria-hidden="true" className="size-4" />
        {t("editor.brokenPageLink")}
      </span>
    );
  }
  return (
    <button
      className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-foreground text-sm shadow-xs outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => selectNote(noteId)}
      type="button"
    >
      {note.icon ? (
        <span aria-hidden="true">{note.icon}</span>
      ) : (
        <FileText aria-hidden="true" className="size-4 text-muted-foreground" />
      )}
      <span className="truncate">{note.title || t("untitled")}</span>
    </button>
  );
}

const PageLinkBlock = createReactBlockSpec(
  {
    type: "pageLink",
    propSchema: {
      noteId: { default: "" },
    },
    content: "none",
  },
  {
    render: (props) => (
      <div className="my-0.5" contentEditable={false}>
        <PageLinkContent noteId={props.block.props.noteId} />
      </div>
    ),
  }
);

const {
  audio: _audio,
  file: _file,
  image: _image,
  video: _video,
  ...textBlockSpecs
} = defaultBlockSpecs;

export const noteEditorSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...textBlockSpecs,
    callout: CalloutBlock(),
    pageLink: PageLinkBlock(),
  },
});

export type NoteBlockSchema = typeof noteEditorSchema.blockSchema;
export type NoteInlineSchema = typeof noteEditorSchema.inlineContentSchema;
export type NoteStyleSchema = typeof noteEditorSchema.styleSchema;
export type NoteEditor = BlockNoteEditor<
  NoteBlockSchema,
  NoteInlineSchema,
  NoteStyleSchema
>;
export type NoteBlock = Block<
  NoteBlockSchema,
  NoteInlineSchema,
  NoteStyleSchema
>;
export type NotePartialBlock = PartialBlock<
  NoteBlockSchema,
  NoteInlineSchema,
  NoteStyleSchema
>;

/** Serializes the typed editor document into the persisted JSON shape. */
export function editorDocumentToNoteContent(
  blocks: NoteBlock[]
): BlockNoteDocument {
  return blocks.map((block) => ({
    id: block.id,
    type: block.type,
    props: block.props,
    content: block.content,
    children: editorDocumentToNoteContent(block.children as NoteBlock[]),
  }));
}

/**
 * Loads persisted JSON back into the editor. The payload was validated by
 * zod at decryption time; the assertion bridges the structural JSON type
 * to BlockNote's schema-parameterized type, which cannot be expressed
 * without re-modelling the entire editor schema.
 */
export function noteContentToPartialBlocks(
  content: BlockNoteDocument
): NotePartialBlock[] | undefined {
  if (content.length === 0) {
    return;
  }
  return content as unknown as NotePartialBlock[];
}
