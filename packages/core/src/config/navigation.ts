import { siteConfig } from "@workspace/core/config/site";
import {
  Github,
  LogOut,
  type LucideIcon,
  NotebookPen,
  Search,
  Send,
  Settings,
  User,
} from "lucide-react";

export interface UserNavItem {
  avatar: string;
  email: string;
  name: string;
}

export interface SubNavItem {
  title: string;
  translationKey: string;
  url: string;
}

export interface MainNavItem {
  href?: string;
  icon: LucideIcon;
  isActive?: boolean;
  items?: SubNavItem[];
  title: string;
  translationKey: string;
  url: string;
}

export interface MobileNavItem {
  href?: string;
  icon: LucideIcon;
  title: string;
  translationKey: string;
  url: string;
}

export interface SecondaryNavItem {
  external?: boolean;
  icon: LucideIcon;
  title: string;
  translationKey: string;
  url: string;
}

export interface ProfileNavItem {
  icon: LucideIcon;
  title: string;
  translationKey: string;
  url: string;
}

export interface ProfileNavGroup {
  id: string;
  items: ProfileNavItem[];
}

export interface NavigationData {
  navMain: MainNavItem[];
  navMobile: MobileNavItem[];
  navProfile: ProfileNavGroup[];
  navSecondary: SecondaryNavItem[];
  user: UserNavItem;
}

export const navigationData: NavigationData = {
  user: {
    name: siteConfig.owner,
    email: "user@example.com",
    avatar: "/avatar.svg",
  },
  navMain: [
    {
      title: "Notes",
      url: "/notes",
      icon: NotebookPen,
      isActive: true,
      items: [],
      translationKey: "notes",
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
      isActive: false,
      items: [],
      translationKey: "settings",
    },
  ],
  navMobile: [
    {
      title: "Notes",
      url: "/notes",
      icon: NotebookPen,
      translationKey: "notes",
    },
    {
      title: "Search",
      url: "#search",
      icon: Search,
      translationKey: "search",
    },
    {
      title: "Profile",
      url: "#profile",
      icon: User,
      translationKey: "profile",
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
      translationKey: "settings",
    },
  ],
  navSecondary: [
    {
      title: "Feedback",
      url: siteConfig.links.issues,
      icon: Send,
      translationKey: "feedback",
      external: true,
    },
    {
      title: "Github",
      url: siteConfig.links.github,
      icon: Github,
      translationKey: "github",
      external: true,
    },
  ],
  navProfile: [
    {
      id: "group-1",
      items: [
        {
          title: "Settings",
          url: "/settings",
          icon: Settings,
          translationKey: "settings",
        },
      ],
    },
    {
      id: "group-2",
      items: [
        {
          title: "Log Out",
          url: "#logout",
          icon: LogOut,
          translationKey: "logOut",
        },
      ],
    },
  ],
};
