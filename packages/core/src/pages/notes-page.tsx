"use client";

import { LanguageSelectScreen } from "@workspace/core/components/notes/language-select-screen";
import { VaultGate } from "@workspace/core/components/notes/vault-gate";
import { useAutoLock } from "@workspace/core/hooks/use-auto-lock";
import { useMounted } from "@workspace/core/hooks/use-mounted";
import { useNotesSettingsStore } from "@workspace/core/stores/notes-settings-store";
import { Toaster } from "@workspace/ui/components/sonner";

export function NotesPage() {
  useAutoLock();
  const mounted = useMounted();
  const languageChosen = useNotesSettingsStore((s) => s.languageChosen);

  return (
    <>
      {mounted && !languageChosen ? <LanguageSelectScreen /> : <VaultGate />}
      <Toaster />
    </>
  );
}
