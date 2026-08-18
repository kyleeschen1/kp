import {
  compileKpFactoringFusionPlan,
  sampleKpFactoringAddendCompactionProgress
} from "../animation/factoring-choreography.ts";
import {
  reverseKpFissionFusionPlan,
  sampleKpFissionFusion,
  type KpFissionFusionPlan
} from "../animation/fission-fusion.ts";
import type {
  KpEquationMaterialLayerOwnerFrame
} from "./equation-material-layer-dom.ts";
import {
  planKpEquationMotionPathBetweenPoints,
  type KpEquationMotionPathCandidate
} from "./equation-motion-path-planner.ts";
import {
  measureKpNativeKatexTextInkRect
} from "./native-katex-paint-geometry.ts";
import type {
  KpNativeKatexPaintAtomObservation,
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import {
  type KpNativeKatexSceneTrack
} from "./native-katex-base-scene-plan.ts";
import type {
  KpFactorCommonTermMotifBinding
} from "../animation/factoring-motif-binding.ts";

export const kpMaximumFactoringExcursionInLocalInkHeights = 3.75;

export type KpNativeKatexFactoringChoreographyIntent =
  KpFactorCommonTermMotifBinding;

interface KpNativeKatexFactoringAtomGeometry {
  readonly atom: KpNativeKatexPaintAtomObservation;
  readonly paintRect: KpNativeKatexPaintAtomObservation["rect"];
}

export interface KpNativeKatexFactoringScenePlan {
  readonly kind: "native-katex-factoring-scene-plan";
  readonly id: string;
  readonly direction: "forward" | "rewind";
  readonly transferPlan: KpFissionFusionPlan;
  readonly sourceFactors: readonly KpNativeKatexFactoringAtomGeometry[];
  readonly targetFactors: readonly KpNativeKatexFactoringAtomGeometry[];
  readonly pathsByEntityId: ReadonlyMap<string, KpEquationMotionPathCandidate>;
  readonly claimedSourceAtomIds: ReadonlySet<string>;
  readonly claimedTargetAtomIds: ReadonlySet<string>;
}

export interface KpNativeKatexFactoringSceneBinding {
  readonly claimTracks:
    (tracks: readonly KpNativeKatexSceneTrack[]) =>
      readonly KpNativeKatexSceneTrack[];
  readonly claimedTargetAtomIds: ReadonlySet<string>;
  readonly sampleMaterialOwners:
    (progress: number) => readonly KpEquationMaterialLayerOwnerFrame[];
  readonly recordEvidence: () => void;
}

export function bindKpNativeKatexFactoringScene(input: {
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly intent: KpNativeKatexFactoringChoreographyIntent;
}): KpNativeKatexFactoringSceneBinding {
  const plan = compileKpNativeKatexFactoringScenePlan(input);
  const sampleContextProgress = (progress: number) =>
    sampleKpNativeKatexFactoringContextProgress(
      progress,
      plan.transferPlan.transferEvent.progress
    );
  return Object.freeze({
    claimTracks(tracks: readonly KpNativeKatexSceneTrack[]) {
      return Object.freeze(tracks.filter((track) =>
        !plan.claimedSourceAtomIds.has(track.sourceAtomId ?? "") &&
        !plan.claimedTargetAtomIds.has(track.targetAtomId ?? "") &&
        !plan.claimedSourceAtomIds.has(track.visualAtomId) &&
        !plan.claimedTargetAtomIds.has(track.visualAtomId)
      ).map((track) => Object.freeze({
        ...track,
        sampleProgress: sampleContextProgress
      })));
    },
    claimedTargetAtomIds: plan.claimedTargetAtomIds,
    sampleMaterialOwners: (progress: number) =>
      sampleKpNativeKatexFactoringScenePlan({ plan, progress }),
    recordEvidence() {
      input.source.stage.dataset["kpNativeKatexFactoringOwnership"] =
        "atomic-fission-fusion";
      input.source.stage.dataset["kpNativeKatexFactoringGeometry"] =
        "paint-space";
      input.source.stage.dataset["kpNativeKatexFactoringSynchronization"] =
        input.intent.synchronization;
      input.source.stage.dataset["kpNativeKatexFactoringPaintPolicy"] =
        input.intent.fusionPaintPolicy;
      input.source.stage.dataset["kpNativeKatexFactoringEvaluation"] =
        input.intent.coefficientEvaluation;
    }
  });
}

export function compileKpNativeKatexFactoringScenePlan(input: {
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly intent: KpNativeKatexFactoringChoreographyIntent;
}): KpNativeKatexFactoringScenePlan {
  assertFactoringIntent(input.intent);
  const forwardPlan = compileKpFactoringFusionPlan({
    id: input.intent.id,
    factorCopyIds: input.intent.factorCopyIds,
    commonFactorId: input.intent.commonFactorId
  });
  const transferPlan = input.intent.direction === "forward"
    ? forwardPlan
    : reverseKpFissionFusionPlan({
        id: `${input.intent.id}.rewind`,
        plan: forwardPlan,
        semanticOrder: input.intent.factorCopyIds
      });
  const sourceFactors = transferPlan.sourceEntityIds.map((entityId) =>
    factorGeometry(input.source, entityId)
  );
  const targetFactors = transferPlan.targetEntityIds.map((entityId) =>
    factorGeometry(input.target, entityId)
  );
  assertTypographyCompatible([...sourceFactors, ...targetFactors]);

  const commonGeometry = input.intent.direction === "forward"
    ? targetFactors[0]!
    : sourceFactors[0]!;
  const branchGeometry = input.intent.direction === "forward"
    ? sourceFactors
    : targetFactors;
  const localInkHeight = Math.max(
    commonGeometry.paintRect.height,
    ...branchGeometry.map(({ paintRect }) => paintRect.height)
  );
  const pathsByEntityId = new Map(branchGeometry.map((geometry, index) => {
    const source = input.intent.direction === "forward"
      ? rectCenter(geometry.paintRect)
      : rectCenter(commonGeometry.paintRect);
    const target = input.intent.direction === "forward"
      ? rectCenter(commonGeometry.paintRect)
      : rectCenter(geometry.paintRect);
    const branchOffset = branchGeometry.length <= 1
      ? 0
      : index / (branchGeometry.length - 1) * 0.4;
    const clearance = localInkHeight * (3.25 + branchOffset);
    if (
      clearance >
      localInkHeight * kpMaximumFactoringExcursionInLocalInkHeights
    ) {
      throw new Error("Factoring paint path exceeds its local ink corridor.");
    }
    return [
      geometry.atom.semanticEntityId,
      planKpEquationMotionPathBetweenPoints({
        id: `${input.intent.id}.paint-path.${geometry.atom.semanticEntityId}`,
        start: source,
        end: target,
        variants: ["arc-above"],
        clearance,
        moverRadius: 0
      }).selected
    ] as const;
  }));

  return Object.freeze({
    kind: "native-katex-factoring-scene-plan",
    id: input.intent.id,
    direction: input.intent.direction,
    transferPlan,
    sourceFactors: Object.freeze(sourceFactors),
    targetFactors: Object.freeze(targetFactors),
    pathsByEntityId,
    claimedSourceAtomIds: new Set(sourceFactors.map(({ atom }) => atom.id)),
    claimedTargetAtomIds: new Set(targetFactors.map(({ atom }) => atom.id))
  });
}

function assertFactoringIntent(
  intent: KpNativeKatexFactoringChoreographyIntent
): void {
  if (
    intent.operation !== "factorCommonTerm" ||
    intent.motif !== "merge-fan-in" ||
    intent.fusionPaintPolicy !== "opaque-many-to-one" ||
    intent.synchronization !== "simultaneous" ||
    intent.coefficientEvaluation !== "deferred" ||
    intent.factorCopyIds.length < 2 ||
    new Set(intent.factorCopyIds).size !== intent.factorCopyIds.length ||
    intent.factorCopyIds.includes(intent.commonFactorId) ||
    (
      intent.direction === "forward"
        ? intent.lifecycle !== "merge"
        : intent.lifecycle !== "split"
    )
  ) {
    throw new Error("Factoring scene requires one coherent typed motif cohort.");
  }
}

export function sampleKpNativeKatexFactoringScenePlan(input: {
  readonly plan: KpNativeKatexFactoringScenePlan;
  readonly progress: number;
}): readonly KpEquationMaterialLayerOwnerFrame[] {
  const bounded = clamp01(input.progress);
  const frame = sampleKpFissionFusion({
    plan: input.plan.transferPlan,
    progress: bounded
  });
  const sourceFrameById = new Map(
    frame.sources.map((source) => [source.entityId, source])
  );
  const targetFrameById = new Map(
    frame.targets.map((target) => [target.entityId, target])
  );

  return Object.freeze([
    ...input.plan.sourceFactors.map((geometry) => {
      const sourceFrame = sourceFrameById.get(geometry.atom.semanticEntityId);
      if (sourceFrame === undefined) {
        throw new Error(
          `Factoring scene ${input.plan.id} lacks source frame ` +
          `${geometry.atom.semanticEntityId}.`
        );
      }
      const desiredPaintRect = input.plan.direction === "forward"
        ? paintRectAlongPath({
            geometry,
            path: requiredPath(input.plan, geometry.atom.semanticEntityId),
            progress: sourceFrame.pathProgress
          })
        : geometry.paintRect;
      return ownerFrame({
        planId: input.plan.id,
        side: "source",
        geometry,
        desiredPaintRect,
        opacity: sourceFrame.opacity
      });
    }),
    ...input.plan.targetFactors.map((geometry) => {
      const targetFrame = targetFrameById.get(geometry.atom.semanticEntityId);
      if (targetFrame === undefined) {
        throw new Error(
          `Factoring scene ${input.plan.id} lacks target frame ` +
          `${geometry.atom.semanticEntityId}.`
        );
      }
      const desiredPaintRect = input.plan.direction === "rewind"
        ? paintRectAlongPath({
            geometry,
            path: requiredPath(input.plan, geometry.atom.semanticEntityId),
            progress: targetFrame.pathProgress,
            startPaintRect: input.plan.sourceFactors[0]!.paintRect
          })
        : geometry.paintRect;
      return ownerFrame({
        planId: input.plan.id,
        side: "target",
        geometry,
        desiredPaintRect,
        opacity: targetFrame.opacity
      });
    })
  ]);
}

export function sampleKpNativeKatexFactoringContextProgress(
  progress: number,
  transferProgress = 1
): number {
  const coordinated = smoothstep(interval(
    progress,
    transferProgress * 0.3,
    transferProgress * 0.8
  ));
  return sampleKpFactoringAddendCompactionProgress(
    interpolate(0.08, 0.78, coordinated)
  );
}

function factorGeometry(
  scene: KpNativeKatexRenderedSceneObservation,
  semanticEntityId: string
): KpNativeKatexFactoringAtomGeometry {
  const atoms = scene.atoms.filter((atom) =>
    atom.semanticEntityId === semanticEntityId
  );
  if (atoms.length !== 1 || atoms[0]!.paintKind !== "glyph") {
    throw new Error(
      `Factoring entity ${semanticEntityId} must own exactly one glyph atom.`
    );
  }
  const atom = atoms[0]!;
  return Object.freeze({
    atom,
    paintRect: measureKpNativeKatexTextInkRect(scene.stage, atom.sourceElement)
  });
}

function assertTypographyCompatible(
  geometries: readonly KpNativeKatexFactoringAtomGeometry[]
): void {
  const reference = geometries[0];
  if (reference === undefined) {
    throw new Error("Factoring scene requires measured factor paint.");
  }
  const incompatible = geometries.find(({ atom, paintRect }) =>
    atom.paintKind !== reference.atom.paintKind ||
    atom.visualKey !== reference.atom.visualKey ||
    typographyFingerprint(atom) !== typographyFingerprint(reference.atom) ||
    atom.fontRevision !== reference.atom.fontRevision ||
    Math.abs(paintRect.width - reference.paintRect.width) > 0.75 ||
    Math.abs(paintRect.height - reference.paintRect.height) > 0.75
  );
  if (incompatible !== undefined) {
    throw new Error(
      "Factoring fusion cannot atomically transfer typography-incompatible " +
      `paint ${incompatible.atom.semanticEntityId}.`
    );
  }
}

function typographyFingerprint(
  atom: KpNativeKatexPaintAtomObservation
): string {
  return atom.styleFingerprint.split("|").filter((entry) =>
    [
      "font-family:",
      "font-size:",
      "font-style:",
      "font-weight:"
    ].some((property) => entry.startsWith(property))
  ).join("|");
}

function requiredPath(
  plan: KpNativeKatexFactoringScenePlan,
  entityId: string
): KpEquationMotionPathCandidate {
  const path = plan.pathsByEntityId.get(entityId);
  if (path === undefined) {
    throw new Error(`Factoring scene ${plan.id} lacks path ${entityId}.`);
  }
  return path;
}

function paintRectAlongPath(input: {
  readonly geometry: KpNativeKatexFactoringAtomGeometry;
  readonly path: KpEquationMotionPathCandidate;
  readonly progress: number;
  readonly startPaintRect?: KpNativeKatexPaintAtomObservation["rect"] | undefined;
}): KpNativeKatexPaintAtomObservation["rect"] {
  const p = clamp01(input.progress);
  const lift = smoothstep(interval(p, 0, 0.18));
  const traverse = smoothstep(interval(p, 0.22, 0.8));
  const descend = smoothstep(interval(p, 0.65, 1));
  const laneY = input.path.control.y;
  const center = {
    x: interpolate(input.path.start.x, input.path.end.x, traverse),
    y: interpolate(
      interpolate(input.path.start.y, laneY, lift),
      input.path.end.y,
      descend
    )
  };
  const paint = input.startPaintRect ?? input.geometry.paintRect;
  return {
    left: center.x - paint.width / 2,
    top: center.y - paint.height / 2,
    width: paint.width,
    height: paint.height
  };
}

function ownerFrame(input: {
  readonly planId: string;
  readonly side: "source" | "target";
  readonly geometry: KpNativeKatexFactoringAtomGeometry;
  readonly desiredPaintRect: KpNativeKatexPaintAtomObservation["rect"];
  readonly opacity: 0 | 1;
}): KpEquationMaterialLayerOwnerFrame {
  const paintOffsetX =
    input.geometry.paintRect.left - input.geometry.atom.rect.left;
  const paintOffsetY =
    input.geometry.paintRect.top - input.geometry.atom.rect.top;
  return Object.freeze({
    ownerId:
      `native-factoring-owner.${input.planId}.${input.side}.` +
      input.geometry.atom.id,
    sourceElement: input.geometry.atom.sourceElement,
    semanticEntityId: input.geometry.atom.semanticEntityId,
    rect: Object.freeze({
      // The path is paint-space authority; wrapper geometry is reconstructed.
      left: input.desiredPaintRect.left - paintOffsetX,
      top: input.desiredPaintRect.top - paintOffsetY,
      width: input.geometry.atom.rect.width,
      height: input.geometry.atom.rect.height
    }),
    expectedPaintRect: input.desiredPaintRect,
    opacity: input.opacity,
    transform: "none",
    fragmentRole: `glyph:factoring-${input.side}`
  });
}

function rectCenter(rect: KpNativeKatexPaintAtomObservation["rect"]): {
  readonly x: number;
  readonly y: number;
} {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function interval(value: number, start: number, end: number): number {
  return clamp01((value - start) / (end - start));
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}

function interpolate(source: number, target: number, progress: number): number {
  return source + (target - source) * progress;
}
