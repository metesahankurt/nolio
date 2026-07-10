"use client";

import { useUpdateStore } from "@workspace/core/stores/update-store";
import { useTranslations } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { cn } from "@workspace/ui/lib/utils";
import { ArrowDownToLine, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

/**
 * In-app "update available" dialog, styled with the app's design system
 * instead of the native OS message box. Shows the new version, its release
 * notes and a download progress bar; the dialog cannot be dismissed while
 * the update is downloading or installing (the app relaunches right after).
 */
export function UpdateDialog() {
  const t = useTranslations("Updater");
  const available = useUpdateStore((s) => s.available);
  const install = useUpdateStore((s) => s.install);
  const phase = useUpdateStore((s) => s.phase);
  const progress = useUpdateStore((s) => s.progress);
  const setPhase = useUpdateStore((s) => s.setPhase);
  const dismiss = useUpdateStore((s) => s.dismiss);
  const [failed, setFailed] = useState(false);

  const busy = phase === "downloading" || phase === "installing";

  const onInstall = () => {
    setFailed(false);
    install?.().catch(() => {
      setFailed(true);
      setPhase("available");
    });
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!(open || busy)) {
          setFailed(false);
          dismiss();
        }
      }}
      open={phase !== "idle" && available !== null}
    >
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={(event) => busy && event.preventDefault()}
        onInteractOutside={(event) => busy && event.preventDefault()}
        showCloseButton={!busy}
      >
        <DialogHeader>
          <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles aria-hidden="true" className="size-5" />
          </div>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { version: available?.version ?? "" })}
          </DialogDescription>
        </DialogHeader>

        {available?.body && (
          <div className="flex flex-col gap-1.5">
            <p className="font-medium text-sm">{t("releaseNotes")}</p>
            <div className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 text-muted-foreground text-sm">
              {available.body}
            </div>
          </div>
        )}

        {busy && (
          <div className="flex flex-col gap-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full bg-primary transition-[width] duration-200",
                  (phase === "installing" || progress === null) &&
                    "animate-pulse"
                )}
                style={{
                  width:
                    phase === "installing" || progress === null
                      ? "100%"
                      : `${Math.round(progress * 100)}%`,
                }}
              />
            </div>
            <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Loader2 aria-hidden="true" className="size-3 animate-spin" />
              {phase === "installing" ? t("installing") : t("downloading")}
              {phase === "downloading" && progress !== null && (
                <span className="ml-auto tabular-nums">
                  {Math.round(progress * 100)}%
                </span>
              )}
            </p>
          </div>
        )}

        {failed && (
          <p className="text-destructive text-sm" role="alert">
            {t("installFailed")}
          </p>
        )}

        <DialogFooter>
          <Button
            disabled={busy}
            onClick={() => {
              setFailed(false);
              dismiss();
            }}
            type="button"
            variant="outline"
          >
            {t("later")}
          </Button>
          <Button disabled={busy} onClick={onInstall} type="button">
            <ArrowDownToLine />
            {t("updateNow")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
