"use client";

import { PasswordField } from "@workspace/core/components/notes/password-field";
import { useBackupFilesAdapterStore } from "@workspace/core/features/notes/backup/backup-files-adapter";
import { WrongPasswordError } from "@workspace/core/features/notes/domain/errors";
import {
  backupFileName,
  buildVaultBackup,
  parseVaultBackup,
  type VaultBackup,
} from "@workspace/core/features/notes/services/backup-service";
import { useVaultStore } from "@workspace/core/stores/vault-store";
import { useTranslations } from "@workspace/i18n";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Download, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Encrypted backup export/import for the settings page.
 *
 * On desktop the registered files adapter opens the OS save/open dialogs so
 * the user chooses where the backup lives; on the web it falls back to a
 * blob download and a file input. The exported file is ciphertext only.
 * Importing asks for the backup's master password up front (same password
 * system as the unlock screen), verifies it against the backup's own
 * header, and on success replaces the vault and unlocks it in place.
 */
export function BackupSection({ hideLabel = false }: { hideLabel?: boolean }) {
  const t = useTranslations("Notes");
  const importBackup = useVaultStore((s) => s.importBackup);
  const filesAdapter = useBackupFilesAdapterStore((s) => s.adapter);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingBackup, setPendingBackup] = useState<VaultBackup | null>(null);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onExport = () => {
    setBusy(true);
    buildVaultBackup()
      .then(async (backup) => {
        const json = JSON.stringify(backup, null, 2);
        if (filesAdapter) {
          const saved = await filesAdapter.saveTextFile(backupFileName(), json);
          if (saved) {
            toast.success(t("backup.exportSuccess"));
          }
          return;
        }
        const blob = new Blob([json], { type: "application/json" });
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

  const stageBackup = (raw: string) => {
    setPendingBackup(parseVaultBackup(raw));
    setPassword("");
    setPasswordError(null);
  };

  const onImport = () => {
    if (!filesAdapter) {
      fileInputRef.current?.click();
      return;
    }
    filesAdapter
      .openTextFile()
      .then((raw) => {
        if (raw !== null) {
          stageBackup(raw);
        }
      })
      .catch(() => toast.error(t("backup.importInvalid")));
  };

  const onFileChosen = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    file
      .text()
      .then(stageBackup)
      .catch(() => toast.error(t("backup.importInvalid")));
  };

  const confirmImport = () => {
    if (!pendingBackup) {
      return;
    }
    setBusy(true);
    setPasswordError(null);
    importBackup(pendingBackup, password)
      .then(() => {
        setPendingBackup(null);
        setPassword("");
        toast.success(t("backup.importSuccess"));
      })
      .catch((error) => {
        if (error instanceof WrongPasswordError) {
          setPasswordError(t("unlock.wrongPassword"));
        } else {
          toast.error(t("backup.importError"));
        }
      })
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
          onClick={onImport}
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
            setPassword("");
            setPasswordError(null);
          }
        }}
        open={pendingBackup !== null}
      >
        <AlertDialogContent>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              confirmImport();
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("backup.importConfirmTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("backup.importConfirmDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <PasswordField
              autoFocus={true}
              disabled={busy}
              error={passwordError}
              label={t("backup.passwordLabel")}
              onChange={setPassword}
              value={password}
            />
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy} type="button">
                {t("common.cancel")}
              </AlertDialogCancel>
              <Button
                disabled={busy || password.length === 0}
                type="submit"
                variant="destructive"
              >
                {busy && (
                  <Loader2 aria-hidden="true" className="animate-spin" />
                )}
                {t("backup.import")}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
