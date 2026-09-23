# Personal HKU / HKUST calculator

Run commands from this existing `JUPASCal` checkout:

```sh
npm run dev         # http://localhost:5174
npm run data:build  # Python 3 standard library; regenerate programme data
npm test            # source, scope, scoring, eligibility and profile checks
npm run build       # TypeScript, Vite, scoped static pages and runtime data
```

The calculator contains 17 HKU and 19 HKUST programmes. The explicit programme
list in `scripts/utils/unify_2026_data.py` prevents deleted programmes from
returning during a rebuild. Saved/shared selections are restricted to the same
list. M1 is preselected for new profiles and grade resets; all grades stay blank.
Existing saved subject selections are respected.

Every calculated score uses the 2026 formula. Subject assignments maximise the
weighted total including an applicable sixth/seventh-subject bonus. Extended
maths counts once. HKUST's sixth-subject bonus requires at least three converted
points; eligible Category B/C subjects follow the supplied 2026 policy.

The supplied `../UpToDateData2026/hku.md` and `hkust.md` are authoritative for
fields they contain. Rebuilding reads them when available and stores only the
retained 2026 rows in `data/personal/` for standalone use. The supplied originals
remain intact outside the checkout. The generated master JSON is never edited
by hand. Supplemental 2026 requirements, interviews, shared quotas, descriptions
and historical offer statistics are retained only for the selected programmes.
Their provenance is recorded in `programme_metadata_2026.json`; the HKUST
Markdown does not specify complete programme-level entrance requirements.

Published 2025 admission figures remain labelled historical reference data.
There are no historical scoring formulas or calculation modes. JS6224, JS6248
and JS6999 have changed scoring bases, so their historical figures are displayed
without deltas or admission bands. HKUST's 2026 expected scores and flexible
admissions conditions are displayed separately from standard eligibility.

Other institutions' reference files, mixed datasets, extraction tools and
calculation branches have been removed. The upstream README files and LICENSE
are intentionally unchanged, as requested; this document describes the personal
version. Git history is preserved.

The personal grade form fixes BAFS, ICT and Economics in three elective slots. Subject selectors, Category C languages, ApL and retake controls are removed. Saved/imported profiles discard unsupported grades and retake flags. Core subjects and M1 remain available.
The default profile selects BAFS, ICT and Economics in that order, sets Citizenship and Social Development to A, and uses M1 as the only extended-maths module.

## Pathway tree ranking

The Browse view can switch between the existing table and a horizontal pathway
tree: entered grades → HKU / HKUST → undergraduate major → possible master's
pathways. Ranking compares programmes with different raw scoring scales by first
normalising each programme's JUPAS score:

```text
J = calculated JUPAS score / programme maximum achievable score × 100
P = personal-fit score (0–100)
Hybrid = 0.5J + 0.5P
Custom mix = wJ + (1 − w)P
```

`w` is the adjustable JUPAS weight from 0% to 100%. JUPAS-only and
personal-fit-only sorting use `J` and `P` respectively. Grade changes rerun the
programme calculations and animate the resulting row order. Major and master's
nodes can be opened for details or selected in pairs for comparison.
