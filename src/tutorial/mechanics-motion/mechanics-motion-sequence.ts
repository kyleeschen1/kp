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
  const compiled = compileMotionObservationAsset(checked.record);
  const beats: readonly MotionBeat[] = Object.freeze([
    { slug: "describe", title: "One point, two views", body: "The object moves right along the track. Its graph point moves right as time passes, and up as position increases.", cue: "Watch the same position appear in both views." },
    { slug: "outward", title: "Now the object pauses", body: `At ${o[1]!.time} s, position is ${o[1]!.position} m. Next, the object stays there. Will its graph point stop too?`, cue: "Watch the graph while the object stays still." },
    { slug: "pause", title: "The graph keeps going", body: `Time advances from ${o[1]!.time} to ${o[2]!.time} s; position stays ${o[2]!.position} m. The graph is horizontal. Next, the object returns.`, cue: "Watch: left on the track becomes down on the graph." },
    { slug: "return", title: "Not the physical path", body: `Returning to ${o[3]!.position} m makes the graph descend. It still goes right because time advances—even as the object moves left.`, cue: "Replay the pause, or try the question below." }
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
  const target = lesson.compiled.record.value.pointId;
  const bounds = [0, 100, 850, 925, 1000], kinds = ["orient", "act", "settle", "inspect"] as const;
  const attention: KpLessonAttentionPlan = { kind: "phased-attention-v1", phases: kinds.map((kind, i) => ({
    id: `motion.${edge}.${kind}`, kind, beatId: lesson.beats[edge]!.slug, checkpointId: lesson.beats[edge + 1]!.slug,
    startProgressPermille: bounds[i]!, endProgressPermille: bounds[i + 1]!, cue: lesson.beats[edge]!.cue, focusRefs: [target]
  })) };
  const focus = projectKpReaderAttention({ attention, progressPermille: local * 1000 })!;
  const visual = focus.visualProgressPermille / 1000, samples = lesson.compiled.record.value.observations;
  const time = samples[edge]!.time + visual * (samples[edge + 1]!.time - samples[edge]!.time);
  // This projection teaches correspondence only. Origin conversion remains a
  // mathematical capability, not an obligatory stop in every reading.
  const origin = 0;
  const visible = focus.phaseKind === "inspect" ? edge + 1 : edge;
  return Object.freeze({ position, visible, origin, attention: focus, beat: lesson.beats[visible]!,
    point: sampleMotionObservation(lesson.compiled.record, time),
    role: progress === 1 ? "Inspect" : focus.phaseKind === "act" || focus.phaseKind === "settle" ? "Watch" : "Read, then move",
    fraction: `${visible + 1} / ${lesson.beats.length}`, graphFocused: true,
    operationId: "motion.observe-linear-trip" });
}
export type MotionLessonFrame = ReturnType<typeof sampleMotionLesson>;
