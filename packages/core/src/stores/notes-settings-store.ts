import { getStorageItem } from "@workspace/core/lib/storage-utils";
import type { Locale } from "@workspace/i18n";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Non-sensitive notes preferences. Safe to persist: contains no key
 * material, no note data, nothing derived from the master password.
 */

export type AutoLockMinutes = 5 | 15 | 30 | 60 | null;

export const AUTO_LOCK_OPTIONS: AutoLockMinutes[] = [5, 15, 30, 60, null];

const DEFAULT_AUTO_LOCK: AutoLockMinutes = 15;

interface NotesSettingsState {
  autoLockMinutes: AutoLockMinutes;
  /**
   * Whether the user has explicitly picked an interface language on the
   * first-run language screen. Persisted so the screen only shows once.
   */
  languageChosen: boolean;
  selectedLocale: Locale | null;
  setAutoLockMinutes: (minutes: AutoLockMinutes) => void;
  setLanguageChosen: (chosen: boolean) => void;
  setSelectedLocale: (locale: Locale) => void;
}

const persisted = getStorageItem<Partial<NotesSettingsState>>(
  "notes-settings-storage",
  {}
);

export const useNotesSettingsStore = create<NotesSettingsState>()(
  persist(
    (set) => ({
      autoLockMinutes: persisted.autoLockMinutes ?? DEFAULT_AUTO_LOCK,
      languageChosen: persisted.languageChosen ?? false,
      selectedLocale: persisted.selectedLocale ?? null,
      setAutoLockMinutes: (autoLockMinutes) => set({ autoLockMinutes }),
      setSelectedLocale: (selectedLocale) => set({ selectedLocale }),
      setLanguageChosen: (languageChosen) => set({ languageChosen }),
    }),
    {
      name: "notes-settings-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
