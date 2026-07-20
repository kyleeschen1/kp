import type {
  KpEquationLinearRearrangementKind
} from "./equation-linear-rearrangement.ts";
import {
  sampleKpEquationLinearRearrangementFrame,
  sampleKpEquationLinearRearrangementRelation
} from "./equation-linear-rearrangement.ts";
import type {
  AnnotatedMotionToken,
  KpMeasuredEquationTransitionRelationGeometry
} from "./equation-motion-dom.ts";
import type {
  KpEquationTokenMotionPose
} from "./semantic-equation-token-renderer.ts";
import type { KpEquationTransitionLifecycleKind } from "./equation-transition-ir.ts";
import type {
  KpWitnessedAnnihilationBinding
} from "../animation/witnessed-annihilation.ts";
import type { KpSuccessorSynthesisBinding } from "../animation/successor-synthesis.ts";
import type { KpReaderEquationTransitionMaterialPlan } from "../reader/renderers/equation-material-plan.ts";
import type { KpReaderEquationLayoutSnapshot } from "../reader/renderers/equation-layout-snapshot.ts";
import type { KpReaderEquationPerceptualAlignmentPlan } from "../reader/renderers/equation-perceptual-alignment.ts";
import {
  createKpEquationWitnessedAnnihilationPlan
} from "./equation-witnessed-annihilation.ts";
import {
  createKpEquationSuccessorSynthesisPlan
} from "./equation-linear-rearrangement.ts";
import {
  sampleKpEquationTokenMotion,
  type KpEquationTokenMotionFrame
} from "./semantic-equation-token-renderer.ts";
import type { KpMeasuredEquationTransitionGeometry } from "./equation-motion-dom.ts";

export interface KpEquationOwnerMotionAnchor {
  readonly id: string;
  readonly rect: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
}

export interface KpEquationOwnerFragmentMotion {
  readonly anchorId: string;
  readonly side: "source" | "target";
  readonly pose: KpEquationTokenMotionPose;
}

export interface KpEquationLinearRearrangementOwnerFrame {
  readonly motion: KpEquationTokenMotionFrame;
  readonly geometry: KpMeasuredEquationTransitionGeometry;
}

export function sampleKpEquationLinearRearrangementOwners(input: {
  readonly kind: KpEquationLinearRearrangementKind;
  readonly transition: KpReaderEquationTransitionMaterialPlan;
  readonly layout: KpReaderEquationLayoutSnapshot;
  readonly alignment: KpReaderEquationPerceptualAlignmentPlan;
  readonly progress: number;
  readonly witnessedAnnihilationBinding?: KpWitnessedAnnihilationBinding | undefined;
  readonly successorSynthesisBinding?: KpSuccessorSynthesisBinding | undefined;
}): KpEquationLinearRearrangementOwnerFrame {
  const alignedById = new Map(
    input.alignment.owners.map((owner) => [owner.ownerId, owner])
  );
  const anchorsById = new Map(
    input.layout.anchors.map((anchor) => [anchor.id, anchor])
  );
  const sourceTokens: AnnotatedMotionToken[] = [];
  const targetTokens: AnnotatedMotionToken[] = [];
  const relations = input.transition.owners.map((owner) => {
    const aligned = alignedById.get(owner.id);
    if (aligned === undefined) {
      throw new Error(`Missing aligned equation owner ${owner.id}.`);
    }
    const sourceAnchors = correctedAnchors(
      owner.sourceAnchorIds,
      anchorsById,
      aligned.sourceBounds
    );
    const targetAnchors = correctedAnchors(
      owner.targetAnchorIds,
      anchorsById,
      aligned.targetBounds
    );
    const ownerSourceTokens = sourceAnchors.map(tokenForAnchor);
    const ownerTargetTokens = targetAnchors.map(tokenForAnchor);
    sourceTokens.push(...ownerSourceTokens);
    targetTokens.push(...ownerTargetTokens);
    const source = endpointWithSelectors(ownerSourceTokens, sourceAnchors);
    const target = endpointWithSelectors(ownerTargetTokens, targetAnchors);
    return {
      recordId: owner.relationRecordId,
      lifecycle: owner.lifecycle,
      ...(source === undefined ? {} : { source }),
      ...(target === undefined ? {} : { target }),
      ...(source === undefined || target === undefined
        ? {}
        : {
            delta: {
              x: center(target.bounds).x - center(source.bounds).x,
              y: center(target.bounds).y - center(source.bounds).y,
              scaleX: target.bounds.width / source.bounds.width,
              scaleY: target.bounds.height / source.bounds.height
            }
          })
    } satisfies KpMeasuredEquationTransitionRelationGeometry;
  });
  const base: KpMeasuredEquationTransitionGeometry = {
    transitionId: input.transition.transitionId,
    linearRearrangementKind: input.kind,
    ...(input.witnessedAnnihilationBinding === undefined
      ? {}
      : { witnessedAnnihilationBinding: input.witnessedAnnihilationBinding }),
    ...(input.successorSynthesisBinding === undefined
      ? {}
      : { successorSynthesisBinding: input.successorSynthesisBinding }),
    sourceTokens,
    targetTokens,
    relations
  };
  const witnessedAnnihilationPlan = createKpEquationWitnessedAnnihilationPlan(base);
  const successorSynthesisPlan = createKpEquationSuccessorSynthesisPlan(base);
  const geometry = {
    ...base,
    ...(witnessedAnnihilationPlan === undefined ? {} : { witnessedAnnihilationPlan }),
    ...(successorSynthesisPlan === undefined ? {} : { successorSynthesisPlan })
  };
  return {
    geometry,
    motion: sampleKpEquationTokenMotion(geometry, input.progress)
  };
}

export function sampleKpEquationLinearRearrangementOwnerMotion(input: {
  readonly kind: KpEquationLinearRearrangementKind;
  readonly relationRecordId: string;
  readonly lifecycle: KpEquationTransitionLifecycleKind;
  readonly sourceAnchors: readonly KpEquationOwnerMotionAnchor[];
  readonly targetAnchors: readonly KpEquationOwnerMotionAnchor[];
  readonly progress: number;
}): readonly KpEquationOwnerFragmentMotion[] {
  const sourceTokens = input.sourceAnchors.map(tokenForAnchor);
  const targetTokens = input.targetAnchors.map(tokenForAnchor);
  const source = endpoint(sourceTokens);
  const target = endpoint(targetTokens);
  const relation: KpMeasuredEquationTransitionRelationGeometry = {
    recordId: input.relationRecordId,
    lifecycle: input.lifecycle,
    ...(source === undefined ? {} : { source }),
    ...(target === undefined ? {} : { target }),
    ...(source === undefined || target === undefined
      ? {}
      : {
          delta: {
            x: center(target.bounds).x - center(source.bounds).x,
            y: center(target.bounds).y - center(source.bounds).y,
            scaleX: target.bounds.width / source.bounds.width,
            scaleY: target.bounds.height / source.bounds.height
          }
        })
  };
  const sampled = sampleKpEquationLinearRearrangementRelation({
    relation,
    sourceTokens,
    targetTokens,
    progress: input.progress,
    frame: sampleKpEquationLinearRearrangementFrame(input.kind, input.progress)
  });
  return (sampled ?? []).map((fragment) => ({
    anchorId: fragment.motionId,
    side: fragment.side,
    pose: fragment.pose
  }));
}

function tokenForAnchor(anchor: KpEquationOwnerMotionAnchor): AnnotatedMotionToken {
  return {
    motionId: anchor.id,
    text: "",
    rect: anchor.rect,
    localRect: anchor.rect,
    // The neutral sampler never reads the DOM element; renderers retain the
    // actual source element for their own clone/material strategy.
    element: undefined as unknown as HTMLElement
  };
}

function endpoint(tokens: readonly AnnotatedMotionToken[]) {
  if (tokens.length === 0) return undefined;
  return {
    selectorIds: tokens.map((token) => token.motionId),
    motionIds: tokens.map((token) => token.motionId),
    bounds: union(tokens.map((token) => token.localRect))
  };
}

function endpointWithSelectors(
  tokens: readonly AnnotatedMotionToken[],
  anchors: readonly (KpEquationOwnerMotionAnchor & { readonly selectorId: string })[]
) {
  if (tokens.length === 0) return undefined;
  return {
    selectorIds: anchors.map((anchor) => anchor.selectorId),
    motionIds: tokens.map((token) => token.motionId),
    bounds: union(tokens.map((token) => token.localRect))
  };
}

function correctedAnchors(
  anchorIds: readonly string[],
  anchorsById: ReadonlyMap<string, KpReaderEquationLayoutSnapshot["anchors"][number]>,
  alignedBounds: KpEquationOwnerMotionAnchor["rect"] | undefined
) {
  const anchors = anchorIds.map((id) => {
    const anchor = anchorsById.get(id);
    if (anchor === undefined) throw new Error(`Missing equation anchor ${id}.`);
    return anchor;
  });
  if (anchors.length === 0) return [];
  const rawBounds = union(anchors.map((anchor) => anchor.rect));
  const correction = alignedBounds === undefined
    ? { x: 0, y: 0 }
    : {
        x: alignedBounds.left - rawBounds.left,
        y: alignedBounds.top - rawBounds.top
      };
  return anchors.map((anchor) => ({
    id: anchor.id,
    selectorId: anchor.selectorId,
    rect: {
      ...anchor.rect,
      left: anchor.rect.left + correction.x,
      top: anchor.rect.top + correction.y
    }
  }));
}

function union(rects: readonly KpEquationOwnerMotionAnchor["rect"][]) {
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
}

function center(rect: KpEquationOwnerMotionAnchor["rect"]) {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}
