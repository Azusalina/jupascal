import type { Lang, Translate } from "./i18n";
import type { Programme } from "../types/jupas";
export type FormulaDescription = { text: string; raw: string | null; showOfficial: boolean };
export function describeFormula(programme: Programme, _year: "2026", _lang: Lang, t: Translate): FormulaDescription {
  return { text: programme.formula_2026 || t("detail.formulaNA"), raw: null, showOfficial: false };
}
