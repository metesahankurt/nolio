"use client";

import { useNotesSettingsStore } from "@workspace/core/stores/notes-settings-store";
import { useVaultStore } from "@workspace/core/stores/vault-store";
import { useEffect } from "react";

/**
 * Locks the vault after a period of inactivity. Activity = keyboard,
 * pointer, touch or scroll (throttled so the store is not written on every
 * mouse move). Visibility changes are handled by the same elapsed-time
 * check: browsers throttle timers in hidden tabs, so the check also runs
 * when the tab becomes visible again — if the app sat hidden past the
 * deadline, it locks immediately before anything is re-rendered.
 */

const ACTIVITY_THROTTLE_MS = 10_000;
const CHECK_INTERVAL_MS = 15_000;

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "keydown",
  "pointerdown",
  "pointermove",
  "touchstart",
  "wheel",
];

export function useAutoLock(): void {
  const autoLockMinutes = useNotesSettingsStore((s) => s.autoLockMinutes);
  const status = useVaultStore((s) => s.status);

  useEffect(() => {
    if (status !== "unlocked" || autoLockMinutes === null) {
      return;
    }
    const timeoutMs = autoLockMinutes * 60_000;
    let lastRegistered = 0;

    const registerActivity = () => {
      const now = Date.now();
      if (now - lastRegistered >= ACTIVITY_THROTTLE_MS) {
        lastRegistered = now;
        useVaultStore.getState().registerActivity();
      }
    };

    const checkDeadline = () => {
      const { lastActivityAt, status: currentStatus } =
        useVaultStore.getState();
      if (
        currentStatus === "unlocked" &&
        lastActivityAt !== null &&
        Date.now() - lastActivityAt >= timeoutMs
      ) {
        useVaultStore.getState().lock();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkDeadline();
      }
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, registerActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    const interval = setInterval(checkDeadline, CHECK_INTERVAL_MS);

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, registerActivity);
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearInterval(interval);
    };
  }, [status, autoLockMinutes]);
}
