import {
  sampleKpAntiderivativeRuleTemplateApplication,
  type KpAntiderivativePowerChoreographyPlan
} from "../animation/antiderivative-power-choreography.ts";
import {
  sampleKpCanonicalNativeKatexCopyFanOutMotion
} from "../animation/copy-fan-out-motion-profile.ts";
import {
  planKpEquationMotionPathBetweenPoints
} from "./equation-motion-path-planner.ts";
import {
  invalidateKpNativeKatexMotionPath
} from "./native-katex-paint-geometry.ts";
import type {
  KpNativeKatexPaintMeasuredSceneTrack
} from "./native-katex-base-scene-plan.ts";
import {
  createKpNativeKatexTrackProjection,
  type KpNativeKatexTrackProjection
} from "./native-katex-track-projection.ts";

export const kpAntiderivativeTemplateInstantiationProfileId =
  "kp.rendering.native-katex.antiderivative-template-instantiation-profile.v2";

const presentationProfile = Object.freeze({
  scaffoldPointScale: 0.78,
  fixedSyntaxPointScale: 0.72,
  closurePointScale: 0.76,
  numeratorVacancyOffsetInNativeHeights: 1.35,
  denominatorBranchClearanceInNativeHeights: 1.8
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
  const fixedSyntaxRoleById = new Map(template.fixedSyntaxGroups.flatMap(
    (group) => group.selectorIds.map((id) => [id, group.role] as const)
  ));
  const closureIds = new Set(template.closureSelectorIds);
  const baseTargetIds = new Set(
    template.bindingRelations[0].targetSelectorIds
  );
  const exponentTargetIds = new Set(
    template.bindingRelations[1].targetSelectorIds
  );
  const denominatorExponentTargetId =
    template.bindingRelations[1].targetSelectorIds[1];
  const numeratorExponentTargetId =
    template.bindingRelations[1].targetSelectorIds[0];
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
      const baseTrack = tracks.find((track) =>
        track.lifecycle === "persist" &&
        baseTargetIds.has(
          targetEntityByAtomId.get(track.targetAtomId ?? "") ?? ""
        )
      );
      if (
        denominatorTrack === undefined ||
        fractionRuleTrack === undefined ||
        baseTrack === undefined
      ) {
        throw new Error(
          "Antiderivative template projection requires base and denominator bindings plus one fraction rule."
        );
      }
      const templateTranslation = translationBetweenCenters(
        baseTrack.endRect,
        baseTrack.startRect
      );
      const occlusionId =
        "foreground-occlusion.antiderivative-template.denominator-through-rule";
      const numeratorReceptionContactGroupId =
        "contact.antiderivative-template.numerator-reception";
      const denominatorReceptionContactGroupId =
        "contact.antiderivative-template.denominator-reception";
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
            progressWindow: Object.freeze({ start: 0.38, end: 0.82 })
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
            intentionalContactGroupId: numeratorReceptionContactGroupId,
            sampleProgress: sampleRuleBindingMotionInput,
            motionMetrics: true as const
          });
        }
        if (track.lifecycle === "split" &&
            targetEntityId !== undefined &&
            exponentTargetIds.has(targetEntityId)) {
          const bindingTrack = Object.freeze({
            ...track,
            timingGroupId: "antiderivative-template.exponent-binding",
            semanticMotionUnitId: "antiderivative-template.exponent-binding",
            routingCohortId: "antiderivative-template.exponent-fan-out",
            routingMemberId: targetEntityId,
            ...(targetEntityId === numeratorExponentTargetId
              ? {
                  intentionalContactGroupId:
                    numeratorReceptionContactGroupId
                }
              : {
                  intentionalContactGroupId:
                    denominatorReceptionContactGroupId
                }),
            sampleProgress: sampleRuleBindingMotionInput,
            motionMetrics: true as const
          });
          return withDenominatorRuleOcclusion(
            targetEntityId === denominatorExponentTargetId
              ? withMotionPath(bindingTrack, {
                  variant: "arc-below",
                  clearanceInNativeHeights: presentationProfile
                    .denominatorBranchClearanceInNativeHeights
                })
              : bindingTrack
          );
        }
        if (
          track.lifecycle === "introduce" &&
          targetEntityId !== undefined &&
          scaffoldIds.has(targetEntityId)
        ) {
          return withDenominatorRuleOcclusion(translatedIntroduction(
            Object.freeze({
              ...track,
              intentionalContactGroupId: numeratorReceptionContactGroupId
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
              },
              translation: templateTranslation
            }
          ));
        }
        if (
          track.lifecycle === "introduce" &&
          targetEntityId !== undefined &&
          fixedSyntaxRoleById.has(targetEntityId)
        ) {
          const role = fixedSyntaxRoleById.get(targetEntityId)!;
          return translatedIntroduction(Object.freeze({
            ...track,
            ...(role === "denominator-successor"
              ? {
                  intentionalContactGroupId:
                    denominatorReceptionContactGroupId
                }
              : {})
          }), {
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
            },
            translation: role === "numerator-successor"
              ? Object.freeze({
                  x: templateTranslation.x + track.endPaintRect.height *
                    presentationProfile
                      .numeratorVacancyOffsetInNativeHeights,
                  y: templateTranslation.y
                })
              : templateTranslation
          });
        }
        if (
          track.lifecycle === "introduce" &&
          targetEntityId !== undefined &&
          closureIds.has(targetEntityId)
        ) {
          return translatedIntroduction(track, {
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
            },
            translation: templateTranslation
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

function translatedIntroduction(
  track: Extract<KpNativeKatexPaintMeasuredSceneTrack, {
    readonly lifecycle: "introduce";
  }>,
  input: {
    readonly timingGroupId: string;
    readonly presence: (progress: number) => number;
    readonly scale: (progress: number) => number;
    readonly translation: Readonly<{ x: number; y: number }>;
  }
): KpNativeKatexPaintMeasuredSceneTrack {
  const withoutPath = invalidateKpNativeKatexMotionPath(track);
  return Object.freeze({
    ...withoutPath,
    startRect: translateRect(track.endRect, input.translation),
    startPaintRect: translateRect(track.endPaintRect, input.translation),
    timingGroupId: input.timingGroupId,
    semanticMotionUnitId: "antiderivative-template.receiver",
    opacityScheduleAuthority: "semantic-choreography" as const,
    sampleProgress: (progress) =>
      sampleKpCanonicalNativeKatexCopyFanOutMotion(
        sampleRuleBindingMotionInput(progress)
      ).addendReflowProgress,
    sampleOpacityProgress: input.presence,
    // Copy fan-out owns the exponent's branch geometry and therefore samples
    // every track at its projected motion progress. Presence remains the
    // template's authority, so fixed target paint cannot leak in early.
    samplePaintPresence: input.presence,
    sampleMaterialScale: input.scale
  });
}

function sampleRuleBindingMotionInput(progress: number): number {
  if (progress <= 0.26) return 0;
  if (progress >= 0.82) return 1;
  const local = (progress - 0.26) / (0.82 - 0.26);
  return local * local * (3 - 2 * local);
}

function translationBetweenCenters(
  from: Readonly<{ left: number; top: number; width: number; height: number }>,
  to: Readonly<{ left: number; top: number; width: number; height: number }>
): Readonly<{ x: number; y: number }> {
  return Object.freeze({
    x: to.left + to.width / 2 - (from.left + from.width / 2),
    y: to.top + to.height / 2 - (from.top + from.height / 2)
  });
}

function translateRect(
  rect: Readonly<{ left: number; top: number; width: number; height: number }>,
  translation: Readonly<{ x: number; y: number }>
) {
  return Object.freeze({
    left: rect.left + translation.x,
    top: rect.top + translation.y,
    width: rect.width,
    height: rect.height
  });
}

function withMotionPath(
  track: KpNativeKatexPaintMeasuredSceneTrack,
  input: {
    readonly variant: "arc-above" | "arc-below";
    readonly clearanceInNativeHeights: number;
  }
): KpNativeKatexPaintMeasuredSceneTrack {
  const center = (rect: Readonly<{
    left: number;
    top: number;
    width: number;
    height: number;
  }>) => Object.freeze({
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  });
  return Object.freeze({
    ...track,
    motionPath: planKpEquationMotionPathBetweenPoints({
      id: `path.${track.id}.antiderivative-template-${input.variant}`,
      start: center(track.startPaintRect),
      end: center(track.endPaintRect),
      variants: [input.variant],
      preferredVariant: input.variant,
      clearance: Math.max(
        track.startPaintRect.height,
        track.endPaintRect.height
      ) * input.clearanceInNativeHeights
    }).selected,
    motionPathSampling: "planned-curve" as const
  });
}
