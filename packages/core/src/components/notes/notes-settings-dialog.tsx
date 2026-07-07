"use client";

import { ThemesList } from "@workspace/core/components/common/themes-list";
import { BackupSection } from "@workspace/core/components/notes/backup-section";
import { ChangePasswordDialog } from "@workspace/core/components/notes/change-password-dialog";
import { useLanguageSwitcher } from "@workspace/core/hooks/use-language-switcher";
import { useThemeTransition } from "@workspace/core/hooks/use-theme-transition";
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
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { KeyRound, Laptop, Moon, Sun } from "lucide-react";
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
  const { theme: activeMode, handleThemeChange } = useThemeTransition();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  const optionLabel = (option: AutoLockMinutes) =>
    option === null
      ? t("settings.autoLockOff")
      : t("settings.autoLockMinutes", { minutes: option });

  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent className="flex h-[80vh] flex-col p-6 sm:max-w-3xl">
          <DialogHeader className="shrink-0">
            <DialogTitle>{t("settings.title")}</DialogTitle>
            <DialogDescription>{t("settings.description")}</DialogDescription>
          </DialogHeader>

          <Tabs
            className="mt-4 flex min-h-0 flex-1 flex-col"
            defaultValue="general"
          >
            <TabsList className="grid w-full shrink-0 grid-cols-2">
              <TabsTrigger className="cursor-pointer" value="general">
                {locale === "tr" ? "Genel" : "General"}
              </TabsTrigger>
              <TabsTrigger className="cursor-pointer" value="appearance">
                {locale === "tr" ? "Görünüm" : "Appearance"}
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="mt-4 min-h-0 flex-1 pr-3">
              <TabsContent className="flex flex-col gap-5 p-1" value="general">
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
                      autoLockMinutes === null
                        ? OFF_VALUE
                        : String(autoLockMinutes)
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
                    className="cursor-pointer justify-start"
                    onClick={() => setChangePasswordOpen(true)}
                    type="button"
                    variant="outline"
                  >
                    <KeyRound className="size-4" />
                    {t("settings.changePasswordAction")}
                  </Button>
                </div>

                <BackupSection />

                <p className="rounded-md border border-border bg-muted/50 p-3 text-muted-foreground text-xs leading-relaxed">
                  {t("unlock.localOnlyNotice")}
                </p>
              </TabsContent>

              <TabsContent
                className="flex flex-col gap-5 p-1"
                value="appearance"
              >
                <div className="flex flex-col gap-1.5">
                  <Label>{locale === "tr" ? "Tema Modu" : "Theme Mode"}</Label>
                  <Select
                    onValueChange={(val) =>
                      handleThemeChange(val as "light" | "dark" | "system")
                    }
                    value={activeMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="size-4" />
                          <span>
                            {locale === "tr" ? "Açık Tema" : "Light Mode"}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="size-4" />
                          <span>
                            {locale === "tr" ? "Koyu Tema" : "Dark Mode"}
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Laptop className="size-4" />
                          <span>
                            {locale === "tr"
                              ? "Sistem Varsayılanı"
                              : "System Default"}
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <ThemesList />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>
      <ChangePasswordDialog
        onOpenChange={setChangePasswordOpen}
        open={changePasswordOpen}
      />
    </>
  );
}
