import { createPortal } from "react-dom";
import {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { pickName, useLang, type Lang, type Translate } from "../lib/i18n";
import {
  localized,
  masterPathwaysFor,
  salariesFor,
  type MasterPathway,
} from "../lib/masterPathways";
import { PERSONAL_ELECTIVES } from "../lib/personalDefaults";
import { pathwayRank, sortPathwayResults, type PathwaySortMode } from "../lib/pathwayRanking";
import { CORE_SUBJECTS, M12_SUBJECT, M1_SUBJECT, subjectChipName } from "../lib/subjects";
import type { ProgrammeResult, StudentGrades } from "../types/jupas";
import "./PathwayTree.css";

type Props = {
  results: ProgrammeResult[];
  grades: StudentGrades;
  onOpenMajor: (code: string) => void;
  onShowList: () => void;
};

type Rect = { left: number; top: number; width: number; height: number };

type MajorCompareNode = {
  id: string;
  type: "major";
  result: ProgrammeResult;
};

type MasterCompareNode = {
  id: string;
  type: "master";
  parent: ProgrammeResult;
  pathway: MasterPathway;
};

type CompareNode = MajorCompareNode | MasterCompareNode;
type InteractionMode = "pan" | "select";

const INSTITUTIONS = ["HKU", "HKUST"] as const;
const MIN_ZOOM = 30;
const MAX_ZOOM = 140;
const ZOOM_STEP = 10;
const MASTER_TITLE_ZOOM_THRESHOLD = 75;
const DETAIL_ZOOM_THRESHOLD = 100;
const DEFAULT_ZOOM = 70;

function formatScore(value: number | null | undefined): string {
  if (typeof value !== "number") return "–";
  return value.toFixed(2).replace(/\.?0+$/, "");
}

export function PathwayTree({ results, grades, onOpenMajor, onShowList }: Props) {
  const { t, lang } = useLang();
  const [sortMode, setSortMode] = useState<PathwaySortMode>("hybrid");
  const [customJupasWeight, setCustomJupasWeight] = useState(50);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [masterDetail, setMasterDetail] = useState<MasterCompareNode | null>(null);
  const [marquee, setMarquee] = useState<Rect | null>(null);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("pan");
  const [zoomPercent, setZoomPercent] = useState(DEFAULT_ZOOM);
  const [isPanning, setIsPanning] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const zoomPercentRef = useRef(DEFAULT_ZOOM);
  const wheelDeltaRef = useRef(0);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const marqueeRef = useRef<Rect | null>(null);
  const panStartRef = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);
  const previousRectsRef = useRef<Map<string, Rect>>(new Map());
  const zoomScale = zoomPercent / 100;
  const overviewNodes = zoomPercent < MASTER_TITLE_ZOOM_THRESHOLD;
  const detailNodes = zoomPercent >= DETAIL_ZOOM_THRESHOLD;

  const rankedResults = useMemo(
    () => sortPathwayResults(results, sortMode, customJupasWeight),
    [results, sortMode, customJupasWeight],
  );

  const pathwaysByCode = useMemo(() => {
    const pathways = new Map<string, MasterPathway[]>();
    for (const result of results) {
      pathways.set(result.programme.jupas_code, masterPathwaysFor(result.programme));
    }
    return pathways;
  }, [results]);

  const compareNodes = useMemo(() => {
    const nodes = new Map<string, CompareNode>();
    for (const result of results) {
      const majorId = majorNodeId(result);
      nodes.set(majorId, { id: majorId, type: "major", result });
      for (const pathway of pathwaysByCode.get(result.programme.jupas_code) ?? []) {
        const id = masterNodeId(result, pathway);
        nodes.set(id, { id, type: "master", parent: result, pathway });
      }
    }
    return nodes;
  }, [results, pathwaysByCode]);

  const selectedNodes = selectedIds.map((id) => compareNodes.get(id)).filter((node): node is CompareNode => Boolean(node));
  const layoutOrderKey = INSTITUTIONS
    .map((institution) => `${institution}:${rankedResults
      .filter((result) => result.programme.institution === institution)
      .map((result) => result.programme.jupas_code)
      .join(",")}`)
    .join("|");

  const gradeItems = useMemo(() => {
    const ordered = [...CORE_SUBJECTS, M1_SUBJECT, ...PERSONAL_ELECTIVES];
    return ordered.flatMap((subject) => {
      const grade = subject === M1_SUBJECT ? grades[M1_SUBJECT] || grades[M12_SUBJECT] : grades[subject];
      return grade ? [{ subject, grade }] : [];
    });
  }, [grades]);

  const scoreSignature = gradeItems.map((item) => `${item.subject}:${item.grade}`).join("|");
  const previousLayoutOrderRef = useRef("");
  const previousZoomRef = useRef(DEFAULT_ZOOM);

  useEffect(() => {
    if (selectedIds.length === 2) setCompareOpen(true);
    if (selectedIds.length < 2) setCompareOpen(false);
  }, [selectedIds]);

  useEffect(() => {
    if (!compareOpen && !masterDetail) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (masterDetail) setMasterDetail(null);
      else setCompareOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [compareOpen, masterDetail]);

  // FLIP animation: score edits and ranking-control changes reorder complete
  // school→major→master rows without losing the viewer's spatial context.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const currentZoom = zoomPercentRef.current;
    const orderChanged = previousLayoutOrderRef.current !== layoutOrderKey;
    const zoomChanged = previousZoomRef.current !== currentZoom;
    const nextRects = new Map<string, Rect>();
    const canvasRect = canvas.getBoundingClientRect();
    const currentZoomScale = currentZoom / 100;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    canvas.querySelectorAll<HTMLElement>("[data-layout-id]").forEach((element) => {
      const id = element.dataset.layoutId;
      if (!id) return;
      const screenRect = element.getBoundingClientRect();
      const next = {
        left: (screenRect.left - canvasRect.left) / currentZoomScale,
        top: (screenRect.top - canvasRect.top) / currentZoomScale,
        width: screenRect.width / currentZoomScale,
        height: screenRect.height / currentZoomScale,
      };
      const previous = previousRectsRef.current.get(id);
      nextRects.set(id, next);
      if (!orderChanged || zoomChanged || !previous || reduceMotion) return;
      const dx = previous.left - next.left;
      const dy = previous.top - next.top;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
      element.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)`, opacity: 0.72 },
          { transform: "translate(0, 0)", opacity: 1 },
        ],
        { duration: 520, easing: "cubic-bezier(.2,.75,.22,1)" },
      );
    });
    previousRectsRef.current = nextRects;
    previousLayoutOrderRef.current = layoutOrderKey;
    previousZoomRef.current = currentZoom;
  }, [layoutOrderKey]);

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 2) return [current[1], id];
      return [...current, id];
    });
  }

  function pointInCanvas(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (event.clientX - rect.left) / zoomScale, y: (event.clientY - rect.top) / zoomScale };
  }

  function beginMarquee(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !event.isPrimary) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, [data-compare-id]")) return;
    const point = pointInCanvas(event);
    dragStartRef.current = point;
    const nextMarquee = { left: point.x, top: point.y, width: 0, height: 0 };
    marqueeRef.current = nextMarquee;
    setMarquee(nextMarquee);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function moveMarquee(event: ReactPointerEvent<HTMLDivElement>) {
    const start = dragStartRef.current;
    if (!start) return;
    const point = pointInCanvas(event);
    const nextMarquee = {
      left: Math.min(start.x, point.x),
      top: Math.min(start.y, point.y),
      width: Math.abs(point.x - start.x),
      height: Math.abs(point.y - start.y),
    };
    marqueeRef.current = nextMarquee;
    setMarquee(nextMarquee);
  }

  function finishMarquee(event: ReactPointerEvent<HTMLDivElement>) {
    const selection = marqueeRef.current;
    dragStartRef.current = null;
    marqueeRef.current = null;
    setMarquee(null);
    if (!selection || selection.width < 8 || selection.height < 8) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();
    const selected = Array.from(canvas.querySelectorAll<HTMLElement>("[data-compare-id]"))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const local = {
          left: (rect.left - canvasRect.left) / zoomScale,
          top: (rect.top - canvasRect.top) / zoomScale,
          right: (rect.right - canvasRect.left) / zoomScale,
          bottom: (rect.bottom - canvasRect.top) / zoomScale,
        };
        return local.left < selection.left + selection.width
          && local.right > selection.left
          && local.top < selection.top + selection.height
          && local.bottom > selection.top;
      })
      .map((element) => element.dataset.compareId)
      .filter((id): id is string => Boolean(id))
      .slice(0, 2);
    if (selected.length) setSelectedIds(selected);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function updateZoom(nextZoom: number, anchor?: { x: number; y: number }) {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
    const currentZoom = zoomPercentRef.current;
    if (clamped === currentZoom) return;
    const viewport = viewportRef.current;
    const viewportX = anchor?.x ?? (viewport?.clientWidth ?? 0) / 2;
    const viewportY = anchor?.y ?? (viewport?.clientHeight ?? 0) / 2;
    const contentX = viewport ? viewport.scrollLeft + viewportX : 0;
    const contentY = viewport ? viewport.scrollTop + viewportY : 0;
    const ratio = clamped / currentZoom;
    zoomPercentRef.current = clamped;
    setZoomPercent(clamped);
    if (!viewport) return;
    requestAnimationFrame(() => {
      viewport.scrollLeft = contentX * ratio - viewportX;
      viewport.scrollTop = contentY * ratio - viewportY;
    });
  }

  function resetView() {
    zoomPercentRef.current = DEFAULT_ZOOM;
    wheelDeltaRef.current = 0;
    setZoomPercent(DEFAULT_ZOOM);
    requestAnimationFrame(() => viewportRef.current?.scrollTo({ left: 0, top: 0, behavior: "smooth" }));
  }

  function showActualSize() {
    updateZoom(100);
  }

  function zoomWithWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    wheelDeltaRef.current += event.deltaY;
    const threshold = event.ctrlKey || event.metaKey ? 18 : 60;
    if (Math.abs(wheelDeltaRef.current) < threshold) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const direction = wheelDeltaRef.current > 0 ? -1 : 1;
    wheelDeltaRef.current = 0;
    updateZoom(zoomPercentRef.current + direction * 5, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }

  function beginCanvasGesture(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !event.isPrimary) return;
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, [data-compare-id]")) return;
    if (interactionMode === "select") {
      beginMarquee(event);
      return;
    }
    const viewport = viewportRef.current;
    if (!viewport) return;
    panStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    };
    setIsPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  function moveCanvasGesture(event: ReactPointerEvent<HTMLDivElement>) {
    if (interactionMode === "select") {
      moveMarquee(event);
      return;
    }
    const start = panStartRef.current;
    const viewport = viewportRef.current;
    if (!start || !viewport) return;
    viewport.scrollLeft = start.scrollLeft - (event.clientX - start.x);
    viewport.scrollTop = start.scrollTop - (event.clientY - start.y);
    event.preventDefault();
  }

  function finishCanvasGesture(event: ReactPointerEvent<HTMLDivElement>) {
    if (interactionMode === "select") {
      finishMarquee(event);
      return;
    }
    panStartRef.current = null;
    setIsPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function cancelCanvasGesture(event: ReactPointerEvent<HTMLDivElement>) {
    dragStartRef.current = null;
    marqueeRef.current = null;
    panStartRef.current = null;
    setMarquee(null);
    setIsPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return (
    <section className="pathway-tree" aria-label={t("tree.aria")}>
      <h2 className="pathway-sr-only">{t("tree.title")}</h2>

      <div className="pathway-floating-controls pathway-control-bar">
        <div className="browse-display-switch pathway-embedded-display" role="group" aria-label={t("tree.displayAria")}>
          <span>{t("tree.displayLabel")}</span>
          <button type="button" aria-pressed="false" onClick={onShowList}>{t("tree.displayTable")}</button>
          <button type="button" className="active" aria-pressed="true">{t("tree.displayTree")}</button>
        </div>
        <div className="pathway-tree-actions">
          <div className="pathway-sort-modes" role="group" aria-label={t("tree.sortAria")}> 
            {(["jupas", "personal", "hybrid", "custom"] as const).map((mode) => (
              <button
                type="button"
                key={mode}
                className={sortMode === mode ? "active" : ""}
                aria-pressed={sortMode === mode}
                onClick={() => setSortMode(mode)}
              >
                {t(`tree.sort.${mode}`)}
              </button>
            ))}
          </div>
          {sortMode === "custom" ? (
            <label className="pathway-weight-control">
              <span>{t("tree.customWeight", { jupas: customJupasWeight, personal: 100 - customJupasWeight })}</span>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={customJupasWeight}
                onChange={(event) => setCustomJupasWeight(Number(event.target.value))}
              />
            </label>
          ) : null}
        </div>
        <div className="pathway-interaction-modes" role="group" aria-label={t("tree.interactionAria")}>
          <span>{t("tree.moveView")}</span>
          <button type="button" className={interactionMode === "pan" ? "active" : ""} aria-pressed={interactionMode === "pan"} onClick={() => setInteractionMode("pan")}>{t("tree.pan")}</button>
          <button type="button" className={interactionMode === "select" ? "active" : ""} aria-pressed={interactionMode === "select"} onClick={() => setInteractionMode("select")}>{t("tree.boxSelect")}</button>
        </div>
        <div className="pathway-zoom-controls">
          <button type="button" onClick={() => updateZoom(zoomPercent - ZOOM_STEP)} disabled={zoomPercent === MIN_ZOOM} aria-label={t("tree.zoomOut")}>−</button>
          <output>{zoomPercent}%</output>
          <button type="button" onClick={() => updateZoom(zoomPercent + ZOOM_STEP)} disabled={zoomPercent === MAX_ZOOM} aria-label={t("tree.zoomIn")}>+</button>
          <button type="button" className="pathway-reset-view" onClick={resetView}>{t("tree.fitView")}</button>
          <button type="button" className="pathway-reset-view" onClick={showActualSize}>{t("tree.actualSize")}</button>
          <span className="pathway-gesture-hint">{t("tree.zoomGesture")}</span>
        </div>
        <p className="pathway-sr-only" aria-live="polite">
          {overviewNodes
            ? t("tree.overviewVisible", { threshold: MASTER_TITLE_ZOOM_THRESHOLD })
            : detailNodes
              ? t("tree.detailsExpanded", { threshold: DETAIL_ZOOM_THRESHOLD })
              : t("tree.masterTitlesVisible", { threshold: DETAIL_ZOOM_THRESHOLD })}
        </p>
      </div>

      {selectedNodes.length ? (
        <div className="pathway-floating-controls pathway-selection-dock" aria-live="polite">
          <span>{t("tree.compareHint")}</span>
          <div className="pathway-selection-chips">
            {selectedNodes.map((node) => (
              <button type="button" key={node.id} onClick={() => toggleSelected(node.id)}>
                {nodeTitle(node, lang)} <span aria-hidden="true">×</span>
              </button>
            ))}
            <em>{selectedNodes.length}/2</em>
          </div>
          <button type="button" className="pathway-clear-selection" onClick={() => setSelectedIds([])}>{t("tree.clear")}</button>
        </div>
      ) : null}

      <div
        ref={viewportRef}
        className={`pathway-scroll is-${interactionMode}-mode${isPanning ? " is-panning" : ""}`}
        onWheel={zoomWithWheel}
      >
        <div
          className={`pathway-canvas${overviewNodes ? " pathway-overview" : detailNodes ? " pathway-detail" : " pathway-titles"}`}
          ref={canvasRef}
          style={{ "--pathway-zoom": zoomScale } as CSSProperties}
          onPointerDown={beginCanvasGesture}
          onPointerMove={moveCanvasGesture}
          onPointerUp={finishCanvasGesture}
          onPointerCancel={cancelCanvasGesture}
        >
          {marquee ? <span className="pathway-marquee" style={marquee} aria-hidden="true" /> : null}

          <div className="pathway-flow">
            <article key={scoreSignature} className="pathway-root-node pathway-score-updated">
              <span className="pathway-node-kind">{t("tree.rootKind")}</span>
              <h3>{t("tree.rootTitle")}</h3>
              {gradeItems.length ? (
                <ul>{gradeItems.map((item) => <li key={item.subject}><span>{subjectChipName(item.subject)}</span><b>{item.grade}</b></li>)}</ul>
              ) : <p>{t("tree.noGrades")}</p>}
            </article>
            <span className="pathway-trunk" aria-hidden="true" />
            <div className="pathway-university-branches">
              {INSTITUTIONS.map((institution) => {
                const institutionResults = rankedResults.filter((result) => result.programme.institution === institution);
                return (
                  <div className="pathway-university-lane" key={institution}>
                    <article className="pathway-school-node" data-layout-id={`school:${institution}`}>
                      <span className="pathway-node-kind">{t("tree.schoolNode")}</span>
                      <strong>{institution}</strong>
                      <span>{t("tree.majorCount", { n: institutionResults.length })}</span>
                    </article>
                    <span className="pathway-school-connector" aria-hidden="true" />
                    <section className="pathway-institution" id={`pathway-${institution.toLowerCase()}`}>
                      <header className="pathway-column-labels" data-layout-id={`school-header:${institution}`}>
                        <div>
                          <span>{t("tree.schoolNode")}</span>
                          <strong>{institution}</strong>
                          <small>{t("tree.schoolSummary", { n: institutionResults.length })}</small>
                        </div>
                        <b>{t("tree.majorNode")}</b>
                        <b>{t("tree.masterNode")}</b>
                      </header>
                      <div className="pathway-programme-scroll">
                        <div className="pathway-programme-list">
                          {institutionResults.length ? institutionResults.map((result, index) => {
                            const routes = pathwaysByCode.get(result.programme.jupas_code) ?? [];
                            const rank = pathwayRank(result, sortMode, customJupasWeight);
                            const majorId = majorNodeId(result);
                            return (
                              <div className="pathway-programme-row" key={result.programme.jupas_code} data-layout-id={`row:${result.programme.jupas_code}`}>
                                <span className="pathway-row-rank" aria-label={t("tree.rank", { n: index + 1 })}>{index + 1}</span>
                                <PathwayNode
                                  id={majorId}
                                  selected={selectedIds.includes(majorId)}
                                  className="pathway-major-node"
                                  onSelect={() => toggleSelected(majorId)}
                                  onOpen={() => onOpenMajor(result.programme.jupas_code)}
                                  title={pickName(result.programme, lang)}
                                  eyebrow={`${result.programme.jupas_code} · ${t("tree.majorNode")}`}
                                >
                                  <ul>
                                    <li>{t("tree.jupasLine", { score: result.calculation.totalScore.toFixed(2), max: formatScore(result.programme.max_achievable_score), pct: rank.jupasPercent.toFixed(1) })}</li>
                                    <li>{t("tree.personalLine", { score: rank.personalScore.toFixed(1) })}</li>
                                    <li>{result.eligibility.eligible ? t("tree.eligible") : t("tree.notEligible")} · {bandLabel(result.band, t)}</li>
                                    <li>{t("tree.masterCount", { n: routes.length })}</li>
                                  </ul>
                                  <div className="pathway-rank-meter">
                                    <span style={{ width: `${rank.combinedScore}%` }} />
                                    <b>{rankLabel(sortMode, rank.combinedScore, t)}</b>
                                  </div>
                                </PathwayNode>
                                <span className="pathway-major-connector" aria-hidden="true" />
                                {overviewNodes ? (
                                  <MasterBranchSummary routes={routes} lang={lang} />
                                ) : (
                                  <div className="pathway-master-track">
                                    {routes.map((pathway) => {
                                    const id = masterNodeId(result, pathway);
                                    const node: MasterCompareNode = { id, type: "master", parent: result, pathway };
                                    return (
                                      <PathwayNode
                                        key={id}
                                        id={id}
                                        selected={selectedIds.includes(id)}
                                        className="pathway-master-node"
                                        onSelect={() => toggleSelected(id)}
                                        onOpen={() => setMasterDetail(node)}
                                        title={localized(pathway.name, lang)}
                                        eyebrow={`${pathway.institution} · ${t("tree.masterNode")}`}
                                      >
                                        {detailNodes ? (
                                          <>
                                            <ul>
                                              <li>{localized(pathway.gpa, lang)}</li>
                                              <li>{localized(pathway.curriculum, lang)}</li>
                                              <li>{pathway.jobs.slice(0, 2).map((job) => localized(job, lang)).join(" · ")}</li>
                                            </ul>
                                            <small>{t("tree.checked", { date: pathway.checkedOn })}</small>
                                          </>
                                        ) : null}
                                      </PathwayNode>
                                    );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          }) : <p className="pathway-empty">{t("tree.emptyBranch")}</p>}
                        </div>
                      </div>
                    </section>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pathway-legend">
            <span><i className="legend-jupas" />{t("tree.legendJupas")}</span>
            <span><i className="legend-personal" />{t("tree.legendPersonal")}</span>
            <span><i className="legend-select" />{t("tree.legendSelect")}</span>
          </div>
        </div>
      </div>

      {compareOpen && selectedNodes.length === 2 ? createPortal(
        <CompareDialog
          nodes={selectedNodes as [CompareNode, CompareNode]}
          onClose={() => setCompareOpen(false)}
          onClear={() => setSelectedIds([])}
          onOpenMajor={(code) => { setCompareOpen(false); onOpenMajor(code); }}
        />,
        document.body,
      ) : null}

      {masterDetail ? createPortal(
        <MasterDetailDialog node={masterDetail} onClose={() => setMasterDetail(null)} />,
        document.body,
      ) : null}
    </section>
  );
}

const MasterBranchSummary = memo(function MasterBranchSummary({ routes, lang }: { routes: MasterPathway[]; lang: Lang }) {
  const { t } = useLang();
  const labels = routes.slice(0, 2).map((route) => masterDirectionLabel(route, lang));
  const remaining = Math.max(0, routes.length - labels.length);
  const allDirections = routes.map((route) => masterDirectionLabel(route, lang)).join(" · ");
  return (
    <div
      className="pathway-master-summary"
      aria-label={t("tree.masterSummaryAria", { n: routes.length, directions: allDirections })}
      title={allDirections}
    >
      <span className="pathway-summary-branches" aria-hidden="true">
        {routes.map((route) => <i key={route.id} />)}
      </span>
      <span className="pathway-summary-copy">
        <b>{t("tree.masterCountShort", { n: routes.length })}</b>
        <small>{labels.join(" · ")}{remaining ? ` +${remaining}` : ""}</small>
      </span>
    </div>
  );
});

function masterDirectionLabel(pathway: MasterPathway, lang: Lang): string {
  const name = localized(pathway.name, lang);
  if (lang === "zh") {
    return name
      .replace(/(?:理學|社會科學)?碩士$/, "")
      .replace(/學$/, "")
      .trim();
  }
  return name
    .replace(/^MSc\s+in\s+/i, "")
    .replace(/^Master of Social Sciences\s+in\s+/i, "")
    .replace(/^Master of\s+/i, "")
    .trim();
}

function PathwayNode({ id, selected, className, onSelect, onOpen, eyebrow, title, children }: {
  id: string;
  selected: boolean;
  className: string;
  onSelect: () => void;
  onOpen: () => void;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  const { t } = useLang();
  function onKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onOpen();
  }
  return (
    <article
      className={`pathway-node ${className}${selected ? " is-selected" : ""}`}
      data-compare-id={id}
      data-layout-id={id}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={onKeyDown}
      aria-label={t("tree.openNode", { title })}
    >
      <button
        type="button"
        className="pathway-node-select"
        aria-pressed={selected}
        aria-label={selected ? t("tree.unselectCompare", { title }) : t("tree.selectCompare", { title })}
        onClick={(event) => { event.stopPropagation(); onSelect(); }}
      >
        <span aria-hidden="true">{selected ? "✓" : ""}</span>
      </button>
      <span className="pathway-node-kind">{eyebrow}</span>
      <h3>{title}</h3>
      {children}
      <span className="pathway-open-hint">{t("tree.openDetails")} →</span>
    </article>
  );
}

function CompareDialog({ nodes, onClose, onClear, onOpenMajor }: {
  nodes: [CompareNode, CompareNode];
  onClose: () => void;
  onClear: () => void;
  onOpenMajor: (code: string) => void;
}) {
  const { t, lang } = useLang();
  return (
    <div className="pathway-dialog-layer" role="presentation" onMouseDown={onClose}>
      <section className="pathway-dialog pathway-compare-dialog" role="dialog" aria-modal="true" aria-labelledby="pathway-compare-title" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><p className="eyebrow">{t("tree.compareEyebrow")}</p><h2 id="pathway-compare-title">{t("tree.compareTitle")}</h2></div>
          <button type="button" className="pathway-dialog-close" onClick={onClose} aria-label={t("tree.close")}>×</button>
        </header>
        <div className="pathway-compare-grid">
          {nodes.map((node) => (
            <article key={node.id}>
              <span className="pathway-compare-type">{node.type === "major" ? t("tree.majorNode") : t("tree.masterNode")}</span>
              <h3>{nodeTitle(node, lang)}</h3>
              {node.type === "major" ? <MajorComparison node={node} onOpenMajor={onOpenMajor} /> : <MasterComparison node={node} />}
            </article>
          ))}
        </div>
        <footer><p>{t("tree.compareDisclaimer")}</p><button type="button" className="ghost-button" onClick={onClear}>{t("tree.clearAndClose")}</button></footer>
      </section>
    </div>
  );
}

function MajorComparison({ node, onOpenMajor }: { node: MajorCompareNode; onOpenMajor: (code: string) => void }) {
  const { t } = useLang();
  const rank = pathwayRank(node.result, "hybrid");
  const programme = node.result.programme;
  return (
    <>
      <dl>
        <div><dt>{t("tree.compareSchool")}</dt><dd>{programme.institution}</dd></div>
        <div><dt>{t("tree.compareJupas")}</dt><dd>{programme.jupas_code} · {node.result.calculation.totalScore.toFixed(2)} / {formatScore(programme.max_achievable_score)} ({rank.jupasPercent.toFixed(1)}%)</dd></div>
        <div><dt>{t("tree.comparePersonal")}</dt><dd>{rank.personalScore.toFixed(1)} / 100</dd></div>
        <div><dt>{t("tree.compareEligibility")}</dt><dd>{node.result.eligibility.eligible ? t("tree.eligible") : t("tree.notEligible")}</dd></div>
        <div><dt>{t("tree.compareMasters")}</dt><dd>{masterPathwaysFor(programme).length}</dd></div>
      </dl>
      <button type="button" className="pathway-dialog-primary" onClick={() => onOpenMajor(programme.jupas_code)}>{t("tree.openMajorDetail")}</button>
    </>
  );
}

function MasterComparison({ node }: { node: MasterCompareNode }) {
  const { t, lang } = useLang();
  return (
    <>
      <dl>
        <div><dt>{t("tree.compareSchool")}</dt><dd>{node.pathway.institution}</dd></div>
        <div><dt>{t("master.entry")}</dt><dd>{localized(node.pathway.entryBackground, lang)}</dd></div>
        <div><dt>{t("master.gpa")}</dt><dd>{localized(node.pathway.gpa, lang)}</dd></div>
        <div><dt>{t("master.curriculum")}</dt><dd>{localized(node.pathway.curriculum, lang)}</dd></div>
        <div><dt>{t("master.jobs")}</dt><dd>{node.pathway.jobs.map((job) => localized(job, lang)).join(" · ")}</dd></div>
      </dl>
      <a className="pathway-dialog-primary" href={node.pathway.sourceUrl} target="_blank" rel="noopener noreferrer">{t("tree.officialSource")} ↗︎</a>
    </>
  );
}

function MasterDetailDialog({ node, onClose }: { node: MasterCompareNode; onClose: () => void }) {
  const { t, lang } = useLang();
  const route = node.pathway;
  const salaries = salariesFor(route);
  return (
    <div className="pathway-dialog-layer" role="presentation" onMouseDown={onClose}>
      <section className="pathway-dialog pathway-master-detail" role="dialog" aria-modal="true" aria-labelledby="pathway-master-title" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div>
            <p className="eyebrow">{node.parent.programme.jupas_code} → {route.institution}</p>
            <h2 id="pathway-master-title">{localized(route.name, lang)}</h2>
            <p>{route.sourceCycle} · {t("tree.checked", { date: route.checkedOn })}</p>
          </div>
          <button type="button" className="pathway-dialog-close" onClick={onClose} aria-label={t("tree.close")}>×</button>
        </header>
        <dl>
          <div><dt>{t("master.entry")}</dt><dd>{localized(route.entryBackground, lang)}</dd></div>
          <div><dt>{t("master.gpa")}</dt><dd>{localized(route.gpa, lang)}</dd></div>
          <div><dt>{t("master.curriculum")}</dt><dd>{localized(route.curriculum, lang)}</dd></div>
          <div><dt>{t("master.jobs")}</dt><dd>{route.jobs.map((job) => localized(job, lang)).join(" · ")}</dd></div>
        </dl>
        {route.caution ? <p className="pathway-detail-caution">{localized(route.caution, lang)}</p> : null}
        <section className="pathway-detail-salaries">
          <h3>{t("master.salary")}</h3>
          <div>{salaries.map((salary) => <article key={salary.id}><strong>{localized(salary.role, lang)}</strong><b>{salary.monthly}{t("master.perMonth")}</b><p>{localized(salary.basis, lang)}</p><a href={salary.sourceUrl} target="_blank" rel="noopener noreferrer">{salary.sourceLabel} ↗︎</a></article>)}</div>
        </section>
        <footer><a className="pathway-dialog-primary" href={route.sourceUrl} target="_blank" rel="noopener noreferrer">{t("tree.officialSource")} ↗︎</a><button type="button" className="ghost-button" onClick={onClose}>{t("tree.close")}</button></footer>
      </section>
    </div>
  );
}

function majorNodeId(result: ProgrammeResult) {
  return `major:${result.programme.jupas_code}`;
}

function masterNodeId(result: ProgrammeResult, pathway: MasterPathway) {
  return `master:${result.programme.jupas_code}:${pathway.id}`;
}

function nodeTitle(node: CompareNode, lang: Lang) {
  return node.type === "major" ? pickName(node.result.programme, lang) : localized(node.pathway.name, lang);
}

function rankLabel(mode: PathwaySortMode, score: number, t: Translate) {
  return t(mode === "jupas" ? "tree.rankJupas" : mode === "personal" ? "tree.rankPersonal" : "tree.rankMix", { score: score.toFixed(1) });
}

function bandLabel(band: ProgrammeResult["band"], t: Translate) {
  const key = {
    "above-uq": "bandLong.aboveUq",
    "above-median": "bandLong.aboveMed",
    "above-lq": "bandLong.aboveLq",
    "below-lq": "bandLong.belowLq",
    "no-score": "bandLong.noScore",
  }[band];
  return t(key);
}
