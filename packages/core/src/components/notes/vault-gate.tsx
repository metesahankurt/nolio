"use client";

import { CreateVaultScreen } from "@workspace/core/components/notes/create-vault-screen";
import { NotesShell } from "@workspace/core/components/notes/notes-shell";
import { UnlockScreen } from "@workspace/core/components/notes/unlock-screen";
import { useVaultStore } from "@workspace/core/stores/vault-store";
import { useTranslations } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";

/**
 * Routes between setup, lock screen and the unlocked shell based on vault
 * status. While anything other than "unlocked" is active, no decrypted
 * content exists anywhere in the tree.
 */
export function VaultGate() {
  const t = useTranslations("Notes");
  const status = useVaultStore((s) => s.status);
  const initialize = useVaultStore((s) => s.initialize);

  switch (status) {
    case "initializing":
      return (
        <div className="flex min-h-full items-center justify-center bg-background p-4">
          <div className="flex w-full max-w-sm flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-3/4" />
          </div>
        </div>
      );
    case "uninitialized":
      return <CreateVaultScreen />;
    case "locked":
    case "unlocking":
      return <UnlockScreen />;
    case "unlocked":
      return <NotesShell />;
    default:
      return (
        <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-background p-4 text-center">
          <p className="font-semibold text-lg">{t("error.storageTitle")}</p>
          <p className="max-w-sm text-muted-foreground text-sm">
            {t("error.storageDescription")}
          </p>
          <Button onClick={() => initialize()} type="button" variant="outline">
            {t("error.retry")}
          </Button>
        </div>
      );
  }
}
