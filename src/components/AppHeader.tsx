import { useEffect, useState } from "react";
import type { Profile } from "../types/jupas";
import { useLang } from "../lib/i18n";
import { ProfileChip } from "./ProfileSwitcher";
import "./AppHeader.css";


type Theme = "light" | "dark";

type Props = {
  theme?: Theme;
  onThemeChange?: (theme: Theme) => void;
  // When provided, a Back pill renders at the left of the (sticky) header
  // — used by the Analysis/Share pages so "back to Step 3" stays in reach
  // while scrolling instead of scrolling away.
  onBack?: () => void;
  // When provided (share / analysis pages), an "Edit Profile" pill renders in
  // the actions area — where the profile pill sits on the calculator pages —
  // and returns to grade selection (Step 1) of the current profile.
  onEditProfile?: () => void;
  profiles?: Profile[];
  activeProfileId?: string;
  onProfileSelect?: (id: string) => void;
  onProfileAdd?: (name: string) => void;
  onProfileRename?: (id: string, name: string) => void;
  onProfileDelete?: (id: string) => void;
  onResetAll?: () => void;
};

export function AppHeader({
  theme,
  onThemeChange,
  onBack,
  onEditProfile,
  profiles,
  activeProfileId,
  onProfileSelect,
  onProfileAdd,
  onProfileRename,
  onProfileDelete,
  onResetAll,
}: Props) {
  const canToggleTheme = theme !== undefined && onThemeChange !== undefined;
  const isDark = theme === "dark";
  const { lang, setLang, t } = useLang();

  // Settings popover (collapses Language + Dark mode into one gear button so
  // the top bar stays uncrowded next to the brand + profile pill).
  const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => {
    if (!settingsOpen) return;
    const close = () => setSettingsOpen(false);
    const t = window.setTimeout(() => document.addEventListener("click", close), 0);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("click", close);
    };
  }, [settingsOpen]);
  const showProfileChip =
    profiles &&
    activeProfileId !== undefined &&
    onProfileSelect &&
    onProfileAdd &&
    onProfileRename &&
    onProfileDelete;

  // Language + theme controls — always tucked inside the settings popover so
  // the gear tray (and the bar's chrome) is identical on every page.
  const langButton = (
    <button
      type="button"
      className="topbar-icon lang-toggle"
      aria-label={`${t("lang.switchTo")}: ${lang === "en" ? "中文" : "English"}`}
      title={`${t("lang.switchTo")}: ${lang === "en" ? "中文" : "English"}`}
      onClick={() => setLang(lang === "en" ? "zh" : "en")}
    >
      {/* Shows the language you'll switch TO (the swap arrow reinforces it's a
          toggle), so it reads as an action rather than a static label. */}
      <span className="lang-toggle-current">{lang === "en" ? "中" : "EN"}</span>
      <svg className="lang-toggle-swap" viewBox="0 0 12 12" width="9" height="9" aria-hidden="true">
        <path d="M2 4h7l-1.6-1.6M10 8H3l1.6 1.6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );

  const themeButton = canToggleTheme ? (
    <button
      type="button"
      className="topbar-icon theme-icon"
      aria-label={isDark ? t("theme.toLight") : t("theme.toDark")}
      aria-pressed={isDark}
      title={isDark ? t("theme.light") : t("theme.dark")}
      onClick={() => onThemeChange?.(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 2.6v2.6M12 18.8v2.6M2.6 12h2.6M18.8 12h2.6M5.2 5.2l1.9 1.9M16.9 16.9l1.9 1.9M5.2 18.8l1.9-1.9M16.9 7.1l1.9-1.9" />
          </g>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path fill="currentColor" d="M20.5 14.6A8.4 8.4 0 0 1 9.4 3.5a.7.7 0 0 0-.92-.86A9.8 9.8 0 1 0 21.36 15.5a.7.7 0 0 0-.86-.9Z" />
        </svg>
      )}
    </button>
  ) : null;

  return (
    <header className="app-topbar">
      <div className="app-topbar-left">
        {onBack ? (
          <button type="button" className="topbar-icon topbar-back" onClick={onBack} aria-label={t("common.back")} title={t("common.back")}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
        ) : null}
      </div>

      <nav className="app-topbar-actions" aria-label={t("nav.primaryAria")}>
        {showProfileChip ? (
          <ProfileChip
            profiles={profiles}
            activeProfileId={activeProfileId}
            onSelect={onProfileSelect}
            onAdd={onProfileAdd}
            onRename={onProfileRename}
            onDelete={onProfileDelete}
            onResetAll={onResetAll}
          />
        ) : null}

        {onEditProfile && !showProfileChip ? (
          <button type="button" className="topbar-edit-profile" onClick={onEditProfile}>
            {t("common.editProfile")}
          </button>
        ) : null}

        <div className="topbar-settings">
          <button
            type="button"
            className="topbar-icon settings-icon"
            aria-label={t("common.settings")}
            aria-haspopup="menu"
            aria-expanded={settingsOpen}
            onClick={(event) => { event.stopPropagation(); setSettingsOpen((v) => !v); }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
            </svg>
          </button>
          {settingsOpen ? (
            <div className="settings-popover" role="menu" onClick={(event) => event.stopPropagation()}>
              {langButton}
              {themeButton}
            </div>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
