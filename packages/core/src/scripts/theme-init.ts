export const themeInitScript = `
  (function() {
    try {
      var root = document.documentElement;

      // 1) Light/dark mode — applied before paint to avoid a flash. Mirrors
      //    providers/theme-provider.tsx (localStorage key "theme").
      var mode = localStorage.getItem("theme") || "system";
      var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      var isDark = mode === "dark" || (mode === "system" && prefersDark);
      root.classList.remove("light", "dark");
      root.classList.add(isDark ? "dark" : "light");
      root.style.colorScheme = isDark ? "dark" : "light";

      // 2) Color theme (data-theme) — persisted by the theme store.
      var raw = localStorage.getItem("theme-storage");
      if (raw) {
        var parsed = JSON.parse(raw);
        var theme = (parsed && parsed.state && parsed.state.selectedTheme) || "default";
        if (theme !== "default") {
          root.setAttribute("data-theme", theme);
        }
      }
    } catch (error) {
      console.error("[Theme Init]", error);
    }
  })();
`;
