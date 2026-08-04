export const KP_LISP_TUNING_KEYS = Object.freeze([
  "jostleAmplitude",
  "parenthesisLag",
  "depthDelay",
  "archHeight",
  "compression",
  "particleDetail",
  "dwellDuration",
  "settlingStiffness"
] as const);

export type KpLispTuningKey = (typeof KP_LISP_TUNING_KEYS)[number];

export interface KpLispTuningValues {
  readonly jostleAmplitude: number;
  readonly parenthesisLag: number;
  readonly depthDelay: number;
  readonly archHeight: number;
  readonly compression: number;
  readonly particleDetail: number;
  readonly dwellDuration: number;
  readonly settlingStiffness: number;
}

export interface KpLispInternalTuningProjection {
  readonly id: "internal-tuning.lisp.s-expression.v1";
  readonly visibility: "internal-only";
  readonly publicControls: false;
  readonly values: KpLispTuningValues;
}

export interface KpLispAuthoredDwellBeat {
  readonly id: string;
  readonly block: "structure" | "application" | "evaluation";
  readonly transitionDuration: number;
  readonly dwell: "minor" | "major";
}

export interface KpLispDwellTimeline {
  readonly id: "dwell-timeline.lisp.s-expression";
  readonly duration: number;
  readonly checkpoints: readonly {
    readonly id: string;
    readonly block: KpLispAuthoredDwellBeat["block"];
    readonly dwellKind: KpLispAuthoredDwellBeat["dwell"];
    readonly transition: { readonly start: number; readonly end: number };
    readonly dwell: { readonly start: number; readonly end: number };
    readonly seekProgress: number;
  }[];
}

export interface KpLispDwellSample {
  readonly checkpointId: string;
  readonly block: KpLispAuthoredDwellBeat["block"];
  readonly phase: "transition" | "dwell";
  readonly localProgress: number;
}

const tuningBounds = Object.freeze({
  jostleAmplitude: [0, 1],
  parenthesisLag: [0.25, 1.75],
  depthDelay: [0, 1.5],
  archHeight: [0.15, 0.8],
  compression: [0.35, 0.8],
  particleDetail: [0, 2],
  dwellDuration: [0.5, 2.5],
  settlingStiffness: [0.4, 1]
} satisfies Record<KpLispTuningKey, readonly [number, number]>);

export const KP_LISP_DEFAULT_TUNING: KpLispTuningValues = Object.freeze({
  jostleAmplitude: 0.42,
  parenthesisLag: 1,
  depthDelay: 0.5,
  archHeight: 0.4,
  compression: 0.58,
  particleDetail: 1,
  dwellDuration: 1.2,
  settlingStiffness: 0.72
});

export const KP_LISP_AUTHORED_DWELL_BEATS = Object.freeze([
  beat("source-readable", "structure", 0, "major"),
  beat("leaf-forms-folded", "structure", 0.85, "minor"),
  beat("lambda-form-folded", "structure", 0.8, "minor"),
  beat("application-folded", "structure", 0.8, "major"),
  beat("source-restored", "structure", 1.4, "major"),
  beat("binding-ready", "application", 0, "major"),
  beat("parameter-bound", "application", 1.2, "minor"),
  beat("body-propagated", "application", 1.05, "minor"),
  beat("body-reconstructed", "application", 1.1, "major"),
  beat("reduction-ready", "evaluation", 0, "major"),
  beat("inputs-gathered", "evaluation", 1, "minor"),
  beat("result-settled", "evaluation", 1, "major")
] as const);

export function defineKpLispInternalTuning(
  overrides: Partial<KpLispTuningValues> = {}
): KpLispInternalTuningProjection {
  for (const key of Object.keys(overrides)) {
    if (!KP_LISP_TUNING_KEYS.includes(key as KpLispTuningKey)) {
      throw new Error(`Unknown Lisp tuning parameter ${key}.`);
    }
  }
  const values = Object.fromEntries(KP_LISP_TUNING_KEYS.map((key) => {
    const value = overrides[key] ?? KP_LISP_DEFAULT_TUNING[key];
    const [minimum, maximum] = tuningBounds[key];
    if (!Number.isFinite(value) || value < minimum || value > maximum) {
      throw new Error(
        `Lisp tuning ${key} must be between ${minimum} and ${maximum}.`
      );
    }
    if (key === "particleDetail" && !Number.isInteger(value)) {
      throw new Error("Lisp tuning particleDetail must be an integer.");
    }
    return [key, round(value)];
  })) as unknown as KpLispTuningValues;
  return Object.freeze({
    id: "internal-tuning.lisp.s-expression.v1",
    visibility: "internal-only",
    publicControls: false,
    values: Object.freeze(values)
  });
}

export function serializeKpLispInternalTuning(
  tuning: KpLispInternalTuningProjection
): string {
  return [
    tuning.id,
    ...KP_LISP_TUNING_KEYS.map((key) => `${key}=${tuning.values[key]}`)
  ].join(";");
}

export function parseKpLispInternalTuning(
  serialized: string
): KpLispInternalTuningProjection {
  const [version, ...entries] = serialized.split(";");
  if (version !== "internal-tuning.lisp.s-expression.v1") {
    throw new Error("Unsupported Lisp tuning serialization version.");
  }
  const values: Record<string, number> = {};
  for (const entry of entries) {
    const [key, rawValue, extra] = entry.split("=");
    if (key === undefined || rawValue === undefined || extra !== undefined ||
        key in values) {
      throw new Error("Malformed Lisp tuning serialization.");
    }
    values[key] = Number(rawValue);
  }
  if (Object.keys(values).length !== KP_LISP_TUNING_KEYS.length ||
      KP_LISP_TUNING_KEYS.some((key) => !(key in values))) {
    throw new Error("Lisp tuning serialization must contain all eight parameters.");
  }
  return defineKpLispInternalTuning(values as unknown as KpLispTuningValues);
}

export function compileKpLispDwellTimeline(
  beats: readonly KpLispAuthoredDwellBeat[] = KP_LISP_AUTHORED_DWELL_BEATS,
  tuning: KpLispInternalTuningProjection = defineKpLispInternalTuning()
): KpLispDwellTimeline {
  if (beats.length === 0) throw new Error("Lisp dwell timeline requires a beat.");
  let cursor = 0;
  const mutable = beats.map((authored) => {
    if (!Number.isFinite(authored.transitionDuration) ||
        authored.transitionDuration < 0) {
      throw new Error(`Lisp beat ${authored.id} has an invalid transition duration.`);
    }
    const transition = interval(cursor, cursor + authored.transitionDuration);
    cursor = transition.end;
    const multiplier = authored.dwell === "major" ? 1 : 0.65;
    const dwell = interval(cursor, cursor + tuning.values.dwellDuration * multiplier);
    cursor = dwell.end;
    return { authored, transition, dwell };
  });
  const duration = round(cursor);
  return Object.freeze({
    id: "dwell-timeline.lisp.s-expression",
    duration,
    checkpoints: Object.freeze(mutable.map(({ authored, transition, dwell }) =>
      Object.freeze({
        id: authored.id,
        block: authored.block,
        dwellKind: authored.dwell,
        transition,
        dwell,
        seekProgress: round(((dwell.start + dwell.end) / 2) / duration)
      })))
  });
}

export function sampleKpLispDwellTimeline(
  timeline: KpLispDwellTimeline,
  progress: number
): KpLispDwellSample {
  const time = round(clamp01(progress) * timeline.duration);
  const checkpoint = timeline.checkpoints.find(({ dwell }) => time <= dwell.end) ??
    timeline.checkpoints.at(-1)!;
  const inTransition = time < checkpoint.transition.end;
  return Object.freeze({
    checkpointId: checkpoint.id,
    block: checkpoint.block,
    phase: inTransition ? "transition" : "dwell",
    localProgress: inTransition
      ? intervalProgress(checkpoint.transition, time)
      : 1
  });
}

function beat(
  id: string,
  block: KpLispAuthoredDwellBeat["block"],
  transitionDuration: number,
  dwell: KpLispAuthoredDwellBeat["dwell"]
): KpLispAuthoredDwellBeat {
  return Object.freeze({ id, block, transitionDuration, dwell });
}

function interval(start: number, end: number) {
  return Object.freeze({ start: round(start), end: round(end) });
}

function intervalProgress(
  value: { readonly start: number; readonly end: number },
  time: number
): number {
  if (value.end === value.start) return 1;
  return round(clamp01((time - value.start) / (value.end - value.start)));
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}
