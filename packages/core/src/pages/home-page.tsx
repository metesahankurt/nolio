"use client";

import { useTranslations } from "@workspace/i18n";
import {
  RichTextEditor,
  type RichTextValue,
} from "@workspace/ui/components/rich-text-editor";
import { useState } from "react";

export function HomePage() {
  const t = useTranslations("HomePage");
  const [note, setNote] = useState<RichTextValue>(() => [
    {
      children: [{ text: t("noteTitle") }],
      type: "h1",
    },
    {
      children: [{ text: "" }],
      type: "p",
    },
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-3">
        <h1 className="font-semibold text-xl">{t("title")}</h1>
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
