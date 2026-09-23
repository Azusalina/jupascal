self-customized version of jupascal , referring to [jupascal.com]

Requires Node.js 20+.

```bash
npm install
npm run dev      
npm run build  
```



## structure

```
index.html, src/, vite.config.ts   the React app (repo root)
data/processed/                    the runtime dataset the app fetches
data/raw/                          source files + subject vocabulary
scripts/extraction/                per-institution scrapers
scripts/utils/                     unification + validation
scripts/*.mjs                      JS audit harnesses (npm run audit*)
docs/manuals/                      architecture & calculation notes
.github/workflows/deploy.yml       build + deploy to GitHub Pages
```

## License

The source code is licensed under the **[MIT License](LICENSE)** — you're free to
use, copy, modify, and distribute it, with attribution. Contributions are very
welcome.

