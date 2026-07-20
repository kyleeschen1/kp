import type {
  KpReaderEquationMaterialOwnerPlan,
  KpReaderEquationMaterialPlan
} from "./equation-material-plan.ts";
import type { KpReaderLayoutRect } from "./equation-layout-snapshot.ts";
import type {
  KpReaderEquationAlignedOwner,
  KpReaderEquationPerceptualAlignmentPlan
} from "./equation-perceptual-alignment.ts";
import {
  assertKpEquationVisualFrame,
  type KpEquationVisualFrame,
  type KpEquationVisualOwnerPose
} from "../../rendering/equation-visual-frame.ts";
import {
  sampleKpEquationMaterialOwnerHandoff
} from "../../rendering/equation-material-owner.ts";
import {
  sampleKpEquationLinearRearrangementOwners,
  type KpEquationOwnerFragmentMotion
} from "../../rendering/equation-linear-rearrangement-owner-motion.ts";
import type { KpEquationLinearRearrangementKind } from "../../rendering/equation-linear-rearrangement.ts";
import type { KpReaderEquationLayoutSnapshot } from "./equation-layout-snapshot.ts";
import type { KpWitnessedAnnihilationBinding } from "../../animation/witnessed-annihilation.ts";
import type { KpSuccessorSynthesisBinding } from "../../animation/successor-synthesis.ts";
import type { KpEquationTokenMotionFrame } from "../../rendering/semantic-equation-token-renderer.ts";

export interface KpReaderEquationSymbolMotionFrame extends KpEquationVisualFrame<
  KpReaderEquationSymbolOwnerPose
> {
  readonly id: string;
  readonly kind: "reader-equation-symbol-motion-frame";
  readonly materialPlanId: string;
  readonly alignmentPlanId: string;
  readonly progress: number;
  readonly easedProgress: number;
  readonly direction: "forward" | "rewind";
  readonly owners: readonly KpReaderEquationSymbolOwnerPose[];
  readonly witnessedAnnihilation?: {
    readonly contactPoint: { readonly x: number; readonly y: number };
    readonly frame: NonNullable<KpEquationTokenMotionFrame["witnessedAnnihilation"]>;
  } | undefined;
}

export interface KpReaderEquationSymbolOwnerPose extends KpEquationVisualOwnerPose {
  readonly ownerId: string;
  readonly lifecycle: KpReaderEquationMaterialOwnerPlan["lifecycle"];
  readonly continuity: KpReaderEquationMaterialOwnerPlan["continuity"];
  readonly sourceAnchorIds: readonly string[];
  readonly targetAnchorIds: readonly string[];
  readonly visualAnchorIds: readonly string[];
  readonly currentBounds: KpReaderLayoutRect;
  readonly materialOpacity: number;
  readonly sourceNativeOpacity: number;
  readonly targetNativeOpacity: number;
  readonly focusStrength: number;
  readonly fragmentPoses: readonly KpEquationOwnerFragmentMotion[];
}

export function sampleKpReaderEquationSymbolMotion(input: {
  readonly materialPlan: KpReaderEquationMaterialPlan;
  readonly alignment: KpReaderEquationPerceptualAlignmentPlan;
  readonly layout?: KpReaderEquationLayoutSnapshot | undefined;
  readonly linearRearrangementKind?: KpEquationLinearRearrangementKind | undefined;
  readonly witnessedAnnihilationBinding?: KpWitnessedAnnihilationBinding | undefined;
  readonly successorSynthesisBinding?: KpSuccessorSynthesisBinding | undefined;
  readonly progress: number;
  readonly direction?: "forward" | "rewind" | undefined;
}): KpReaderEquationSymbolMotionFrame {
  if (input.alignment.layoutSnapshotId === "") {
    throw new Error("Equation symbol motion requires a layout-backed alignment plan.");
  }
  if (!Number.isFinite(input.progress)) {
    throw new Error("Equation symbol motion progress must be finite.");
  }
  const progress = clamp01(input.progress);
  const easedProgress = smoothstep(progress);
  const ownersById = new Map(
    input.alignment.owners.map((owner) => [owner.ownerId, owner])
  );
  const materialOwners = input.materialPlan.transitions.flatMap(
    (transition) => transition.owners
  );
  const transition = input.materialPlan.transitions.find(
    (candidate) => candidate.transitionId === input.layout?.transitionId
  );
  const operation = input.layout === undefined ||
      input.linearRearrangementKind === undefined || transition === undefined
    ? undefined
    : sampleKpEquationLinearRearrangementOwners({
        kind: input.linearRearrangementKind,
        transition,
        layout: input.layout,
        alignment: input.alignment,
        progress,
        witnessedAnnihilationBinding: input.witnessedAnnihilationBinding,
        successorSynthesisBinding: input.successorSynthesisBinding
      });
  const owners = materialOwners.map((owner) => {
    const aligned = ownersById.get(owner.id);
    if (aligned === undefined) {
      throw new Error(`Alignment plan is missing material owner ${owner.id}.`);
    }
    return sampleOwner(
      owner,
      aligned,
      progress,
      easedProgress,
      operation?.motion
    );
  });
  if (ownersById.size !== owners.length) {
    throw new Error("Alignment plan and material plan have different owner closure.");
  }

  const frame: KpReaderEquationSymbolMotionFrame = {
    id: `motion.${input.alignment.id}.${progress.toFixed(4)}`,
    kind: "reader-equation-symbol-motion-frame",
    materialPlanId: input.materialPlan.id,
    alignmentPlanId: input.alignment.id,
    progress,
    easedProgress,
    direction: input.direction ?? "forward",
    owners,
    ...(operation?.motion.witnessedAnnihilation === undefined ||
      operation.geometry.witnessedAnnihilationPlan === undefined
      ? {}
      : {
          witnessedAnnihilation: {
            contactPoint: operation.geometry.witnessedAnnihilationPlan.contactPoint,
            frame: operation.motion.witnessedAnnihilation
          }
        })
  };
  assertKpEquationVisualFrame(frame);
  return frame;
}

function sampleOwner(
  owner: KpReaderEquationMaterialOwnerPlan,
  aligned: KpReaderEquationAlignedOwner,
  progress: number,
  easedProgress: number,
  operationMotion: KpEquationTokenMotionFrame | undefined
): KpReaderEquationSymbolOwnerPose {
  const source = aligned.sourceBounds;
  const target = aligned.targetBounds;
  const currentBounds = source !== undefined && target !== undefined
    ? lerpRect(source, target, easedProgress)
    : source !== undefined
      ? lerpRect(source, vanishedRect(source), easedProgress)
      : target !== undefined
        ? lerpRect(vanishedRect(target), target, easedProgress)
        : undefined;
  if (currentBounds === undefined) {
    throw new Error(`Material owner ${owner.id} has no aligned endpoint geometry.`);
  }
  const handoff = sampleKpEquationMaterialOwnerHandoff({
    ownerId: owner.id,
    progress,
    sourcePresent: source !== undefined,
    targetPresent: target !== undefined
  });
  const ownerAnchorIds = new Set([
    ...owner.sourceAnchorIds,
    ...owner.targetAnchorIds
  ]);
  const fragmentPoses: readonly KpEquationOwnerFragmentMotion[] =
    operationMotion?.tokens.flatMap((token) =>
      ownerAnchorIds.has(token.motionId)
        ? [{ anchorId: token.motionId, side: token.side, pose: token.pose }]
        : []
    ) ?? [];

  return {
    ownerId: owner.id,
    lifecycle: owner.lifecycle,
    continuity: owner.continuity,
    sourceAnchorIds: [...owner.sourceAnchorIds],
    targetAnchorIds: [...owner.targetAnchorIds],
    visualAnchorIds: [
      ...(owner.sourceAnchorIds.length > 0
        ? owner.sourceAnchorIds
        : owner.targetAnchorIds)
    ],
    currentBounds,
    materialOpacity: handoff.materialOpacity,
    sourceNativeOpacity: handoff.sourceNativeOpacity,
    targetNativeOpacity: handoff.targetNativeOpacity,
    fragmentPoses,
    focusStrength: owner.focused
      ? 0.35 + 0.65 * Math.sin(Math.PI * progress)
      : 0
  };
}

function vanishedRect(rect: KpReaderLayoutRect): KpReaderLayoutRect {
  const scale = 0.84;
  const width = rect.width * scale;
  const height = rect.height * scale;
  return {
    left: rect.left + (rect.width - width) / 2,
    top: rect.top + (rect.height - height) / 2 - rect.height * 0.12,
    width,
    height
  };
}

function lerpRect(
  source: KpReaderLayoutRect,
  target: KpReaderLayoutRect,
  progress: number
): KpReaderLayoutRect {
  return {
    left: lerp(source.left, target.left, progress),
    top: lerp(source.top, target.top, progress),
    width: lerp(source.width, target.width, progress),
    height: lerp(source.height, target.height, progress)
  };
}

function lerp(source: number, target: number, progress: number): number {
  return source + (target - source) * progress;
}

function smoothstep(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
