"use client";

import { NoteTree } from "@workspace/core/components/notes/note-tree";
import { siteConfig } from "@workspace/core/config/site";
import { useMounted } from "@workspace/core/hooks/use-mounted";
import type { NotesView } from "@workspace/core/stores/notes-store";
import { useNotesStore } from "@workspace/core/stores/notes-store";
import { useSidebarStore } from "@workspace/core/stores/sidebar-store";
import { useVaultStore } from "@workspace/core/stores/vault-store";
import { useTranslations } from "@workspace/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Logo } from "@workspace/ui/components/landing/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@workspace/ui/components/sidebar";
import {
  ChevronsUpDown,
  Clock,
  ExternalLink,
  FileStack,
  Github,
  Lock,
  Plus,
  Search,
  Settings,
  Star,
  Tag,
  Trash2,
} from "lucide-react";
import type * as React from "react";

interface NoteSidebarProps extends React.ComponentProps<typeof Sidebar> {
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
  ...props
}: NoteSidebarProps) {
  const t = useTranslations("Notes");
  const vaultName = useVaultStore((s) => s.vaultName);
  const lock = useVaultStore((s) => s.lock);
  const { isMobile, setOpenMobile } = useSidebar();
  const { variant } = useSidebarStore();
  const mounted = useMounted();
  const view = useNotesStore((s) => s.view);
  const setView = useNotesStore((s) => s.setView);
  const createNote = useNotesStore((s) => s.createNote);

  const initials = vaultName ? vaultName.slice(0, 2).toUpperCase() : "ME";

  const handleNavigate = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
    onNavigate?.();
  };

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
    target: Exclude<NotesView, "note" | "settings">,
    icon: React.ReactNode,
    label: string
  ) => (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={view === target}
        onClick={() => {
          setView(target);
          handleNavigate();
        }}
        tooltip={label}
      >
        {icon}
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  if (!mounted) {
    return null;
  }

  return (
    <Sidebar collapsible="icon" variant={variant} {...props}>
      {/* titlebar-mac-pad reserves vertical room for the macOS traffic
          lights (see globals.css); data-tauri-drag-region makes the header a
          native window drag handle. Both are inert on web. */}
      <SidebarHeader
        className="titlebar-mac-pad border-sidebar-border border-b"
        data-tauri-drag-region={true}
      >
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:!p-1.5"
              tooltip="Nolio"
            >
              <Logo className="size-8 group-data-[collapsible=icon]:size-5!" />
              <div className="grid min-w-0 flex-1 text-left">
                <span className="truncate font-semibold text-sm leading-5">
                  Nolio
                </span>
                <span className="truncate text-muted-foreground text-xs leading-4">
                  {vaultName ?? t("unlock.defaultVaultName")}
                </span>
              </div>
            </SidebarMenuButton>
            <SidebarMenuAction
              aria-label={t("sidebar.lockVault")}
              onClick={() => lock()}
              title={t("sidebar.lockVault")}
            >
              <Lock />
            </SidebarMenuAction>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0">
        <SidebarMenu className="px-2 py-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                onOpenSearch();
                handleNavigate();
              }}
              tooltip={t("sidebar.search")}
            >
              <Search aria-hidden="true" />
              <span>{t("sidebar.search")}</span>
              <kbd className="ml-auto rounded border border-sidebar-border px-1 text-[10px] text-muted-foreground group-data-[collapsible=icon]:hidden">
                ⌘K
              </kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                createNote(null).catch(() => {
                  // Surfaced through saveStatus.
                });
                handleNavigate();
              }}
              tooltip={t("sidebar.newNote")}
            >
              <Plus aria-hidden="true" />
              <span>{t("sidebar.newNote")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarMenu aria-label={t("sidebar.viewsLabel")} className="px-2">
          {viewItem(
            "all",
            <FileStack aria-hidden="true" />,
            t("sidebar.allNotes")
          )}
          {viewItem(
            "favorites",
            <Star aria-hidden="true" />,
            t("sidebar.favorites")
          )}
          {viewItem(
            "recent",
            <Clock aria-hidden="true" />,
            t("sidebar.recent")
          )}
          {viewItem("trash", <Trash2 aria-hidden="true" />, t("sidebar.trash"))}
        </SidebarMenu>

        <div className="mt-2 min-h-0 flex-1 overflow-y-auto px-2 group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="px-2 py-1">
            {t("sidebar.pages")}
          </SidebarGroupLabel>
          <NoteTree />
        </div>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex flex-col gap-0.5 px-2 pt-1 pb-1.5 group-data-[collapsible=icon]:hidden">
          <SidebarMenuButton
            className="h-7 text-[11px] text-muted-foreground/75"
            onClick={() => openExternal("https://github.com/metesahankurt")}
          >
            <Github className="size-3.5" />
            <span>@metesahankurt</span>
            <ExternalLink className="ml-auto size-2.5 opacity-50" />
          </SidebarMenuButton>
          <SidebarMenuButton
            className="h-7 text-[11px] text-muted-foreground/75"
            onClick={() => openExternal(siteConfig.links.releases)}
          >
            <Tag className="size-3.5" />
            <span>{t("sidebar.latestUpdates")}</span>
            <ExternalLink className="ml-auto size-2.5 opacity-50" />
          </SidebarMenuButton>
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild={true}>
                <SidebarMenuButton
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  size="lg"
                  tooltip={vaultName || t("unlock.defaultVaultName")}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 font-bold text-sm text-white">
                    {initials}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {vaultName || t("unlock.defaultVaultName")}
                    </span>
                    <span className="truncate font-normal text-muted-foreground text-xs">
                      {t("sidebar.localProfile")}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="right"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 font-bold text-sm text-white">
                      {initials}
                    </div>
                    <div className="grid flex-1 text-left text-sm">
                      <span className="truncate font-medium">
                        {vaultName || t("unlock.defaultVaultName")}
                      </span>
                      <span className="truncate text-muted-foreground text-xs">
                        {t("sidebar.localProfile")}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onSelect={() => {
                      onOpenSettings();
                      handleNavigate();
                    }}
                  >
                    <Settings />
                    {t("sidebar.settings")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => lock()}>
                    <Lock />
                    {t("sidebar.lockVault")}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
