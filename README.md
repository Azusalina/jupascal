# Self-customized version of jupascal

## What is it?

A personal HKU/HKUST admission-score calculator, referring to
https://www.jupascal.com. It supports 17 HKU and 19 HKUST programmes with 2026
calculation formulas, a programme list and an interactive pathway tree.

## How to use

Requires Node.js 20+.

```bash
npm install
npm run dev
npm run build
```

Open the local URL printed by Vite. Enter your grades and choose a programme.
Open Filter in the list and use All / HKU / HKUST to show both universities or
one university. The pathway tree has the same university switch; the choice
stays the same when switching views.

Run `npm test` to audit source data and calculations. More technical details,
source validation and license information are in [description.md](description.md).
