"use client";

import { persistLocalePreference } from "@workspace/core/components/common/locale-preference-sync";
import { useLanguageSwitcher } from "@workspace/core/hooks/use-language-switcher";
import { useNotesSettingsStore } from "@workspace/core/stores/notes-settings-store";
import { useLocale, useTranslations } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";
import { Check, Languages } from "lucide-react";

/**
 * First-run language chooser shown before the vault gate. The notes app
 * currently ships Turkish and English; picking one switches the URL locale
 * (next-intl) and records the choice so the screen never reappears. Users
 * can still change it later from notes settings.
 */
const OFFERED_LOCALES = [
  { code: "tr", flag: "🇹🇷", nativeName: "Türkçe" },
  { code: "en", flag: "🇬🇧", nativeName: "English" },
] as const;

export function LanguageSelectScreen() {
  const t = useTranslations("Notes");
  const locale = useLocale();
  const { changeLanguage, isPending } = useLanguageSwitcher();
  const setLanguageChosen = useNotesSettingsStore((s) => s.setLanguageChosen);

  const choose = (code: string) => {
    persistLocalePreference(code);
    if (code !== locale) {
      changeLanguage(code);
    }
    setLanguageChosen(true);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Languages aria-hidden="true" className="size-6" />
          </div>
          <CardTitle>{t("language.title")}</CardTitle>
          <CardDescription>{t("language.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {OFFERED_LOCALES.map((option) => (
            <Button
              className={cn(
                "h-12 justify-start gap-3 text-base",
                option.code === locale && "border-ring"
              )}
              disabled={isPending}
              key={option.code}
              onClick={() => choose(option.code)}
              type="button"
              variant="outline"
            >
              <span aria-hidden="true" className="text-xl">
                {option.flag}
              </span>
              <span className="flex-1 text-left">{option.nativeName}</span>
              {option.code === locale && (
                <Check aria-hidden="true" className="size-4 text-primary" />
              )}
            </Button>
          ))}
          <Button
            className="mt-2"
            disabled={isPending}
            onClick={() => setLanguageChosen(true)}
            type="button"
          >
            {t("language.continue")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
