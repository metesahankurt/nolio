"use client";

import { useTranslations } from "@workspace/i18n";
import {
  RichTextEditor,
  type RichTextValue,
} from "@workspace/ui/components/rich-text-editor";
import { useState } from "react";

const demoValue: RichTextValue = [
  {
    children: [{ text: "Plate editor demo" }],
    type: "h1",
  },
  {
    children: [
      { text: "Bold", bold: true },
      { text: ", " },
      { text: "italic", italic: true },
      { text: ", " },
      { text: "underline", underline: true },
      { text: ", " },
      { text: "strike", strikethrough: true },
      { text: ", " },
      { text: "inline code", code: true },
      { text: " and " },
      { text: "highlight", highlight: true },
      { text: " marks render together in one paragraph." },
    ],
    type: "p",
  },
  {
    children: [{ text: "Headings" }],
    type: "h2",
  },
  {
    children: [{ text: "Heading level three sample" }],
    type: "h3",
  },
  {
    children: [
      {
        text: "A quote block keeps long note context visually separate.",
      },
    ],
    type: "blockquote",
  },
  {
    children: [
      {
        children: [
          { text: "Callout blocks are available for important notes." },
        ],
        type: "p",
      },
    ],
    type: "callout",
  },
  {
    checked: false,
    children: [{ text: "Open task item" }],
    indent: 1,
    listStyleType: "todo",
    type: "p",
  },
  {
    checked: true,
    children: [{ text: "Completed task item" }],
    indent: 1,
    listStyleType: "todo",
    type: "p",
  },
  {
    children: [{ text: "Bulleted list item" }],
    indent: 1,
    listStyleType: "disc",
    type: "p",
  },
  {
    children: [{ text: "Another bullet with wrapping text for layout checks" }],
    indent: 1,
    listStyleType: "disc",
    type: "p",
  },
  {
    children: [{ text: "Numbered list item" }],
    indent: 1,
    listStart: 1,
    listStyleType: "decimal",
    type: "p",
  },
  {
    children: [{ text: "Second numbered list item" }],
    indent: 1,
    listStart: 2,
    listStyleType: "decimal",
    type: "p",
  },
  {
    children: [
      { text: "A link to " },
      {
        children: [{ text: "OpenAI" }],
        target: "_blank",
        type: "a",
        url: "https://openai.com",
      },
      { text: " is part of the same document." },
    ],
    type: "p",
  },
  {
    children: [
      {
        children: [{ text: "const enabled = features.every(Boolean);" }],
        type: "code_line",
      },
      {
        children: [{ text: "console.info(enabled);" }],
        type: "code_line",
      },
    ],
    type: "code_block",
  },
  {
    children: [
      {
        children: [
          {
            children: [{ text: "Feature" }],
            type: "th",
          },
          {
            children: [{ text: "Status" }],
            type: "th",
          },
          {
            children: [{ text: "Notes" }],
            type: "th",
          },
        ],
        type: "tr",
      },
      {
        children: [
          {
            children: [{ text: "Tables" }],
            type: "td",
          },
          {
            children: [{ text: "Active" }],
            type: "td",
          },
          {
            children: [{ text: "Header and body cells render." }],
            type: "td",
          },
        ],
        type: "tr",
      },
      {
        children: [
          {
            children: [{ text: "Slash menu" }],
            type: "td",
          },
          {
            children: [{ text: "Active" }],
            type: "td",
          },
          {
            children: [{ text: "Type / in an empty block." }],
            type: "td",
          },
        ],
        type: "tr",
      },
    ],
    type: "table",
  },
  {
    children: [{ text: "" }],
    type: "p",
  },
];

export function NoteEditorDemoPage() {
  const t = useTranslations("NoteEditorDemoPage");
  const [note, setNote] = useState<RichTextValue>(() => demoValue);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-semibold text-xl">{t("title")}</h1>
          <p className="text-muted-foreground text-sm">{t("description")}</p>
        </div>
        <RichTextEditor
          aria-label={t("editorLabel")}
          className="flex-1"
          initialValue={note}
          onChange={setNote}
          placeholder={t("placeholder")}
        />
      </div>
    </div>
  );
}
