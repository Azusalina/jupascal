import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const THEME_KEY = "jupas-staging-theme";

// Defaults to dark mode while honouring an explicit saved preference.
export function loadTheme(): Theme {
  let saved: string | null = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch { /* use default */ }
  if (saved === "light" || saved === "dark") return saved;
  return "dark";
}

// Self-contained theme state for standalone routes. Applies `data-theme` to
// <html> and persists to the shared localStorage key, so toggling here and
// returning to the calculator (which re-reads the key on mount) stays in sync.
export function useTheme(): [Theme, (next: Theme) => void] {
  const [theme, setTheme] = useState<Theme>(() => loadTheme());
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);
  return [theme, setTheme];
}
