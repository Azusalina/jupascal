import type { Programme, RequirementPool } from "../types/jupas";
import { APL_GRADES, CAT_B_SUBJECTS } from "./subjects";

const CAT_B_SET = new Set(CAT_B_SUBJECTS);

// ApL result level (upper-cased) → equivalent DSE level for the score conversion.
// null = "Attained" (bare pass), not credited by any institution measured.
const APL_LEVEL_EQUIV: Record<string, "3" | "4" | null> = {
  "ATTAINED WITH DISTINCTION (II)": "4",
  "ATTAINED WITH DISTINCTION (I)": "3",
  "ATTAINED": null,
};

export function isCategoryBSubject(subject: string): boolean {
  return CAT_B_SET.has(subject);
}

function normalizeApLGrade(grade: string): string {
  return (grade || "").trim().toUpperCase();
}

export function isCategoryBGrade(grade: string): boolean {
  return normalizeApLGrade(grade) in APL_LEVEL_EQUIV;
}

// Map any casing/spacing of an ApL result back to its canonical APL_GRADES form
// (the exact string the grade buttons compare against). undefined if not an ApL
// result. Used to keep stored/shared ApL grades aligned with the UI options.
export function canonicalCategoryBGrade(grade: string): string | undefined {
  const norm = normalizeApLGrade(grade);
  return APL_GRADES.find((g) => g.toUpperCase() === norm);
}

function categoryBScoreLevel(programme: Programme, grade: string): string | null {
  const norm = normalizeApLGrade(grade);
  const level = APL_LEVEL_EQUIV[norm];
  if (level) return level;
  return null;
}

// Base points for an ApL subject at `grade` for this programme: the programme's
// Cat-A conversion value for the equivalent DSE level. undefined when `subject`
// isn't an ApL subject.
export function categoryBBasePoints(programme: Programme, subject: string, grade: string): number | undefined {
  if (!isCategoryBSubject(subject)) return undefined;
  const level = categoryBScoreLevel(programme, grade);
  if (!level) return 0; // not credited (bare "Attained" where unaccepted / unknown)
  return programme.score_conversion_table.category_a?.[level] ?? 0;
}

// Whether THIS ApL subject is recognised by the programme at all (per apl_policy):
// "any" → all ApL; a list → only the listed subjects; undefined / "none" → none.
function categoryBInPolicy(programme: Programme, subject: string): boolean {
  if (!isCategoryBSubject(subject)) return false;
  const policy = programme.apl_policy;
  if (!policy || policy === "none") return false;
  if (policy === "any") return true;
  return Array.isArray(policy) && policy.includes(subject);
}

export function categoryBAccepted(programme: Programme, subject: string): boolean {
  if (programme.apl_policy === "none") return false;
  return categoryBInPolicy(programme, subject);
}

export function categoryBCanSatisfyElective(
  programme: Programme,
  subject: string,
  grade: string,
  pool: RequirementPool,
): boolean {
  if (!isCategoryBSubject(subject)) return true; // not an ApL subject — not our concern
  if (programme.apl_bonus_only) return false; // HKUST: ApL is a score bonus, not an elective
  const policy = programme.apl_policy;
  if (!policy || policy === "none") return false;
  if (Array.isArray(policy) && !policy.includes(subject)) return false;
  const level = categoryBScoreLevel(programme, grade);
  if (!level) return false; // below the programme's floor / unknown grade
  const need = Number(pool.grade);
  return Number.isNaN(need) || Number(level) >= need;
}
