"use client";

import { applyTheme, useThemeStore } from "@workspace/core/stores/theme-store";
import { useEffect } from "react";

export function ThemeInitializer() {
  const selectedTheme = useThemeStore((state) => state.selectedTheme);

  useEffect(() => {
    applyTheme(selectedTheme);
  }, [selectedTheme]);

  return null;
}
