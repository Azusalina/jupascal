import { useRef, useState } from "react";
import { useLang } from "../lib/i18n";
import "./MobileWelcome.css";


type Theme = "light" | "dark";

type Props = {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  // Dismiss the landing and drop the user into the calculator (Step 1).
  onStart: () => void;
  // When true, the landing plays its fade/slide-out. The parent unmounts
  // it after the transition. Rendered as an overlay over the live app so
  // the hand-off is a cross-fade (brand stays put) rather than a hard cut.
  exiting?: boolean;
};

// First-run mobile landing. A full-screen overlay shown only to genuine
// first-time visitors (see shouldShowWelcome in App.tsx). Leads with a
// swipeable showcase of the product (in the app's own visual language) so the
// value is shown, not just described, then dissolves to reveal the app.
export function MobileWelcome({ theme, onThemeChange, onStart, exiting = false }: Props) {
  const { t, lang, setLang } = useLang();
  const isDark = theme === "dark";
  const trackRef = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState(0);

  function slideStep() {
    const el = trackRef.current;
    if (!el || el.children.length < 2) return el?.clientWidth ?? 1;
    return (el.children[1] as HTMLElement).offsetLeft - (el.children[0] as HTMLElement).offsetLeft || 1;
  }
  function onTrackScroll() {
    const el = trackRef.current;
    if (el) setSlide(Math.round(el.scrollLeft / slideStep()));
  }
  function goToSlide(i: number) {
    trackRef.current?.scrollTo({ left: i * slideStep(), behavior: "smooth" });
  }

  return (
    <main className={`mobile-welcome${lang === "en" ? " is-en" : ""}${exiting ? " is-exiting" : ""}`}>
      <header className="welcome-topbar">
        <div className="welcome-topbar-controls">
          <button
            type="button"
            className="topbar-icon lang-toggle"
            aria-label={`${t("lang.switchTo")}: ${lang === "en" ? "中文" : "English"}`}
            title={`${t("lang.switchTo")}: ${lang === "en" ? "中文" : "English"}`}
            onClick={() => setLang(lang === "en" ? "zh" : "en")}
          >
            <span className="lang-toggle-current">{lang === "en" ? "中" : "EN"}</span>
            <svg className="lang-toggle-swap" viewBox="0 0 12 12" width="9" height="9" aria-hidden="true">
              <path d="M2 4h7l-1.6-1.6M10 8H3l1.6 1.6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="topbar-icon theme-icon"
            aria-label={isDark ? t("theme.toLight") : t("theme.toDark")}
            aria-pressed={isDark}
            onClick={() => onThemeChange(isDark ? "light" : "dark")}
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
                <path
                  fill="currentColor"
                  d="M20.5 14.6A8.4 8.4 0 0 1 9.4 3.5a.7.7 0 0 0-.92-.86A9.8 9.8 0 1 0 21.36 15.5a.7.7 0 0 0-.86-.9Z"
                />
              </svg>
            )}
          </button>
        </div>
      </header>

      <div className="welcome-body">
        <div className="welcome-hero">
          <p className="eyebrow">{t("welcome.eyebrow")}</p>
          <h1 className="welcome-headline">
            {lang === "zh" ? (
              <>
                <span>一次過比較各大院校</span>
                <br />
                <span className="welcome-accent">所有課程收生分數</span>
              </>
            ) : (
              <>
                {t("welcome.headline.pre")}
                <span className="welcome-accent">{t("welcome.headline.accent")}</span>
                {t("welcome.headline.post")}
              </>
            )}
          </h1>
          <p className="welcome-sub">{t("welcome.sub")}</p>
        </div>

        {/* Swipeable showcase — in-theme mockups of the product. Decorative, so
            hidden from assistive tech. */}
        <div className="welcome-showcase">
          <div className="welcome-track" ref={trackRef} onScroll={onTrackScroll} aria-hidden="true">
            {/* 1 — per-slot risk read */}
            <div className="welcome-slide">
              <div className="welcome-peek">
                <div className="welcome-peek-head">
                  <span className="welcome-peek-label">{t("welcome.slide1.label")}</span>
                  <span className="welcome-peek-note">{t("welcome.slide1.note")}</span>
                </div>
                <ul className="welcome-peek-list">
                  <li><span className="welcome-peek-slot">A1</span><span className="welcome-peek-prog">{t("welcome.slide1.prog1")}</span><span className="welcome-peek-tag good">{t("risk.safe")}</span></li>
                  <li><span className="welcome-peek-slot">A2</span><span className="welcome-peek-prog">{t("welcome.slide1.prog2")}</span><span className="welcome-peek-tag warn">{t("risk.risky")}</span></li>
                  <li><span className="welcome-peek-slot">A3</span><span className="welcome-peek-prog">{t("welcome.slide1.prog3")}</span><span className="welcome-peek-tag alert">{t("risk.highRisk")}</span></li>
                </ul>
              </div>
              <p className="welcome-slide-cap">{t("welcome.slide1.cap")}</p>
            </div>

            {/* 2 — score vs past bands */}
            <div className="welcome-slide">
              <div className="welcome-peek">
                <div className="welcome-peek-head">
                  <span className="welcome-peek-label">JS6705 · HKU · {t("welcome.slide2.programme")}</span>
                  <span className="welcome-peek-note">{t("welcome.slide2.note")}</span>
                </div>
                <div className="welcome-gauge">
                  <div className="welcome-gauge-track">
                    <span className="welcome-gauge-fill" style={{ width: "62%" }} />
                    <span className="welcome-gauge-dot" style={{ left: "62%" }} />
                  </div>
                  <div className="welcome-gauge-ticks"><span>{t("common.lq")}</span><span>{t("common.medAbbr")}</span><span>{t("common.uq")}</span></div>
                </div>
                <div className="welcome-gauge-score"><strong>35.0</strong> {t("welcome.slide2.score")}</div>
              </div>
              <p className="welcome-slide-cap">{t("welcome.slide2.cap")}</p>
            </div>

            {/* 3 — coverage */}
            <div className="welcome-slide">
              <div className="welcome-peek">
                <div className="welcome-peek-head">
                  <span className="welcome-peek-label">{t("welcome.slide3.label")}</span>
                  <span className="welcome-peek-note">{t("welcome.slide3.note")}</span>
                </div>
                <div className="welcome-chips">
                  {["HKU", "HKUST"].map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </div>
                <div className="welcome-bigstat">{t("welcome.slide3.statPrefix")}<strong>{__PROGRAMME_COUNT__}</strong>{t("welcome.slide3.statSuffix")}</div>
              </div>
              <p className="welcome-slide-cap">{t("welcome.slide3.cap")}</p>
            </div>
          </div>

          <div className="welcome-dots">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                type="button"
                className={i === slide ? "is-active" : ""}
                aria-label={t("welcome.gotoSlide", { n: i + 1 })}
                onClick={() => goToSlide(i)}
              />
            ))}
          </div>
        </div>

        <div className="welcome-actions">
          <button type="button" className="stepper-next-btn welcome-cta" onClick={onStart}>
            {t("welcome.getStarted")}
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M1 7H17M11 1L17 7L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <p className="welcome-footnote">{t("welcome.footnote.pre")}</p>
        </div>
      </div>
    </main>
  );
}
