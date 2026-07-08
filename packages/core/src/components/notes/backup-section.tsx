"use client";

import {
  backupFileName,
  buildVaultBackup,
  parseVaultBackup,
  restoreVaultBackup,
  type VaultBackup,
} from "@workspace/core/features/notes/services/backup-service";
import { useVaultStore } from "@workspace/core/stores/vault-store";
import { useTranslations } from "@workspace/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Encrypted backup export/import for the settings dialog. Uses only the
 * browser File APIs (Blob download + file input), so it works on web and in
 * the Tauri WebView without any filesystem permissions. The exported file
 * is ciphertext only; importing replaces the current vault and requires the
 * backup's master password to unlock.
 */
export function BackupSection({ hideLabel = false }: { hideLabel?: boolean }) {
  const t = useTranslations("Notes");
  const lock = useVaultStore((s) => s.lock);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingBackup, setPendingBackup] = useState<VaultBackup | null>(null);
  const [busy, setBusy] = useState(false);

  const onExport = () => {
    setBusy(true);
    buildVaultBackup()
      .then((backup) => {
        const blob = new Blob([JSON.stringify(backup, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = backupFileName();
        anchor.click();
        URL.revokeObjectURL(url);
        toast.success(t("backup.exportSuccess"));
      })
      .catch(() => toast.error(t("backup.exportError")))
      .finally(() => setBusy(false));
  };

  const onFileChosen = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    file
      .text()
      .then((raw) => {
        setPendingBackup(parseVaultBackup(raw));
      })
      .catch(() => toast.error(t("backup.importInvalid")));
  };

  const confirmImport = () => {
    if (!pendingBackup) {
      return;
    }
    setBusy(true);
    restoreVaultBackup(pendingBackup)
      .then(() => {
        setPendingBackup(null);
        // Drop any decrypted state and re-read the restored header, so the
        // user must unlock with the backup's master password.
        lock();
        toast.success(t("backup.importSuccess"));
        setTimeout(() => window.location.reload(), 400);
      })
      .catch(() => toast.error(t("backup.importError")))
      .finally(() => setBusy(false));
  };

  return (
    <div className="flex flex-col gap-1.5">
      {!hideLabel && <Label>{t("backup.title")}</Label>}
      <div className="flex gap-2">
        <Button
          className="flex-1 justify-start"
          disabled={busy}
          onClick={onExport}
          type="button"
          variant="outline"
        >
          <Download />
          {t("backup.export")}
        </Button>
        <Button
          className="flex-1 justify-start"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
          type="button"
          variant="outline"
        >
          <Upload />
          {t("backup.import")}
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">{t("backup.hint")}</p>
      <input
        accept="application/json,.json"
        className="hidden"
        onChange={onFileChosen}
        ref={fileInputRef}
        tabIndex={-1}
        type="file"
      />

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setPendingBackup(null);
          }
        }}
        open={pendingBackup !== null}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("backup.importConfirmTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("backup.importConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={confirmImport}>
              {t("backup.import")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
