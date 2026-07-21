import type {
  KpReaderEquationMaterialOwnerPlan,
  KpReaderEquationMaterialPlan
} from "./equation-material-plan.ts";
import type { KpReaderLayoutRect } from "./equation-layout-snapshot.ts";
import type {
  KpReaderEquationAlignedOwner,
  KpReaderEquationPerceptualAlignmentPlan
} from "./equation-perceptual-alignment.ts";
import { sampleKpReaderEquationPerceptualPathOffset } from "./equation-perceptual-alignment.ts";
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
  type KpEquationLinearRearrangementOwnerFrame,
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
  readonly samplingAuthority: "operation-specific" | "generic-fallback";
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
      sampleKpReaderEquationPerceptualPathOffset({
        alignment: input.alignment,
        progress
      }),
      input.layout,
      operation
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
    samplingAuthority: operation === undefined
      ? "generic-fallback"
      : "operation-specific",
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
  pathOffset: { readonly x: number; readonly y: number },
  layout: KpReaderEquationLayoutSnapshot | undefined,
  operation: KpEquationLinearRearrangementOwnerFrame | undefined
): KpReaderEquationSymbolOwnerPose {
  const source = aligned.sourceBounds;
  const target = aligned.targetBounds;
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
    operation?.motion.tokens.flatMap((token) =>
      ownerAnchorIds.has(token.motionId)
        ? [{
            anchorId: token.motionId,
            side: token.side,
            pose: {
              ...token.pose,
              x: token.pose.x + pathOffset.x,
              y: token.pose.y + pathOffset.y
            }
          }]
        : []
    ) ?? [];
  if (operation !== undefined && fragmentPoses.length === 0) {
    throw new Error(
      `Operation-specific motion is missing material owner ${owner.id}.`
    );
  }
  const currentBounds = operation === undefined
    ? shiftBounds(
        sampleGenericFallbackBounds(owner.id, source, target, easedProgress),
        pathOffset
      )
    : operationFragmentBounds(owner.id, fragmentPoses, layout);

  return {
    ownerId: owner.id,
    lifecycle: owner.lifecycle,
    continuity: owner.continuity,
    sourceAnchorIds: [...owner.sourceAnchorIds],
    targetAnchorIds: [...owner.targetAnchorIds],
    visualAnchorIds: fragmentPoses.length > 0
      ? fragmentPoses.map((fragment) => fragment.anchorId)
      : [
          ...(owner.sourceAnchorIds.length > 0
            ? owner.sourceAnchorIds
            : owner.targetAnchorIds)
        ],
    currentBounds,
    materialOpacity: handoff.materialOpacity,
    sourceNativeOpacity: handoff.sourceNativeOpacity,
    targetNativeOpacity: handoff.targetNativeOpacity,
    fragmentPoses,
    // Operation frames already encode their temporal emphasis in fragment
    // poses. Focus is therefore a semantic flag, not a second motion sampler.
    focusStrength: owner.focused ? 1 : 0
  };
}

function shiftBounds(
  bounds: KpReaderLayoutRect,
  offset: { readonly x: number; readonly y: number }
): KpReaderLayoutRect {
  return {
    ...bounds,
    left: bounds.left + offset.x,
    top: bounds.top + offset.y
  };
}

function sampleGenericFallbackBounds(
  ownerId: string,
  source: KpReaderLayoutRect | undefined,
  target: KpReaderLayoutRect | undefined,
  progress: number
): KpReaderLayoutRect {
  const bounds = source !== undefined && target !== undefined
    ? lerpFallbackRect(source, target, progress)
    : source !== undefined
      ? lerpFallbackRect(source, vanishedFallbackRect(source), progress)
      : target !== undefined
        ? lerpFallbackRect(vanishedFallbackRect(target), target, progress)
        : undefined;
  if (bounds === undefined) {
    throw new Error(`Material owner ${ownerId} has no aligned endpoint geometry.`);
  }
  return bounds;
}

function operationFragmentBounds(
  ownerId: string,
  fragments: readonly KpEquationOwnerFragmentMotion[],
  layout: KpReaderEquationLayoutSnapshot | undefined
): KpReaderLayoutRect {
  if (layout === undefined) {
    throw new Error(`Operation-specific owner ${ownerId} requires layout geometry.`);
  }
  const anchors = new Map(layout.anchors.map((anchor) => [anchor.id, anchor.rect]));
  const visible = fragments.filter((fragment) => fragment.pose.opacity > 0.001);
  const contributing = visible.length > 0 ? visible : fragments;
  const rects = contributing.map((fragment) => {
    const rect = anchors.get(fragment.anchorId);
    if (rect === undefined) {
      throw new Error(`Operation-specific owner ${ownerId} is missing ${fragment.anchorId}.`);
    }
    const scale = fragment.pose.scale;
    return {
      left: rect.left + fragment.pose.x + rect.width * (1 - scale) / 2,
      top: rect.top + fragment.pose.y + rect.height * (1 - scale) / 2,
      width: rect.width * scale,
      height: rect.height * scale
    };
  });
  return unionRects(rects);
}

function unionRects(rects: readonly KpReaderLayoutRect[]): KpReaderLayoutRect {
  if (rects.length === 0) throw new Error("Operation-specific owner has no fragment bounds.");
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
}

function vanishedFallbackRect(rect: KpReaderLayoutRect): KpReaderLayoutRect {
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

function lerpFallbackRect(
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
