"use client";

import { useNotesStore } from "@workspace/core/stores/notes-store";
import { useTranslations } from "@workspace/i18n";
import { Check, CircleX, Loader2 } from "lucide-react";

/** Save state with icon AND text — color is never the only indicator. */
export function SaveStatus() {
  const t = useTranslations("Notes");
  const saveStatus = useNotesStore((s) => s.saveStatus);

  if (saveStatus === "idle") {
    return null;
  }
  const content = {
    saving: {
      icon: <Loader2 aria-hidden="true" className="size-3 animate-spin" />,
      label: t("save.saving"),
      className: "text-muted-foreground",
    },
    saved: {
      icon: <Check aria-hidden="true" className="size-3" />,
      label: t("save.saved"),
      className: "text-muted-foreground",
    },
    error: {
      icon: <CircleX aria-hidden="true" className="size-3" />,
      label: t("save.error"),
      className: "text-destructive",
    },
  }[saveStatus];

  return (
    <span
      aria-live="polite"
      className={`flex items-center gap-1 text-xs ${content.className}`}
    >
      {content.icon}
      {content.label}
    </span>
  );
}
