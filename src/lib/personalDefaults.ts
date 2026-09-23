import { CORE_SUBJECTS, M12_SUBJECT, M1_SUBJECT } from "./subjects";
import type { StudentGrades } from "../types/jupas";

const CSD_SUBJECT = "Citizenship and Social Development";

export const PERSONAL_ELECTIVES = [
  "Business, Accounting and Financial Studies",
  "Information and Communication Technology",
  "Economics",
];

export function defaultGrades(): StudentGrades {
  return {
    "m12:module": M1_SUBJECT,
    [CSD_SUBJECT]: "A",
    "elective-1:subject": PERSONAL_ELECTIVES[0],
    "elective-2:subject": PERSONAL_ELECTIVES[1],
    "elective-3:subject": PERSONAL_ELECTIVES[2],
  };
}

export function hasEnteredGrades(grades: StudentGrades): boolean {
  return Object.entries(grades).some(([subject, grade]) => !!grade && !/^(?:elective-[1-4]|cat-[bc]):subject$|^m12:module$/.test(subject));
}

// The personal build has a fixed subject set: four compulsory subjects, M1,
// and the three electives above. Keep this separate from JUPAS eligibility —
// it only controls when the grade editor can hand focus to Programme Choices.
export function hasCompletePersonalGrades(grades: StudentGrades): boolean {
  return CORE_SUBJECTS.every((subject) => Boolean(grades[subject]))
    && Boolean(grades[M1_SUBJECT] || grades[M12_SUBJECT])
    && PERSONAL_ELECTIVES.every((subject) => Boolean(grades[subject]));
}

// Keep legacy profiles usable without counting subjects hidden from this form.
export function personalGrades(grades: StudentGrades): StudentGrades {
  const allowed = new Set([...CORE_SUBJECTS, M1_SUBJECT, ...PERSONAL_ELECTIVES]);
  const next: StudentGrades = {};
  for (const [subject, grade] of Object.entries(grades)) {
    if (allowed.has(subject)) next[subject] = grade;
  }
  // M1 is the only supported extended-maths module in this personal build.
  // Preserve an old combined M1/M2 grade as M1, and discard old M2 values.
  if (!next[M1_SUBJECT] && grades[M12_SUBJECT]) next[M1_SUBJECT] = grades[M12_SUBJECT];
  next["m12:module"] = M1_SUBJECT;
  PERSONAL_ELECTIVES.forEach((subject, index) => {
    next[`elective-${index + 1}:subject`] = subject;
  });
  return next;
}
