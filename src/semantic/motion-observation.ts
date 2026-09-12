import { createKpImmutableSemanticAssetObject, type KpImmutableSemanticAssetObject } from "./immutable-asset.ts";
import { sha256 } from "../kernel/sha256.ts";

export interface MotionObservationSource {
  readonly schemaVersion: "kp.motion-observation.v1";
  readonly pointId: string;
  readonly lengthUnit: "m";
  readonly timeUnit: "s";
  readonly interpolation: "piecewise-linear";
  readonly originShift: number;
  readonly observations: readonly { readonly id: string; readonly time: number; readonly position: number }[];
}
export type CheckedMotionObservation = KpImmutableSemanticAssetObject<MotionObservationSource>;
export interface MotionObservationGap {
  readonly status: "repair";
  readonly code: "motion-source" | "motion-observation" | "motion-unsupported";
  readonly path: string;
  readonly expected: string;
}
const checked = new WeakSet<object>();
export const motionObservationExample: MotionObservationSource = {
  schemaVersion: "kp.motion-observation.v1", pointId: "point.cart", lengthUnit: "m", timeUnit: "s",
  interpolation: "piecewise-linear", originShift: 3,
  observations: [
    { id: "start", time: 0, position: 1 }, { id: "outward", time: 2, position: 5 },
    { id: "pause", time: 4, position: 5 }, { id: "return", time: 6, position: 2 }
  ]
};

/** Observations do not determine the intervening path. This bounded source
 * explicitly chooses linear interpolation, fixed axes, and metre/second units. */
export function checkMotionObservation(value: unknown):
  | { readonly status: "checked"; readonly record: CheckedMotionObservation }
  | MotionObservationGap {
  const fail = (code: MotionObservationGap["code"], path: string, expected: string): MotionObservationGap => ({ status: "repair", code, path, expected });
  if (!plain(value)) return fail("motion-source", "$", "Use a plain motion-observation source.");
  const keys = ["schemaVersion", "pointId", "lengthUnit", "timeUnit", "interpolation", "originShift", "observations"];
  if (Object.keys(value).some(key => !keys.includes(key))) return fail("motion-unsupported", "$", "Only observation data is accepted; no derived claims, geometry or timing policy.");
  if (value["schemaVersion"] !== "kp.motion-observation.v1" || value["lengthUnit"] !== "m" || value["timeUnit"] !== "s" || value["interpolation"] !== "piecewise-linear")
    return fail("motion-unsupported", "$", "Use v1, metres, seconds and explicit piecewise-linear interpolation.");
  const pointId = value["pointId"], originShift = value["originShift"], observations = value["observations"];
  if (!identifier(pointId) || !boundedInteger(originShift)) return fail("motion-source", "$", "Use a stable point ID and integer origin shift between -1000 and 1000 m.");
  if (!Array.isArray(observations) || observations.length < 2 || observations.length > 12)
    return fail("motion-observation", "$.observations", "Supply 2–12 ordered observations.");
  const samples: MotionObservationSource["observations"][number][] = [], ids = new Set<string>();
  for (const [index, sample] of observations.entries()) {
    const path = `$.observations[${index}]`;
    if (!plain(sample) || Object.keys(sample).some(key => !["id", "time", "position"].includes(key))) return fail("motion-observation", path, "Use only id, time and position.");
    const id = sample["id"], time = sample["time"], position = sample["position"];
    if (!identifier(id) || ids.has(id) || !boundedInteger(time) || time < 0 || !boundedInteger(position))
      return fail("motion-observation", path, "Use unique IDs and bounded integer times/positions; time is nonnegative.");
    if ((index === 0 && time !== 0) || (index > 0 && time <= samples[index - 1]!.time))
      return fail("motion-observation", `${path}.time`, "Start at zero and use strictly increasing times.");
    ids.add(id); samples.push({ id, time, position });
  }
  const source: MotionObservationSource = { schemaVersion: "kp.motion-observation.v1", pointId, originShift,
    lengthUnit: "m", timeUnit: "s", interpolation: "piecewise-linear", observations: samples };
  const record = createKpImmutableSemanticAssetObject({ id: `motion.${sha256(JSON.stringify(source))}`,
    objectType: "motion-observation", title: "One-dimensional position record", value: source,
    selectors: samples.map(sample => ({ id: `observation.${sample.id}`, kind: "observation", label: sample.id })) });
  checked.add(record);
  return { status: "checked", record };
}

export function assertCheckedMotionObservation(record: CheckedMotionObservation): void {
  if (!checked.has(record)) throw new TypeError("Motion data must pass its domain checker, not only an immutable constructor.");
}
export function motionObservationFacts(record: CheckedMotionObservation) {
  assertCheckedMotionObservation(record);
  const observations = record.value.observations, first = observations[0]!, last = observations.at(-1)!;
  return Object.freeze({ duration: last.time, displacement: last.position - first.position,
    distance: observations.slice(1).reduce((sum, sample, index) => sum + Math.abs(sample.position - observations[index]!.position), 0),
    coordinates: Object.freeze(observations.map(sample => sample.position - record.value.originShift)) });
}

/** Time sampling has no paint or playback policy; reverse seeks ask the same
 * model at the same time. Distance belongs to the declared interpolated model. */
export function sampleMotionObservation(record: CheckedMotionObservation, time: number) {
  assertCheckedMotionObservation(record);
  const samples = record.value.observations, last = samples.at(-1)!;
  if (!Number.isFinite(time) || time < 0 || time > last.time) throw new RangeError("Time must lie within the observed interval.");
  const index = Math.min(samples.findIndex((sample, i) => i > 0 && time <= sample.time) - 1, samples.length - 2);
  const segment = Math.max(0, index), from = samples[segment]!, to = samples[segment + 1]!;
  const fraction = (time - from.time) / (to.time - from.time);
  const position = from.position + fraction * (to.position - from.position);
  const distance = samples.slice(1, segment + 1).reduce((sum, sample, i) => sum + Math.abs(sample.position - samples[i]!.position), 0) + Math.abs(position - from.position);
  return Object.freeze({ pointId: record.value.pointId, time, position,
    displacement: position - samples[0]!.position, distance, segment, fraction,
    fromObservationId: from.id, toObservationId: to.id });
}
function boundedInteger(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && Math.abs(value) <= 1000; }
function identifier(value: unknown): value is string { return typeof value === "string" && /^[a-zA-Z][a-zA-Z0-9_.-]{0,63}$/.test(value); }
function plain(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && Object.getPrototypeOf(value) === Object.prototype &&
    Reflect.ownKeys(value).every(key => typeof key === "string" && Object.getOwnPropertyDescriptor(value, key)?.enumerable === true && "value" in Object.getOwnPropertyDescriptor(value, key)!);
}
