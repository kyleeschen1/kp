import {
  projectKpNativeKatexSemanticPaintRelations,
  type KpNativeKatexPaintMeasuredSceneTrack,
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
const IDENTITY_ABSORPTION_CONTACT_ID =
  "contact.carrier-preserving-simplification.identity-absorption";

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
  const absorptionTargets = identityAbsorptionTargets(binding, profile);
  const removedOwnerBySelector = new Map(
    binding.removedSyntaxCohort.map((owner) => [owner.selectorRef, owner])
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
            // The identity cohort is allowed to meet the carrier's ink edge,
            // but only the verified one-to-one carrier relation owns result paint.
            intentionalContactGroupId: IDENTITY_ABSORPTION_CONTACT_ID,
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
          const [endRect, endPaintRect] = settleScaledPaintAtTarget(
            track,
            removedOwnerBySelector.get(sourceEntity)!,
            absorptionTargets.get(sourceEntity)!,
            profile.removedSyntaxAbsorption.minimumScale
          );
          return Object.freeze({
            ...track,
            endRect,
            endPaintRect,
            timingGroupId: REMOVED_SYNTAX_COHORT_ID,
            intentionalContactGroupId: IDENTITY_ABSORPTION_CONTACT_ID,
            opacityScheduleAuthority: "semantic-choreography" as const,
            sampleProgress: (progress: number) =>
              optics(progress, profile).removedSyntaxCohort.absorptionProgress,
            sampleOpacityProgress: (progress: number) =>
              optics(progress, profile).removedSyntaxCohort.disappearanceProgress,
            sampleMaterialScale: (progress: number) =>
              optics(progress, profile).removedSyntaxCohort.scale
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

function identityAbsorptionTargets(
  binding: KpNativeKatexCarrierPreservingSimplificationBinding,
  profile: KpNativeKatexCarrierPreservingSimplificationOpticalProfile
): ReadonlyMap<string, {
  readonly paintCenterX: number;
  readonly baselineY: number;
}> {
  const carrier = binding.carrier.source.rect;
  const centerX = carrier.left + carrier.width +
      carrier.height *
        profile.removedSyntaxAbsorption.pointOffsetInCarrierInkHeights;
  const owners = [...binding.removedSyntaxCohort];
  const ordered = owners.map((owner, index) => ({ owner, index }))
    .sort((left, right) =>
      left.owner.rect.left - right.owner.rect.left ||
      left.index - right.index
    );
  const span = carrier.height *
    profile.removedSyntaxAbsorption.kernelSpanInCarrierInkHeights;
  const targets = new Map<string, {
    readonly paintCenterX: number;
    readonly baselineY: number;
  }>();
  ordered.forEach(({ owner }, rank) => {
    const offset = ordered.length === 1
      ? 0
      : (rank / (ordered.length - 1) - 0.5) * span;
    targets.set(owner.selectorRef, Object.freeze({
      paintCenterX: centerX + offset,
      baselineY: binding.carrier.source.baselineY
    }));
  });
  return targets;
}

function settleScaledPaintAtTarget(
  track: KpNativeKatexPaintMeasuredSceneTrack,
  owner: KpNativeKatexCarrierPreservingSimplificationBinding[
    "removedSyntaxCohort"
  ][number],
  target: { readonly paintCenterX: number; readonly baselineY: number },
  scale: number
): readonly [
  KpNativeKatexPaintMeasuredSceneTrack["startRect"],
  NonNullable<KpNativeKatexPaintMeasuredSceneTrack["startPaintRect"]>
] {
  const paint = track.startPaintRect;
  const ownerCenterX = track.startRect.left + track.startRect.width / 2;
  const ownerCenterY = track.startRect.top + track.startRect.height / 2;
  const paintCenterOffsetX =
    paint.left + paint.width / 2 - ownerCenterX;
  const baselineOffsetY = owner.baselineY - ownerCenterY;
  // Scaling happens around the material-owner center. Solve the destination
  // center backward so the contracted ink retains the equation baseline and
  // cannot read as a superscript beside the full-size carrier.
  const endOwnerCenterX = target.paintCenterX - scale * paintCenterOffsetX;
  const endOwnerCenterY = target.baselineY - scale * baselineOffsetY;
  const deltaX = endOwnerCenterX - ownerCenterX;
  const deltaY = endOwnerCenterY - ownerCenterY;
  return Object.freeze([
    Object.freeze({
      ...track.startRect,
      left: track.startRect.left + deltaX,
      top: track.startRect.top + deltaY
    }),
    Object.freeze({
      ...paint,
      left: paint.left + deltaX,
      top: paint.top + deltaY
    })
  ]);
}
