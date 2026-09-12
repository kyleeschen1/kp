import { compileMotionObservationAsset } from "../../authoring/motion-observation-authoring.ts";
import { checkMotionObservation, sampleMotionObservation, type MotionObservationGap } from "../../semantic/motion-observation.ts";
import { projectKpReaderAttention } from "../../reader/runtime/attention-projector.ts";
import type { KpLessonAttentionPlan } from "../../reader/document/public-api.ts";

export interface MotionBeat { readonly slug: string; readonly title: string; readonly body: string; readonly cue: string }
const issued = new WeakSet<object>();
const lessonBrand = Symbol("checked-motion-explanation");
export interface CheckedMotionLesson {
  readonly [lessonBrand]: true;
  readonly compiled: ReturnType<typeof compileMotionObservationAsset>;
  readonly beats: readonly MotionBeat[];
  readonly checkpoints: readonly number[];
}
export function checkMotionLesson(value: unknown): { readonly status: "checked"; readonly lesson: CheckedMotionLesson } | MotionObservationGap {
  const checked = checkMotionObservation(value); if (checked.status === "repair") return checked;
  const s = checked.record.value, o = s.observations;
  // This first narrative teaches outward, pause, return. The mathematical owner
  // is wider; unsupported narratives must not borrow these explanatory claims.
  if (o.length !== 4 || o[1]!.position <= o[0]!.position || o[2]!.position !== o[1]!.position ||
    o[3]!.position >= o[2]!.position || o[3]!.position < o[0]!.position || s.originShift <= 0 || s.originShift >= o[1]!.position ||
    o.some(p => p.position < 0 || p.position > 8) || s.originShift > 6)
    return { status: "repair", code: "motion-unsupported", path: "$.observations", expected: "This narrative needs four observations: outward, same-position interval, partial return; positions 0–8 m and a positive origin shift inside the outward extent." };
  const compiled = compileMotionObservationAsset(checked.record), f = compiled.facts;
  const beats: readonly MotionBeat[] = Object.freeze([
    { slug: "describe", title: "A destination is not a trip", body: "How could someone reconstruct motion they did not see? Track one marked point, choose a zero and a positive direction, then record where it is and when. We will model steady motion between the recorded times.", cue: "Watch the marked point move along the ruler. The clock tells us when." },
    { slug: "outward", title: "A position needs a time", body: `At ${o[1]!.time} seconds the point is ${o[1]!.position} metres to the right of zero. Pairing a place with a time distinguishes this observation from the destination alone. The next recorded position is the same.`, cue: "Watch time advance while the point holds its place in our model." },
    { slug: "pause", title: "Time passes; position stays the same", body: `Between ${o[1]!.time} and ${o[2]!.time} seconds, our straight-line interpolation models a pause. Equal endpoint measurements alone cannot rule out a hidden detour. Next the point returns partway.`, cue: "Watch the point move back while the clock keeps increasing." },
    { slug: "return", title: "Coming back does not erase the journey", body: `At ${o[3]!.time} seconds the point is at ${o[3]!.position} metres. It travelled outward and back; the final position does not tell that whole story. Now change only where we put zero.`, cue: `Keep your eye on the point as zero moves ${s.originShift} metres right.` },
    { slug: "origin", title: "Different numbers, the same trip", body: `Every coordinate is now ${s.originShift} less. The object did not move during this change of description. Subtracting the same amount from both endpoint coordinates leaves their difference, ${f.displacement} metre${f.displacement === 1 ? "" : "s"}, unchanged.`, cue: "Read the lower graph: time runs across, position runs up." },
    { slug: "graph", title: "The graph is a record, not the physical path", body: "The point travelled along a horizontal table—not up and down this graph. A horizontal graph segment says position stayed constant while time passed. The descending segment records the return. Its slope will lead us to velocity.", cue: "Compare the final-minus-initial change with all the travel in between." },
    { slug: "compare", title: "Net change and total travel answer different questions", body: `Displacement is ${f.displacement >= 0 ? "+" : ""}${f.displacement} m: final position minus initial position. Distance in this model is ${f.distance} m: add travel in both directions positively. Changing zero changes neither.`, cue: "Try a new trip: from 2 m to 6 m and back to 2 m. What are the two totals?" }
  ].map(beat => Object.freeze(beat)));
  const lesson: CheckedMotionLesson = Object.freeze({ [lessonBrand]: true as const, compiled, beats,
    checkpoints: Object.freeze(beats.map((_, i) => i / (beats.length - 1))) });
  issued.add(lesson); return { status: "checked", lesson };
}
export function assertMotionLesson(lesson: CheckedMotionLesson): void {
  if (!issued.has(lesson)) throw new TypeError("Use the checked motion explanation and its governed construction.");
}

export function sampleMotionLesson(lesson: CheckedMotionLesson, progress: number) {
  assertMotionLesson(lesson);
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) throw new RangeError("Motion explanation progress must be within 0–1.");
  const last = lesson.beats.length - 1, position = progress * last;
  const edge = Math.min(Math.floor(position), last - 1), local = position - edge;
  const target = edge < 3 ? lesson.compiled.record.value.pointId : edge === 3 ? "motion.origin" : "motion.graph";
  const bounds = [0, 100, 850, 925, 1000], kinds = ["orient", "act", "settle", "inspect"] as const;
  const attention: KpLessonAttentionPlan = { kind: "phased-attention-v1", phases: kinds.map((kind, i) => ({
    id: `motion.${edge}.${kind}`, kind, beatId: lesson.beats[edge]!.slug, checkpointId: lesson.beats[edge + 1]!.slug,
    startProgressPermille: bounds[i]!, endProgressPermille: bounds[i + 1]!, cue: lesson.beats[edge]!.cue, focusRefs: [target]
  })) };
  const focus = projectKpReaderAttention({ attention, progressPermille: local * 1000 })!;
  const visual = focus.visualProgressPermille / 1000, samples = lesson.compiled.record.value.observations;
  const time = edge < 3 ? samples[edge]!.time + visual * (samples[edge + 1]!.time - samples[edge]!.time) : lesson.compiled.facts.duration;
  const origin = edge < 3 ? 0 : edge === 3 ? visual * lesson.compiled.record.value.originShift : lesson.compiled.record.value.originShift;
  const visible = focus.phaseKind === "inspect" ? edge + 1 : edge;
  return Object.freeze({ position, visible, origin, attention: focus, beat: lesson.beats[visible]!,
    point: sampleMotionObservation(lesson.compiled.record, time),
    role: edge >= 4 ? "Read the record" : focus.phaseKind === "act" || focus.phaseKind === "settle" ? "Watch" : "Read, then move",
    fraction: `${visible + 1} / ${lesson.beats.length}`, graphFocused: edge >= 4,
    operationId: edge < 3 ? "motion.observe-linear-trip" : "motion.change-fixed-origin" });
}
export type MotionLessonFrame = ReturnType<typeof sampleMotionLesson>;
