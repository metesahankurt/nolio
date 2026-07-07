"use client";

import { NoteTree } from "@workspace/core/components/notes/note-tree";
import { siteConfig } from "@workspace/core/config/site";
import type { NotesView } from "@workspace/core/stores/notes-store";
import { useNotesStore } from "@workspace/core/stores/notes-store";
import { useVaultStore } from "@workspace/core/stores/vault-store";
import { useTranslations } from "@workspace/i18n";
import { Button } from "@workspace/ui/components/button";
import { Logo } from "@workspace/ui/components/landing/logo";
import { cn } from "@workspace/ui/lib/utils";
import {
  Clock,
  ExternalLink,
  FileStack,
  Github,
  Lock,
  Plus,
  Search,
  Star,
  Tag,
  Trash2,
} from "lucide-react";

interface NoteSidebarProps {
  onNavigate?: () => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
}

/**
 * Sidebar content, rendered inline on desktop and inside a Sheet on
 * mobile. Only mounted while the vault is unlocked — while locked no
 * sidebar (and no note titles) exist at all.
 */
export function NoteSidebar({
  onOpenSearch,
  onOpenSettings,
  onNavigate,
}: NoteSidebarProps) {
  const t = useTranslations("Notes");
  const vaultName = useVaultStore((s) => s.vaultName);
  const lock = useVaultStore((s) => s.lock);
  const view = useNotesStore((s) => s.view);
  const setView = useNotesStore((s) => s.setView);
  const createNote = useNotesStore((s) => s.createNote);

  const initials = vaultName ? vaultName.slice(0, 2).toUpperCase() : "ME";

  const openExternal = (url: string) => {
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
      (
        window as unknown as {
          __TAURI_INTERNALS__: {
            invoke: (
              cmd: string,
              args: Record<string, unknown>
            ) => Promise<unknown>;
          };
        }
      ).__TAURI_INTERNALS__.invoke("plugin:opener|open_url", {
        url,
      });
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const viewItem = (
    target: Exclude<NotesView, "note">,
    icon: React.ReactNode,
    label: string
  ) => (
    <button
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring",
        view === target && "bg-sidebar-accent text-sidebar-accent-foreground"
      )}
      onClick={() => {
        setView(target);
        onNavigate?.();
      }}
      type="button"
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* data-tauri-drag-region makes this strip a native window drag handle
          (ignored on web). The mac-titlebar-pad class leaves room for the
          macOS traffic lights under the overlay title bar. */}
      <div
        className="flex items-center gap-2 border-sidebar-border border-b p-3"
        data-tauri-drag-region={true}
      >
        <Logo className="size-8" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm leading-5">Nolio</p>
          <p className="truncate text-muted-foreground text-xs leading-4">
            {vaultName ?? t("unlock.defaultVaultName")}
          </p>
        </div>
        <Button
          aria-label={t("sidebar.lockVault")}
          className="size-8 cursor-pointer rounded-lg"
          onClick={() => lock()}
          size="icon"
          title={t("sidebar.lockVault")}
          variant="ghost"
        >
          <Lock className="size-4 text-muted-foreground hover:text-foreground" />
        </Button>
      </div>

      <div className="flex flex-col gap-0.5 p-2">
        <button
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-muted-foreground text-sm outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onOpenSearch}
          type="button"
        >
          <Search aria-hidden="true" className="size-4" />
          {t("sidebar.search")}
          <kbd className="ml-auto rounded border border-sidebar-border px-1 text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </button>
        <button
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => {
            createNote(null).catch(() => {
              // Surfaced through saveStatus.
            });
            onNavigate?.();
          }}
          type="button"
        >
          <Plus aria-hidden="true" className="size-4" />
          {t("sidebar.newNote")}
        </button>
      </div>

      <nav
        aria-label={t("sidebar.viewsLabel")}
        className="flex flex-col gap-0.5 px-2"
      >
        {viewItem(
          "all",
          <FileStack aria-hidden="true" className="size-4" />,
          t("sidebar.allNotes")
        )}
        {viewItem(
          "favorites",
          <Star aria-hidden="true" className="size-4" />,
          t("sidebar.favorites")
        )}
        {viewItem(
          "recent",
          <Clock aria-hidden="true" className="size-4" />,
          t("sidebar.recent")
        )}
        {viewItem(
          "trash",
          <Trash2 aria-hidden="true" className="size-4" />,
          t("sidebar.trash")
        )}
      </nav>

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto px-2">
        <p className="px-2 py-1 font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
          {t("sidebar.pages")}
        </p>
        <NoteTree />
      </div>

      <div className="flex flex-col gap-0.5 border-sidebar-border border-t p-2">
        <div className="flex flex-col gap-0.5 px-2 pt-1 pb-1.5">
          <button
            className="flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => openExternal("https://github.com/metesahankurt")}
            type="button"
          >
            <Github className="size-3.5 shrink-0" />
            <span className="truncate">@metesahankurt</span>
            <ExternalLink className="ml-auto size-2.5 shrink-0 opacity-50" />
          </button>
          <button
            className="flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => openExternal(siteConfig.links.releases)}
            type="button"
          >
            <Tag className="size-3.5 shrink-0" />
            <span className="truncate">{t("sidebar.latestUpdates")}</span>
            <ExternalLink className="ml-auto size-2.5 shrink-0 opacity-50" />
          </button>
        </div>

        <button
          className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={onOpenSettings}
          type="button"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 font-bold text-sm text-white">
            {initials}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold text-foreground">
              {vaultName || t("unlock.defaultVaultName")}
            </span>
            <span className="truncate font-normal text-muted-foreground text-xs">
              {t("sidebar.localProfile")}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
