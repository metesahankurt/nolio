import { useUpdateStore } from "@workspace/core/stores/update-store";
import { useTranslations } from "@workspace/i18n";
import { useCallback } from "react";
import { toast } from "sonner";

/**
 * Checks the Tauri updater endpoint and, when a release is found, offers it
 * through the update store so the in-app UpdateDialog (design-system
 * styled) takes over — no native OS prompt. The install closure downloads
 * with progress reporting, then relaunches the app.
 */

async function runUpdateCheck(
  manual: boolean,
  t: (key: string) => string
): Promise<void> {
  const { check } = await import("@tauri-apps/plugin-updater");

  if (manual) {
    toast.info(t("checking"));
  }

  const update = await check();
  if (!update) {
    if (manual) {
      toast.success(t("upToDate"));
    }
    return;
  }

  useUpdateStore.getState().offerUpdate(
    {
      version: update.version,
      body: update.body ?? undefined,
      date: update.date ?? undefined,
    },
    async () => {
      const store = useUpdateStore.getState();
      store.setPhase("downloading");
      store.setProgress(null);
      let contentLength: number | null = null;
      let downloaded = 0;
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          contentLength = event.data.contentLength ?? null;
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          useUpdateStore
            .getState()
            .setProgress(
              contentLength ? Math.min(downloaded / contentLength, 1) : null
            );
        } else {
          useUpdateStore.getState().setPhase("installing");
        }
      });
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    }
  );
}

export function useAppUpdater() {
  const t = useTranslations("Updater");

  const checkForUpdates = useCallback(
    async (manual = false) => {
      try {
        const { isTauri } = await import("@tauri-apps/api/core");
        if (!isTauri()) {
          if (manual) {
            toast.info(t("webUnsupported"));
          }
          return;
        }
        await runUpdateCheck(manual, t);
      } catch {
        if (manual) {
          toast.error(t("checkFailed"));
        }
      }
    },
    [t]
  );

  return { checkForUpdates };
}
