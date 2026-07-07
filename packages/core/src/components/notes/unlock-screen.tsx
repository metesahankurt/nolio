"use client";

import { PasswordField } from "@workspace/core/components/notes/password-field";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Loader2, LockKeyhole } from "lucide-react";
import { useState } from "react";

/**
 * Lock screen. While locked, nothing decrypted exists in the app: no note
 * titles, no previews, no sidebar content, no search index. The error
 * message is deliberately generic — internal failure detail never reaches
 * the UI.
 *
 * There is no password recovery for a local vault (by design). The only
 * escape from a forgotten password is wiping the vault and starting over,
 * offered here behind an explicit, clearly-worded confirmation.
 */
export function UnlockScreen() {
  const t = useTranslations("Notes");
  const status = useVaultStore((s) => s.status);
  const vaultName = useVaultStore((s) => s.vaultName);
  const error = useVaultStore((s) => s.error);
  const unlock = useVaultStore((s) => s.unlock);
  const resetVault = useVaultStore((s) => s.resetVault);

  const [password, setPassword] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const unlocking = status === "unlocking";

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (unlocking || password.length === 0) {
      return;
    }
    unlock(password).finally(() => setPassword(""));
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="!flex !flex-col !items-center !justify-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-muted text-foreground">
            <LockKeyhole aria-hidden="true" className="size-6" />
          </div>
          <CardTitle>{vaultName ?? t("unlock.defaultVaultName")}</CardTitle>
          <CardDescription>{t("unlock.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <PasswordField
              autoComplete="current-password"
              autoFocus={true}
              disabled={unlocking}
              error={error ? t("unlock.wrongPassword") : null}
              label={t("unlock.password")}
              onChange={setPassword}
              value={password}
            />
            <Button disabled={unlocking || password.length === 0} type="submit">
              {unlocking && <Loader2 className="animate-spin" />}
              {unlocking ? t("unlock.unlocking") : t("unlock.submit")}
            </Button>
            <Button
              className="text-muted-foreground text-xs"
              onClick={() => setResetOpen(true)}
              size="sm"
              type="button"
              variant="ghost"
            >
              {t("unlock.forgotPassword")}
            </Button>
            <p className="text-center text-muted-foreground text-xs leading-relaxed">
              {t("unlock.localOnlyNotice")}
            </p>
          </form>
        </CardContent>
      </Card>

      <AlertDialog onOpenChange={setResetOpen} open={resetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("reset.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("reset.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetVault().catch(() => {
                  // Even on a storage error the in-memory state is cleared;
                  // the user lands back on setup.
                });
              }}
            >
              {t("reset.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
