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
