import { calculateScore, checkEligibility } from "./calculator";
import { personalValueFor } from "./personalization";
import { hasPostReleaseInterview, hasPreReleaseOnlyInterview } from "./selection";
import type { BenchmarkBand, BenchmarkComparison, BenchmarkKey, Programme, ProgrammeResult, StudentGrades } from "../types/jupas";

export type SortKey = "benchmark" | "code" | "name" | "eligibility" | "score" | "personal" | "lq" | "median" | "uq" | "quota";

// Interview-timing filter based on official source timing only. Vague entries
// such as "When necessary" are excluded from both timing filters.
export type InterviewFilter = "all" | "after" | "before";

export type Filters = {
  query: string;
  eligibleOnly: boolean;
  band: BenchmarkBand | "all";
  interview: InterviewFilter;
};

export function buildProgrammeResult(programme: Programme, grades: StudentGrades, retakenSubjects: string[] = []): ProgrammeResult {
  const calculation = calculateScore(grades, programme, retakenSubjects);
  const eligibility = checkEligibility(grades, programme.min_requirements_2026, programme);
  const comparisons = buildComparisons(calculation.totalScore, programme);
  const band = getBenchmarkBand(calculation.totalScore, programme);
  return {
    programme,
    calculation,
    eligibility,
    comparisons,
    band,
    // Whether the PROGRAMME has 2025 admission-score data — independent of whether
    // the student has entered grades. (Was `comparisons.length > 0`, which was
    // false with no grades, wrongly flagging real benchmarks as "no data".)
    hasScoreData: hasHistoricalScores(programme),
  };
}

export function filterResults(results: ProgrammeResult[], filters: Filters) {
  const query = normalizeSearchText(filters.query);
  const compactQuery = compactSearchText(filters.query);
  return results.filter((result) => {
    const programme = result.programme;
    if (filters.eligibleOnly && !result.eligibility.eligible) return false;
    if (filters.band !== "all" && result.band !== filters.band) return false;
    if (filters.interview !== "all") {
      if (filters.interview === "after" && !hasPostReleaseInterview(programme)) return false;
      if (filters.interview === "before" && !hasPreReleaseOnlyInterview(programme)) return false;
    }
    if (!query) return true;
    const index = searchIndexFor(programme);
    if (isShortSearch(query, compactQuery)) return compactMatch(compactQuery, index);
    return index.normalized.includes(query)
      || compactMatch(compactQuery, index)
      || tokenPrefixMatch(query, index.tokens);
  });
}

export function sortResults(results: ProgrammeResult[], sortKey: SortKey, direction: "asc" | "desc", deltaMode: "points" | "percent" = "points") {
  // In % mode the benchmark-diff columns rank by percentage-of-benchmark, not
  // raw points, so the display and the ordering stay in the same unit.
  const pct = deltaMode === "percent";
  const benchDelta = (r: ProgrammeResult, key: BenchmarkKey) => (pct ? percentFor(r, key) : deltaFor(r, key));
  const central = (r: ProgrammeResult) => (pct ? centralPercentFor(r) : centralDeltaFor(r));
  const sorted = [...results].sort((a, b) => {
    const multiplier = direction === "asc" ? 1 : -1;
    if (sortKey === "benchmark") {
      const value = benchmarkRank(a) - benchmarkRank(b) || central(a) - central(b) || benchDelta(a, "lq") - benchDelta(b, "lq");
      return multiplier * value;
    }
    if (sortKey === "score") return multiplier * (a.calculation.totalScore - b.calculation.totalScore);
    if (sortKey === "personal") return multiplier * (personalValueFor(a.programme).score - personalValueFor(b.programme).score);
    if (sortKey === "quota") return multiplier * (numberForSort(a.programme.quota) - numberForSort(b.programme.quota));
    if (sortKey === "eligibility") return multiplier * (Number(a.eligibility.eligible) - Number(b.eligibility.eligible));
    if (sortKey === "median") return multiplier * (central(a) - central(b));
    if (sortKey === "lq" || sortKey === "uq") return multiplier * (benchDelta(a, sortKey) - benchDelta(b, sortKey));
    if (sortKey === "name") {
      return multiplier * (a.programme.name_en.localeCompare(b.programme.name_en) || a.programme.jupas_code.localeCompare(b.programme.jupas_code));
    }
    return multiplier * a.programme.jupas_code.localeCompare(b.programme.jupas_code);
  });
  return sorted;
}

export type BenchmarkSource = "actual" | "mean" | "expected" | "none";

export type EffectiveBenchmarks = {
  lq: number | null;
  median: number | null; // the central reference: median ?? mean ?? expected_score
  uq: number | null;
  source: BenchmarkSource;
};

export function effectiveBenchmarks(programme: Programme): EffectiveBenchmarks {
  const s = programme.historical_comparable === false ? {} : programme.scores_2025 || {};
  const lq = s.lq ?? null;
  const uq = s.uq ?? null;
  if (s.median != null) return { lq, median: s.median, uq, source: "actual" };
  if (s.mean != null) return { lq, median: s.mean, uq, source: "mean" };
  if (s.expected_score != null) return { lq, median: s.expected_score, uq, source: "expected" };
  return { lq, median: null, uq, source: "none" };
}

export function buildComparisons(totalScore: number, programme: Programme): BenchmarkComparison[] {
  const labels: Record<BenchmarkKey, string> = { uq: "UQ", median: "Median", lq: "LQ", mean: "Mean", expected_score: "Expected" };
  const scores = programme.historical_comparable === false ? {} : programme.scores_2025 || {};
  // expected_score is shown as a benchmark card ONLY when it's the fallback
  // reference (no median and no mean); beside published quartiles it's redundant.
  const keys: BenchmarkKey[] = ["uq", "median", "lq", "mean"];
  if (scores.median == null && scores.mean == null && scores.expected_score != null) keys.push("expected_score");
  return keys.flatMap((key) => {
    const score = scores[key];
    if (!score || !totalScore) return [];
    return [{
      key,
      label: labels[key],
      score,
      delta: totalScore - score,
      percent: ((totalScore - score) / score) * 100,
    }];
  });
}

export function getBenchmarkBand(totalScore: number, programme: Programme): BenchmarkBand {
  const { lq, median, uq } = effectiveBenchmarks(programme);
  if (!totalScore || (uq == null && median == null && lq == null)) return "no-score";
  if (uq != null && totalScore >= uq) return "above-uq";
  if (median != null && totalScore >= median) return "above-median";
  if (lq != null && totalScore >= lq) return "above-lq";
  return "below-lq";
}

export function bandLabel(band: BenchmarkBand) {
  return {
    "above-uq": "Above UQ",
    "above-median": "Above median",
    "above-lq": "Above LQ",
    "below-lq": "Below LQ",
    "no-score": "No score data",
  }[band];
}

// i18n key for a band's long label — feed to `t()` so band captions localize
// consistently wherever they render (results table/cards, share, analysis).
export function bandLabelKey(band: BenchmarkBand): string {
  return {
    "above-uq": "bandLong.aboveUq",
    "above-median": "bandLong.aboveMed",
    "above-lq": "bandLong.aboveLq",
    "below-lq": "bandLong.belowLq",
    "no-score": "bandLong.noScore",
  }[band];
}

export function benchmarkRank(result: ProgrammeResult) {
  return {
    "above-uq": 4,
    "above-median": 3,
    "above-lq": 2,
    "below-lq": 1,
    "no-score": 0,
  }[result.band];
}

export function deltaFor(result: ProgrammeResult, key: BenchmarkKey) {
  return result.comparisons.find((comparison) => comparison.key === key)?.delta ?? Number.NEGATIVE_INFINITY;
}

export function centralDeltaFor(result: ProgrammeResult) {
  return result.comparisons.find((comparison) => comparison.key === "median" || comparison.key === "mean")?.delta ?? Number.NEGATIVE_INFINITY;
}

export function percentFor(result: ProgrammeResult, key: BenchmarkKey) {
  return result.comparisons.find((comparison) => comparison.key === key)?.percent ?? Number.NEGATIVE_INFINITY;
}

export function centralPercentFor(result: ProgrammeResult) {
  return result.comparisons.find((comparison) => comparison.key === "median" || comparison.key === "mean")?.percent ?? Number.NEGATIVE_INFINITY;
}

function numberForSort(value?: number | null) {
  return value ?? Number.NEGATIVE_INFINITY;
}

export function formatDelta(value?: number) {
  if (value === undefined || value === Number.NEGATIVE_INFINITY) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

export function formatPercent(value?: number) {
  if (value === undefined || value === Number.NEGATIVE_INFINITY) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function hasHistoricalScores(programme: Programme) {
  const scores = programme.historical_comparable === false ? {} : programme.scores_2025 || {};
  return Boolean(scores.uq || scores.median || scores.lq || scores.mean);
}

type SearchIndex = {
  normalized: string;
  compact: string;
  aliases: string[];
  shortAliases: string[];
  tokens: string[];
};

const searchIndexCache = new WeakMap<Programme, SearchIndex>();

const SEARCH_ALIASES: Record<string, string[]> = {
  JS6896: ["ibgm", "international business global management", "hku ibgm"],
};
const PATHWAY_ALIASES: Record<string, string[]> = {
  JS6717: ["psychology", "psychology pathway", "psy", "psych"],
};

const ACRONYM_STOPWORDS = new Set([
  "and",
  "as",
  "at",
  "bachelor",
  "degree",
  "for",
  "honours",
  "hons",
  "in",
  "of",
  "offered",
  "programme",
  "program",
  "the",
  "with",
]);

function searchIndexFor(programme: Programme): SearchIndex {
  const cached = searchIndexCache.get(programme);
  if (cached) return cached;
  const aliases = programmeAliases(programme);
  const shortAliases = programmeShortAliases(programme);
  const values = [
    programme.jupas_code,
    programme.name_en,
    programme.name_zh || "",
    programme.short_description || "",
    programme.institution,
    programme.faculty || "",
    programme.remarks || "",
    ...(programme.programme_websites || []),
    ...aliases,
    ...shortAliases,
  ];
  const compactValues = [
    programme.jupas_code,
    programme.name_en,
    programme.name_zh || "",
    programme.short_description || "",
    ...(programme.programme_websites || []),
    ...aliases,
    ...shortAliases,
  ];
  const normalized = normalizeSearchText(values.join(" "));
  const compact = compactSearchText(compactValues.join(" "));
  const normalizedAliases = aliases.map(normalizeSearchText).filter(Boolean);
  const normalizedShortAliases = shortAliases.map(normalizeSearchText).filter(Boolean);
  const tokens = [...new Set(normalized.split(" ").filter(Boolean))];
  const index = { normalized, compact, aliases: normalizedAliases, shortAliases: normalizedShortAliases, tokens };
  searchIndexCache.set(programme, index);
  return index;
}

function programmeAliases(programme: Programme): string[] {
  const name = programme.name_en || "";
  const chineseName = programme.name_zh || "";
  const normalizedName = normalizeSearchText(name);
  const aliases = new Set<string>(SEARCH_ALIASES[programme.jupas_code] || []);

  for (const acronym of acronymCandidates(name)) aliases.add(acronym);
  for (const slug of websiteSlugs(programme.programme_websites || [])) aliases.add(slug);

  if (/\b(global|international)\b/.test(normalizedName) && /\bbusiness\b/.test(normalizedName)) {
    aliases.add("gbus");
    aliases.add("global business");
    aliases.add("international business");
  }
  if (/\bcomputer\b/.test(normalizedName) && /\bscience\b/.test(normalizedName)) aliases.add("cs");
  if (/\bdata\b/.test(normalizedName) && /\bscience\b/.test(normalizedName)) aliases.add("ds");
  if (/\bartificial\b/.test(normalizedName) && /\bintelligence\b/.test(normalizedName)) aliases.add("ai");
  if (/\bsocial work\b/.test(normalizedName)) aliases.add("sowk");
  if (/\binternational\b/.test(normalizedName)) aliases.add(normalizedName.replace(/\binternational\b/g, "intl"));
  if (/\bbusiness\b/.test(normalizedName)) aliases.add(normalizedName.replace(/\bbusiness\b/g, "biz"));
  for (const alias of PATHWAY_ALIASES[programme.jupas_code] || []) aliases.add(alias);
  for (const alias of chineseAliases(name, chineseName)) aliases.add(alias);

  return [...aliases].filter(Boolean);
}

function programmeShortAliases(programme: Programme): string[] {
  const en = normalizeSearchText(programme.name_en || "");
  const zh = programme.name_zh || "";
  const aliases = new Set<string>();

  // Generated two-letter acronyms are noisy (e.g. many unrelated chunks can
  // produce "ot"). Keep 1-2 character queries to deliberate shorthands.
  if (/computer science/.test(en) || /計算機科學|電腦科學/.test(zh)) aliases.add("cs");
  if (/data science/.test(en) || /數據科學|資料科學/.test(zh)) aliases.add("ds");
  if (/artificial intelligence/.test(en) || /人工智能/.test(zh)) aliases.add("ai");
  for (const alias of chineseAliases(programme.name_en || "", zh)) {
    if ([...alias].length <= 2) aliases.add(alias);
  }

  return [...aliases];
}

function chineseAliases(nameEn: string, nameZh: string): string[] {
  const name = `${nameEn.toLowerCase()} ${nameZh}`;
  const groups: Array<[RegExp, string[]]> = [
    [/business administration|工商管理|\bbba\b/, ["工管", "工商管理", "bba"]],
    [/global business|international business|環球商業|國際商業/, ["環商", "國商", "gbus"]],
    [/financial technology|fintech|金融科技/, ["金科", "金融科技"]],
    [/psychology|心理/, ["心理", "psy", "psych"]],
    [/social work|社會工作/, ["社工", "sowk"]],
    [/social science|社會科學/, ["社科"]],
    [/computing|computer|計算機|電腦/, ["計科", "電腦", "cs"]],
    [/data science|數據科學/, ["數科", "ds"]],
    [/artificial intelligence|人工智能/, ["人智", "ai"]],
    [/account|會計/, ["會計", "acct"]],
    [/actuarial|精算/, ["精算"]],
    [/economics|經濟/, ["經濟", "econ"]],
    [/finance|financial|金融|財務/, ["金融", "fin"]],
    [/marketing|市場|營銷/, ["市場", "mkt"]],
    [/statistic|統計/, ["統計", "stats"]],
    [/mathematics|數學/, ["數學", "math"]],
  ];
  return groups.flatMap(([pattern, aliases]) => pattern.test(name) ? aliases : []);
}

function acronymCandidates(value: string): string[] {
  const candidates = new Set<string>();
  const chunks = [
    value,
    ...value.split(/\b(?:in|of|for|with)\b/i).slice(1),
    ...value.split(/[()[\]:;/+-]/),
  ];
  for (const chunk of chunks) {
    const words = (chunk.match(/[A-Za-z0-9]+/g) || [])
      .map((word) => word.toLowerCase())
      .filter((word) => word.length > 1 && !ACRONYM_STOPWORDS.has(word));
    if (words.length < 2 || words.length > 8) continue;
    const acronym = words.map((word) => word[0]).join("");
    if (acronym.length >= 3) candidates.add(acronym);
  }
  const explicit = value.match(/\b[A-Z][A-Z0-9&]{1,}\b/g) || [];
  for (const token of explicit) {
    const normalizedToken = token.toLowerCase().replace(/&/g, "");
    if (normalizedToken.length >= 3) candidates.add(normalizedToken);
  }
  return [...candidates];
}

function websiteSlugs(urls: string[]): string[] {
  const slugs = new Set<string>();
  for (const rawUrl of urls) {
    try {
      const url = new URL(rawUrl);
      for (const part of url.hostname.split(".")) {
        if (part.length > 1 && !["www", "com", "edu", "hk"].includes(part)) slugs.add(part);
      }
      for (const part of url.pathname.split(/[/?#._-]+/)) {
        if (part.length > 1) slugs.add(part);
      }
    } catch {
      // Ignore malformed source URLs.
    }
  }
  return [...slugs];
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactSearchText(value: string) {
  return normalizeSearchText(value).replace(/\s+/g, "");
}

function tokenPrefixMatch(query: string, indexTokens: string[]) {
  const queryTokens = query.split(" ").filter(Boolean);
  if (queryTokens.length === 0) return false;
  if (queryTokens.every((token) => token.length <= 2)) return false;
  return queryTokens.every((queryToken) => {
    if (queryToken.length === 1) return indexTokens.includes(queryToken);
    return indexTokens.some((token) => token.startsWith(queryToken));
  });
}

function compactMatch(compactQuery: string, index: SearchIndex) {
  if (compactQuery.length < 2) return false;
  if (compactQuery.length <= 2) {
    return index.shortAliases.includes(compactQuery);
  }
  return index.compact.includes(compactQuery);
}

function isShortSearch(query: string, compactQuery: string) {
  // The ≤2-char "alias only" gate exists to stop noisy Latin acronyms (e.g. "ba"
  // matching every "…ba…" substring). CJK is the opposite: two characters is a
  // precise term (數學, 物理, 工商, 統計…), so a CJK query should match the
  // programme name directly, not just curated aliases.
  if (/[一-鿿]/.test(query)) return false;
  return !query.includes(" ") && [...compactQuery].length <= 2;
}
