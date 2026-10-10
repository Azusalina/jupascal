import { useLang } from "../lib/i18n";

export type InstitutionScope = "all" | "HKU" | "HKUST";

export function InstitutionSwitch({ value, onChange }: {
  value: InstitutionScope;
  onChange: (value: InstitutionScope) => void;
}) {
  const { t } = useLang();
  return (
    <div className="browse-display-switch institution-switch" role="group" aria-label={t("browse.institutionAria")}>
      <span>{t("browse.institutionLabel")}</span>
      {(["all", "HKU", "HKUST"] as const).map((scope) => (
        <button type="button" key={scope} className={value === scope ? "active" : ""}
          aria-pressed={value === scope} onClick={() => onChange(scope)}>
          {scope === "all" ? t("browse.institutionAll") : scope}
        </button>
      ))}
    </div>
  );
}
