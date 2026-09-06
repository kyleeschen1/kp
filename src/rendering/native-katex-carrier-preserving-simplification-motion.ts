import {
  projectKpNativeKatexSemanticPaintRelations,
  type KpNativeKatexRendererReadyScenePlan,
  type KpNativeKatexSemanticPaintRelation
} from "./native-katex-base-scene-plan.ts";
import {
  compileKpCanonicalNativeKatexScenePlan,
} from "./native-katex-scene-compositor.ts";
import {
  createKpNativeKatexEndpointOwnershipView
} from "./native-katex-endpoint-ownership.ts";
import {
  kpNativeKatexCarrierPreservingSimplificationOpticalProfile,
  sampleKpNativeKatexCarrierPreservingSimplificationOptics,
  type KpNativeKatexCarrierPreservingSimplificationOpticalProfile
} from "./native-katex-carrier-preserving-simplification-profile.ts";
import type {
  KpNativeKatexCarrierPreservingSimplificationBinding
} from "./native-katex-carrier-preserving-simplification-binding.ts";
import {
  createKpNativeKatexTrackProjection
} from "./native-katex-track-projection.ts";

const REMOVED_SYNTAX_COHORT_ID =
  "cohort.carrier-preserving-simplification.removed-syntax";

export interface KpNativeKatexCarrierPreservingSimplificationMotionPlan {
  readonly kind:
    "native-katex-carrier-preserving-simplification-motion-plan";
  readonly lifecycle: "renderer-session-ephemeral";
  readonly binding: KpNativeKatexCarrierPreservingSimplificationBinding;
  readonly rendererPlan: KpNativeKatexRendererReadyScenePlan;
  readonly carrierTrackId: string;
  readonly removedSyntaxTrackIds: readonly string[];
  readonly toJSON: () => never;
}

/**
 * The generic Native KaTeX compositor still owns cloning and endpoint
 * handoff. This narrow projection maps verified carrier/removal roles to the
 * candidate profile, so the motif does not become a second renderer or clock.
 */
export function compileKpNativeKatexCarrierPreservingSimplificationMotion(
  input: {
    readonly binding: KpNativeKatexCarrierPreservingSimplificationBinding;
    readonly opticalProfile?:
      KpNativeKatexCarrierPreservingSimplificationOpticalProfile | undefined;
    readonly identityInkShrinkReview?: boolean | undefined;
  }
): KpNativeKatexCarrierPreservingSimplificationMotionPlan {
  const { binding } = input;
  const profile = input.opticalProfile ??
    kpNativeKatexCarrierPreservingSimplificationOpticalProfile;
  const source = createKpNativeKatexEndpointOwnershipView({
    handle: binding.sourceHandle,
    endpoint: "source",
    collapsedGroupIds: Object.freeze([
      binding.carrier.source.presentationGroupId,
      ...binding.removedSyntaxCohort.map(({ presentationGroupId }) =>
        presentationGroupId
      ),
      ...binding.stationaryContext.map(({ source: owner }) =>
        owner.presentationGroupId
      )
    ])
  });
  const target = createKpNativeKatexEndpointOwnershipView({
    handle: binding.targetHandle,
    endpoint: "target",
    collapsedGroupIds: Object.freeze([
      binding.carrier.target.presentationGroupId,
      ...binding.stationaryContext.map(({ target: owner }) =>
        owner.presentationGroupId
      )
    ])
  });
  const carrierSourceRef = binding.recipe.carrier.sourceSelectorRef;
  const carrierTargetRef = binding.recipe.carrier.targetSelectorRef;
  const removedRefs = new Set(
    binding.recipe.removedSyntaxCohort.selectorRefs
  );
  let carrierTrackId: string | undefined;
  const removedSyntaxTrackIds: string[] = [];
  const trackProjection = createKpNativeKatexTrackProjection({
    id: `track-projection.${binding.recipe.id}`,
    project({ tracks, source: sourceObservation, target: targetObservation }) {
      const sourceEntityByAtomId = new Map(
        sourceObservation.atoms.map(({ id, semanticEntityId }) =>
          [id, semanticEntityId]
        )
      );
      const targetEntityByAtomId = new Map(
        targetObservation.atoms.map(({ id, semanticEntityId }) =>
          [id, semanticEntityId]
        )
      );
      return Object.freeze(tracks.map((track) => {
        const sourceEntity = track.sourceAtomId === undefined
          ? undefined
          : sourceEntityByAtomId.get(track.sourceAtomId);
        const targetEntity = track.targetAtomId === undefined
          ? undefined
          : targetEntityByAtomId.get(track.targetAtomId);
        if (
          sourceEntity === carrierSourceRef &&
          targetEntity === carrierTargetRef &&
          track.lifecycle === "persist"
        ) {
          carrierTrackId = track.id;
          return Object.freeze({
            ...track,
            timingGroupId: binding.recipe.carrier.correspondenceRecordId,
            sampleProgress: (progress: number) =>
              optics(progress, profile).carrier.transitProgress
          });
        }
        if (
          sourceEntity !== undefined &&
          removedRefs.has(sourceEntity) &&
          track.lifecycle === "eliminate"
        ) {
          removedSyntaxTrackIds.push(track.id);
          return Object.freeze({
            ...track,
            // Removed syntax owns no result paint. The review treatment reuses
            // native evaluation's measured-ink material scaling, but does not
            // fuse or replace the persistent carrier. Both removals share time.
            endRect: Object.freeze({ ...track.startRect }),
            endPaintRect: Object.freeze({ ...track.startPaintRect }),
            timingGroupId: REMOVED_SYNTAX_COHORT_ID,
            opacityScheduleAuthority: "semantic-choreography" as const,
            sampleProgress: () => 0,
            sampleOpacityProgress: (progress: number) =>
              input.identityInkShrinkReview
                ? Number(optics(progress, profile).removedSyntaxCohort.withdrawalProgress === 1)
                : optics(progress, profile).removedSyntaxCohort.withdrawalProgress,
            ...(input.identityInkShrinkReview ? {
              sampleMaterialScale: (progress: number) => Math.max(Number.EPSILON,
                1 - optics(progress, profile).removedSyntaxCohort.withdrawalProgress)
            } : {})
          });
        }
        if (track.lifecycle === "persist") {
          // Verified context has no local choreography; its measured source
          // pose remains authoritative throughout this operation.
          return Object.freeze({ ...track, sampleProgress: () => 0 });
        }
        throw new Error(
          `Carrier motion received unclassified ${track.lifecycle} track ${track.id}.`
        );
      }));
    }
  });
  const rendererPlan = compileKpCanonicalNativeKatexScenePlan({
    source,
    target,
    relations: paintRelations(binding),
    trackProjection,
    fanInRouting: false,
    copyFanOutRouting: false
  });
  if (carrierTrackId === undefined) {
    throw new Error("Carrier motion compiled without one persistent carrier track.");
  }
  if (
    removedSyntaxTrackIds.length !==
    binding.recipe.removedSyntaxCohort.selectorRefs.length
  ) {
    throw new Error("Carrier motion did not bind the complete removal cohort.");
  }
  return Object.freeze({
    kind:
      "native-katex-carrier-preserving-simplification-motion-plan" as const,
    lifecycle: "renderer-session-ephemeral" as const,
    binding,
    rendererPlan,
    carrierTrackId,
    removedSyntaxTrackIds: Object.freeze([...removedSyntaxTrackIds]),
    toJSON(): never {
      throw new Error(
        "Native KaTeX carrier motion plans cannot enter durable state."
      );
    }
  });
}

function paintRelations(
  binding: KpNativeKatexCarrierPreservingSimplificationBinding
): readonly KpNativeKatexSemanticPaintRelation[] {
  return projectKpNativeKatexSemanticPaintRelations({
    groups: [{
      id: binding.recipe.carrier.correspondenceRecordId,
      kind: "one-to-one",
      sourceEntityIds: [binding.recipe.carrier.sourceSelectorRef],
      targetEntityIds: [binding.recipe.carrier.targetSelectorRef]
    }, ...binding.recipe.stationaryContext.map((context) => ({
      id: context.correspondenceRecordId,
      kind: "one-to-one" as const,
      sourceEntityIds: [context.sourceSelectorRef],
      targetEntityIds: [context.targetSelectorRef]
    }))]
  });
}

function optics(
  progress: number,
  profile: KpNativeKatexCarrierPreservingSimplificationOpticalProfile
) {
  return sampleKpNativeKatexCarrierPreservingSimplificationOptics(
    progress,
    profile
  );
}
