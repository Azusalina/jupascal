import type { CalculationResult, CandidateScore, EligibilityDetail, EligibilityResult, MinRequirements, Programme, RequirementPool, StudentGrades, ScoreSlot } from "../types/jupas";
import { categoryCBasePoints, categoryCCanSatisfyElective, isCategoryCGrade, isCategoryCSubject } from "./categoryC";
import { categoryBAccepted, categoryBBasePoints, categoryBCanSatisfyElective, isCategoryBSubject } from "./categoryB";
import { canonicalSubject, CAT_A_SUBJECTS, SUBJECT_EXPANSIONS, M1_SUBJECT, M2_SUBJECT, M12_SUBJECT } from "./subjects";

const CAT_A_SET = new Set(CAT_A_SUBJECTS);
export const SLOT_BOOKKEEPING_KEY = /^(?:elective-[1-4]|cat-[bc]):subject$|^m12:module$/;
const isMathModule = (subject: string) => [M1_SUBJECT, M2_SUBJECT, M12_SUBJECT].includes(subject);

function includesM12Aware(subjects: string[] = [], candidate: string) {
  const name = canonicalSubject(candidate);
  return subjects.some(subject => {
    const accepted = canonicalSubject(subject);
    return accepted === name || SUBJECT_EXPANSIONS[accepted]?.includes(name) || SUBJECT_EXPANSIONS[name]?.includes(accepted);
  });
}

/** Calculate only the supplied 2026 recipes, including the optimal bonus subject.
 * Each slot consumes one distinct subject. Required slots are never backfilled.
 * The search is memoized by slot and used-subject mask (normally <= 10 subjects).
 */
export function calculateScore(studentGrades: StudentGrades, programme: Programme, retakenSubjects: string[] = []): CalculationResult {
  const candidates: CandidateScore[] = [];
  for (const [rawSubject, grade] of Object.entries(studentGrades)) {
    if (!grade || grade === "U" || SLOT_BOOKKEEPING_KEY.test(rawSubject)) continue;
    const subject = canonicalSubject(rawSubject);
    if (subject === "Citizenship and Social Development" || (programme.institution === "HKUST" && subject === "Liberal Studies")) continue;
    if (isCategoryCSubject(subject) && programme.institution === "HKU" && programme.category_c_policy === "score_excluded") continue;
    if (isCategoryBSubject(subject) && !categoryBAccepted(programme, subject)) continue;
    const basePoints = isCategoryCSubject(subject) ? categoryCBasePoints(programme, subject, grade) ?? 0
      : isCategoryBSubject(subject) ? categoryBBasePoints(programme, subject, grade) ?? 0
      : programme.score_conversion_table.category_a?.[grade] ?? 0;
    if (!basePoints) continue;
    const existing = candidates.find(c => c.subject === subject || (isMathModule(c.subject) && isMathModule(subject)));
    if (existing && existing.basePoints >= basePoints) continue;
    if (existing) candidates.splice(candidates.indexOf(existing), 1);
    candidates.push({ subject, grade, basePoints, multiplier: 1, weightedScore: basePoints,
      isCompulsory: false, isBestOfPool: false, used: false, isBonus: false });
  }
  type Pick = { index: number; multiplier: number; compulsory: boolean; bonus?: boolean };
  type Solution = { score: number; picks: Pick[] };
  const bit = (i: number) => 1n << BigInt(i);
  const group = (subject: string) => isMathModule(subject) || isCategoryCSubject(subject);
  const compatible = (mask: bigint, index: number) => {
    if (mask & bit(index)) return false;
    if (isCategoryCSubject(candidates[index].subject) && candidates.some((c, i) => (mask & bit(i)) && isCategoryCSubject(c.subject))) return false;
    if (!programme.extended_math_or_category_c || !group(candidates[index].subject)) return true;
    return !candidates.some((c, i) => (mask & bit(i)) && group(c.subject));
  };
  const canTake = (slot: ScoreSlot, c: CandidateScore) => !isCategoryBSubject(c.subject)
    && (!isCategoryCSubject(c.subject) || slot.allow_category_c)
    && (!slot.subjects.length || includesM12Aware(slot.subjects, c.subject));
  const weight = (slot: ScoreSlot, c: CandidateScore) => slot.weights[c.subject] ?? slot.weight;
  let best: Solution = { score: 0, picks: [] };
  for (const slots of programme.score_slots_2026) {
    const memo = new Map<string, Solution>();
    const search = (at: number, mask: bigint, filled: number): Solution => {
      const key = `${at}:${mask}:${filled}`;
      const cached = memo.get(key);
      if (cached) return cached;
      if (at === slots.length) {
        let bonus: Solution = { score: 0, picks: [] };
        if (filled === slots.length && programme.bonus_multiplier > 0) {
          candidates.forEach((c, index) => {
            if (!compatible(mask, index) || c.basePoints < (programme.bonus_min_points ?? 0)) return;
            const score = c.basePoints * programme.bonus_multiplier;
            if (score > bonus.score) bonus = { score, picks: [{ index, multiplier: programme.bonus_multiplier, compulsory: false, bonus: true }] };
          });
        }
        return bonus;
      }
      const slot = slots[at];
      let result: Solution | undefined;
      candidates.forEach((c, index) => {
        if (!compatible(mask, index) || !canTake(slot, c)) return;
        const multiplier = weight(slot, c);
        const tail = search(at + 1, mask | bit(index), filled + 1);
        const score = c.basePoints * multiplier + tail.score;
        if (!result || score > result.score) result = { score, picks: [{ index, multiplier, compulsory: slot.compulsory }, ...tail.picks] };
      });
      // A missing required subject is worth zero; an unrelated subject cannot fill it.
      result ??= search(at + 1, mask, filled);
      memo.set(key, result);
      return result;
    };
    const result = search(0, 0n, 0);
    if (result.score > best.score) best = result;
  }
  const selected = best.picks.map(pick => {
    const c = candidates[pick.index];
    Object.assign(c, { multiplier: pick.multiplier, weightedScore: c.basePoints * pick.multiplier,
      used: true, isCompulsory: pick.compulsory, isBonus: !!pick.bonus,
      isBestOfPool: !pick.compulsory && !pick.bonus && pick.multiplier !== 1,
      ...(pick.bonus ? { bonusValue: `+${pick.multiplier}x` } : {}) });
    return c;
  });
  // Retained programmes have no numeric repeater deduction. Sitting-combination
  // requirements remain available in programme details.
  void retakenSubjects;
  return { totalScore: Number(best.score.toFixed(3)), selected, allCandidates: candidates,
    formula: programme.formula_2026, score_type: "actual" };
}

export function checkEligibility(studentGrades: StudentGrades, reqs: MinRequirements, programme: Programme): EligibilityResult {
  const base = checkPattern(studentGrades, reqs, programme);
  const alts = reqs?.alternatives;
  if (base.eligible || !alts || alts.length === 0) return base;
  for (const alt of alts) {
    const r = checkPattern(studentGrades, { ...alt, alternatives: undefined }, programme);
    if (r.eligible) return r;
  }
  return base;
}

function checkPattern(studentGrades: StudentGrades, reqs: MinRequirements, programme: Programme): EligibilityResult {
  const details: EligibilityDetail[] = [];
  let eligible = true;
  for (const key of ["chi", "eng", "math", "csd"] as const) {
    const studentGrade = studentGrades[mapReqKeyToSubject(key)];
    const reqGrade = reqs?.[key];
    const pass = compareGrades(studentGrade, reqGrade, programme);
    if (!pass) eligible = false;
    details.push({ label: key.toUpperCase(), pass, got: studentGrade || "N/A", need: reqGrade });
  }

  const used = new Set([
    "Chinese Language",
    "English Language",
    "Mathematics (Compulsory Part)",
    "Citizenship and Social Development",
  ]);

  const electiveDefs: Array<{ label: string; pool?: RequirementPool }> = [
    { label: "Elective 1", pool: reqs?.elect1 },
    { label: "Elective 2", pool: reqs?.elect2 },
  ];
  const definedPools = electiveDefs.map((e) => e.pool).filter((p): p is RequirementPool => !!p);
  const assigned = matchElectives(studentGrades, definedPools, used, programme);

  let poolIdx = 0;
  for (const def of electiveDefs) {
    if (!def.pool) {
      details.push({ label: def.label, pass: true, got: "N/A", need: "N/A" });
      continue;
    }
    const got = assigned[poolIdx++];
    const pass = got.length >= def.pool.count;
    if (!pass) eligible = false;
    details.push({
      label: def.label,
      pass,
      got: got.length > 0 ? (studentGrades[got[0]] as string) : "None",
      need: def.pool.grade,
      note: def.pool.note || def.pool.subjects.join("/") || "",
    });
  }

  return { eligible, details };
}

function electiveCanTake(pool: RequirementPool, subject: string, grade: string, programme: Programme) {
  let isMatch =
    pool.subjects.includes("Any") ||
    pool.subjects.includes("*") ||
    (pool.subjects.includes("CategoryA") && CAT_A_SET.has(canonicalSubject(subject))) ||
    includesM12Aware(pool.subjects, subject);
  if (!isMatch && pool.note?.includes("Category A") && (subject.includes("Module 1") || subject.includes("Module 2"))) {
    isMatch = true;
  }
  if (!isMatch) return false;
  if (isCategoryBSubject(subject)) return categoryBCanSatisfyElective(programme, subject, grade, pool);
  if (!categoryCCanSatisfyElective(programme, subject, grade, pool)) return false;
  return compareGrades(grade, pool.grade, programme, subject);
}

function matchElectives(
  studentGrades: StudentGrades,
  pools: RequirementPool[],
  used: Set<string>,
  programme: Programme,
): string[][] {
  const subjects = Object.keys(studentGrades).filter(
    (s) => !used.has(s) && !SLOT_BOOKKEEPING_KEY.test(s),
  );

  const slotPool: number[] = [];
  pools.forEach((pool, pi) => {
    for (let i = 0; i < Math.max(0, pool.count || 0); i++) slotPool.push(pi);
  });
  const adj: number[][] = slotPool.map((pi) =>
    subjects
      .map((s, si) => (electiveCanTake(pools[pi], s, studentGrades[s] as string, programme) ? si : -1))
      .filter((si) => si >= 0),
  );

  const subjToSlot = new Array<number>(subjects.length).fill(-1);
  const slotToSubj = new Array<number>(slotPool.length).fill(-1);
  const augment = (slot: number, seen: boolean[]): boolean => {
    for (const si of adj[slot]) {
      if (seen[si]) continue;
      seen[si] = true;
      if (subjToSlot[si] === -1 || augment(subjToSlot[si], seen)) {
        subjToSlot[si] = slot;
        slotToSubj[slot] = si;
        return true;
      }
    }
    return false;
  };
  const order = slotPool.map((_, k) => k).sort((a, b) => adj[a].length - adj[b].length);
  for (const slot of order) augment(slot, new Array<boolean>(subjects.length).fill(false));

  const perPool: string[][] = pools.map(() => []);
  slotToSubj.forEach((si, slot) => {
    if (si >= 0) perPool[slotPool[slot]].push(subjects[si]);
  });
  return perPool;
}

function compareGrades(student: string | undefined, required: string | undefined, programme: Programme, subject?: string) {
  if (!required) return true;
  if (!student) return false;
  const convTable = programme.score_conversion_table.category_a || {};
  const catCTable = programme.score_conversion_table.category_c || {};
  const val = (grade: string) => {
    const normalized = String(grade).toUpperCase();
    if (subject && isCategoryCSubject(subject) && isCategoryCGrade(normalized)) return categoryCBasePoints(programme, subject, normalized, catCTable) ?? 0;
    if (normalized === "A" || normalized === "ATTAINED") return 2;
    if (convTable[normalized] !== undefined) return convTable[normalized];
    if (catCTable[normalized] !== undefined) return catCTable[normalized];
    return Number.parseFloat(normalized) || 0;
  };
  return val(student) >= val(required);
}

function mapReqKeyToSubject(key: "chi" | "eng" | "math" | "csd") {
  return {
    chi: "Chinese Language",
    eng: "English Language",
    math: "Mathematics (Compulsory Part)",
    csd: "Citizenship and Social Development",
  }[key];
}
