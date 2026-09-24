// Build static pages and bundle only the personal calculator's runtime data.
import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
const data = JSON.parse(readFileSync('data/processed/JUPAS_2026_Unified_Data.json', 'utf8'));
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const page = (title, body, home) => `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><style>body{font:17px/1.6 system-ui;max-width:850px;margin:40px auto;padding:20px;color:#252321;background:#fbf5ef}a{color:#476348}li{margin:12px 0}small{color:#65625e}</style><main><a href="${home}">Open personal calculator</a><h1>${escape(title)}</h1>${body}</main></html>`;
mkdirSync('dist/programmes', { recursive:true });
writeFileSync('dist/programmes/index.html', page('HKU & HKUST · 2026', `<ul>${data.map(p => `<li><a href="../p/${p.jupas_code}/">${p.jupas_code} · ${escape(p.institution)} · ${escape(p.name_en)}</a></li>`).join('')}</ul>`, '../'));
for (const p of data) {
  const refs = Object.entries(p.scores_2025).filter(([,v]) => v != null).map(([k,v]) => `${escape(k)}: ${v}`).join(' · ');
  const expected = p.expected_score_2026 == null ? '' : `<p>2026 expected score: <strong>${p.expected_score_2026}</strong></p>`;
  const historical = refs ? `<h2>2025 historical admission figures</h2><p>${refs}</p>${p.historical_comparable === false ? '<p>The scoring basis changed. These figures are reference only and are not directly comparable with the 2026 score.</p>' : ''}` : '';
  const dir = `dist/p/${p.jupas_code}`;
  mkdirSync(dir, { recursive:true });
  writeFileSync(`${dir}/index.html`, page(`${p.jupas_code} · ${p.name_en}`, `<p>${escape(p.institution)} · ${escape(p.faculty)}</p><h2>2026 calculation</h2><p>${escape(p.formula_2026)}</p>${expected}${historical}<p><a href="../../?p=${p.jupas_code}">Calculate my score</a></p>`, '../../'));
}
const paths = ['/', '/programmes/', ...data.map(p=>`/p/${p.jupas_code}/`)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(p=>`<url><loc>https://jupascal.com${p}</loc></url>`).join('')}</urlset>`;
writeFileSync('dist/sitemap.xml', sitemap);
for (const file of ['JUPAS_2026_Unified_Data.json','JUPAS_2026_Unified_Data.version','programme_details_2026.json']) {
  mkdirSync('dist/data/processed',{recursive:true}); cpSync(`data/processed/${file}`,`dist/data/processed/${file}`);
}
mkdirSync('dist/data/raw',{recursive:true}); cpSync('data/raw/subjects.canonical.json','dist/data/raw/subjects.canonical.json');
console.log(`Built ${data.length} programme pages and bundled personal runtime data.`);
