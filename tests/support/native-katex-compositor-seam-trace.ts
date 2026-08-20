import { kpNativeKatexCompositorConformanceBudget } from
  "./native-katex-compositor-conformance-budget.ts";
import type { KpNativeKatexConformanceVisibleInkObservation } from
  "./native-katex-compositor-visible-ink-observer.ts";

export type KpNativeKatexConformancePaintOwner =
  | "native-source"
  | "material"
  | "native-target";

export type KpNativeKatexConformanceSampleSlot =
  typeof kpNativeKatexCompositorConformanceBudget.sampleSlots[number];

export interface KpNativeKatexConformanceSeamSample {
  readonly slot: KpNativeKatexConformanceSampleSlot;
  readonly progress: number;
  readonly owner: KpNativeKatexConformancePaintOwner;
  readonly paintOpacityByOwner: Readonly<Record<
    KpNativeKatexConformancePaintOwner,
    number
  >>;
  readonly observation: KpNativeKatexConformanceVisibleInkObservation;
}

export interface KpNativeKatexConformanceSeamTrace {
  readonly kind: "native-katex-compositor-seam-trace";
  readonly transitionId: string;
  readonly semanticEntityId: string;
  readonly shapeId: KpNativeKatexConformanceVisibleInkObservation["shapeId"];
  readonly lifecycleRevision: number;
  readonly fontRevision: number;
  readonly viewportKey: string;
  readonly samples: readonly KpNativeKatexConformanceSeamSample[];
}

const expectedOwnerBySlot = Object.freeze({
  "source-native": "native-source",
  "source-material-seam": "material",
  "material-midpoint": "material",
  "material-target-seam": "material",
  "target-native": "native-target"
} satisfies Record<
  KpNativeKatexConformanceSampleSlot,
  KpNativeKatexConformancePaintOwner
>);

export function createKpNativeKatexConformanceSeamTrace(input: {
  readonly transitionId: string;
  readonly lifecycleRevision: number;
  readonly fontRevision: number;
  readonly viewportKey: string;
  readonly samples: readonly KpNativeKatexConformanceSeamSample[];
}): KpNativeKatexConformanceSeamTrace {
  requireText(input.transitionId, "transition ID");
  requireText(input.viewportKey, "viewport key");
  requireRevision(input.lifecycleRevision, "lifecycle revision");
  requireRevision(input.fontRevision, "font revision");
  const slots = kpNativeKatexCompositorConformanceBudget.sampleSlots;
  if (input.samples.length !== slots.length) {
    throw new Error(`Seam trace requires exactly ${slots.length} samples.`);
  }
  const first = input.samples[0];
  if (first === undefined) throw new Error("Seam trace requires samples.");
  let previousProgress = -1;
  for (const [index, sample] of input.samples.entries()) {
    if (sample.slot !== slots[index]) {
      throw new Error(`Seam trace sample ${index} must be ${slots[index]}.`);
    }
    if (sample.owner !== expectedOwnerBySlot[sample.slot]) {
      throw new Error(
        `${sample.slot} must be owned by ${expectedOwnerBySlot[sample.slot]}.`
      );
    }
    for (const [owner, opacity] of Object.entries(sample.paintOpacityByOwner)) {
      if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) {
        throw new Error(`${sample.slot} ${owner} opacity must be within zero and one.`);
      }
    }
    if (Object.keys(sample.paintOpacityByOwner).length !== 3) {
      throw new Error(`${sample.slot} must report all three paint owners.`);
    }
    if (
      !Number.isFinite(sample.progress) ||
      sample.progress < 0 ||
      sample.progress > 1 ||
      sample.progress <= previousProgress
    ) {
      throw new Error("Seam trace progress must increase strictly within zero and one.");
    }
    if (
      sample.observation.semanticEntityId !==
        first.observation.semanticEntityId ||
      sample.observation.shapeId !== first.observation.shapeId
    ) {
      throw new Error(
        "Seam trace samples must preserve semantic entity and shape identity."
      );
    }
    previousProgress = sample.progress;
  }
  return Object.freeze({
    kind: "native-katex-compositor-seam-trace" as const,
    transitionId: input.transitionId,
    semanticEntityId: first.observation.semanticEntityId,
    shapeId: first.observation.shapeId,
    lifecycleRevision: input.lifecycleRevision,
    fontRevision: input.fontRevision,
    viewportKey: input.viewportKey,
    samples: Object.freeze(input.samples.map((sample) => Object.freeze({
      ...sample,
      paintOpacityByOwner: Object.freeze({ ...sample.paintOpacityByOwner }),
      observation: sample.observation
    })))
  });
}

export function expectedKpNativeKatexOwnerForSampleSlot(
  slot: KpNativeKatexConformanceSampleSlot
): KpNativeKatexConformancePaintOwner {
  return expectedOwnerBySlot[slot];
}

function requireText(value: string, label: string): void {
  if (value.trim() === "") throw new Error(`${label} must be non-empty.`);
}

function requireRevision(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative integer.`);
  }
}
