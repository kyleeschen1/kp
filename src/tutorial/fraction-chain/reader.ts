import { createKpReaderTimelinePlaybackClock } from "../../reader/runtime/timeline-playback-clock.ts";
import { createInspectionEdgeScroll } from "../../reader/runtime/inspection-edge-scroll.ts";
import { holdDisclosureViewportAnchor } from "../../reader/runtime/disclosure-viewport-anchor.ts";
import { revealEquationInViewport } from "../../reader/runtime/equation-viewport.ts";
import { sampleInsetDerivationRecord } from "../mechanics-relations/energy-derivation-presentation.ts";
import { fractionIntervalAt, fractionPositionAtY, fractionSceneAt } from "./position.ts";
import { preserveEnergyDisclosureFocus } from "../mechanics-relations/energy-disclosure-focus.ts";
import { projectEquationRail } from "../../reader/runtime/equation-rail-presentation.ts";

type Surface = { seek(progress: number): unknown; dispose(): void; invalidate?(): void };
/** This local passage composes the existing clock, measured rail, docking,
 * viewport and disclosure owners. It never schedules compositor animation. */
export function mountFractionPassage(root: HTMLElement, surfaces: readonly Surface[]) {
  if (surfaces.length !== 4) throw new Error("Prepare all four checked native surfaces before enabling the passage.");
  const get = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const history = get<HTMLElement>(".fraction-history"), rail = get<HTMLElement>("[data-fraction-rail]");
  const rows = [...root.querySelectorAll<HTMLElement>("[data-fraction-row]")];
  const inspection = get<HTMLElement>("[data-fraction-inspection]"), stages = [...root.querySelectorAll<HTMLElement>("[data-fraction-stage]")];
  const handle = get<HTMLButtonElement>("[data-derivation-handle]"), scope = get<HTMLElement>("[data-fraction-scope]");
  const disclosure = get<HTMLButtonElement>("[data-fraction-disclosure]");
  rail.setAttribute("data-derivation-rail", ""); disclosure.setAttribute("data-refinement-expand", "combine");
  preserveEnergyDisclosureFocus(root);
  const abort = new AbortController(), options = { signal: abort.signal };
  const clock = createKpReaderTimelinePlaybackClock({ id: "fraction.passage", durationMs: 13200 });
  let points: { position: number; y: number }[] = [], position = 0, drag: number | undefined;
  let held: number | undefined, resizeFrame: number | undefined, equationHeight = 0;
  const measure = () => {
    // A hidden/collapsed host has no new geometry authority. ResizeObserver
    // will remeasure on restoration; never replace native certificates with
    // the transient zero-width layout seen during capture or host resizing.
    if (!history.isConnected || history.offsetWidth <= 0) return false;
    const top = history.getBoundingClientRect().top;
    points = rows.filter(row => !row.hidden).map(row => {
      const rect = row.querySelector<HTMLElement>(".energy-derivation-equation")!.getBoundingClientRect();
      return { position: Number(row.dataset["position"]), y: rect.top + rect.height / 2 - top };
    });
    equationHeight = Math.max(...rows.filter(row => !row.hidden).map(row => row.querySelector<HTMLElement>(".energy-derivation-equation")!.offsetHeight));
    rail.style.top = `${points[0]!.y}px`; rail.style.height = `${points.at(-1)!.y - points[0]!.y}px`;
    for (const stop of rail.querySelectorAll<HTMLElement>(":scope > span")) {
      if (!stop.hidden) stop.style.top = `${fractionIntervalAt(Number(stop.dataset["position"]), points).y - points[0]!.y}px`;
    }
    return true;
  };
  const paint = () => {
    if (!history.isConnected || history.offsetWidth <= 0) return;
    position = clock.getSnapshot().progress * 3;
    const interval = fractionIntervalAt(position, points), scene = fractionSceneAt(position);
    projectEquationRail({ root, rail, centers: points.map(point => point.y),
      stops: [...rail.querySelectorAll<HTMLElement>(":scope > span")].filter(stop => !stop.hidden)
        .sort((a, b) => Number(a.dataset["position"]) - Number(b.dataset["position"])),
      passages: rows.filter(row => !row.hidden).map(row => row.querySelector<HTMLElement>(".fraction-reason")!),
      move: points.indexOf(interval.before), progress: interval.progress });
    // Opacity gates the complete inactive owner, including descendants with
    // explicit visibility, while retaining measurable native geometry.
    stages.forEach((stage, index) => { stage.style.opacity = index === scene.index ? "1" : "0"; stage.setAttribute("aria-hidden", String(index !== scene.index)); });
    surfaces[scene.index]!.seek(scene.progress);
    scope.style.top = `${interval.y}px`;
    inspection.style.top = `${interval.y}px`;
    const inset = sampleInsetDerivationRecord(interval.progress, interval.after.y - interval.before.y, equationHeight);
    inspection.style.opacity = String(inset.inspectionOpacity);
    rows.forEach(row => {
      const at = Number(row.dataset["position"]);
      row.style.setProperty("--derivation-record-presence", String(at === interval.before.position ? inset.sourcePresence : at === interval.after.position ? inset.targetPresence : 1));
      row.style.setProperty("--derivation-record-emphasis", String(at === interval.before.position ? inset.sourceEmphasis : at === interval.after.position ? inset.targetEmphasis : 0));
    });
    root.dataset["fractionPosition"] = position.toFixed(6);
    handle.setAttribute("aria-valuenow", String(position));
    handle.setAttribute("aria-valuetext", `Move ${Math.min(3, Math.floor(position) + 1)}; ${position.toFixed(2)} of 3`);
  };
  const seek = (value: number) => clock.seek(Math.max(0, Math.min(3, value)) / 3);
  const pointer = (clientY: number) => seek(fractionPositionAtY(clientY - history.getBoundingClientRect().top, points));
  const edge = createInspectionEdgeScroll({ signal: abort.signal,
    bounds: () => { const top = history.getBoundingClientRect().top; return { top: top + points[0]!.y, bottom: top + points.at(-1)!.y }; },
    readableBounds: () => { const first = rows[0]!.getBoundingClientRect(), last = rows.at(-1)!.getBoundingClientRect(); return { top: first.top, bottom: last.bottom }; }, sample: pointer });
  const start = (event: PointerEvent) => {
    if (event.button !== 0) return;
    event.preventDefault(); drag = event.pointerId; root.dataset["derivationDragging"] = "true"; handle.setPointerCapture(drag); handle.focus({ preventScroll: true }); edge.update(event.clientY);
  };
  handle.addEventListener("pointerdown", start, options); rail.addEventListener("pointerdown", start, options);
  handle.addEventListener("pointermove", event => { if (drag === event.pointerId) edge.update(event.clientY); }, options);
  const stop = () => { edge.stop(); drag = undefined; delete root.dataset["derivationDragging"]; };
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) handle.addEventListener(event, stop, options);
  window.addEventListener("blur", stop, options);
  const navigate = (direction: number) => {
    const destinations = points.map(point => point.position);
    seek(direction > 0 ? destinations.find(value => value > position + .000001) ?? 3 : [...destinations].reverse().find(value => value < position - .000001) ?? 0);
    revealEquationInViewport(rows.find(row => Number(row.dataset["position"]) === position)?.querySelector<HTMLElement>(".energy-derivation-equation") ?? inspection);
  };
  handle.addEventListener("keydown", event => {
    if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault(); stop();
    if (event.key === "Home" || event.key === "End") { seek(event.key === "Home" ? 0 : 3); revealEquationInViewport(rows[event.key === "Home" ? 0 : rows.length - 1]!); }
    else navigate(event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1);
  }, options);
  get<HTMLButtonElement>("[data-fraction-back]").addEventListener("click", () => navigate(-1), options);
  get<HTMLButtonElement>("[data-fraction-next]").addEventListener("click", () => navigate(1), options);
  disclosure.addEventListener("click", () => {
    stop(); const anchor = holdDisclosureViewportAnchor(handle, abort.signal);
    const opening = held === undefined, restore = held;
    if (opening) held = position;
    root.querySelectorAll<HTMLElement>("[data-fraction-detail]").forEach(element => element.hidden = !opening);
    disclosure.setAttribute("aria-expanded", String(opening)); disclosure.textContent = opening ? "Return to the whole step" : "Inspect smaller steps";
    measure(); if (!opening) { held = undefined; seek(restore!); } else paint();
    anchor.refresh();
  }, options);
  if (!measure()) throw new Error("Mount the fraction passage in a measurable host.");
  const unsubscribe = clock.subscribe(paint); paint();
  root.dataset["tracing"] = "true";
  root.querySelectorAll<HTMLElement>("[data-fraction-rail], [data-fraction-scope], [data-fraction-navigation], [data-fraction-help], [data-fraction-disclosure]").forEach(element => element.hidden = false);
  get<HTMLElement>("[data-fraction-static-detail]").hidden = true;
  get<HTMLElement>("[data-fraction-status]").hidden = true;
  const resize = new ResizeObserver(() => {
    if (resizeFrame !== undefined) return;
    resizeFrame = requestAnimationFrame(() => { resizeFrame = undefined; if (!measure()) return; surfaces.forEach(surface => surface.invalidate?.()); paint(); });
  });
  resize.observe(history);
  const dispose = () => { abort.abort(); if (resizeFrame !== undefined) cancelAnimationFrame(resizeFrame); resize.disconnect(); unsubscribe(); clock.dispose(); surfaces.forEach(surface => surface.dispose()); };
  window.addEventListener("pagehide", dispose, { ...options, once: true });
  return { dispose };
}
