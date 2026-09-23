import type { Programme } from "../types/jupas";

/**
 * A programme's non-admission characteristics, all on a 0–10 scale.
 *
 * This model is deliberately separate from HKDSE scoring.  The values are a
 * first-pass decision model distilled from the retained 2026 programme
 * descriptions and the user's questionnaire; they are not university claims
 * or outcome guarantees.  Information Day findings should be used to revise
 * the programme-side values, especially role clarity and flexibility.
 */
export type PersonalDimensionKey =
  | "quantitativeModelling"
  | "dataAiDecision"
  | "businessFinance"
  | "codingIntensity"
  | "theoryDepth"
  | "workStyleFit"
  | "incomeUpside"
  | "stability"
  | "financialCentreFit"
  | "specialistSignal"
  | "flexibility"
  | "postgraduateLeverage";

export type PersonalDimension = {
  key: PersonalDimensionKey;
  weight: number;
  target: number;
  label: { en: string; zh: string };
  description: { en: string; zh: string };
};

export const PERSONAL_DIMENSIONS: readonly PersonalDimension[] = [
  {
    key: "quantitativeModelling", weight: 14, target: 9,
    label: { en: "Quantitative modelling", zh: "數學及量化建模" },
    description: { en: "Mathematics, optimization and modelling of real systems.", zh: "數學、最優化，以及把現實系統轉化成模型的深度。" },
  },
  {
    key: "dataAiDecision", weight: 9, target: 8,
    label: { en: "Data, AI & decisions", zh: "數據、AI 及決策" },
    description: { en: "Using statistics, data and AI to make defensible decisions.", zh: "運用統計、數據及 AI 作出可論證的決策。" },
  },
  {
    key: "businessFinance", weight: 7, target: 7,
    label: { en: "Business & finance", zh: "商業及金融關聯" },
    description: { en: "Exposure to firms, markets, capital and commercial decisions.", zh: "接觸企業、市場、資本及商業決策的程度。" },
  },
  {
    key: "codingIntensity", weight: 7, target: 5,
    label: { en: "Coding intensity", zh: "Coding 強度" },
    description: { en: "The ideal is purposeful, moderate coding—not a software-only path.", zh: "理想是把 coding 當重要工具，但不讓軟件開發佔據整條職業路徑。" },
  },
  {
    key: "theoryDepth", weight: 5, target: 7,
    label: { en: "Theory & proof depth", zh: "理論及證明深度" },
    description: { en: "Rigour, abstraction and foundations that support later specialization.", zh: "嚴謹理論、抽象思維及支援日後專精的基礎。" },
  },
  {
    key: "workStyleFit", weight: 8, target: 9,
    label: { en: "Preferred work style", zh: "理想工作方式" },
    description: { en: "Analytical, non-repetitive work with limited rote, compliance and presentation load.", zh: "偏分析、非重複；較少死記、合規及高密度 presentation 的工作方式。" },
  },
  {
    key: "incomeUpside", weight: 10, target: 9,
    label: { en: "Income upside", zh: "收入上限" },
    description: { en: "Potential access to well-paid quantitative or professional roles.", zh: "通往高薪量化或專業職位的潛力。" },
  },
  {
    key: "stability", weight: 9, target: 8,
    label: { en: "Career stability", zh: "職業穩定性" },
    description: { en: "Breadth of durable demand without relying on one volatile niche.", zh: "具持久需求，且不完全依賴單一高波動細分市場。" },
  },
  {
    key: "financialCentreFit", weight: 9, target: 9,
    label: { en: "Financial-centre fit", zh: "金融中心職涯匹配" },
    description: { en: "Fit with a professional, quantitative career in Hong Kong or another major commercial centre.", zh: "與香港或其他主要商業中心內的專業量化白領職涯相符程度。" },
  },
  {
    key: "specialistSignal", weight: 11, target: 9,
    label: { en: "Specialist signal / moat", zh: "專業身份及護城河" },
    description: { en: "How clearly the degree signals a defensible specialty to employers.", zh: "學位能否向僱主清楚傳達可防守的專長，避免「萬金油」風險。" },
  },
  {
    key: "flexibility", weight: 6, target: 8,
    label: { en: "Pathway flexibility", zh: "路徑彈性" },
    description: { en: "Room for electives, a second major/minor and later course correction.", zh: "透過選修、第二主修／副修及後續轉向保留選擇的空間。" },
  },
  {
    key: "postgraduateLeverage", weight: 5, target: 9,
    label: { en: "Postgraduate leverage", zh: "深造槓桿" },
    description: { en: "Strength as a foundation for a targeted MSc, MPhil or PhD.", zh: "作為針對性 MSc、MPhil 或 PhD 基礎的強度。" },
  },
] as const;

export type ProgrammePersonalParameters = Record<PersonalDimensionKey, number>;

const P = (
  quantitativeModelling: number,
  dataAiDecision: number,
  businessFinance: number,
  codingIntensity: number,
  theoryDepth: number,
  workStyleFit: number,
  incomeUpside: number,
  stability: number,
  financialCentreFit: number,
  specialistSignal: number,
  flexibility: number,
  postgraduateLeverage: number,
): ProgrammePersonalParameters => ({
  quantitativeModelling,
  dataAiDecision,
  businessFinance,
  codingIntensity,
  theoryDepth,
  workStyleFit,
  incomeUpside,
  stability,
  financialCentreFit,
  specialistSignal,
  flexibility,
  postgraduateLeverage,
});

// Order for P(): quant, data/AI, business/finance, coding, theory, work style,
// income, stability, financial-centre fit, specialist signal, flexibility, PG.
// Every retained programme is explicit so a newly introduced programme cannot
// silently inherit a flattering generic score.
const PROGRAMME_PARAMETERS: Record<string, ProgrammePersonalParameters> = {
  JS5102: P(8, 5, 2, 4, 8, 7, 7, 7, 4, 4, 9, 9),
  JS5103: P(4, 4, 2, 3, 7, 6, 6, 7, 3, 4, 9, 9),
  JS5181: P(8, 8, 2, 7, 8, 7, 8, 7, 5, 6, 8, 9),
  JS5300: P(3, 4, 8, 2, 3, 4, 8, 7, 9, 4, 9, 7),
  JS5311: P(6, 6, 9, 3, 6, 6, 8, 7, 9, 7, 7, 8),
  JS5312: P(6, 6, 10, 4, 5, 5, 9, 7, 10, 8, 6, 8),
  JS5313: P(3, 4, 9, 2, 3, 3, 9, 6, 10, 8, 7, 7),
  JS5314: P(5, 8, 8, 7, 4, 6, 8, 8, 9, 8, 7, 8),
  JS5315: P(2, 3, 8, 2, 3, 3, 7, 7, 8, 6, 7, 6),
  JS5316: P(3, 7, 9, 4, 3, 4, 8, 6, 9, 6, 7, 6),
  JS5317: P(7, 6, 8, 5, 4, 7, 7, 8, 7, 7, 7, 8),
  JS5318: P(4, 5, 9, 3, 3, 2, 8, 9, 9, 10, 4, 7),
  JS5331: P(7, 6, 10, 4, 7, 6, 9, 7, 10, 9, 5, 9),
  JS5332: P(10, 8, 10, 7, 8, 8, 10, 7, 10, 10, 4, 10),
  JS5411: P(2, 5, 7, 2, 4, 3, 6, 6, 7, 5, 7, 7),
  JS5412: P(7, 9, 6, 6, 6, 7, 7, 7, 6, 7, 7, 9),
  JS5813: P(10, 6, 8, 4, 10, 9, 8, 8, 8, 9, 7, 10),
  JS5814: P(9, 9, 9, 7, 7, 8, 9, 9, 10, 9, 6, 10),
  JS5822: P(5, 7, 10, 4, 5, 5, 8, 7, 9, 7, 7, 8),

  JS6200: P(8, 9, 4, 9, 7, 5, 9, 8, 7, 9, 6, 9),
  JS6224: P(8, 10, 5, 8, 8, 6, 9, 8, 7, 9, 8, 10),
  JS6248: P(8, 9, 10, 8, 6, 7, 10, 8, 10, 9, 6, 9),
  JS6705: P(4, 7, 3, 3, 7, 5, 6, 8, 4, 7, 7, 9),
  JS6717: P(3, 5, 6, 2, 5, 3, 6, 7, 5, 3, 9, 8),
  JS6729: P(10, 8, 9, 6, 8, 8, 9, 10, 10, 10, 5, 10),
  JS6731: P(2, 4, 3, 1, 4, 6, 5, 10, 3, 10, 3, 7),
  JS6755: P(3, 5, 9, 3, 3, 4, 8, 7, 9, 5, 9, 7),
  JS6767: P(7, 6, 10, 4, 8, 6, 9, 8, 10, 9, 7, 9),
  JS6779: P(9, 10, 7, 7, 8, 9, 9, 9, 9, 4, 9, 10),
  JS6781: P(5, 7, 10, 5, 4, 3, 8, 9, 9, 9, 6, 8),
  JS6793: P(8, 9, 9, 7, 6, 7, 9, 8, 10, 8, 7, 9),
  JS6846: P(5, 9, 9, 6, 4, 5, 8, 6, 9, 7, 7, 7),
  JS6860: P(6, 6, 10, 4, 5, 4, 10, 7, 10, 10, 4, 8),
  JS6884: P(10, 8, 10, 7, 9, 8, 10, 7, 10, 10, 5, 10),
  JS6896: P(3, 4, 10, 2, 3, 2, 9, 6, 10, 9, 7, 7),
  JS6999: P(8, 10, 4, 9, 8, 5, 9, 8, 7, 9, 7, 10),
};

export type PersonalValueRow = PersonalDimension & {
  programmeValue: number;
  match: number;
  contribution: number;
  lostPoints: number;
};

export type PersonalValueResult = {
  score: number;
  rows: PersonalValueRow[];
  strongest: PersonalValueRow[];
  gaps: PersonalValueRow[];
  band: "excellent" | "strong" | "conditional" | "weak";
};

export function hasPersonalParameters(code: string): boolean {
  return Object.prototype.hasOwnProperty.call(PROGRAMME_PARAMETERS, code);
}

export function personalValueFor(programme: Pick<Programme, "jupas_code">): PersonalValueResult {
  const parameters = PROGRAMME_PARAMETERS[programme.jupas_code];
  if (!parameters) {
    throw new Error(`Missing personal-value parameters for ${programme.jupas_code}`);
  }

  const rows = PERSONAL_DIMENSIONS.map((dimension) => {
    const programmeValue = parameters[dimension.key];
    const match = Math.max(0, 1 - Math.abs(programmeValue - dimension.target) / 10);
    const contribution = dimension.weight * match;
    return {
      ...dimension,
      programmeValue,
      match,
      contribution,
      lostPoints: dimension.weight - contribution,
    };
  });
  const score = rows.reduce((sum, row) => sum + row.contribution, 0);
  const strongest = [...rows]
    .sort((a, b) => b.contribution - a.contribution || b.weight - a.weight)
    .slice(0, 3);
  const gaps = [...rows]
    .sort((a, b) => b.lostPoints - a.lostPoints || b.weight - a.weight)
    .slice(0, 3);

  return {
    score,
    rows,
    strongest,
    gaps,
    band: score >= 85 ? "excellent" : score >= 75 ? "strong" : score >= 65 ? "conditional" : "weak",
  };
}
