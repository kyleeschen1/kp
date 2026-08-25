import {
  sampleKpAntiderivativeRuleTemplateApplication,
  type KpAntiderivativePowerChoreographyPlan
} from "../animation/antiderivative-power-choreography.ts";
import type {
  KpNativeKatexPaintMeasuredSceneTrack
} from "./native-katex-base-scene-plan.ts";
import {
  createKpNativeKatexTrackProjection,
  type KpNativeKatexTrackProjection
} from "./native-katex-track-projection.ts";

export const kpAntiderivativeTemplateInstantiationProfileId =
  "kp.rendering.native-katex.antiderivative-template-instantiation-profile.v1";

const presentationProfile = Object.freeze({
  scaffoldPointScale: 0.48,
  fixedSyntaxPointScale: 0.04,
  closurePointScale: 0.08
});

/**
 * This projection expresses one reviewed-candidate causal phrase: the rule's
 * prospective structure receives verified source bindings before it becomes
 * live syntax. It is deliberately antiderivative-local until human approval
 * and a structurally different caller demonstrate a reusable motif boundary.
 */
export function createKpAntiderivativeTemplateInstantiationTrackProjection(
  plan: KpAntiderivativePowerChoreographyPlan
): KpNativeKatexTrackProjection {
  const template = plan.ruleTemplateApplication;
  const scaffoldIds = new Set(template.scaffoldSemanticEntityIds);
  const fixedSyntaxIds = new Set(template.fixedSyntaxSelectorIds);
  const closureIds = new Set(template.closureSelectorIds);
  const baseTargetIds = new Set(
    template.bindingRelations[0].targetSelectorIds
  );
  const exponentTargetIds = new Set(
    template.bindingRelations[1].targetSelectorIds
  );
  const denominatorExponentTargetId =
    template.bindingRelations[1].targetSelectorIds[1];
  return createKpNativeKatexTrackProjection({
    id: `track-projection.${kpAntiderivativeTemplateInstantiationProfileId}`,
    project({ tracks, target }) {
      const targetEntityByAtomId = new Map(target.atoms.map((atom) => [
        atom.id,
        atom.semanticEntityId
      ]));
      const denominatorTrack = tracks.find((track) =>
        track.lifecycle === "split" &&
        targetEntityByAtomId.get(track.targetAtomId ?? "") ===
          denominatorExponentTargetId
      );
      const fractionRuleTrack = tracks.find((track) =>
        track.lifecycle === "introduce" &&
        track.paintKind === "rule" &&
        scaffoldIds.has(
          targetEntityByAtomId.get(track.targetAtomId ?? "") ?? ""
        )
      );
      if (denominatorTrack === undefined || fractionRuleTrack === undefined) {
        throw new Error(
          "Antiderivative template projection requires one denominator binding and fraction rule."
        );
      }
      const occlusionId =
        "foreground-occlusion.antiderivative-template.denominator-through-rule";
      const baseReceptionContactGroupId =
        "contact.antiderivative-template.base-reception";
      const withDenominatorRuleOcclusion = (
        track: KpNativeKatexPaintMeasuredSceneTrack
      ): KpNativeKatexPaintMeasuredSceneTrack => {
        if (
          track.id !== denominatorTrack.id &&
          track.id !== fractionRuleTrack.id
        ) return track;
        return Object.freeze({
          ...track,
          intentionalForegroundOcclusion: Object.freeze({
            id: occlusionId,
            role: track.id === denominatorTrack.id
              ? "occluder" as const
              : "occluded" as const,
            counterpartTrackId: track.id === denominatorTrack.id
              ? fractionRuleTrack.id
              : denominatorTrack.id,
            progressWindow: Object.freeze({ start: 0.52, end: 0.82 })
          })
        });
      };
      return Object.freeze(tracks.map((track) => {
        const targetEntityId = targetEntityByAtomId.get(
          track.targetAtomId ?? ""
        );
        if (track.lifecycle === "persist" &&
            targetEntityId !== undefined &&
            baseTargetIds.has(targetEntityId)) {
          return Object.freeze({
            ...track,
            timingGroupId: "antiderivative-template.base-binding",
            semanticMotionUnitId: "antiderivative-template.base-binding",
            // The prospective fraction rule opens under the source x while x
            // is being received into the numerator. This is motif contact,
            // not incidental crowding, and remains pair-bounded by the rule's
            // matching compiler-owned contact ID.
            intentionalContactGroupId: baseReceptionContactGroupId,
            sampleProgress: sampleWindow(0.08, 0.38),
            motionMetrics: true as const
          });
        }
        if (track.lifecycle === "split" &&
            targetEntityId !== undefined &&
            exponentTargetIds.has(targetEntityId)) {
          return withDenominatorRuleOcclusion(Object.freeze({
            ...track,
            timingGroupId: "antiderivative-template.exponent-binding",
            semanticMotionUnitId: "antiderivative-template.exponent-binding",
            routingCohortId: "antiderivative-template.exponent-fan-out",
            routingMemberId: targetEntityId,
            sampleProgress: sampleWindow(0.42, 0.78),
            motionMetrics: true as const
          }));
        }
        if (
          track.lifecycle === "introduce" &&
          targetEntityId !== undefined &&
          scaffoldIds.has(targetEntityId)
        ) {
          return withDenominatorRuleOcclusion(stationaryIntroduction(
            Object.freeze({
              ...track,
              intentionalContactGroupId: baseReceptionContactGroupId
            }), {
              timingGroupId: "antiderivative-template.scaffold",
              presence: (progress) =>
                sampleKpAntiderivativeRuleTemplateApplication(progress)
                  .scaffoldPresence,
              scale: (progress) => {
                const presence = sampleKpAntiderivativeRuleTemplateApplication(
                  progress
                ).scaffoldPresence;
                return presentationProfile.scaffoldPointScale +
                  (1 - presentationProfile.scaffoldPointScale) * presence;
              }
            }
          ));
        }
        if (
          track.lifecycle === "introduce" &&
          targetEntityId !== undefined &&
          fixedSyntaxIds.has(targetEntityId)
        ) {
          return stationaryIntroduction(track, {
            timingGroupId: "antiderivative-template.fixed-syntax",
            presence: (progress) =>
              sampleKpAntiderivativeRuleTemplateApplication(progress)
                .syntaxPresence,
            scale: (progress) => {
              const syntax = sampleKpAntiderivativeRuleTemplateApplication(
                progress
              ).syntaxPresence;
              return presentationProfile.fixedSyntaxPointScale +
                (1 - presentationProfile.fixedSyntaxPointScale) * syntax;
            }
          });
        }
        if (
          track.lifecycle === "introduce" &&
          targetEntityId !== undefined &&
          closureIds.has(targetEntityId)
        ) {
          return stationaryIntroduction(track, {
            timingGroupId: "antiderivative-template.rule-closure",
            presence: (progress) =>
              sampleKpAntiderivativeRuleTemplateApplication(progress)
                .closurePresence,
            scale: (progress) => {
              const closure = sampleKpAntiderivativeRuleTemplateApplication(
                progress
              ).closurePresence;
              return presentationProfile.closurePointScale +
                (1 - presentationProfile.closurePointScale) * closure;
            }
          });
        }
        if (track.lifecycle === "introduce") {
          throw new Error(
            `Antiderivative template projection has no role for introduced ` +
            `${targetEntityId ?? track.targetAtomId ?? track.id}.`
          );
        }
        if (track.lifecycle === "eliminate") {
          return Object.freeze({
            ...track,
            opacityScheduleAuthority: "semantic-choreography" as const,
            // Operator and differential withdrawal completed before material
            // transit begins; invisible clones must not obstruct the template.
            sampleProgress: () => 1,
            sampleOpacityProgress: () => 1
          });
        }
        return track;
      }));
    }
  });
}

function sampleWindow(
  start: number,
  end: number
): (progress: number) => number {
  return (progress) => {
    if (progress <= start) return 0;
    if (progress >= end) return 1;
    const local = (progress - start) / (end - start);
    return local * local * (3 - 2 * local);
  };
}

function stationaryIntroduction(
  track: Extract<KpNativeKatexPaintMeasuredSceneTrack, {
    readonly lifecycle: "introduce";
  }>,
  input: {
    readonly timingGroupId: string;
    readonly presence: (progress: number) => number;
    readonly scale: (progress: number) => number;
  }
): KpNativeKatexPaintMeasuredSceneTrack {
  return Object.freeze({
    ...track,
    startRect: Object.freeze({ ...track.endRect }),
    startPaintRect: Object.freeze({ ...track.endPaintRect }),
    timingGroupId: input.timingGroupId,
    semanticMotionUnitId: input.timingGroupId,
    opacityScheduleAuthority: "semantic-choreography" as const,
    sampleProgress: () => 1,
    sampleOpacityProgress: input.presence,
    // Copy fan-out owns the exponent's branch geometry and therefore samples
    // every track at its projected motion progress. Presence remains the
    // template's authority, so fixed target paint cannot leak in early.
    samplePaintPresence: input.presence,
    sampleMaterialScale: input.scale
  });
}
