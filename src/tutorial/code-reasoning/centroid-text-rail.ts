import { createInspectionEdgeScroll } from "../../reader/runtime/inspection-edge-scroll.ts";
import { projectEquationRail } from "../../reader/runtime/equation-rail-presentation.ts";
import { holdDisclosureViewportAnchor } from "../../reader/runtime/disclosure-viewport-anchor.ts";
import { centroidBeatReading } from "./centroid-beats.ts";

const checkpoints = { original: 0, extracted: .5, generalized: 1 } as const;
export function projectCentroidTextPosition(value: number) {
  if (!Number.isFinite(value)) throw new RangeError("Text rail position must be finite");
  const position = Math.max(0, Math.min(centroidBeatReading.length - 1, value));
  const move = Math.min(centroidBeatReading.length - 2, Math.floor(position));
  const progress = position - move;
  const from = centroidBeatReading[move]!, to = centroidBeatReading[move + 1]!;
  return { position, move, progress, beat: progress === 1 ? to : from,
    codeProgress: checkpoints[from.checkpoint] + (checkpoints[to.checkpoint] - checkpoints[from.checkpoint]) * progress };
}

/** Text owns a local inspection coordinate, not a second animation clock.
 * The existing native code plan is sampled only through the host callback. */
export function mountCentroidTextRail(root: HTMLElement, onSeek: (position: ReturnType<typeof projectCentroidTextPosition>) => void) {
  const rail = root.querySelector<HTMLElement>("[data-centroid-text-rail]")!;
  const handle = root.querySelector<HTMLButtonElement>("[data-derivation-handle]")!;
  const rows = [...root.querySelectorAll<HTMLElement>("[data-centroid-beat]")];
  const stops = [...rail.querySelectorAll<HTMLElement>(":scope > span")];
  const abort = new AbortController(), options = { signal: abort.signal };
  let position = 0, centers: number[] = [], drag: number | undefined;
  const paint = () => {
    if (centers.length !== rows.length || !root.offsetWidth) return;
    const pose = projectCentroidTextPosition(position);
    const y = centers[pose.move]! + (centers[pose.move + 1]! - centers[pose.move]!) * pose.progress;
    handle.style.top = `${y}px`;
    handle.setAttribute("aria-valuenow", position.toFixed(3));
    handle.setAttribute("aria-valuetext", `${centroidBeatReading.indexOf(pose.beat) + 1} of ${rows.length}: ${pose.beat.text.replaceAll("`", "")}`);
    projectEquationRail({ root, rail, centers, stops, passages: rows, move: pose.move, progress: pose.progress });
    root.dataset["textPosition"] = String(position);
  };
  const measure = () => {
    if (!root.offsetWidth) return;
    const top = root.getBoundingClientRect().top;
    centers = rows.map(row => { const rect = row.querySelector("p")!.getBoundingClientRect(); return rect.top + rect.height / 2 - top; });
    rail.style.top = `${centers[0]}px`; rail.style.height = `${centers.at(-1)! - centers[0]!}px`;
    stops.forEach((stop, i) => { stop.style.top = `${centers[i]! - centers[0]!}px`; });
    paint();
  };
  const seek = (value: number) => { const pose = projectCentroidTextPosition(value); position = pose.position; paint(); onSeek(pose); };
  const pointer = (clientY: number) => {
    measure();
    const y = clientY - root.getBoundingClientRect().top;
    if (y <= centers[0]!) return seek(0);
    const i = centers.findIndex((center, i) => i > 0 && y <= center);
    if (i < 0) return seek(rows.length - 1);
    const distance = centers[i]! - centers[i - 1]!;
    seek(Math.abs(y - centers[i]!) < 3 ? i : Math.abs(y - centers[i - 1]!) < 3 ? i - 1 : i - 1 + (y - centers[i - 1]!) / distance);
  };
  const edge = createInspectionEdgeScroll({ signal: abort.signal, sample: pointer,
    bounds: () => { const top = root.getBoundingClientRect().top; return { top: top + centers[0]!, bottom: top + centers.at(-1)! }; },
    readableBounds: () => ({ top: rows[0]!.getBoundingClientRect().top, bottom: rows.at(-1)!.getBoundingClientRect().bottom }) });
  const stop = () => { edge.stop(); const held = drag; drag = undefined; if (held !== undefined && handle.hasPointerCapture(held)) handle.releasePointerCapture(held); delete root.dataset["derivationDragging"]; };
  const start = (event: PointerEvent) => {
    if (event.button !== 0) return;
    event.preventDefault(); measure(); drag = event.pointerId; handle.setPointerCapture(drag);
    handle.focus({ preventScroll: true }); root.dataset["derivationDragging"] = "true"; edge.update(event.clientY);
  };
  rail.addEventListener("pointerdown", start, options); handle.addEventListener("pointerdown", start, options);
  handle.addEventListener("pointermove", event => { if (drag === event.pointerId) edge.update(event.clientY); }, options);
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) handle.addEventListener(type, stop, options);
  window.addEventListener("blur", stop, options);
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); }, options);
  handle.addEventListener("keydown", event => {
    if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault(); stop();
    seek(event.key === "Home" ? 0 : event.key === "End" ? rows.length - 1 : event.key === "ArrowDown" || event.key === "ArrowRight" ? Math.floor(position + .00001) + 1 : Math.ceil(position - .00001) - 1);
    handle.scrollIntoView({ block: "nearest", behavior: "instant" });
  }, options);
  const size = new ResizeObserver(measure); size.observe(root); rows.forEach(row => size.observe(row));
  let anchor: ReturnType<typeof holdDisclosureViewportAnchor> | undefined;
  root.addEventListener("click", event => {
    if (event.target instanceof Element && event.target.closest("summary")) {
      stop(); anchor = holdDisclosureViewportAnchor(handle, abort.signal);
    }
  }, options);
  root.addEventListener("toggle", () => { measure(); anchor?.refresh(); }, { ...options, capture: true });
  window.addEventListener("resize", measure, options);
  measure();
  return { handle, seek, refresh: measure, stop, getPosition: () => position,
    sync(codeProgress: number) {
      if (Math.abs(projectCentroidTextPosition(position).codeProgress - codeProgress) < .000001) { measure(); return; }
      position = codeProgress === 0 ? 0 : codeProgress <= .5 ? 3 + codeProgress * 2 : 5 + (codeProgress - .5) * 2;
      measure();
    },
    dispose() { stop(); abort.abort(); size.disconnect(); }
  };
}
