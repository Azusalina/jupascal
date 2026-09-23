// Non-academic admission requirements ("duties beyond your grades") — the typed,
// salience-tiered model behind the analysis reminders. NOT a score-risk signal:
// because our data is incomplete and we can't be certain a programme interviews,
// these are surfaced as informational reminders, never blockers.
//
// Three layers, in precedence order (see getSelection):
//   1. CURATED  — human-validated overrides keyed by JUPAS code. Authoritative.
//   2. text     — parsed from the programme's own requirement notes. Reliable
//                 where present, but the source data is sparse (e.g. medicine has
//                 NO interview text at all → that's what the curated layer is for).
//   3. heuristic — inferred from the programme's discipline (name/faculty). Broad
//                 but fuzzy → always tagged `inferred`, language stays hedged.
//
// To correct a programme: add/edit its entry in CURATED below (highest priority).

import type { Programme } from "../types/jupas";
import type { Lang } from "./i18n";
import INTERVIEW_TRANSLATIONS_JSON from "../../data/processed/interview_translations.json";

const INTERVIEW_TRANSLATIONS = INTERVIEW_TRANSLATIONS_JSON as Record<string, string>;

export type SelectionType =
  | "interview"
  | "portfolio"
  | "audition"
  | "physical-test"
  | "practical-test"
  | "written-test"
  | "aptitude-test"
  // Not a selection STEP but an application tip: document relevant experience in
  // the JUPAS "Other Experiences & Achievements" section (e.g. a sports programme
  // whose non-JUPAS routes demand proof of competition results → put it in OEA).
  | "oea";

// How much the step matters, per the advisor model:
//   required — a gate or near-gate you MUST satisfy (medicine interview, arts
//              portfolio, PE physical test). Score alone won't carry you.
//   weighty  — a real ranking factor / bonus (typically post-DSE interviews).
//   optional — good-to-have / may be invited (often pre-DSE interviews).
export type SelectionSalience = "required" | "weighty" | "optional";
export type SelectionSource = "curated" | "official" | "text" | "heuristic";
// When the step happens relative to HKDSE results — the key importance signal:
// pre-results interviews are typically "good to have" (ace it → conditional
// offer), post-results ones carry real ranking weight. Only known from official
// per-institution interview-arrangement pages → populated in the curated layer.
export type SelectionTiming = "pre-results" | "post-results" | "both";

export type SelectionItem = {
  type: SelectionType;
  salience: SelectionSalience;
  source: SelectionSource;
  timing?: SelectionTiming;
  when?: string;
  before?: string;
  after?: string;
  date?: string;
  format?: string;
  scored?: boolean;
  // When set, the UI hedges this item rather than stating it as confirmed:
  //   "type"  – inferred from the programme name/discipline (heuristic guess)
  //   "stale" – from an official source we believe is out of date (e.g. an
  //             institution that hasn't published this cycle's arrangements yet)
  inferred?: "type" | "stale";
  // Optional i18n key for extra programme-specific guidance shown under the item
  // (e.g. what to put in the OEA). Curated layer only.
  note?: string;
  // Programme-specific requirement detail sentences pulled from the notes (e.g.
  // a portfolio's format/content rules). Source text, localised at render via
  // translateSelectionText. Populated for non-interview types (interview already
  // carries structured before/after).
  details?: string[];
};
export type Selection = {
  items: SelectionItem[];
  // True only when every item is from curated/text (official) — drives whether
  // the UI hedges ("may require") vs states it. Heuristic-derived = inferred.
  confirmed: boolean;
};

// Salience policy for a scraped interview: explicit source value wins (HKUST);
// otherwise use only official timing, not discipline-based judgement.
function interviewSalience(timing: SelectionTiming | undefined, given?: string): SelectionSalience {
  if (given === "required" || given === "weighty" || given === "optional") return given;
  return timing === "pre-results" ? "optional" : "weighty";
}

function officialItems(p: Programme): SelectionItem[] {
  const list = p.non_academic;
  if (!list || !list.length) return [];
  return list.map((r) => {
    const type = r.type as SelectionType;
    const timing = (r.timing as SelectionTiming) || undefined;
    const salience: SelectionSalience =
      type === "interview"
        ? interviewSalience(timing, r.salience)
        : ((r.salience as SelectionSalience) || "required");
    const item: SelectionItem = { type, salience, source: "official", timing };
    if (r.when) item.when = r.when;
    if (r.before) item.before = r.before;
    if (r.after) item.after = r.after;
    if (r.date) item.date = r.date;
    if (r.format) item.format = r.format;
    if (r.scored) item.scored = true;
    return item;
  });
}

export function getSelection(p: Programme): Selection {
  const items = officialItems(p);
  return { items, confirmed: items.length > 0 };
}

export function hasSelection(p: Programme): boolean {
  return getSelection(p).items.length > 0;
}

// ── Interview timing (surfacing helper) ───────────────────────────────────────
// Timing is the official signal behind the Browse filter, list flag, and
// analysis call-out. Vague entries such as "When necessary" remain visible in
// Detail, but are treated as tentative and are not labelled/called out.
const interviewCache = new WeakMap<Programme, SelectionItem | null>();
function programmeInterview(p: Programme): SelectionItem | null {
  let iv = interviewCache.get(p);
  if (iv === undefined) {
    iv = getSelection(p).items.find((i) => i.type === "interview") ?? null;
    interviewCache.set(p, iv);
  }
  return iv;
}

// Raw timing of the programme's interview (pre-results / post-results / both), or
// null when there's no interview or its timing is unknown. Drives the
// timing-accurate analysis labels and the "before results" filter.
export function interviewTiming(p: Programme): SelectionTiming | null {
  return programmeInterview(p)?.timing ?? null;
}

export function interviewSourceText(p: Programme): string | null {
  return programmeInterview(p)?.when ?? null;
}

export function isTentativeInterview(p: Programme): boolean {
  const iv = programmeInterview(p);
  if (!iv) return false;
  const when = (iv.when || "").toLowerCase();
  return /\bwhen necessary\b|\bif necessary\b|\bif required\b|\bwhere necessary\b/.test(when);
}

export function hasDisplayInterview(p: Programme): boolean {
  const iv = programmeInterview(p);
  return !!iv && !!iv.timing && !isTentativeInterview(p);
}

export function hasPostReleaseInterview(p: Programme): boolean {
  if (isTentativeInterview(p)) return false;
  const timing = interviewTiming(p);
  return timing === "post-results" || timing === "both";
}

export function hasPreReleaseOnlyInterview(p: Programme): boolean {
  return !isTentativeInterview(p) && interviewTiming(p) === "pre-results";
}

// ── i18n key helpers (shared by DetailPanel + analysis so labels stay in sync) ──
export function selectionTypeKey(type: SelectionType): string {
  return {
    interview: "sel.type.interview",
    portfolio: "sel.type.portfolio",
    audition: "sel.type.audition",
    "physical-test": "sel.type.physical",
    "practical-test": "sel.type.practical",
    "written-test": "sel.type.written",
    "aptitude-test": "sel.type.aptitude",
    oea: "sel.type.oea",
  }[type];
}

export function selectionTimingKey(timing?: SelectionTiming): string | null {
  if (timing === "pre-results") return "sel.timing.pre";
  if (timing === "post-results") return "sel.timing.post";
  if (timing === "both") return "sel.timing.both";
  return null;
}

// What the requirement means for the applicant — gates the tone of the reminder.
export function selectionSalienceKey(salience: SelectionSalience): string {
  return {
    required: "sel.salience.required",
    weighty: "sel.salience.weighty",
    optional: "sel.salience.optional",
  }[salience];
}


// Current JUPAS entry cycle (build-time define; auto-updates on the annual refresh).
const CURRENT_CYCLE = parseInt(__ADMISSION_CYCLE__, 10) || 2026;

function stripStaleYear(text: string): string {
  return text
    .replace(/\b20\d{2}年?/g, (m) => (parseInt(m, 10) >= CURRENT_CYCLE ? m : ""))
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function translateSelectionText(text: string | null | undefined, lang: Lang): string {
  if (!text) return "";
  if (lang !== "zh") return stripStaleYear(text);
  const trimmed = text.trim();
  const key = trimmed.toLowerCase().replace(/\s+/g, " ").replace(/–/g, "-");
  if (INTERVIEW_TRANSLATIONS[key]) {
    return stripStaleYear(INTERVIEW_TRANSLATIONS[key]);
  }

  if (trimmed.includes("Before results:") || trimmed.includes("After results:")) {
    return trimmed.split(" · ").map(part => {
      if (part.startsWith("Before results: ")) {
        const val = part.substring("Before results: ".length);
        return `放榜前：${translateSelectionText(val, lang)}`;
      }
      if (part.startsWith("After results: ")) {
        const val = part.substring("After results: ".length);
        return `放榜後：${translateSelectionText(val, lang)}`;
      }
      return translateSelectionText(part, lang);
    }).join(" · ");
  }

  return stripStaleYear(trimmed);
}
