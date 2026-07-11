"use client";

import { useNotesSettingsStore } from "@workspace/core/stores/notes-settings-store";
import { useLocale } from "@workspace/i18n";
import { usePathname, useRouter } from "@workspace/i18n/navigation";
import { routing } from "@workspace/i18n/routing";
import { useEffect } from "react";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

interface CookieStoreLike {
  set(options: {
    expires?: number;
    name: string;
    path?: string;
    sameSite?: "lax" | "strict" | "none";
    value: string;
  }): Promise<void>;
}

function getCookieStore(): CookieStoreLike | null {
  if (typeof globalThis === "undefined" || !("cookieStore" in globalThis)) {
    return null;
  }
  return (globalThis as { cookieStore?: CookieStoreLike }).cookieStore ?? null;
}

export function persistLocalePreference(locale: string) {
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    return;
  }

  useNotesSettingsStore
    .getState()
    .setSelectedLocale(locale as (typeof routing.locales)[number]);

  getCookieStore()
    ?.set({
      expires: Date.now() + ONE_YEAR_SECONDS * 1000,
      name: LOCALE_COOKIE_NAME,
      path: "/",
      sameSite: "lax",
      value: locale,
    })
    .catch(() => {
      // The local persisted setting still keeps native/static routes in sync.
    });
}

export function LocalePreferenceSync() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const selectedLocale = useNotesSettingsStore((s) => s.selectedLocale);

  useEffect(() => {
    if (!selectedLocale || selectedLocale === locale) {
      return;
    }
    if (!routing.locales.includes(selectedLocale)) {
      return;
    }
    router.replace(pathname, { locale: selectedLocale });
  }, [locale, pathname, router, selectedLocale]);

  return null;
}
