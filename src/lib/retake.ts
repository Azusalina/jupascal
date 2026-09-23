import type { Programme } from "../types/jupas";

// The severity + machine-readable kind of an HKU sitting-combination rule. The
// render layer maps `kind` to a localized sentence (strings.ts); `severity`
// drives the tone. `single` and `latest` are the retaker-hostile ones:
//   • single  — only ONE sitting is counted, so a retaker CANNOT mix a better
//               subject from a different year into the same offer.
//   • latest  — the LATEST sitting's grade is used (not the best), so a subject
//               that dropped in a later resit actively hurts.
//   • years   — best across specific listed years only.
//   • sittings — best across the latest N (or "2 or more") sittings.
export type ConsiderationKind = "single" | "latest" | "years" | "sittings" | "other";

export type RetakeConsideration = {
  kind: ConsiderationKind;
  severity: "warning" | "info";
  text: string; // the raw source phrasing, shown as a quote
};

export function classifyConsideration(raw: string | null | undefined): RetakeConsideration | null {
  const text = (raw || "").trim();
  if (!text) return null;
  const lower = text.toLowerCase();
  if (/\bsingle sitting\b/.test(lower)) {
    return { kind: "single", severity: "warning", text };
  }
  if (/^latest results\b/.test(lower)) {
    return { kind: "latest", severity: "warning", text };
  }
  if (/\bsitting/.test(lower)) {
    return { kind: "sittings", severity: "info", text };
  }
  if (/\byear\b/.test(lower)) {
    return { kind: "years", severity: "info", text };
  }
  return { kind: "other", severity: "info", text };
}

// The consideration attached to a programme (HKU only today), classified.
export function programmeConsideration(programme: Programme): RetakeConsideration | null {
  return classifyConsideration(programme.retake?.consideration);
}
