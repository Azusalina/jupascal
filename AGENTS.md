# Personal JUPASCal

Work in this checkout in place. Preserve Git history, LICENSE and README.

Only the 17 HKU and 19 HKUST programmes in `scripts/utils/unify_2026_data.py`
are supported. Never restore excluded programmes or other institutions.
All calculations use 2026 formulas. Historical 2025 admission figures are
reference data only; there is no 2025 calculation mode.

Use `python3 scripts/utils/unify_2026_data.py` (standard library only) to rebuild
the master JSON. Never edit the generated JSON by hand. Supplied sibling
`../UpToDateData2026/*.md` takes precedence over the scoped source snapshots
in `data/personal/`. Metadata absent from the Markdown is retained separately
with provenance in `programme_metadata_2026.json`.
For HKU, `../updatedata2026/hku26.md` overrides programme names, formulas and
all admission-score quartiles. Requirements absent from that file remain from
the existing 2026 source. The legacy `scores_2025` runtime field is tagged with
`benchmark_year` (2026 for this HKU source, 2025 for HKUST).

The app is React + TypeScript + Vite. Use `npm run dev`, `npm run build`,
and `npm test`. M1 is selected by default; grades start blank.
The existing desktop/mobile UI and local profiles remain supported.
