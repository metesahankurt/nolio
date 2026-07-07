"use client";

import { BackupSection } from "@workspace/core/components/notes/backup-section";
import { ChangePasswordDialog } from "@workspace/core/components/notes/change-password-dialog";
import { useLanguageSwitcher } from "@workspace/core/hooks/use-language-switcher";
import type { AutoLockMinutes } from "@workspace/core/stores/notes-settings-store";
import {
  AUTO_LOCK_OPTIONS,
  useNotesSettingsStore,
} from "@workspace/core/stores/notes-settings-store";
import { useLocale, useTranslations } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { KeyRound } from "lucide-react";
import { useState } from "react";

const OFF_VALUE = "off";

// The notes app currently ships Turkish and English.
const OFFERED_LOCALES = [
  { code: "tr", nativeName: "Türkçe" },
  { code: "en", nativeName: "English" },
] as const;

interface NotesSettingsDialogProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function NotesSettingsDialog({
  open,
  onOpenChange,
}: NotesSettingsDialogProps) {
  const t = useTranslations("Notes");
  const locale = useLocale();
  const { changeLanguage, isPending } = useLanguageSwitcher();
  const autoLockMinutes = useNotesSettingsStore((s) => s.autoLockMinutes);
  const setAutoLockMinutes = useNotesSettingsStore((s) => s.setAutoLockMinutes);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const optionLabel = (option: AutoLockMinutes) =>
    option === null
      ? t("settings.autoLockOff")
      : t("settings.autoLockMinutes", { minutes: option });

  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("settings.title")}</DialogTitle>
            <DialogDescription>{t("settings.description")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label>{t("settings.language")}</Label>
              <Select
                disabled={isPending}
                onValueChange={(value) => changeLanguage(value)}
                value={locale}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OFFERED_LOCALES.map((option) => (
                    <SelectItem key={option.code} value={option.code}>
                      {option.nativeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("settings.autoLock")}</Label>
              <Select
                onValueChange={(value) =>
                  setAutoLockMinutes(
                    value === OFF_VALUE
                      ? null
                      : (Number(value) as Exclude<AutoLockMinutes, null>)
                  )
                }
                value={
                  autoLockMinutes === null ? OFF_VALUE : String(autoLockMinutes)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUTO_LOCK_OPTIONS.map((option) => (
                    <SelectItem
                      key={option === null ? OFF_VALUE : option}
                      value={option === null ? OFF_VALUE : String(option)}
                    >
                      {optionLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">
                {t("settings.autoLockHint")}
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("changePassword.title")}</Label>
              <Button
                className="justify-start"
                onClick={() => setChangePasswordOpen(true)}
                type="button"
                variant="outline"
              >
                <KeyRound />
                {t("settings.changePasswordAction")}
              </Button>
            </div>
            <BackupSection />
            <p className="rounded-md border border-border bg-muted/50 p-3 text-muted-foreground text-xs leading-relaxed">
              {t("unlock.localOnlyNotice")}
            </p>
          </div>
        </DialogContent>
      </Dialog>
      <ChangePasswordDialog
        onOpenChange={setChangePasswordOpen}
        open={changePasswordOpen}
      />
    </>
  );
}
