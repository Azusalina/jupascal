export type Grade = "5**" | "5*" | "5" | "4" | "3" | "2" | "1" | "A" | "B" | "C" | "D" | "E" | "U" | "";

export type StudentGrades = Record<string, string>;

export type Profile = {
  id: string;
  name: string;
  grades: StudentGrades;
  // Profile-scoped picks. Optional for migration from pre-per-profile
  // localStorage shapes – reads should treat `undefined` as `[]`.
  pickedCodes?: (string | null)[];
  retakenSubjects?: string[];
};

export type RequirementPool = {
  count: number;
  subjects: string[];
  grade: string;
  note?: string;
};

export type MinRequirements = {
  chi?: string;
  eng?: string;
  math?: string;
  csd?: string;
  elect1?: RequirementPool;
  elect2?: RequirementPool;
  conditional_remarks?: string;
  // OR-alternatives: some JUPAS programmes list the requirement as two (or more)
  // acceptable patterns (e.g. JS1202: "Math 3 + any elective" OR "Math 2 +
  // a specific science elective", encoded on the listing as a conditional
  // elective row). A student is eligible if the base pattern OR ANY alternative
  // is fully satisfied. Each alternative is a self-contained pattern; its own
  // `alternatives` (if any) is ignored to keep the check one level deep.
  alternatives?: MinRequirements[];
};

export type BestOfPool = {
  count: number;
  subjects: string[];
  weight: number;
  slot?: string;
  [key: string]: unknown;
};

export type HkustFormulaStep = {
  type: "required" | "best_from_pool" | "better_of";
  subject?: string;               // required
  weight?: number;                // required
  subject_filter?: string[];      // best_from_pool — [] means "any remaining"
  weights?: Array<{ subjects: string[]; weight: number }>; // tiered pool weights
  options?: HkustFormulaStep[][]; // better_of — take whichever branch scores higher
  eligible_categories?: string[];
};

export type Constraint = {
  type: string;
  description?: string;
  subjects?: string[];
  count?: number;
  limit?: number;
  multiplier?: number;
  subject_count?: number;
  max_attainable_weighting?: number;
  bonus_percentage?: number;
  [key: string]: unknown;
};

export type Scores2025 = {
  median?: number | null;
  lq?: number | null;
  uq?: number | null;
  mean?: number | null;
  expected_score?: number | null;
  score_type?: "actual" | "estimated" | string;
};

export type ScoreConversionTable = {
  category_a?: Record<string, number>;
  category_c?: Record<string, number>;
};

export type OfferStatistic = {
  Year: number;
  Type: "Application" | "Offer" | string;
  School?: string;
  JUPAS?: string;
  Quota?: number;
  Total?: number;
  "Band A"?: number;
  "Band B"?: number;
  "Band C"?: number;
  "Band D"?: number;
  "Band E"?: number;
};

// One officially-scraped non-academic requirement (interview / portfolio /
// audition / practical / physical / written / aptitude test) — see unify Step 4c.
export type ProgrammeRequirement = {
  type: string; // interview | portfolio | audition | physical-test | practical-test | written-test | aptitude-test
  timing?: "pre-results" | "post-results" | "both" | string | null;
  when?: string; // human-readable timing detail ("Before results: Mid-June · After results: Late-July")
  before?: string | null;
  after?: string | null;
  date?: string | null;
  format?: string | null;
  salience?: "required" | "weighty" | "optional" | string; // provided by source (HKUST); else derived in selection.ts
  scored?: boolean; // HKUST: interview folded into the admission score
};

export type ScoreSlot = {
  subjects: string[];
  weight: number;
  weights: Record<string, number>;
  allow_category_c: boolean;
  compulsory: boolean;
};

export type Programme = {
  score_slots_2026: ScoreSlot[][];
  bonus_multiplier: number;
  bonus_min_points?: number;
  extended_math_or_category_c?: boolean;
  expected_score_2026?: number;
  flexible_admissions_2026?: { core_shortfall: number; affected_core_subjects: number; score_above_median: boolean; band: string };
  historical_comparable?: boolean;
  source_2026?: string;
  jupas_code: string;
  name_en: string;
  name_zh?: string | null;
  institution: string;
  faculty?: string | null;
  formula_2026?: string | null;
  formula_2026_id?: string | null;
  subject_weights_2026?: Record<string, number>;
  best_of_weights_2026?: BestOfPool[];
  // HKUST-only: the sequential graded-pool formula (English/Math ×2 → tiered
  // "best from pool" → best-of-other pools, optionally a `better_of`). This is
  // the AUTHORITATIVE HKUST model the calculator walks; the flat
  // subject_weights/best_of fields can't represent it and mislead the display,
  // so the DetailPanel breakdown renders from this for HKUST.
  hkust_formula_steps?: HkustFormulaStep[];
  // Noise-filtered 2025→2026 scoring changes (unify computes this; present only
  // when a real weighting/formula change exists). Drives the DetailPanel pills
  // + "what changed" panel.
  min_requirements_2026: MinRequirements;
  calculation_constraints?: Constraint[];
  score_conversion_table: ScoreConversionTable;
  // Category C (Other Languages) policy — DATA-DRIVEN (emitted by unify's curated
  // table) so the rule isn't a hardcoded JS-code list in the runtime:
  //   "none"                – Cat C ignored entirely (both eligibility & scoring)
  //   "elective_cat_a_only" – Cat C can't satisfy an elective (may still score)
  //   "score_excluded"      – Cat C not counted in the score, but may still satisfy
  //                           an elective for eligibility (HKU programmes whose
  //                           scoring formula lacks the "a"/"c" Cat-C footnote)
  //   undefined             – standard (Cat C per the institution's score policy)
  category_c_policy?: "none" | "elective_cat_a_only" | "score_excluded";
  apl_policy?: "none" | "any" | string[];
  apl_max?: number;
  apl_bonus_only?: boolean;
  max_achievable_score?: number | null;
  scores_2025: Scores2025;
  offer_statistics?: OfferStatistic[];
  retake?: {
    penalty: string | null;                           // "10%" | "5% or less" | "6% to 10%" | null
    scope: "retake_subject" | "admission_score";
    consideration?: string;                           // HKU only
    policy_en?: string | null;
    source?: string | null;
  } | null;
  quota?: number | null;
  // Joint-admission intake shared across several programmes: the combined total
  // + the JS codes that share it (so the UI can say "N places shared across M").
  quota_shared?: { total: number | null; codes: string[] } | null;
  remarks?: string | null;

  non_academic?: ProgrammeRequirement[] | null;

  // JUPAS-site baseline (populated by scripts/extraction/jupas_detail_scrap.py)
  jupas_url?: string | null;
  short_description?: string | null;
  programme_websites?: string[] | null;
  tuition_fee_first_year?: string | null;
  tuition_fee_full_text?: string | null;
  contacts_text?: string | null;
  study_level?: string | null;
  jupas_requirements?: JupasRequirements | null;
};

export type JupasRequirement = {
  subject: string;
  min_level: string;
};

export type JupasRequirements = {
  programme_core?: JupasRequirement[];
  programme_electives?: JupasRequirement[];
  general_core?: JupasRequirement[];
  general_electives?: JupasRequirement[];
  notes?: string[];
  raw_text?: string;
};

export type CandidateScore = {
  subject: string;
  grade: string;
  basePoints: number;
  multiplier: number;
  weightedScore: number;
  isCompulsory: boolean;
  isBestOfPool: boolean;
  used: boolean;
  isBonus: boolean;
  bonusValue?: string;
  // This selected subject had a HKDSE retake penalty applied (HKU per-subject
  // model). `weightedScore` is already the post-penalty value.
  retakePenalized?: boolean;
};

// The HKDSE retake / repeater penalty actually applied to a computed score.
// Present only when the student is a retaker AND the programme penalises it.
export type CalculationResult = {
  totalScore: number;
  formula?: string | null;
  selected: CandidateScore[];
  allCandidates: CandidateScore[];
  score_type: string;
  // Set when a retake penalty was applied — `totalScore` is already net of it.
};

export type EligibilityDetail = {
  label: string;
  pass: boolean;
  got: string;
  need?: string;
  note?: string;
};

export type EligibilityResult = {
  eligible: boolean;
  details: EligibilityDetail[];
};

export type BenchmarkKey = "uq" | "median" | "lq" | "mean" | "expected_score";

export type BenchmarkComparison = {
  key: BenchmarkKey;
  label: string;
  score: number;
  delta: number;
  percent: number;
};

export type BenchmarkBand = "above-uq" | "above-median" | "above-lq" | "below-lq" | "no-score";

export type ProgrammeResult = {
  programme: Programme;
  calculation: CalculationResult;
  eligibility: EligibilityResult;
  comparisons: BenchmarkComparison[];
  band: BenchmarkBand;
  hasScoreData: boolean;
};
