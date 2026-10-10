import { useLang } from "../lib/i18n";

export type InstitutionScope = "all" | "HKU" | "HKUST";

export function InstitutionSwitch({ value, onChange, variant = "toolbar" }: {
  value: InstitutionScope;
  onChange: (value: InstitutionScope) => void;
  variant?: "toolbar" | "filter";
}) {
  const { t } = useLang();
  return (
    <div className={`institution-switch ${variant === "filter" ? "university-filter-group" : "browse-display-switch"}`} role="group" aria-label={t("browse.institutionAria")}>
      <span>{t("browse.institutionLabel")}</span>
      {(["all", "HKU", "HKUST"] as const).map((scope) => (
        <button type="button" key={scope} className={`${variant === "filter" ? "pill " : ""}${value === scope ? "active" : ""}`}
          aria-pressed={value === scope} onClick={() => onChange(scope)}>
          {scope === "all" ? t("browse.institutionAll") : scope}
        </button>
      ))}
    </div>
  );
}
