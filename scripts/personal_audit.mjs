import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { build } from 'esbuild';
const read = path => JSON.parse(readFileSync(path, 'utf8'));
const data = read('data/processed/JUPAS_2026_Unified_Data.json');
const registry = read('data/raw/subjects.canonical.json');
const byCode = Object.fromEntries(data.map(p => [p.jupas_code, p]));
const load = async entry => {
  const output = await build({ entryPoints:[entry], bundle:true, write:false, format:'esm', platform:'node',
    define:{__ADMISSION_CYCLE__:'"2026"'}, logLevel:'silent' });
  return import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].text).toString('base64'));
};
const { calculateScore, checkEligibility } = await load('src/lib/calculator.ts');
const { buildProgrammeResult, effectiveBenchmarks } = await load('src/lib/results.ts');
const { defaultGrades, hasEnteredGrades } = await load('src/lib/personalDefaults.ts');
const { PERSONAL_DIMENSIONS, hasPersonalParameters, personalValueFor } = await load('src/lib/personalization.ts');
const { normalizedJupasScore, pathwayRank, sortPathwayResults } = await load('src/lib/pathwayRanking.ts');
const { PROGRAMME_CODE_PATTERN, sanitizeGrades } = await load('src/lib/hashState.ts');
const ENG='English Language', CHI='Chinese Language', MATH='Mathematics (Compulsory Part)';
const { module_1:M1, module_2:M2 } = registry.math_extended;
const CSD='Citizenship and Social Development';
const JAP=registry.category_c.find(s=>s.startsWith('Japanese:'));
const URDU=registry.category_c.find(s=>s.startsWith('Urdu:'));
let checks=0;
function check(name, fn) { fn(); checks++; }
const near = (got,want,message) => assert.ok(Math.abs(got-want)<.011,`${message}: got ${got}, expected ${want}`);
const score = (code, grades) => calculateScore(grades,byCode[code]).totalScore;
check('scope',()=>{
 assert.equal(data.length,36); assert.equal(data.filter(p=>p.institution==='HKU').length,17);
 assert.equal(data.filter(p=>p.institution==='HKUST').length,19);
 assert.deepEqual(data.map(p=>p.jupas_code),read('data/personal/programme_codes.json'));
 assert.equal(new Set(data.map(p=>p.jupas_code)).size,36);
 for(const code of ['JS5101','JS6808','JS6810','JS5118','JS5711','JS5811','JS5812','JS5901','JS5240','JS1001']) {
  assert.ok(!byCode[code]); assert.ok(!PROGRAMME_CODE_PATTERN.test(code));
 }
 for(const p of data) assert.ok(PROGRAMME_CODE_PATTERN.test(p.jupas_code));
 for(const p of data) assert.ok(!Object.keys(p).some(k=>/formula_2025|weights_2025/.test(k)));
 assert.deepEqual(Object.keys(read('data/processed/programme_details_2026.json')).sort(),data.map(p=>p.jupas_code).sort());
});
check('personal defaults',()=>{
 assert.deepEqual(defaultGrades(),{
  'm12:module':M1,
  [CSD]:'A',
  'elective-1:subject':'Business, Accounting and Financial Studies',
  'elective-2:subject':'Information and Communication Technology',
  'elective-3:subject':'Economics',
 });
 for(const p of data) assert.equal(calculateScore(defaultGrades(),p).totalScore,0);
});
check('personal value model covers the complete retained scope',()=>{
 assert.equal(PERSONAL_DIMENSIONS.reduce((sum,d)=>sum+d.weight,0),100);
 assert.equal(PERSONAL_DIMENSIONS.length,12);
 for(const p of data) {
  assert.equal(hasPersonalParameters(p.jupas_code),true,p.jupas_code);
  const value=personalValueFor(p);
  assert.ok(value.score>=0&&value.score<=100,p.jupas_code);
  assert.equal(value.rows.length,12);
  near(value.rows.reduce((sum,row)=>sum+row.contribution,0),value.score,p.jupas_code+' personal total');
 }
 assert.ok(personalValueFor(byCode.JS6779).score>personalValueFor(byCode.JS5318).score);
});
check('pathway tree ranking normalizes different score scales and respects mix weights',()=>{
 const g={[ENG]:'4',[CHI]:'4',[MATH]:'5*',[M1]:'5*',Economics:'4','Information and Communication Technology':'5','Business, Accounting and Financial Studies':'4',[CSD]:'A'};
 const results=data.map(p=>buildProgrammeResult(p,g));
 for(const result of results){
  const normalized=normalizedJupasScore(result);
  assert.ok(normalized>=0&&normalized<=100,result.programme.jupas_code);
  near(pathwayRank(result,'jupas').combinedScore,normalized,result.programme.jupas_code+' jupas endpoint');
  near(pathwayRank(result,'personal').combinedScore,personalValueFor(result.programme).score,result.programme.jupas_code+' personal endpoint');
  near(pathwayRank(result,'hybrid').combinedScore,(normalized+personalValueFor(result.programme).score)/2,result.programme.jupas_code+' hybrid');
  near(pathwayRank(result,'custom',70).combinedScore,normalized*.7+personalValueFor(result.programme).score*.3,result.programme.jupas_code+' custom');
 }
 for(const mode of ['jupas','personal','hybrid','custom']){
  const sorted=sortPathwayResults(results,mode,65);
  for(let i=1;i<sorted.length;i++) assert.ok(pathwayRank(sorted[i-1],mode,65).combinedScore>=pathwayRank(sorted[i],mode,65).combinedScore-.001,mode);
 }
});
check('saved blank module selection survives sanitization',()=>{
 assert.deepEqual(sanitizeGrades(defaultGrades()),defaultGrades());
 assert.deepEqual(sanitizeGrades({'m12:module':M2}),{
  'm12:module':M1,
  'elective-1:subject':'Business, Accounting and Financial Studies',
  'elective-2:subject':'Information and Communication Technology',
  'elective-3:subject':'Economics',
 });
 assert.equal(hasEnteredGrades(defaultGrades()),true);
 assert.equal(hasEnteredGrades({...defaultGrades(),[JAP]:'N1'}),true);
});
check('shared intake is retained without excluded codes',()=>{
 assert.deepEqual(byCode.JS6755.quota_shared,{total:226,codes:['JS6755','JS6767','JS6781']});
 for(const p of data) for(const code of p.quota_shared?.codes??[]) assert.ok(byCode[code]);
});
check('supplied source tables',()=>{
 for(const inst of ['hku','hkust']) {
  const path=`../UpToDateData2026/${inst}.md`;
  if(!existsSync(path)) continue;
  for(const line of readFileSync(path,'utf8').split('\n')) {
   const cells=line.split('|').slice(1,-1).map(s=>s.trim());
   const match=cells[0]?.match(inst==='hku'?/^(\d{4}) /:/^(JS\d{4})$/);
   if(!match) continue;
   const p=byCode[(inst==='hku'?'JS':'')+match[1]]; if(!p)continue;
   const number=s=>s==='–'||s==='-'?null:Number(s);
   const clean=s=>s.replace(/<sup>.*?<\/sup>/g,'').replaceAll('<br>',' ').replaceAll('**UPDATED**','').replaceAll('**NEW**','').replaceAll('**','').replace('*Remarks:','Remarks:').replace(/\*$/,'').replace(/\s+/g,' ').trim();
   assert.equal(p.formula_2026,clean(cells[inst==='hku'?1:2]));
   if(inst==='hku') {
    assert.equal(p.scores_2025.uq,number(cells[10]));assert.equal(p.scores_2025.median,number(cells[11]));assert.equal(p.scores_2025.lq,number(cells[12]));
    assert.equal(p.min_requirements_2026.eng,cells[2]); assert.equal(p.min_requirements_2026.chi,cells[3]); assert.equal(p.min_requirements_2026.math,cells[4]);
   } else {
    assert.equal(p.scores_2025.median,number(cells[4])); assert.equal(p.scores_2025.lq,number(cells[5]));
    assert.equal(p.expected_score_2026,number(cells[6]));assert.equal(p.max_achievable_score,number(cells[3]));
   }
  }
 }
});
const top=Object.fromEntries([ENG,CHI,MATH,M1,'Biology','Chemistry','Physics','Economics','Information and Communication Technology'].map(s=>[s,'5**']));top[CSD]='A';
for(const p of data) check(`${p.jupas_code} maximum, eligibility and distinct subjects`,()=>{
 const result=calculateScore(top,p);
 near(result.totalScore,p.max_achievable_score,p.jupas_code);
 assert.equal(checkEligibility(top,p.min_requirements_2026,p).eligible,true,p.jupas_code);
 assert.equal(new Set(result.selected.map(s=>s.subject)).size,result.selected.length);
 near(result.selected.reduce((sum,c)=>sum+c.weightedScore,0),result.totalScore,p.jupas_code+' breakdown');
 assert.equal(calculateScore({},p).totalScore,0);
});
const sample={[ENG]:'4',[MATH]:'5',[CHI]:'3',[M1]:'5**',Biology:'5*',Chemistry:'5'};
check('HKU weighted best five with unweighted sixth',()=>near(score('JS6755',sample),35.85,'BBA'));
check('HKU weighted best six with seventh',()=>near(score('JS6860',{...sample,Physics:'4'}),39.85,'Asset Management'));
const finance={[ENG]:'5*',[MATH]:'5',[M1]:'5**',[CHI]:'4',Biology:'5',Chemistry:'3',Physics:'2'};
check('HKU quantitative finance requires extended maths',()=>near(score('JS6884',finance),40.9,'Quantitative Finance'));
check('HKU actuarial maths weighting',()=>near(score('JS6729',finance),34.7,'Actuarial Science'));
check('HKU statistical decision sciences weighting',()=>near(score('JS6779',finance),33.25,'Statistical Decision Sciences'));
check('HKU changed formulas neither force nor double-weight extended maths',()=>{
 const grades={[ENG]:'4',[MATH]:'4',[CHI]:'5',Biology:'5*',Chemistry:'5**'};
 for(const code of ['JS6200','JS6224','JS6248','JS6999']) near(score(code,grades),29,code);
 assert.equal(checkEligibility({...grades,[CSD]:'A'},byCode.JS6224.min_requirements_2026,byCode.JS6224).eligible,true);
});
check('HKU Cat C competes with M1 instead of double counting',()=>{
 const grades={[ENG]:'4',[CHI]:'4',[MATH]:'4',Biology:'4',[M1]:'5**',[JAP]:'N1'};
 near(score('JS6705',grades),24.5,'Psychology');
 assert.equal(calculateScore(grades,byCode.JS6755).selected.some(s=>s.subject===JAP),false);
});
check('HKUST sixth bonus floor and exact percentage',()=>{
 const base={[ENG]:'4',[MATH]:'4',[CHI]:'4',Biology:'4',Chemistry:'4'};
 near(score('JS5300',base),28,'five subjects');
 near(score('JS5300',{...base,Physics:'2'}),28,'sixth level 2');
 near(score('JS5300',{...base,Physics:'3'}),29.05,'sixth level 3');
 near(score('JS5300',{...base,[JAP]:'N1'}),30.975,'Cat C bonus only');
});
check('HKUST science caps weighted electives at two',()=>{
 const grades={[ENG]:'4',[MATH]:'4',[CHI]:'4',[M1]:'4',Physics:'4',Biology:'4'};
 near(score('JS5102',grades),31.5,'Group A');
 const weighted=calculateScore(grades,byCode.JS5102).selected.filter(c=>!c.isCompulsory&&!c.isBonus&&c.multiplier>1);
 assert.ok(weighted.length<=2);
});
check('HKUST better-of branches work with and without preferred subjects',()=>{
 const plain={[ENG]:'4',[MATH]:'4',[CHI]:'4',Geography:'4',History:'4'};
 near(score('JS5312',plain),28,'finance plain branch');
 near(score('JS5312',{...plain,Chemistry:'4'}),31.5,'finance weighted branch plus sixth');
});
check('HKUST category B only supplies a recognised sixth bonus',()=>{
 const base={[ENG]:'4',[MATH]:'4',[CHI]:'4',Physics:'4',Biology:'4'};
 const apl=registry.category_b[0];
 near(score('JS5102',{...base,[apl]:'Attained with Distinction (II)'}),29.5,'science ApL bonus');
 near(score('JS5300',{...base,[apl]:'Attained with Distinction (II)'}),28,'business excludes ApL');
});
check('HKUST Urdu B conversion follows supplied 2026 table',()=>{
 const grades={[ENG]:'4',[CHI]:'4',[MATH]:'4',History:'4',[URDU]:'B'};
 near(score('JS5411',grades),26,'Urdu B is four points');
});
check('M1 and M2 count once including bonus',()=>{
 for(const p of data) near(calculateScore({...sample,[M2]:'5**'},p).totalScore,calculateScore(sample,p).totalScore,p.jupas_code);
});
check('failed citizenship does not satisfy eligibility',()=>{
 for(const p of data) assert.equal(checkEligibility({...top,[CSD]:'U'},p.min_requirements_2026,p).eligible,false);
});
check('required subject pools cannot reuse a single elective',()=>{
 const grades={[ENG]:'5',[CHI]:'5',[MATH]:'5',[CSD]:'A',[M1]:'4'};
 assert.equal(checkEligibility(grades,byCode.JS6729.min_requirements_2026,byCode.JS6729).eligible,false);
 assert.equal(checkEligibility({...grades,Economics:'3'},byCode.JS6729.min_requirements_2026,byCode.JS6729).eligible,true);
});
check('changed HKU formulas never compare incompatible historical totals',()=>{
 for(const code of ['JS6224','JS6248','JS6999']) {
  const r=buildProgrammeResult(byCode[code],sample);
  assert.equal(r.calculation.formula,byCode[code].formula_2026);
  assert.deepEqual(r.comparisons,[]);assert.equal(effectiveBenchmarks(byCode[code]).source,'none');
  assert.ok(byCode[code].scores_2025.median>0);
 }
});
// Deterministic property checks use real retained programmes and mixed grades.
let seed=126;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
const levels=['2','3','4','5','5*','5**'];
for(let i=0;i<12;i++)for(const p of data)check(`${p.jupas_code} mixed-grade monotonicity ${i}`,()=>{
 const subjects=[ENG,CHI,MATH,M1,'Biology','Chemistry','Economics'];
 const g=Object.fromEntries(subjects.map(s=>[s,levels[Math.floor(random()*levels.length)]]));
 const r=calculateScore(g,p);assert.ok(Number.isFinite(r.totalScore)&&r.totalScore>=0);
 assert.ok(r.totalScore<=p.max_achievable_score+.011);
 const raised={...g,[subjects[i%subjects.length]]:'5**'};
 assert.ok(calculateScore(raised,p).totalScore+.001>=r.totalScore,`${p.jupas_code} increasing a grade decreased the score`);
});
console.log(`Passed ${checks} checks: source values, 36 programme maxima/eligibility, 2026 formulas, bonuses, exclusions, fixed subjects and mixed-grade properties.`);
