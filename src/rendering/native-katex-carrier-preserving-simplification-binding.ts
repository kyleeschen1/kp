import type {
  KpCarrierPreservingSimplificationRecipe
} from "../animation/carrier-preserving-simplification-recipe.ts";
import type { KpStageRelativeRect } from
  "./native-katex-fragment-observer.ts";
import {
  sampleKpNativeKatexCarrierPreservingSimplificationOptics,
  type KpNativeKatexCarrierPreservingSimplificationOpticalProfile
} from "./native-katex-carrier-preserving-simplification-profile.ts";
import type {
  KpNativeKatexRenderedEndpointHandle,
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";

export interface KpNativeKatexMeasuredSelectorOwner {
  readonly selectorRef: string;
  readonly presentationGroupId: string;
  readonly paintAtomIds: readonly string[];
  readonly rect: KpStageRelativeRect;
  readonly baselineY: number;
  readonly styleFingerprint: string;
  readonly element: HTMLElement;
}

export interface KpNativeKatexCarrierPreservingSimplificationBinding {
  readonly kind: "native-katex-carrier-preserving-simplification-binding";
  readonly lifecycle: "renderer-session-ephemeral";
  readonly recipe: KpCarrierPreservingSimplificationRecipe;
  readonly sourceHandle: KpNativeKatexRenderedEndpointHandle;
  readonly targetHandle: KpNativeKatexRenderedEndpointHandle;
  readonly carrier: {
    readonly source: KpNativeKatexMeasuredSelectorOwner;
    readonly target: KpNativeKatexMeasuredSelectorOwner;
  };
  readonly removedSyntaxCohort:
    readonly KpNativeKatexMeasuredSelectorOwner[];
  readonly stationaryContext: readonly {
    readonly correspondenceRecordId: string;
    readonly source: KpNativeKatexMeasuredSelectorOwner;
    readonly target: KpNativeKatexMeasuredSelectorOwner;
  }[];
  readonly toJSON: () => never;
}

export interface KpNativeKatexProjectedCarrierPose {
  readonly progress: number;
  readonly rect: KpStageRelativeRect;
  readonly baselineY: number;
}

/**
 * Semantic refs are resolved against one immutable measurement transaction.
 * Glyph text is deliberately ignored: equal-looking glyphs cannot establish
 * carrier identity or substitute for the verified recipe.
 */
export function bindKpNativeKatexCarrierPreservingSimplification(input: {
  readonly recipe: KpCarrierPreservingSimplificationRecipe;
  readonly sourceHandle: KpNativeKatexRenderedEndpointHandle;
  readonly targetHandle: KpNativeKatexRenderedEndpointHandle;
}): KpNativeKatexCarrierPreservingSimplificationBinding {
  assertEndpointHandle(input.sourceHandle, "source", input.recipe.endpointRefs.sourceObjectId);
  assertEndpointHandle(input.targetHandle, "target", input.recipe.endpointRefs.targetObjectId);
  if (
    input.sourceHandle.observation.stage !==
    input.targetHandle.observation.stage
  ) {
    throw new Error("Carrier endpoints must share one Native KaTeX stage.");
  }
  if (
    input.sourceHandle.revision.fontRevision !==
    input.targetHandle.revision.fontRevision
  ) {
    throw new Error("Carrier endpoints require one settled font revision.");
  }

  const carrier = Object.freeze({
    source: measuredSelectorOwner(
      input.sourceHandle.observation,
      input.recipe.carrier.sourceSelectorRef
    ),
    target: measuredSelectorOwner(
      input.targetHandle.observation,
      input.recipe.carrier.targetSelectorRef
    )
  });
  const removedSyntaxCohort = Object.freeze(
    input.recipe.removedSyntaxCohort.selectorRefs.map((selectorRef) =>
      measuredSelectorOwner(input.sourceHandle.observation, selectorRef)
    )
  );
  const stationaryContext = Object.freeze(
    input.recipe.stationaryContext.map((context) => Object.freeze({
      correspondenceRecordId: context.correspondenceRecordId,
      source: measuredSelectorOwner(
        input.sourceHandle.observation,
        context.sourceSelectorRef
      ),
      target: measuredSelectorOwner(
        input.targetHandle.observation,
        context.targetSelectorRef
      )
    }))
  );

  return Object.freeze({
    kind: "native-katex-carrier-preserving-simplification-binding" as const,
    lifecycle: "renderer-session-ephemeral" as const,
    recipe: input.recipe,
    sourceHandle: input.sourceHandle,
    targetHandle: input.targetHandle,
    carrier,
    removedSyntaxCohort,
    stationaryContext,
    toJSON(): never {
      throw new Error(
        "Native KaTeX carrier bindings cannot enter durable state."
      );
    }
  });
}

export function projectKpNativeKatexCarrierPose(input: {
  readonly binding: KpNativeKatexCarrierPreservingSimplificationBinding;
  readonly progress: number;
  readonly opticalProfile?:
    KpNativeKatexCarrierPreservingSimplificationOpticalProfile | undefined;
}): KpNativeKatexProjectedCarrierPose {
  const optical = sampleKpNativeKatexCarrierPreservingSimplificationOptics(
    input.progress,
    input.opticalProfile
  );
  const transit = optical.carrier.transitProgress;
  const source = input.binding.carrier.source;
  const target = input.binding.carrier.target;
  // Preserve exact measured endpoint values instead of relying on numerically
  // close interpolation at the two native ownership seams.
  if (transit === 0) return frozenPose(optical.progress, source);
  if (transit === 1) return frozenPose(optical.progress, target);
  return Object.freeze({
    progress: optical.progress,
    rect: Object.freeze({
      left: lerp(source.rect.left, target.rect.left, transit),
      top: lerp(source.rect.top, target.rect.top, transit),
      width: lerp(source.rect.width, target.rect.width, transit),
      height: lerp(source.rect.height, target.rect.height, transit)
    }),
    baselineY: lerp(source.baselineY, target.baselineY, transit)
  });
}

function assertEndpointHandle(
  handle: KpNativeKatexRenderedEndpointHandle,
  side: "source" | "target",
  objectId: string
): void {
  if (handle.observation.endpoint !== side) {
    throw new Error(`Carrier ${side} handle has the wrong endpoint role.`);
  }
  const endpointGroups = handle.observation.groups.filter(
    ({ semanticEntityId }) => semanticEntityId === objectId
  );
  if (endpointGroups.length !== 1) {
    throw new Error(
      `Carrier ${side} handle does not identify endpoint ${objectId}.`
    );
  }
}

function measuredSelectorOwner(
  observation: KpNativeKatexRenderedSceneObservation,
  selectorRef: string
): KpNativeKatexMeasuredSelectorOwner {
  const groups = observation.groups.filter(
    ({ semanticEntityId }) => semanticEntityId === selectorRef
  );
  if (groups.length !== 1) {
    throw new Error(
      `Native ${observation.endpoint} endpoint expected one measured owner ` +
      `for semantic selector ${selectorRef}, received ${groups.length}.`
    );
  }
  const group = groups[0]!;
  const baselineY = group.baselineY;
  if (baselineY === undefined || baselineY === null || !Number.isFinite(baselineY)) {
    throw new Error(`Measured selector ${selectorRef} lacks an ink baseline.`);
  }
  if (group.sourceElement === undefined || group.styleFingerprint === undefined) {
    throw new Error(`Measured selector ${selectorRef} lacks native paint authority.`);
  }
  if (group.atomIds.length === 0) {
    throw new Error(`Measured selector ${selectorRef} owns no native paint.`);
  }
  return Object.freeze({
    selectorRef,
    presentationGroupId: group.id,
    paintAtomIds: Object.freeze([...group.atomIds]),
    rect: Object.freeze({ ...group.rect }),
    baselineY,
    styleFingerprint: group.styleFingerprint,
    element: group.sourceElement
  });
}

function frozenPose(
  progress: number,
  owner: KpNativeKatexMeasuredSelectorOwner
): KpNativeKatexProjectedCarrierPose {
  return Object.freeze({
    progress,
    rect: owner.rect,
    baselineY: owner.baselineY
  });
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}
