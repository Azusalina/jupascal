import type { Programme, RequirementPool } from "../types/jupas";
import { CAT_C_SUBJECTS } from "./subjects";

type CatCLanguage = "french" | "german" | "spanish" | "japanese" | "korean" | "urdu";
type GradePoints = Partial<Record<string, number>>;
type Policy = Partial<Record<CatCLanguage, GradePoints>>;

const CAT_C_SET = new Set(CAT_C_SUBJECTS);
const LEVEL_OPTIONS: Record<CatCLanguage, string[]> = {
  french: ["C2", "C1", "B2", "B1", "A2"],
  german: ["C2", "C1", "B2", "B1", "A2"],
  spanish: ["C2", "C1", "B2", "B1", "A2"],
  japanese: ["N1", "N2", "N3"],
  korean: ["Grade 6", "Grade 5", "Grade 4", "Grade 3"],
  urdu: ["A++", "A+", "A", "B++", "B+", "B", "C", "D", "E"],
};
const BROAD_TO_EXACT: Record<CatCLanguage, Record<string, string>> = {
  french: { A: "C2", B: "C1", C: "B2", D: "B1", E: "A2" },
  german: { A: "C2", B: "C1", C: "B2", D: "B1", E: "A2" },
  spanish: { A: "C2", B: "C1", C: "B2", D: "B1", E: "A2" },
  japanese: { A: "N1", B: "N2", C: "N3" },
  korean: { A: "Grade 6", B: "Grade 5", C: "Grade 4", D: "Grade 3" },
  urdu: { A: "A", B: "B++", C: "B", D: "C", E: "D" },
};

const POLICIES: Record<string, Policy> = {
  HKUST: {
    japanese: { N1: 8.5, N2: 5.5, N3: 3 },
    korean: { "GRADE 6": 8.5, "GRADE 5": 5.5, "GRADE 4": 4, "GRADE 3": 3 },
    french: { C2: 8.5, C1: 7, B2: 5.5, B1: 4, A2: 3 },
    german: { C2: 8.5, C1: 7, B2: 5.5, B1: 4, A2: 3 },
    spanish: { C2: 8.5, C1: 7, B2: 5.5, B1: 4, A2: 3 },
    urdu: { "A++": 8.5, "A+": 7, A: 7, "B++": 5.5, "B+": 4, B: 4, C: 3, D: 2, E: 1 },
  },
  HKU: {
    japanese: { N1: 8.5, N2: 7, N3: 4 },
    korean: { "GRADE 6": 8.5, "GRADE 5": 7, "GRADE 4": 5.5, "GRADE 3": 4 },
    french: { C2: 8.5, C1: 8.5, B2: 7, B1: 5.5, A2: 4 },
    german: { C2: 8.5, C1: 8.5, B2: 7, B1: 5.5, A2: 4 },
    spanish: { C2: 8.5, C1: 8.5, B2: 7, B1: 5.5, A2: 4 },
    urdu: { "A++": 8.5, "A+": 8.5, A: 8.5, "B++": 7, "B+": 5.5, B: 4, C: 3, D: 2, E: 1 },
  },
};

for (const policy of Object.values(POLICIES)) addLegacyBroadAliases(policy);

export function isCategoryCSubject(subject: string): boolean {
  return CAT_C_SET.has(subject);
}

export function categoryCLevelOptions(subject: string): string[] {
  const language = categoryCLanguage(subject);
  return language ? LEVEL_OPTIONS[language] : [];
}

export function normalizeCategoryCGrade(grade: string): string | undefined {
  const raw = String(grade || "").trim();
  if (!raw) return undefined;
  const upper = raw.toUpperCase();
  for (const options of Object.values(LEVEL_OPTIONS)) {
    const match = options.find((option) => option.toUpperCase() === upper);
    if (match) return match;
  }
  if (["A", "B", "C", "D", "E", "U"].includes(upper)) return upper;
  return undefined;
}

export function isCategoryCGrade(grade: string): boolean {
  return normalizeCategoryCGrade(grade) !== undefined;
}

export function categoryCBasePoints(
  programme: Programme,
  subject: string,
  grade: string,
  fallbackTable: Record<string, number> = {},
): number | undefined {
  if (!isCategoryCSubject(subject)) return undefined;
  const language = categoryCLanguage(subject);
  const normalized = normalizeGradeForLookup(grade);
  if (!language || !normalized || normalized === "U") return 0;

  const policy = scorePolicyFor(programme);
  const languagePolicy = policy?.[language];
  if (languagePolicy) return languagePolicy[normalized] ?? 0;
  return fallbackTable[normalized] ?? 0;
}


// True unless the programme drops Category C languages from the score. Used by the
// calculator to skip Cat C subjects among the scoring candidates. Note "score_excluded"
// returns false here (not scored) yet still lets Cat C satisfy an elective — that path
// is governed separately by categoryCCanSatisfyElective.
export function acceptsCategoryC(programme: Programme): boolean {
  return programme.category_c_policy !== "none" && programme.category_c_policy !== "score_excluded";
}

export function categoryCCanSatisfyElective(
  programme: Programme,
  subject: string,
  grade: string,
  pool: RequirementPool,
): boolean {
  if (!isCategoryCSubject(subject)) return true;
  if (programme.category_c_policy === "none" || programme.category_c_policy === "elective_cat_a_only") return false;
  const note = pool.note?.toLowerCase() || "";
  if (note.includes("except") && (note.includes("other language") || note.includes("category c"))) return false;

  const language = categoryCLanguage(subject);
  const normalized = normalizeCategoryCGrade(grade);
  if (!language || !normalized || normalized === "U") return false;

  const points = categoryCBasePoints(programme, subject, normalized, programme.score_conversion_table.category_c || {});
  return points !== undefined && points > 0;
}

function scorePolicyFor(programme: Programme): Policy | undefined {
  return POLICIES[programme.institution];
}

function categoryCLanguage(subject: string): CatCLanguage | undefined {
  if (subject.startsWith("French:")) return "french";
  if (subject.startsWith("German:")) return "german";
  if (subject.startsWith("Spanish:")) return "spanish";
  if (subject.startsWith("Japanese:")) return "japanese";
  if (subject.startsWith("Korean:")) return "korean";
  if (subject.startsWith("Urdu:")) return "urdu";
  return undefined;
}

function normalizeGradeForLookup(grade: string): string {
  const normalized = normalizeCategoryCGrade(grade);
  return normalized ? normalized.toUpperCase() : String(grade || "").trim().toUpperCase();
}

function addLegacyBroadAliases(policy: Policy): void {
  for (const [language, map] of Object.entries(policy) as Array<[CatCLanguage, GradePoints | undefined]>) {
    if (!map) continue;
    const aliases = BROAD_TO_EXACT[language];
    for (const [broad, exact] of Object.entries(aliases)) {
      const score = map[exact.toUpperCase()];
      if (score !== undefined && map[broad] === undefined) map[broad] = score;
    }
  }
}
