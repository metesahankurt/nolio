"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type Theme = "dark" | "light" | "system";
type ResolvedTheme = "dark" | "light";

interface ThemeProviderProps {
  attribute?: "class";
  children: ReactNode;
  defaultTheme?: Theme;
  disableTransitionOnChange?: boolean;
  enableColorScheme?: boolean;
  enableSystem?: boolean;
  storageKey?: string;
}

interface ThemeContextValue {
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyMode(theme: ResolvedTheme, enableColorScheme: boolean) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);

  if (enableColorScheme) {
    root.style.colorScheme = theme;
  }
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  enableColorScheme = true,
  enableSystem = true,
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");

  useEffect(() => {
    const storedTheme = localStorage.getItem(storageKey) as Theme | null;
    if (
      storedTheme === "light" ||
      storedTheme === "dark" ||
      (enableSystem && storedTheme === "system")
    ) {
      setThemeState(storedTheme);
    }
  }, [enableSystem, storageKey]);

  useEffect(() => {
    const update = () => {
      const nextTheme = resolveTheme(theme);
      setResolvedTheme(nextTheme);
      applyMode(nextTheme, enableColorScheme);
    };

    update();

    if (theme !== "system" || !enableSystem) {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [enableColorScheme, enableSystem, theme]);

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      setThemeState(nextTheme);
      localStorage.setItem(storageKey, nextTheme);
    },
    [storageKey]
  );

  const value = useMemo(
    () => ({ resolvedTheme, setTheme, theme }),
    [resolvedTheme, setTheme, theme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return (
    useContext(ThemeContext) ?? {
      resolvedTheme: "light" as const,
      setTheme: () => undefined,
      theme: "system" as const,
    }
  );
}
