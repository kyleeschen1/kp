export interface KpTemporalPose {
  readonly x: number;
  readonly y: number;
  readonly opacity: number;
  readonly scale: number;
}

export interface KpTemporalContinuityFailure {
  readonly path: string;
  readonly message: string;
}

export interface KpTemporalContinuityReport {
  readonly lawId: string;
  readonly passed: boolean;
  readonly sampleCount: number;
  readonly topologySize: number;
  readonly failures: readonly KpTemporalContinuityFailure[];
}

export function checkKpTemporalContinuity(input: {
  readonly sample: (progress: number) => Readonly<Record<string, KpTemporalPose>>;
  readonly steps?: number;
  readonly maxFractionalJump?: number;
}): KpTemporalContinuityReport {
  const steps = positiveInteger(input.steps ?? 240, "Temporal continuity steps");
  const maxFractionalJump = positive(input.maxFractionalJump ?? 0.12, "Temporal continuity jump fraction");
  const frames = Array.from({ length: steps + 1 }, (_, index) => input.sample(index / steps));
  const ids = Object.keys(frames[0]!).sort();
  const failures: KpTemporalContinuityFailure[] = [];
  for (const [index, frame] of frames.entries()) {
    const frameIds = Object.keys(frame).sort();
    if (!sameStrings(frameIds, ids)) {
      failures.push({ path: `frames.${index}.topology`, message: `Expected token topology ${ids.join(", ")}; received ${frameIds.join(", ")}.` });
      continue;
    }
    for (const id of ids) validatePose(frame[id]!, `frames.${index}.${id}`, failures);
  }

  for (const id of ids) {
    for (const key of ["x", "y", "opacity", "scale"] as const) {
      const values = frames.flatMap((frame) => frame[id] === undefined ? [] : [frame[id]![key]]);
      if (values.length !== frames.length) continue;
      const range = Math.max(...values) - Math.min(...values);
      const floor = key === "x" || key === "y" ? 1 : 0.025;
      const threshold = Math.max(floor, range * maxFractionalJump);
      for (let index = 1; index < values.length; index += 1) {
        const beforePose = frames[index - 1]![id]!;
        const afterPose = frames[index]![id]!;
        if (key !== "opacity" && Math.max(beforePose.opacity, afterPose.opacity) <= 0.01) continue;
        const jump = Math.abs(values[index]! - values[index - 1]!);
        if (jump > threshold) failures.push({
          path: `frames.${index}.${id}.${key}`,
          message: `Adjacent samples jump ${round(jump)}, above continuity threshold ${round(threshold)}.`
        });
      }
    }
  }
  return report("animation.temporal-continuity", frames.length, ids.length, failures);
}

export function checkKpTemporalReverseEquivalence(input: {
  readonly forward: (progress: number) => Readonly<Record<string, KpTemporalPose>>;
  readonly inverse: (progress: number) => Readonly<Record<string, KpTemporalPose>>;
  readonly steps?: number;
  readonly tolerance?: number;
}): KpTemporalContinuityReport {
  const steps = positiveInteger(input.steps ?? 120, "Temporal reverse steps");
  const tolerance = positive(input.tolerance ?? 1e-7, "Temporal reverse tolerance");
  const failures: KpTemporalContinuityFailure[] = [];
  const initial = input.forward(0);
  const ids = Object.keys(initial).sort();
  for (let index = 0; index <= steps; index += 1) {
    const progress = index / steps;
    const forward = input.forward(progress);
    const inverse = input.inverse(1 - progress);
    if (!sameStrings(Object.keys(forward).sort(), ids) || !sameStrings(Object.keys(inverse).sort(), ids)) {
      failures.push({ path: `frames.${index}.topology`, message: "Forward and inverse samples must preserve one token topology." });
      continue;
    }
    for (const id of ids) {
      for (const key of ["x", "y", "opacity", "scale"] as const) {
        const delta = Math.abs(forward[id]![key] - inverse[id]![key]);
        if (delta > tolerance) failures.push({
          path: `frames.${index}.${id}.${key}`,
          message: `Forward and inverse differ by ${round(delta)}.`
        });
      }
    }
  }
  return report("animation.temporal-reverse-equivalence", steps + 1, ids.length, failures);
}

function validatePose(pose: KpTemporalPose, path: string, failures: KpTemporalContinuityFailure[]): void {
  if (![pose.x, pose.y, pose.opacity, pose.scale].every(Number.isFinite)) {
    failures.push({ path, message: "Temporal pose values must be finite." });
  }
  if (pose.opacity < 0 || pose.opacity > 1) failures.push({ path: `${path}.opacity`, message: "Opacity must remain between zero and one." });
  if (pose.scale <= 0) failures.push({ path: `${path}.scale`, message: "Scale must remain greater than zero." });
}

function report(lawId: string, sampleCount: number, topologySize: number, failures: KpTemporalContinuityFailure[]): KpTemporalContinuityReport {
  return { lawId, passed: failures.length === 0, sampleCount, topologySize, failures };
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function positive(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label} must be positive.`);
  return value;
}

function positiveInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${label} must be a positive integer.`);
  return value;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
