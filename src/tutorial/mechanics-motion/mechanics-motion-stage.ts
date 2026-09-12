import { KpGraph2DRuntimeSessionLifecycle, type KpGraph2DRuntimeSession } from "../../rendering/graph-2d-runtime-session.ts";
import { renderKpFocusDeckAnnotation } from "../focus-deck-annotation.ts";
import { assertMotionLesson, sampleMotionLesson, type CheckedMotionLesson, type MotionLessonFrame } from "./mechanics-motion-sequence.ts";

const n = (value: number) => Number(value.toFixed(2)).toString();
const annotation = (id: string, text: string, role: "label" | "support" | "meta" = "label") => renderKpFocusDeckAnnotation({ entityId: id, text, role });

/** This is the single candidate representation for the new bounded domain, not
 * a promoted cross-family motif. Every mount requires the checked construction. */
export const motionRepresentation = Object.freeze({ id: "representation.motion-observation.native-2d.v1",
  route: "/experiments/mechanics-motion/", renderTargetId: "render.motion-observation" });

// This reading keeps the original zero. Reserve plot space for its observations,
// not the negative coordinates of the separate origin-change capability.
const graphCeiling = (lesson: CheckedMotionLesson) => Math.max(2,
  Math.ceil(Math.max(...lesson.compiled.record.value.observations.map(o => o.position)) / 2) * 2);

export function renderMotionStage(lesson: CheckedMotionLesson): string {
  assertMotionLesson(lesson);
  return `<figure class="kp-focus-deck__stage motion-stage" data-motion-stage aria-label="One trip shown on a ruler and as a position–time record">
    <div class="motion-physical" data-motion-physical>
      <div class="motion-stage-heading">${annotation("motion.table", "Track")}${annotation("motion.clock", "0 s · Position: 1 m", "support")}</div>
      <div class="motion-ruler"><svg viewBox="0 0 600 90" aria-hidden="true"><path class="motion-axis" d="M30 60H570"/>
        <path class="motion-zero" data-motion-zero d="M30 5V75"/><circle class="motion-point" data-motion-point cy="35" r="10" cx="97.5"/>
        ${Array.from({ length: 9 }, (_, i) => `<path class="motion-tick" d="M${30 + i * 67.5} 55v10"/>`).join("")}</svg>
        <div class="motion-ruler-labels">${Array.from({ length: 9 }, (_, i) => `<span data-motion-tick="${i}">${annotation(`motion.ruler.${i}`, String(i), "meta")}</span>`).join("")}</div>
      </div>
    </div>
    <div class="motion-graph" data-motion-graph>
      <div class="motion-stage-heading">${annotation("motion.graph", "Position (m) ↑")}${annotation("motion.time-axis", "Time (s) →", "meta")}</div>
      <div class="motion-plot"><svg viewBox="0 0 600 220" preserveAspectRatio="none" aria-hidden="true">
        <path class="motion-axis" d="M30 10V200H570"/>
        <path class="motion-grid" d="M30 10H570M30 105H570M30 200H570"/>
        <path class="motion-trace" data-motion-trace/><path class="motion-guide" data-motion-guide/>
        ${lesson.compiled.record.value.observations.map((_, i) => `<circle data-motion-observation="${i}" class="motion-observation" r="4"/>`).join("")}
        <circle data-motion-graph-point class="motion-point" r="6"/>
      </svg>
      <span class="motion-y-label motion-y-top">${annotation("motion.graph.top", String(graphCeiling(lesson)), "meta")}</span>
      <span class="motion-y-label motion-y-middle">${annotation("motion.graph.middle", String(graphCeiling(lesson) / 2), "meta")}</span>
      <span class="motion-y-label motion-y-bottom">${annotation("motion.graph.bottom", "0", "meta")}</span>
      </div>
      <div class="motion-time-labels">${lesson.compiled.record.value.observations.map((sample, i) => `<span style="left:${5 + 90 * sample.time / lesson.compiled.facts.duration}%">${annotation(`motion.graph.time.${i}`, String(sample.time), "meta")}</span>`).join("")}</div>
    </div>
  </figure>`;
}

type Session = KpGraph2DRuntimeSession<CheckedMotionLesson, MotionLessonFrame, null>;
function createMotionSession(root: HTMLElement, content: CheckedMotionLesson, frame: MotionLessonFrame): Session {
  let status: Session["status"] = "mounted";
  const get = <T extends Element>(selector: string): T => { const element = root.querySelector<T>(selector); if (!element) throw new Error(`Missing motion stage ${selector}`); return element; };
  const label = (id: string, text: string) => { const element = get(`[data-kp-focus-deck-annotation="${id}"]`); if (element.textContent !== text) element.textContent = text; };
  const source = content.compiled.record.value, samples = source.observations, duration = content.compiled.facts.duration;
  const ceiling = graphCeiling(content);
  const gx = (time: number) => 30 + 540 * time / duration, gy = (position: number) => 200 - position / ceiling * 190;
  const paint = (f: MotionLessonFrame) => {
    if (status === "disposed") return;
    get("[data-motion-point]").setAttribute("cx", String(30 + f.point.position * 67.5));
    get("[data-motion-zero]").setAttribute("d", `M${30 + f.origin * 67.5} 5V75`);
    label("motion.clock", `${n(f.point.time)} s · Position: ${n(f.point.position - f.origin)} m`);
    for (let i = 0; i <= 8; i++) label(`motion.ruler.${i}`, n(i - f.origin));
    const reached = samples.filter(sample => sample.time <= f.point.time);
    const path = [...reached.map(sample => [gx(sample.time), gy(sample.position - f.origin)]), [gx(f.point.time), gy(f.point.position - f.origin)]];
    get("[data-motion-trace]").setAttribute("d", path.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" "));
    const x = gx(f.point.time), y = gy(f.point.position - f.origin);
    get("[data-motion-graph-point]").setAttribute("cx", String(x)); get("[data-motion-graph-point]").setAttribute("cy", String(y));
    get("[data-motion-guide]").setAttribute("d", `M${x} 200V${y}H30`);
    samples.forEach((sample, i) => { const dot = get(`[data-motion-observation="${i}"]`); dot.setAttribute("cx", String(gx(sample.time))); dot.setAttribute("cy", String(gy(sample.position - f.origin))); dot.setAttribute("visibility", sample.time <= f.point.time ? "visible" : "hidden"); });
    root.dataset["motionGraphFocused"] = String(f.graphFocused);
    root.dataset["motionTime"] = String(f.point.time); root.dataset["motionOrigin"] = String(f.origin);
    root.dataset["motionPosition"] = String(f.point.position);
  };
  paint(frame);
  return { content, get status() { return status; }, apply: ({ frame: next }) => paint(next), dispose() { status = "disposed"; } };
}
export function mountMotionStage(root: HTMLElement, lesson: CheckedMotionLesson) {
  assertMotionLesson(lesson);
  // Each display owns its DOM; mounting the same checked source twice must not
  // redirect either session into the other instance or resurrect a disposed one.
  const lifecycle = new KpGraph2DRuntimeSessionLifecycle<HTMLElement, CheckedMotionLesson, MotionLessonFrame, null, Session>(
    ({ content, frame }) => createMotionSession(root, content, frame));
  let disposed = false;
  lifecycle.apply({ owner: root, content: lesson, frame: sampleMotionLesson(lesson, 0), viewport: null });
  return { project(frame: MotionLessonFrame) { if (!disposed) lifecycle.apply({ owner: root, content: lesson, frame, viewport: null }); },
    dispose() { disposed = true; lifecycle.dispose(root); } };
}
