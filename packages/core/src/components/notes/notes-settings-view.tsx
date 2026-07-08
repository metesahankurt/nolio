"use client";

import { LanguageCard } from "@workspace/core/components/common/language-card";
import { ModeCard } from "@workspace/core/components/common/mode-card";
import { SidebarVariantCard } from "@workspace/core/components/common/sidebar-variant-card";
import { ThemesList } from "@workspace/core/components/common/themes-list";
import { BackupSection } from "@workspace/core/components/notes/backup-section";
import { ChangePasswordDialog } from "@workspace/core/components/notes/change-password-dialog";
import { useAppUpdater } from "@workspace/core/hooks/use-app-updater";
import type { AutoLockMinutes } from "@workspace/core/stores/notes-settings-store";
import {
  AUTO_LOCK_OPTIONS,
  useNotesSettingsStore,
} from "@workspace/core/stores/notes-settings-store";
import { useTranslations } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { ScrollArea, ScrollBar } from "@workspace/ui/components/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { KeyRound, RefreshCw } from "lucide-react";
import { useState } from "react";

const OFF_VALUE = "off";

/**
 * Settings as a full page inside the app shell (not a modal), mirroring the
 * original Catalyzer settings page: the exact same LanguageCard, ModeCard,
 * SidebarVariantCard and ThemesList, followed by the notes app's own extra
 * cards (auto-lock, security, encrypted backup, app update).
 *
 * ModeCard and SidebarVariantCard read the ui sidebar context from the notes
 * shell, so this view can keep the same ScrollArea/content sizing used by the
 * original Catalyzer SettingsPage.
 */
export function NotesSettingsView() {
  const t = useTranslations("Notes");
  const autoLockMinutes = useNotesSettingsStore((s) => s.autoLockMinutes);
  const setAutoLockMinutes = useNotesSettingsStore((s) => s.setAutoLockMinutes);
  const { checkForUpdates } = useAppUpdater();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const optionLabel = (option: AutoLockMinutes) =>
    option === null
      ? t("settings.autoLockOff")
      : t("settings.autoLockMinutes", { minutes: option });

  return (
    <ScrollArea className="h-full w-full">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 pb-28 md:pb-4">
        <h1 className="font-bold text-2xl tracking-tight">
          {t("sidebar.settings")}
        </h1>
        <p className="-mt-2 text-muted-foreground text-sm">
          {t("settings.description")}
        </p>

        {/* Original Catalyzer settings cards, used verbatim. */}
        <LanguageCard />
        <ModeCard />
        <div className="hidden md:block">
          <SidebarVariantCard />
        </div>
        <ThemesList />

        {/* Notes app extras, in the same card style. */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
            <div className="space-y-1.5">
              <CardTitle>{t("settings.autoLockTitle")}</CardTitle>
              <CardDescription>{t("settings.autoLockHint")}</CardDescription>
            </div>
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
              <SelectTrigger className="w-[160px] shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
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
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-4 space-y-0 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <CardTitle>{t("settings.securityTitle")}</CardTitle>
              <CardDescription>
                {t("settings.securityDescription")}
              </CardDescription>
            </div>
            <Button
              className="shrink-0"
              onClick={() => setChangePasswordOpen(true)}
              type="button"
              variant="outline"
            >
              <KeyRound className="size-4" />
              {t("settings.changePasswordAction")}
            </Button>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="space-y-1.5">
            <CardTitle>{t("backup.title")}</CardTitle>
            <CardDescription>{t("settings.backupDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <BackupSection hideLabel={true} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-4 space-y-0 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1.5">
              <CardTitle>{t("settings.appUpdate")}</CardTitle>
              <CardDescription>
                {t("settings.updateDescription")}
              </CardDescription>
            </div>
            <Button
              className="shrink-0"
              onClick={() => checkForUpdates(true)}
              type="button"
              variant="outline"
            >
              <RefreshCw className="size-4" />
              {t("settings.checkUpdates")}
            </Button>
          </CardHeader>
        </Card>

        <p className="rounded-md border border-border bg-muted/50 p-3 text-muted-foreground text-xs leading-relaxed">
          {t("unlock.localOnlyNotice")}
        </p>
      </div>

      <ChangePasswordDialog
        onOpenChange={setChangePasswordOpen}
        open={changePasswordOpen}
      />
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  );
}
