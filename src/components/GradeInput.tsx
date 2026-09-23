import { memo, useEffect, useRef, useState } from "react";
import { CORE_SUBJECTS, CSD_GRADES, DSE_GRADES, M12_SUBJECT, M1_SUBJECT } from "../lib/subjects";
import { hasCompletePersonalGrades, PERSONAL_ELECTIVES } from "../lib/personalDefaults";
import { localizedSubject, localizedSubjectChip } from "../lib/subjectsI18n";
import { useLang, type Lang } from "../lib/i18n";
import { MOBILE_MEDIA_QUERY } from "../lib/useMediaQuery";
import type { StudentGrades } from "../types/jupas";
import "./GradeInput.css";


type Props = {
  grades: StudentGrades;
  onChange: (grades: StudentGrades) => void;
  onReset: () => void;
  // View mode: disables every grade button + elective select and hides
  // the Reset/Done footer actions. Users can still scroll through the
  // panel to see what the shared profile has entered.
  readOnly?: boolean;
  // Console only: tapping anywhere on the header (title + summary pills), not
  // just the Done/Edit button, toggles the collapse. Off for the mobile stepper.
  headerToggles?: boolean;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onComplete?: () => void;
};

const ELECTIVE_SLOTS = ["elective-1", "elective-2", "elective-3"];

export const GradeInput = memo(({ grades, onChange, onReset, readOnly = false, headerToggles = false, collapsed: controlledCollapsed, onCollapsedChange, onComplete }: Props) => {
  const { t, lang } = useLang();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;
  const [isStuck, setIsStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  function setCollapsed(next: boolean | ((current: boolean) => boolean)) {
    const value = typeof next === "function" ? next(collapsed) : next;
    if (controlledCollapsed === undefined) setInternalCollapsed(value);
    onCollapsedChange?.(value);
  }

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsStuck(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);
  function setGrade(subject: string, grade: string) {
    const next = { ...grades };
    if (grade) next[subject] = grade;
    else delete next[subject];
    commitGradeState(next);
  }

  const extGrade = grades[M1_SUBJECT] || grades[M12_SUBJECT] || "";

  function writeExtMath(grade: string) {
    const next = { ...grades };
    delete next[M1_SUBJECT];
    delete next[M12_SUBJECT]; // collapse any legacy combined entry to a single source
    next["m12:module"] = M1_SUBJECT;
    if (grade) next[M1_SUBJECT] = grade;
    commitGradeState(next);
  }

  function commitGradeState(next: StudentGrades) {
    const cleaned = cleanGradeState(next);
    const justCompleted = !hasCompletePersonalGrades(grades) && hasCompletePersonalGrades(cleaned);
    onChange(cleaned);
    if (justCompleted) {
      setCollapsed(true);
      onComplete?.();
    }
  }

  function reset() {
    onReset();
    setCollapsed(false);
    if (window.matchMedia?.(MOBILE_MEDIA_QUERY).matches) {
      document.querySelector(".grade-panel")?.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }

  function finishMobileEntry() {
    setCollapsed(true);
  }

  return (
    <section className={`panel grade-panel${collapsed ? " mobile-collapsed" : ""}${readOnly ? " is-readonly" : ""}`} aria-label={t("grade.ariaPanel")}>
      <div ref={sentinelRef} aria-hidden="true" className="sticky-sentinel" />
      <div
        className={`${isStuck ? "panel-heading is-stuck" : "panel-heading"}${headerToggles ? " is-tappable" : ""}`}
        onClick={headerToggles ? () => setCollapsed((c) => !c) : undefined}
      >
        <div className="step-title-content">
          <p className="eyebrow">{t("grade.eyebrow")}</p>
          <h2>{t("grade.title")}</h2>
        </div>
        <div className="grade-actions">
          <button
            className="ghost-button mobile-collapse-toggle"
            type="button"
            onClick={(event) => { event.stopPropagation(); setCollapsed(!collapsed); }}
          >
            {collapsed ? t("grade.edit") : t("grade.done")}
          </button>
        </div>
        <GradeTitleSummary grades={grades} />
      </div>

      <div className="grade-panel-body">
        <h3 className="grade-section-title">{t("grade.core")}</h3>
        <div className="grade-grid">
          {CORE_SUBJECTS.map((subject) => (
            <div className="field" key={subject}>
              <span>{localizedSubject(subject, lang)}</span>
              <GradeButtons
                value={grades[subject] || ""}
                grades={subject.includes("Citizenship") ? CSD_GRADES.filter(Boolean) : DSE_GRADES.filter(Boolean)}
                disabled={readOnly}
                onChange={(grade) => setGrade(subject, grade)}
              />
            </div>
          ))}
          <div className="field">
            <span className="field-head">
              {t("grade.mathExt")}
              <span className="ext-math-toggle" aria-label="M1">
                <span className="ext-module active">M1</span>
              </span>
            </span>
            <GradeButtons
              value={extGrade}
              grades={DSE_GRADES.filter(Boolean)}
              disabled={readOnly}
              onChange={writeExtMath}
            />
          </div>
        </div>

        <hr className="grade-section-divider" />

        <div className="elective-block">
          <h3>{t("grade.electives")}</h3>
          {ELECTIVE_SLOTS.map((slot, index) => {
            const subject = PERSONAL_ELECTIVES[index];
            return (
              <div className="elective-row" key={slot}>
                <span className="fixed-elective-subject">{localizedSubject(subject, lang)}</span>
                <GradeButtons
                  value={grades[subject] || ""}
                  grades={DSE_GRADES.filter(Boolean)}
                  disabled={readOnly}
                  compact
                  onChange={(grade) => setGrade(subject, grade)}
                />
              </div>
            );
          })}

        </div>
        {readOnly ? null : (
          <div className="grade-footer-actions">
            <button className="grade-reset-button" type="button" onClick={reset}>
              {t("grade.reset")}
            </button>
            <button className="done-button" type="button" onClick={finishMobileEntry}>
              {t("grade.done")}
            </button>
          </div>
        )}
      </div>
    </section>
  );
});

const GradeButtons = memo(({
  value,
  grades,
  labels,
  disabled = false,
  compact = false,
  fit = false,
  onChange,
}: {
  value: string;
  grades: string[];
  // Optional display override: button shows labels[grade], onChange still emits
  // the full grade value (used for ApL's long result names).
  labels?: Record<string, string>;
  disabled?: boolean;
  compact?: boolean;
  fit?: boolean;
  onChange: (grade: string) => void;
}) => {
  return (
    <div className={`${compact ? "grade-buttons compact" : "grade-buttons"}${fit ? " is-fit" : ""}`} role="radiogroup">
      {grades.map((grade) => (
        <button
          key={grade}
          type="button"
          className={value === grade ? "grade-chip active" : "grade-chip"}
          disabled={disabled}
          role="radio"
          aria-checked={value === grade}
          onClick={() => onChange(value === grade ? "" : grade)}
        >
          {labels?.[grade] ?? grade}
        </button>
      ))}
    </div>
  );
});

function cleanGradeState(grades: StudentGrades) {
  const next = { ...grades };
  for (const [key, value] of Object.entries(next)) {
    if (!value) delete next[key];
  }
  return next;
}

export function GradeTitleSummary({ grades }: { grades: StudentGrades }) {
  const { t, lang } = useLang();
  // Show the third summary pill once its subject is selected.
  const showIfPicked = (slot: string) => Boolean(grades[`${slot}:subject`]);
  // Extended maths is fixed to M1 in this personal build.
  const extGrade = grades[M1_SUBJECT] || grades[M12_SUBJECT];
  const extLabel = "M1";
  const items: Array<{ key: string; label: string; grade?: string }> = [
    { key: "Chi", label: t("grade.sum.chi"), grade: grades["Chinese Language"] },
    { key: "Eng", label: t("grade.sum.eng"), grade: grades["English Language"] },
    { key: "Math", label: t("grade.sum.math"), grade: grades["Mathematics (Compulsory Part)"] },
    { key: "CSD", label: t("grade.sum.csd"), grade: grades["Citizenship and Social Development"] },
    { key: "M1/2", label: extLabel, grade: extGrade },
    ...electiveItem(grades, "elective-1", "E1", lang),
    ...electiveItem(grades, "elective-2", "E2", lang),
    ...(showIfPicked("elective-3") ? electiveItem(grades, "elective-3", "E3", lang) : []),
  ];

  return (
    <div className="grade-title-summary" aria-label={t("grade.summaryAria")}>
      {items.map(({ key, label, grade }) => (
        <span className={grade ? "grade-summary-cell filled" : "grade-summary-cell"} key={key}>
          <b className={label.length > 3 ? "compact-label" : undefined}>{label}</b>
          <em>{grade || "-"}</em>
        </span>
      ))}
    </div>
  );
}

function electiveItem(grades: StudentGrades, slot: string, placeholder: string, lang: Lang) {
  const subject = grades[`${slot}:subject`];
  // When a subject is picked, surface its compact chip form (Bio/生物, …) so a
  // glance at the summary tells you which electives are populated. Empty slots
  // fall back to E1/E2/E3/E4.
  const label = subject ? localizedSubjectChip(subject, lang) : placeholder;
  return [{ key: slot, label, grade: subject ? grades[subject] : undefined }];
}
