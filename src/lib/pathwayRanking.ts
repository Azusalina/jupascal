import type { ProgrammeResult } from "../types/jupas";
import { personalValueFor } from "./personalization";

export type PathwaySortMode = "jupas" | "personal" | "hybrid" | "custom";

export type PathwayRank = {
  jupasPercent: number;
  personalScore: number;
  combinedScore: number;
};

export function normalizedJupasScore(result: ProgrammeResult): number {
  const maximum = result.programme.max_achievable_score;
  if (typeof maximum !== "number" || maximum <= 0) return 0;
  return Math.max(0, Math.min(100, (result.calculation.totalScore / maximum) * 100));
}

export function pathwayRank(
  result: ProgrammeResult,
  mode: PathwaySortMode,
  customJupasWeight = 50,
): PathwayRank {
  const jupasPercent = normalizedJupasScore(result);
  const personalScore = personalValueFor(result.programme).score;
  const jupasWeight = mode === "personal" ? 0 : mode === "jupas" ? 100 : mode === "hybrid" ? 50 : customJupasWeight;
  const safeWeight = Math.max(0, Math.min(100, jupasWeight));
  const combinedScore = (jupasPercent * safeWeight + personalScore * (100 - safeWeight)) / 100;
  return { jupasPercent, personalScore, combinedScore };
}

export function sortPathwayResults(
  results: ProgrammeResult[],
  mode: PathwaySortMode,
  customJupasWeight = 50,
): ProgrammeResult[] {
  return [...results].sort((a, b) => {
    const rankA = pathwayRank(a, mode, customJupasWeight);
    const rankB = pathwayRank(b, mode, customJupasWeight);
    return rankB.combinedScore - rankA.combinedScore
      || rankB.jupasPercent - rankA.jupasPercent
      || rankB.personalScore - rankA.personalScore
      || a.programme.jupas_code.localeCompare(b.programme.jupas_code);
  });
}
