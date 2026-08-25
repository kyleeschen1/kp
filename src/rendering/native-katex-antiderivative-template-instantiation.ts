import {
  sampleKpAntiderivativeRuleTemplateApplication,
  type KpAntiderivativePowerChoreographyPlan
} from "../animation/antiderivative-power-choreography.ts";
import {
  invalidateKpNativeKatexMotionPath,
  measureKpNativeKatexPaintAtomRect
} from "./native-katex-paint-geometry.ts";
import type {
  KpEquationMotionPathCandidate
} from "./equation-motion-path-planner.ts";
import type {
  KpNativeKatexPaintMeasuredSceneTrack
} from "./native-katex-base-scene-plan.ts";
import type {
  KpNativeKatexPaintAtomObservation,
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import {
  createKpNativeKatexTrackProjection,
  type KpNativeKatexTrackProjection
} from "./native-katex-track-projection.ts";

export const kpAntiderivativeTemplateInstantiationProfileId =
  "kp.rendering.native-katex.antiderivative-template-instantiation-profile.v5";

const presentationProfile = Object.freeze({
  scaffoldPointScale: 0.9,
  fixedSyntaxPointScale: 0.88,
  closurePointScale: 0.9,
  numeratorVacancyOffsetInNativeHeights: 1.35,
  receiverPathProgress: 0.5,
  receiverGapInNativeHeights: 0.4,
  stageEdgeInsetPx: 4
});

export interface KpAntiderivativeTemplateReceiverPlacement {
  readonly lane: "right" | "above";
  readonly translation: Readonly<{ x: number; y: number }>;
}

/**
 * This projection expresses one reviewed-candidate causal phrase: the rule's
 * prospective structure receives verified source bindings before it becomes
 * live syntax. It is deliberately antiderivative-local until human approval
 * and a structurally different caller demonstrate a reusable motif boundary.
 */
export function createKpAntiderivativeTemplateInstantiationTrackProjection(
  plan: KpAntiderivativePowerChoreographyPlan,
  templateSource?: KpNativeKatexRenderedSceneObservation
): KpNativeKatexTrackProjection {
  if (templateSource !== undefined) {
    return createTemplateSourceHandoffProjection(plan, templateSource);
  }
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
    project({ tracks, source, target }) {
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
      const receiverPlacement = measureKpAntiderivativeTemplateReceiverPlacement({
        source,
        target
      });
      const receiverTranslation = receiverPlacement.translation;
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
            timingGroupId: "antiderivative-template.receiver",
            semanticMotionUnitId: "antiderivative-template.receiver",
            // The base is received by the numerator vacancy, but shares the
            // lower branch's contact allowance while leaving the source pose;
            // otherwise collision repair pulls one member out of the rigid
            // receiver cohort before settlement.
            intentionalContactGroupId: denominatorReceptionContactGroupId,
            motionPath: pathThroughReceiver(
              track,
              receiverTranslation,
              receiverPlacement.lane
            ),
            motionPathSampling: "staged-waypoint" as const,
            sampleProgress: sampleRuleMaterialPathProgress,
            motionMetrics: true as const
          });
        }
        if (track.lifecycle === "split" &&
            targetEntityId !== undefined &&
            exponentTargetIds.has(targetEntityId)) {
          const bindingTrack = Object.freeze({
            ...track,
            timingGroupId: "antiderivative-template.receiver",
            semanticMotionUnitId: "antiderivative-template.receiver",
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
            motionPath: pathThroughReceiver(
              track,
              receiverTranslation,
              receiverPlacement.lane
            ),
            motionPathSampling: "staged-waypoint" as const,
            sampleProgress: sampleRuleMaterialPathProgress,
            ...(targetEntityId === denominatorExponentTargetId
              ? {
                  samplePaintPresence: sampleFollowerPresence
                }
              : {}),
            motionMetrics: true as const
          });
          return withDenominatorRuleOcclusion(bindingTrack);
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
              translation: receiverTranslation
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
            intentionalContactGroupId: role === "denominator-successor"
              ? denominatorReceptionContactGroupId
              : numeratorReceptionContactGroupId
          }), {
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
                  x: receiverTranslation.x + track.endPaintRect.height *
                    presentationProfile
                      .numeratorVacancyOffsetInNativeHeights,
                  y: receiverTranslation.y
                })
              : receiverTranslation
          });
        }
        if (
          track.lifecycle === "introduce" &&
          targetEntityId !== undefined &&
          closureIds.has(targetEntityId)
        ) {
          return translatedIntroduction(track, {
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
            translation: receiverTranslation
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

/**
 * The canonical Catalogue host renders the instantiated rule before transit.
 * Measure that actual native RHS as the presentation source so the learner
 * sees one equation—and especially one fraction rule—become the expanded
 * result. The verified initial-to-expanded correspondence remains semantic
 * authority; this projection changes only the renderer-owned source pose.
 */
function createTemplateSourceHandoffProjection(
  plan: KpAntiderivativePowerChoreographyPlan,
  templateSource: KpNativeKatexRenderedSceneObservation
): KpNativeKatexTrackProjection {
  const template = plan.ruleTemplateApplication;
  return createKpNativeKatexTrackProjection({
    id: `track-projection.${kpAntiderivativeTemplateInstantiationProfileId}.native-template-source`,
    project({ tracks, target }) {
      const targetAtoms = new Map(target.atoms.map((atom) => [atom.id, atom]));
      const templateAtoms = templateSource.atoms;
      const projected = tracks.map((track) => {
        if (track.lifecycle === "eliminate") {
          return Object.freeze({
            ...track,
            opacityScheduleAuthority: "semantic-choreography" as const,
            // The instantiated panel has already explained the source-side
            // operator and differential; neither belongs to the RHS handoff.
            sampleProgress: () => 1,
            sampleOpacityProgress: () => 1
          });
        }
        const targetAtom = targetAtoms.get(track.targetAtomId ?? "");
        if (targetAtom === undefined) {
          throw new Error(
            `Antiderivative template handoff cannot resolve target paint for ${track.id}.`
          );
        }
        const sourceAtom = uniqueTemplateAtom(templateAtoms, targetAtom);
        const withoutPath = invalidateKpNativeKatexMotionPath(track);
        return Object.freeze({
          ...withoutPath,
          startRect: Object.freeze({ ...sourceAtom.rect }),
          startPaintRect: Object.freeze(
            measureKpNativeKatexPaintAtomRect(templateSource.stage, sourceAtom)
          ),
          timingGroupId: "antiderivative-template.native-handoff",
          semanticMotionUnitId: "antiderivative-template.native-handoff",
          ...(track.lifecycle === "persist" || track.lifecycle === "split"
            ? { motionMetrics: true as const }
            : {}),
          ...(track.lifecycle === "introduce"
            ? {
                // The grammar is prospective in the visible template, so it
                // is already fully painted when material ownership begins.
                opacityScheduleAuthority:
                  "semantic-choreography" as const,
                sampleOpacityProgress: () => 1,
                samplePaintPresence: () => 1
              }
            : {})
        });
      });
      const fractionRule = projected.find((track) =>
        track.paintKind === "rule" &&
        track.targetAtomId !== undefined &&
        targetAtoms.get(track.targetAtomId)?.semanticEntityId ===
          template.scaffoldSemanticEntityIds[0]
      );
      if (fractionRule === undefined) {
        throw new Error(
          "Antiderivative native template handoff requires one shifting fraction rule."
        );
      }
      return Object.freeze(projected);
    }
  });
}

function uniqueTemplateAtom(
  atoms: readonly KpNativeKatexPaintAtomObservation[],
  target: KpNativeKatexPaintAtomObservation
): KpNativeKatexPaintAtomObservation {
  const candidates = atoms.filter((atom) =>
    atom.semanticEntityId === target.semanticEntityId &&
    atom.paintKind === target.paintKind &&
    atom.visualKey === target.visualKey
  );
  if (candidates.length !== 1) {
    throw new Error(
      `Antiderivative instantiated template expected one ${target.paintKind} ` +
      `owner for ${target.semanticEntityId}; received ${candidates.length}.`
    );
  }
  return candidates[0]!;
}

function translatedIntroduction(
  track: Extract<KpNativeKatexPaintMeasuredSceneTrack, {
    readonly lifecycle: "introduce";
  }>,
  input: {
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
    timingGroupId: "antiderivative-template.receiver",
    semanticMotionUnitId: "antiderivative-template.receiver",
    opacityScheduleAuthority: "semantic-choreography" as const,
    sampleProgress: (progress) =>
      sampleKpAntiderivativeRuleTemplateApplication(progress)
        .receiverSettlementProgress,
    sampleOpacityProgress: input.presence,
    // Receiver settlement owns motion for the introduced grammar. Presence
    // remains the template's separate authority, so target paint cannot leak
    // in before the receiver opens.
    samplePaintPresence: input.presence,
    sampleMaterialScale: input.scale
  });
}

function sampleRuleMaterialPathProgress(progress: number): number {
  const template = sampleKpAntiderivativeRuleTemplateApplication(progress);
  const receiver = presentationProfile.receiverPathProgress;
  return template.receiverSettlementProgress > 0
    ? receiver + (1 - receiver) * template.receiverSettlementProgress
    : receiver * template.bindingProgress;
}

function sampleFollowerPresence(progress: number): number {
  const binding = sampleKpAntiderivativeRuleTemplateApplication(progress)
    .bindingProgress;
  return smoothstep(clamp01((binding - 0.16) / 0.34));
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

export function measureKpAntiderivativeTemplateReceiverPlacement(input: {
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): KpAntiderivativeTemplateReceiverPlacement {
  const stageRect = input.target.stage.getBoundingClientRect();
  const sourceRect = unionAtomRects(input.source);
  const targetRect = unionAtomRects(input.target);
  const nativeHeight = Math.max(sourceRect.height, targetRect.height);
  const gap = nativeHeight * presentationProfile.receiverGapInNativeHeights;
  const rightTranslation = sourceRect.right + gap - targetRect.left;
  const rightEdge = targetRect.right + rightTranslation;
  if (
    rightEdge <= stageRect.width - presentationProfile.stageEdgeInsetPx
  ) {
    return Object.freeze({
      lane: "right" as const,
      translation: Object.freeze({ x: rightTranslation, y: 0 })
    });
  }
  const aboveTranslation = Math.max(
    presentationProfile.stageEdgeInsetPx - targetRect.top,
    sourceRect.top - gap - targetRect.bottom
  );
  return Object.freeze({
    lane: "above" as const,
    translation: Object.freeze({ x: 0, y: aboveTranslation })
  });
}

function unionAtomRects(
  scene: KpNativeKatexRenderedSceneObservation
): {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly width: number;
  readonly height: number;
} {
  if (scene.atoms.length === 0) {
    throw new Error("Antiderivative template placement requires native paint.");
  }
  const left = Math.min(...scene.atoms.map(({ rect }) => rect.left));
  const top = Math.min(...scene.atoms.map(({ rect }) => rect.top));
  const right = Math.max(...scene.atoms.map(({ rect }) =>
    rect.left + rect.width
  ));
  const bottom = Math.max(...scene.atoms.map(({ rect }) =>
    rect.top + rect.height
  ));
  return Object.freeze({
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top
  });
}

function pathThroughReceiver(
  track: KpNativeKatexPaintMeasuredSceneTrack,
  translation: Readonly<{ x: number; y: number }>,
  lane: KpAntiderivativeTemplateReceiverPlacement["lane"]
): KpEquationMotionPathCandidate {
  const start = rectCenter(track.startPaintRect);
  const end = rectCenter(track.endPaintRect);
  const receiver = {
    x: end.x + translation.x,
    y: end.y + translation.y
  };
  const travelDistance = distance(start, receiver) + distance(receiver, end);
  return Object.freeze({
    id: `path.${track.id}.antiderivative-template-receiver`,
    variant: lane === "right" ? "around-right" as const : "arc-above" as const,
    start: Object.freeze(start),
    control: Object.freeze(receiver),
    end: Object.freeze(end),
    collisionCount: 0,
    travelDistance,
    readingOrderPenalty: 0,
    preferencePenalty: 0,
    score: travelDistance
  });
}

function rectCenter(rect: Readonly<{
  left: number;
  top: number;
  width: number;
  height: number;
}>): { x: number; y: number } {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function distance(
  left: Readonly<{ x: number; y: number }>,
  right: Readonly<{ x: number; y: number }>
): number {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}
