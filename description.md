# JUPASCal details

## Structure

```
index.html, src/, vite.config.ts   the React app (repo root)
data/processed/                    the runtime dataset the app fetches
data/raw/                          source files + subject vocabulary
scripts/extraction/                per-institution scrapers
scripts/utils/                     unification + validation
scripts/*.mjs                      JS audit harnesses (npm run audit*)
docs/manuals/                      architecture & calculation notes
.github/workflows/static.yml       build + deploy to GitHub Pages on pushes to the default branch
```

## License

The source code is licensed under the **[MIT License](LICENSE)** — you're free to
use, copy, modify, and distribute it, with attribution. Contributions are very
welcome.


## University display and source validation

The list and pathway tree share an All / HKU / HKUST university switch. The switch
survives changes between the two views, including the selected-only list. A single
university fills the list width; the tree contains only that university’s branch.
Saved programme selections and grades are preserved. Tree comparisons discard
nodes that leave the displayed scope. The display choice resets to All on reload.

The retained scope remains 17 HKU and 19 HKUST programmes. On 2026-10-10, all
17 HKU names, 2026 formulas and UQ/median/LQ values matched
`../updatedata2026/hku26.md`. No data correction was necessary. The automated
source audit now checks programme names as well as formulas and scores. HKUST
source values were not changed by this update. Rebuild data only with
`python3 scripts/utils/unify_2026_data.py`; do not edit the generated JSON.

Validation: `npm test`, `npm run build`, and browser interaction checks for both
desktop and mobile university switching.
