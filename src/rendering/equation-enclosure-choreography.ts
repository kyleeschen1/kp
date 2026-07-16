export type KpEquationEnclosureChoreographyKind = "wrap" | "unwrap";

export interface KpEquationEnclosureChoreographyFrame {
  readonly kind: KpEquationEnclosureChoreographyKind;
  readonly progress: number;
  readonly persistentTravelProgress: number;
  readonly enclosureVisibility: number;
  readonly outerArtifactVisibility: number;
  readonly settleProgress: number;
}

export function sampleKpEquationEnclosureChoreography(
  kind: KpEquationEnclosureChoreographyKind,
  progress: number
): KpEquationEnclosureChoreographyFrame {
  const p = clamp01(progress);

  if (kind === "wrap") {
    return {
      kind,
      progress: p,
      persistentTravelProgress: intervalProgress(p, 0.08, 0.42),
      enclosureVisibility: intervalProgress(p, 0.42, 0.7),
      outerArtifactVisibility: intervalProgress(p, 0.58, 0.82),
      settleProgress: intervalProgress(p, 0.76, 1)
    };
  }

  return {
    kind,
    progress: p,
    persistentTravelProgress: intervalProgress(p, 0.45, 0.88),
    enclosureVisibility: 1 - intervalProgress(p, 0.18, 0.56),
    outerArtifactVisibility: 1 - intervalProgress(p, 0, 0.32),
    settleProgress: intervalProgress(p, 0.82, 1)
  };
}

function intervalProgress(progress: number, start: number, end: number): number {
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  const local = (progress - start) / (end - start);
  return local * local * (3 - 2 * local);
}

function clamp01(value: number): number {
  return Number.isNaN(value) ? 0 : Math.max(0, Math.min(1, value));
}
