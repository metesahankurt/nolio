import { useLocale } from "@workspace/i18n";
import { toast } from "sonner";

interface UpdateInfo {
  downloadAndInstall: () => Promise<void>;
  version: string;
}

async function performDownloadAndInstall(update: UpdateInfo, locale: string) {
  const { relaunch } = await import("@tauri-apps/plugin-process");

  toast.info(
    locale === "tr"
      ? "Güncelleme indiriliyor ve kuruluyor. Lütfen bekleyin..."
      : "Downloading and installing update. Please wait..."
  );

  await update.downloadAndInstall();
  await relaunch();
}

async function promptAndInstall(update: UpdateInfo, locale: string) {
  const { ask } = await import("@tauri-apps/plugin-dialog");

  const yes = await ask(
    locale === "tr"
      ? `Yeni bir sürüm (${update.version}) mevcut. Şimdi indirip yüklemek ister misiniz?`
      : `A new version (${update.version}) is available. Do you want to download and install it now?`,
    {
      title: locale === "tr" ? "Güncelleme Mevcut" : "Update Available",
      kind: "info",
      okLabel: locale === "tr" ? "Evet" : "Yes",
      cancelLabel: locale === "tr" ? "Hayır" : "No",
    }
  );

  if (yes) {
    await performDownloadAndInstall(update, locale);
  }
}

function handleWebManualCheck(manual: boolean, locale: string) {
  if (manual) {
    toast.info(
      locale === "tr"
        ? "Web sürümünde güncelleme kontrolü desteklenmemektedir."
        : "Update check is not supported in the web version."
    );
  }
}

async function runUpdateCheck(manual: boolean, locale: string) {
  const { check } = await import("@tauri-apps/plugin-updater");

  if (manual) {
    toast.info(
      locale === "tr"
        ? "Güncellemeler denetleniyor..."
        : "Checking for updates..."
    );
  }

  const update = await check();
  if (update) {
    await promptAndInstall(update, locale);
  } else if (manual) {
    toast.success(
      locale === "tr"
        ? "Uygulamanız güncel. Son sürümü kullanıyorsunuz."
        : "Your app is up to date. You are using the latest version."
    );
  }
}

export function useAppUpdater() {
  const locale = useLocale();

  const checkForUpdates = async (manual = false) => {
    try {
      const { isTauri } = await import("@tauri-apps/api/core");
      if (!isTauri()) {
        await handleWebManualCheck(manual, locale);
        return;
      }
      await runUpdateCheck(manual, locale);
    } catch (err) {
      console.error("Failed to check for updates:", err);
      if (manual) {
        toast.error(
          locale === "tr"
            ? "Güncelleme kontrolü başarısız oldu."
            : "Update check failed."
        );
      }
    }
  };

  return { checkForUpdates };
}
