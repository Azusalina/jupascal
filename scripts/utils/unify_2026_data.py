"""Build the personal HKU/HKUST dataset using Python 3 (standard library only).

The supplied ../UpToDateData2026 Markdown is authoritative. A scoped snapshot
keeps the checkout buildable when that sibling folder is unavailable. Only
2026 calculation recipes are emitted; 2025 numbers are historical benchmarks.
"""
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'data'
SOURCE = ROOT.parent / 'UpToDateData2026'
ENG = 'English Language'
CHI = 'Chinese Language'
MATH = 'Mathematics (Compulsory Part)'
M1 = 'Mathematics Extended Part (Module 1)'
M2 = 'Mathematics Extended Part (Module 2)'
SCI = ['Biology', 'Chemistry', 'Physics', M1, M2]
FIN = ['Chemistry', 'Economics', 'Physics', M1, M2]
SCALE = {'5**': 8.5, '5*': 7, '5': 5.5, '4': 4, '3': 3, '2': 2, '1': 1, 'U': 0, 'A': 0}
KEEP = {
    'HKU': {'JS' + c for c in '6200 6224 6248 6705 6717 6729 6731 6755 6767 6779 6781 6793 6846 6860 6884 6896 6999'.split()},
    'HKUST': {'JS' + c for c in '5102 5103 5181 5300 5311 5312 5313 5314 5315 5316 5317 5318 5331 5332 5411 5412 5813 5814 5822'.split()},
}


def clean(text):
    text = re.sub(r'<sup>.*?</sup>', '', text)
    text = text.replace('<br>', ' ').replace('**UPDATED**', '').replace('**NEW**', '')
    return re.sub(r'\s+', ' ', text.replace('**', '').replace('*Remarks:', 'Remarks:').strip().rstrip('*')).strip()


def num(text):
    return None if text.strip() in ('–', '-', '') else float(text)


def read_source(inst):
    snapshot = DATA / 'personal' / f'{inst.lower()}_2026.json'
    source = SOURCE / f'{inst.lower()}.md'
    if not source.exists():
        return json.loads(snapshot.read_text())
    rows = []
    faculty = ''
    for line in source.read_text().splitlines():
        if line.startswith('### '):
            faculty = line[4:].strip()
        pattern = r'^\| (\d{4}) ' if inst == 'HKU' else r'^\| (JS\d{4}) '
        match = re.match(pattern, line)
        if not match:
            continue
        code = ('JS' if inst == 'HKU' else '') + match[1]
        if code not in KEEP[inst]:
            continue
        cells = [clean(c) for c in line.strip('|').split('|')]
        if inst == 'HKU':
            rows.append(dict(code=code, name=cells[0][5:].strip(), faculty=faculty,
                formula=cells[1], core=cells[2:6], electives=cells[6:8], requirements=cells[8],
                # Deliberately do not retain the historical formula column.
                benchmarks=dict(uq=num(cells[10]), median=num(cells[11]), lq=num(cells[12]))))
        else:
            rows.append(dict(code=code, name=cells[1], formula=cells[2], maximum=num(cells[3]),
                benchmarks=dict(median=num(cells[4]), lq=num(cells[5])), expected=num(cells[6])))
    assert {p['code'] for p in rows} == KEEP[inst], f'Missing or duplicate {inst} source programmes'
    assert len(rows) == len(KEEP[inst])
    snapshot.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + '\n')
    return rows


def slot(subjects=None, weight=1, weights=None, catc=False, compulsory=False):
    return dict(subjects=subjects or [], weight=weight, weights=weights or {}, allow_category_c=catc, compulsory=compulsory)


def required(subject, weight=1):
    return slot([subject], weight, compulsory=True)


def hku_recipe(formula):
    bonus = re.search(r'\+\s*([\d.]+) x (\d)(?:th|st|nd|rd) Best Subject', formula)
    base = formula[:bonus.start()].strip() if bonus else formula
    slots = []
    catc = '¤' in formula
    for term in base.replace('¤', '').split('+'):
        term = term.strip()
        best = re.fullmatch(r'Best (\d+) Subjects', term)
        if best:
            slots.extend(slot(catc=catc) for _ in range(int(best[1])))
            continue
        match = re.fullmatch(r'(?:(\d+(?:\.\d+)?) x )?(Eng|Math|M1 / M2)', term)
        assert match, f'Unsupported HKU 2026 formula term: {term}'
        weight = float(match[1] or 1)
        subs = {'Eng': [ENG], 'Math': [MATH], 'M1 / M2': [M1, M2]}[match[2]]
        slots.append(slot(subs, weight, compulsory=True))
    return [slots], (float(bonus[1]) if bonus else 0), catc


def ust_recipe(code):
    cores = [required(ENG, 2), required(MATH, 2)]
    any3 = [slot(), slot(), slot()]
    if code in {'JS5102', 'JS5103', 'JS5181'}:
        weights = {s: (2 if (s in ['Biology', 'Chemistry']) == (code == 'JS5103') else 1.5) for s in SCI}
        return [[required(ENG, 1.5), required(MATH), slot(SCI, weights=weights), slot(weights=weights), slot()]]
    if code in {'JS5312', 'JS5331', 'JS5332', 'JS5822'}:
        return [cores + any3, cores + [slot(FIN, 1.5), slot(), slot()]]
    if code == 'JS5411':
        return [[required(ENG, 2), required(CHI, 1.5)] + [slot(catc=True) for _ in range(3)]]
    if code in {'JS5412', 'JS5814'}:
        return [cores + [slot(weights={M1: 1.5, M2: 1.5}) for _ in range(3)]]
    if code == 'JS5813':
        weights = {s: (2 if s in [M1, M2] else 1.5) for s in SCI + ['Economics']}
        return [cores + [slot(list(weights), weights=weights), slot(), slot()]]
    return [cores + any3]


def maximum_weight(slots):
    # M1 and M2 may be counted only once, so three slots with a maths weighting
    # do not each receive that weighting when calculating the bonus denominator.
    if sum(bool(s['weights']) for s in slots) == 3:
        return 7.5
    return sum(max([s['weight']] + list(s['weights'].values())) for s in slots)


def hku_requirements(row):
    chi, eng, math, csd = row['core'][1], row['core'][0], row['core'][2], 'A'
    e1 = dict(count=1, subjects=['CategoryA'], grade=row['electives'][0])
    e2 = dict(count=1, subjects=['Any'], grade=row['electives'][1])
    text = row['requirements']
    specific = re.search(r'Level ([34]) or above in one of the following subjects: (.+?)\.', text)
    if specific:
        names = specific[2].replace(', or ', ', ').replace(' or ', ', ').split(', ')
        # The BAFS branch labels contain commas; map those as a single subject.
        if 'Business, Accounting and Financial Studies' in specific[2]:
            names = ['Biology', 'Business, Accounting and Financial Studies', 'Chemistry', 'Economics', 'Information and Communication Technology', 'Physics']
        e1.update(subjects=names, grade=specific[1], note=specific[0])
    elif re.search(r'Level ([34]) or above in Mathematics Extended Part \(Module 1 or 2\)\.', text):
        grade = re.search(r'Level ([34])', text)[1]
        e2.update(subjects=[M1, M2], grade=grade, note=text)
    return dict(chi=chi, eng=eng, math=math, csd=csd, elect1=e1, elect2=e2,
        conditional_remarks='' if text == '–' else text)


def main():
    metadata = {p['jupas_code']: p for p in json.loads((DATA / 'personal/programme_metadata_2026.json').read_text())}
    programmes = []
    for inst in KEEP:
        for row in read_source(inst):
            code = row['code']
            p = dict(metadata[code])
            p.update(name_en=row['name'], formula_2026=row['formula'], scores_2025=row['benchmarks'],
                source_2026=f'UpToDateData2026/{inst.lower()}.md', score_conversion_table=dict(category_a=SCALE),
                subject_weights_2026={}, best_of_weights_2026=[], calculation_constraints=[])
            if inst == 'HKU':
                recipes, bonus, catc = hku_recipe(row['formula'])
                p.update(faculty=row['faculty'], min_requirements_2026=hku_requirements(row),
                    score_slots_2026=recipes, bonus_multiplier=bonus,
                    category_c_policy=None if catc else 'score_excluded', extended_math_or_category_c=catc,
                    apl_policy='none')
                # Historical values are retained as reference only, without their
                # old formulas or a numerical comparison on incompatible scales.
                p['historical_comparable'] = code not in {'JS6224', 'JS6248', 'JS6999'}
                p['max_achievable_score'] = 8.5 * (maximum_weight(recipes[0]) + bonus)
            else:
                recipes = ust_recipe(code)
                max_weight = max(maximum_weight(s) for s in recipes)
                p.update(score_slots_2026=recipes, bonus_multiplier=max_weight * .05,
                    bonus_min_points=3, expected_score_2026=row['expected'], max_achievable_score=row['maximum'],
                    historical_comparable=True, category_c_policy=None,
                    flexible_admissions_2026=dict(core_shortfall=1, affected_core_subjects=1, score_above_median=True, band='A'),
                    apl_policy='any' if code in {'JS5102','JS5103','JS5181','JS5411','JS5412','JS5813'} else 'none',
                    apl_bonus_only=True)
                assert abs(8.5 * max_weight * 1.05 - row['maximum']) < .011, (code, max_weight)
                p['calculation_constraints'] = [dict(type='hkust_weighted_best', subject_count=5,
                    max_attainable_weighting=max_weight, bonus_percentage=5)]
                # Use the exact recipe in formula details as well as calculation.
                def to_step(s):
                    if s['compulsory']:
                        return dict(type='required', subject=s['subjects'][0], weight=s['weight'])
                    grouped = {}
                    for name, weight in s['weights'].items(): grouped.setdefault(weight, []).append(name)
                    if s['weight'] != 1: grouped[s['weight']] = s['subjects']
                    return dict(type='best_from_pool', subject_filter=s['subjects'],
                        weights=[dict(subjects=v, weight=k) for k,v in grouped.items()],
                        eligible_categories=['Core','Category A'] + (['Category C'] if s['allow_category_c'] else []))
                p['hkust_formula_steps'] = ([to_step(s) for s in recipes[0]] if len(recipes) == 1 else
                    [dict(type='better_of', options=[[to_step(s) for s in recipe] for recipe in recipes])])
            p['formula_2026_id'] = f'best{len(recipes[0])}'
            for s in recipes[0]:
                if s['compulsory']:
                    for name in s['subjects']: p['subject_weights_2026'][name] = s['weight']
            programmes.append(p)
    programmes.sort(key=lambda p: p['jupas_code'])
    assert len(programmes) == 36
    (DATA / 'personal/programme_codes.json').write_text(json.dumps([p['jupas_code'] for p in programmes]) + '\n')
    output = json.dumps(programmes, ensure_ascii=False, indent=2) + '\n'
    (DATA / 'processed/JUPAS_2026_Unified_Data.json').write_text(output)
    (DATA / 'processed/JUPAS_2026_Unified_Data.version').write_text(hashlib.sha256(output.encode()).hexdigest()[:16] + '\n')
    print('Generated 36 programmes (17 HKU, 19 HKUST), using 2026 scoring only.')


if __name__ == '__main__':
    main()
