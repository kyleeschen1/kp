import type { KpVerifiedEvenRootSolveExemplar } from
  "../semantic/even-root-solve-exemplar.ts";
import {
  isKpVerifiedEvenRootSolveExemplar
} from "../semantic/even-root-solve-exemplar.ts";
import {
  projectKpNativeKatexSemanticPaintRelations,
  type KpNativeKatexPaintMeasuredSceneTrack,
  type KpNativeKatexSemanticPaintRelation
} from "./native-katex-base-scene-plan.ts";
import {
  compileKpCanonicalNativeKatexScenePlan,
  createKpCanonicalNativeKatexSceneSession,
  type KpCanonicalNativeKatexSceneSession,
  type KpNativeKatexSceneOwnershipFrame
} from "./native-katex-scene-compositor.ts";
import {
  createKpNativeKatexTrackProjection
} from "./native-katex-track-projection.ts";
import {
  invalidateKpNativeKatexMotionPath
} from "./native-katex-paint-geometry.ts";
import {
  planKpEquationMotionPathBetweenPoints
} from "./equation-motion-path-planner.ts";
import type { KpNativeKatexRenderedSceneObservation } from
  "./native-katex-rendered-scene.ts";
import type { KpEvenRootNativeEndpointSet } from
  "./even-root-native-endpoints.ts";
import {
  compileKpNativeKatexInkKnotMetrics
} from "./native-katex-ink-knot-geometry.ts";

const kpEvenRootExtractionTreatment = Object.freeze({
  bodyGatherWindow: Object.freeze({ start: 0.14, end: 0.5 }),
  bodyCompressionWindow: Object.freeze({ start: 0.28, end: 0.5 }),
  bodyHandoffWindow: Object.freeze({ start: 0.48, end: 0.54 }),
  resultRevealWindow: Object.freeze({ start: 0.52, end: 0.6 }),
  resultExpansionWindow: Object.freeze({ start: 0.52, end: 0.72 }),
  contextSettlementWindow: Object.freeze({ start: 0.1, end: 0.72 })
});

const kpEvenRootInversePowerTreatment = Object.freeze({
  roleTransferWindow: Object.freeze({ start: 0.08, end: 0.52 }),
  roleTransferWithdrawalWindow: Object.freeze({ start: 0.42, end: 0.54 }),
  roleTransferCompressionWindow: Object.freeze({ start: 0.38, end: 0.54 }),
  receiverIntroductionWindow: Object.freeze({ start: 0.42, end: 0.62 }),
  contextSettlementWindow: Object.freeze({ start: 0.14, end: 0.62 }),
  exponentReceiverScale: 0.22,
  departureClearanceInLocalInkHeights: 0.55
});

export interface KpEvenRootVisibleToImplicitRoleTransfer {
  readonly kind: "visible-exponent-to-implicit-root-index";
  readonly sourceExponentEntityId: "source.exponent.two";
  readonly targetRootIndexEntityId: "radical.index.implicit-two";
  readonly paintIdentity: "not-a-glyph-identity";
}

export interface KpEvenRootTransitSession {
  readonly kind: "kp-even-root-transit-session";
  readonly lifecycle: "renderer-session";
  readonly transition: "inverse-power" | "root-value-evaluation";
  readonly canonical: KpCanonicalNativeKatexSceneSession;
  readonly roleTransfer?: KpEvenRootVisibleToImplicitRoleTransfer | undefined;
  readonly apply: (progress: number) => KpNativeKatexSceneOwnershipFrame;
  readonly retire: (
    reason?: "surface-disposed" | "measurement-invalidated" | "scene-replaced"
  ) => void;
}

export function createKpEvenRootInversePowerTransitSession(input: {
  readonly exemplar: KpVerifiedEvenRootSolveExemplar;
  readonly endpoints: KpEvenRootNativeEndpointSet["inversePower"];
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): KpEvenRootTransitSession {
  assertExemplar(input.exemplar);
  const roleTransfer = Object.freeze({
    kind: "visible-exponent-to-implicit-root-index" as const,
    sourceExponentEntityId: input.exemplar.states[0].exponentEntityId,
    targetRootIndexEntityId: input.exemplar.states[1].rootIndexEntityId,
    // The target index is mathematically present but has no native glyph.
    // Calling this persistence would create duplicate or fabricated ink.
    paintIdentity: "not-a-glyph-identity" as const
  });
  const canonical = createKpCanonicalNativeKatexSceneSession(
    compileKpEvenRootInversePowerTransitPlan(input)
  );
  return session("inverse-power", canonical, roleTransfer);
}

export function compileKpEvenRootInversePowerTransitPlan(input: {
  readonly exemplar: KpVerifiedEvenRootSolveExemplar;
  readonly endpoints: KpEvenRootNativeEndpointSet["inversePower"];
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}) {
  assertExemplar(input.exemplar);
  assertEndpointPair(input.endpoints, "state.even-root.source",
    "state.even-root.radical-branches");
  return compileKpCanonicalNativeKatexScenePlan({
    source: input.source,
    target: input.target,
    relations: inversePowerPaintRelations(input.exemplar),
    copyFanOutRouting: false,
    trackProjection: inversePowerTrackProjection(input.exemplar)
  });
}

export function createKpEvenRootEvaluationTransitSession(input: {
  readonly exemplar: KpVerifiedEvenRootSolveExemplar;
  readonly endpoints: KpEvenRootNativeEndpointSet["evaluation"];
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): KpEvenRootTransitSession {
  assertExemplar(input.exemplar);
  const canonical = createKpCanonicalNativeKatexSceneSession(
    compileKpEvenRootEvaluationTransitPlan(input)
  );
  return session("root-value-evaluation", canonical);
}

export function compileKpEvenRootEvaluationTransitPlan(input: {
  readonly exemplar: KpVerifiedEvenRootSolveExemplar;
  readonly endpoints: KpEvenRootNativeEndpointSet["evaluation"];
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}) {
  assertExemplar(input.exemplar);
  assertEndpointPair(input.endpoints, "state.even-root.radical-branches",
    "state.even-root.evaluated-branches");
  return compileKpCanonicalNativeKatexScenePlan({
    source: input.source,
    target: input.target,
    relations: evaluationPaintRelations(input.exemplar),
    copyFanOutRouting: false,
    trackProjection: evaluationTrackProjection(input.exemplar, input.endpoints)
  });
}

function inversePowerPaintRelations(
  exemplar: KpVerifiedEvenRootSolveExemplar
): readonly KpNativeKatexSemanticPaintRelation[] {
  const [source, radical] = exemplar.states;
  return projectKpNativeKatexSemanticPaintRelations({
    groups: [
      oneToOne("subject", source.subjectEntityId, radical.subjectEntityId),
      oneToOne("relation", source.relationEntityId, radical.relationEntityId),
      oneToOne("radicand", source.rightEntityId, radical.radicandEntityId),
      introduction("plus-minus", radical.plusMinusEntityId),
      introduction("radical", radical.radicalOperatorEntityId)
    ]
  });
}

function evaluationPaintRelations(
  exemplar: KpVerifiedEvenRootSolveExemplar
): readonly KpNativeKatexSemanticPaintRelation[] {
  const [, radical, evaluated] = exemplar.states;
  return projectKpNativeKatexSemanticPaintRelations({
    groups: [
      oneToOne("subject", radical.subjectEntityId, evaluated.subjectEntityId),
      oneToOne("relation", radical.relationEntityId, evaluated.relationEntityId),
      oneToOne(
        "plus-minus",
        radical.plusMinusEntityId,
        evaluated.plusMinusEntityId
      ),
      // Arithmetic authority relates the root to 3. Paint deliberately uses
      // eliminate/introduce so contributor ink meets at one knot without two
      // simultaneously legible expressions.
      removal("root-operator", radical.radicalOperatorEntityId),
      removal("radicand", radical.radicandEntityId),
      introduction("evaluated-value", evaluated.valueEntityId)
    ]
  });
}

function inversePowerTrackProjection(
  exemplar: KpVerifiedEvenRootSolveExemplar
) {
  const [sourceState, radicalState] = exemplar.states;
  return createKpNativeKatexTrackProjection({
    id: `track-projection.${exemplar.id}.inverse-power`,
    project({ tracks, source, target }) {
      const sourceEntity = entityByAtom(source);
      const targetEntity = entityByAtom(target);
      const radicalAtom = target.atoms.find((atom) =>
        atom.semanticEntityId === radicalState.radicalOperatorEntityId
      );
      if (radicalAtom === undefined) {
        throw new Error("Even-root transit requires measured native radical ink.");
      }
      const receptionContactGroupId =
        `contact.${exemplar.id}.inverse-power-reception`;
      return Object.freeze(tracks.map((track) => {
        const from = sourceEntity.get(track.sourceAtomId ?? "");
        const to = targetEntity.get(track.targetAtomId ?? "");
        if (from === sourceState.exponentEntityId) {
          const receiverCenter = Object.freeze({
            x: radicalAtom.rect.left + track.startPaintRect.width * 0.32,
            y: radicalAtom.rect.top + track.startPaintRect.height * 0.38
          });
          const { endRect, endPaintRect } = relocateSourcePaintToCenter(
            track,
            receiverCenter
          );
          const localInkHeight = Math.max(
            track.startPaintRect.height,
            endPaintRect.height,
            1
          );
          const motionPath = planKpEquationMotionPathBetweenPoints({
            id: `operation-path.${exemplar.id}.exponent-to-root-reception`,
            relationRecordId: roleTransferRelationId(exemplar.id),
            start: rectCenter(track.startPaintRect),
            end: rectCenter(endPaintRect),
            variants: ["arc-above"],
            clearance: localInkHeight *
              kpEvenRootInversePowerTreatment
                .departureClearanceInLocalInkHeights
          }).selected;
          return Object.freeze({
            ...track,
            endRect,
            endPaintRect,
            motionPath,
            motionPathSampling: "foreground-diagonal-role-transfer" as const,
            timingGroupId: `timing.${exemplar.id}.role-transfer`,
            semanticMotionUnitId: `motion.${exemplar.id}.inverse-power-role-transfer`,
            intentionalContactGroupId: receptionContactGroupId,
            opacityScheduleAuthority: "semantic-choreography" as const,
            sampleProgress: sampleWindow(
              kpEvenRootInversePowerTreatment.roleTransferWindow.start,
              kpEvenRootInversePowerTreatment.roleTransferWindow.end
            ),
            sampleOpacityProgress: sampleWindow(
              kpEvenRootInversePowerTreatment
                .roleTransferWithdrawalWindow.start,
              kpEvenRootInversePowerTreatment
                .roleTransferWithdrawalWindow.end
            ),
            sampleMaterialScale: (progress: number) =>
              lerp(
                1,
                kpEvenRootInversePowerTreatment.exponentReceiverScale,
                smoothstep(
                  kpEvenRootInversePowerTreatment
                    .roleTransferCompressionWindow.start,
                  kpEvenRootInversePowerTreatment
                    .roleTransferCompressionWindow.end,
                  progress
                )
              )
          });
        }
        if (
          to === radicalState.radicalOperatorEntityId ||
          to === radicalState.plusMinusEntityId
        ) {
          return invalidateKpNativeKatexMotionPath(Object.freeze({
            ...track,
            startRect: track.endRect,
            timingGroupId: `timing.${exemplar.id}.branch-introduction`,
            semanticMotionUnitId: `motion.${exemplar.id}.inverse-power-reception`,
            intentionalContactGroupId: receptionContactGroupId,
            opacityScheduleAuthority: "semantic-choreography" as const,
            sampleProgress: () => 1,
            sampleOpacityProgress: sampleWindow(
              kpEvenRootInversePowerTreatment.receiverIntroductionWindow.start,
              kpEvenRootInversePowerTreatment.receiverIntroductionWindow.end
            ),
            sampleMaterialScale: (progress: number) =>
              lerp(0.2, 1, smoothstep(
                kpEvenRootInversePowerTreatment
                  .receiverIntroductionWindow.start,
                kpEvenRootInversePowerTreatment
                  .receiverIntroductionWindow.end,
                progress
              ))
          }));
        }
        return Object.freeze({
          ...track,
          sampleProgress: sampleWindow(
            kpEvenRootInversePowerTreatment.contextSettlementWindow.start,
            kpEvenRootInversePowerTreatment.contextSettlementWindow.end
          )
        });
      }));
    }
  });
}

function evaluationTrackProjection(
  exemplar: KpVerifiedEvenRootSolveExemplar,
  endpoints: KpEvenRootNativeEndpointSet["evaluation"]
) {
  const [, radicalState, evaluatedState] = exemplar.states;
  return createKpNativeKatexTrackProjection({
    id: `track-projection.${exemplar.id}.root-evaluation`,
    project({ tracks, source, target }) {
      const sourceEntity = entityByAtom(source);
      const targetEntity = entityByAtom(target);
      const resultAtom = target.atoms.find((atom) =>
        atom.semanticEntityId === evaluatedState.valueEntityId
      );
      if (resultAtom === undefined) {
        throw new Error("Root evaluation requires measured result ink.");
      }
      const resultCenter = {
        x: resultAtom.rect.left + resultAtom.rect.width / 2,
        y: resultAtom.rect.top + resultAtom.rect.height / 2
      };
      const rootExpressionEntityIds = new Set(
        endpoints.source.nodes
          .filter(({ role }) =>
            role === "radical-operator" || role === "radicand"
          )
          .map(({ entityId }) => entityId)
      );
      const rootExpressionTracks = tracks.filter((track) => {
        const from = sourceEntity.get(track.sourceAtomId ?? "");
        return from !== undefined && rootExpressionEntityIds.has(from);
      });
      if (rootExpressionTracks.length < 2) {
        throw new Error(
          "Root extraction requires measured enclosure and radicand ink."
        );
      }
      const knot = compileRootBodyKnot({
        tracks: rootExpressionTracks,
        resultRect: resultAtom.rect,
        resultCenter
      });
      const extractionContactGroupId =
        `contact.${exemplar.id}.root-extraction-assembly`;
      return Object.freeze(tracks.map((track) => {
        const from = sourceEntity.get(track.sourceAtomId ?? "");
        const to = targetEntity.get(track.targetAtomId ?? "");
        if (from !== undefined && rootExpressionEntityIds.has(from)) {
          const bodyPose = knot.bodyPoseByTrackId.get(track.id);
          if (bodyPose === undefined) {
            throw new Error(`Root body track ${track.id} lacks a knot pose.`);
          }
          const { endRect, endPaintRect } = relocateSourcePaintToCenter(
            track,
            bodyPose.center
          );
          return invalidateKpNativeKatexMotionPath(Object.freeze({
            ...track,
            endRect,
            endPaintRect,
            timingGroupId: `timing.${exemplar.id}.root-body-knot`,
            semanticMotionUnitId: `motion.${exemplar.id}.root-body`,
            intentionalContactGroupId: extractionContactGroupId,
            opacityScheduleAuthority: "semantic-choreography" as const,
            sampleProgress: sampleWindow(
              kpEvenRootExtractionTreatment.bodyGatherWindow.start,
              kpEvenRootExtractionTreatment.bodyGatherWindow.end
            ),
            sampleOpacityProgress: sampleWindow(
              kpEvenRootExtractionTreatment.bodyHandoffWindow.start,
              kpEvenRootExtractionTreatment.bodyHandoffWindow.end
            ),
            sampleMaterialScale: (progress: number) =>
              lerp(1, knot.bodyKernelScale, smoothstep(
                kpEvenRootExtractionTreatment.bodyCompressionWindow.start,
                kpEvenRootExtractionTreatment.bodyCompressionWindow.end,
                progress
              ))
          }));
        }
        if (to === evaluatedState.valueEntityId) {
          return invalidateKpNativeKatexMotionPath(Object.freeze({
            ...track,
            startRect: track.endRect,
            timingGroupId: `timing.${exemplar.id}.root-body-knot`,
            semanticMotionUnitId: `motion.${exemplar.id}.root-result`,
            intentionalContactGroupId: extractionContactGroupId,
            opacityScheduleAuthority: "semantic-choreography" as const,
            sampleProgress: () => 1,
            sampleOpacityProgress: sampleWindow(
              kpEvenRootExtractionTreatment.resultRevealWindow.start,
              kpEvenRootExtractionTreatment.resultRevealWindow.end
            ),
            sampleMaterialScale: (progress: number) =>
              lerp(knot.resultKernelScale, 1, smoothstep(
                kpEvenRootExtractionTreatment.resultExpansionWindow.start,
                kpEvenRootExtractionTreatment.resultExpansionWindow.end,
                progress
              ))
          }));
        }
        if (
          from === radicalState.plusMinusEntityId &&
          to === evaluatedState.plusMinusEntityId
        ) {
          return Object.freeze({
            ...track,
            intentionalContactGroupId: extractionContactGroupId,
            sampleProgress: sampleWindow(
              kpEvenRootExtractionTreatment.contextSettlementWindow.start,
              kpEvenRootExtractionTreatment.contextSettlementWindow.end
            )
          });
        }
        return Object.freeze({
          ...track,
          sampleProgress: sampleWindow(
            kpEvenRootExtractionTreatment.contextSettlementWindow.start,
            kpEvenRootExtractionTreatment.contextSettlementWindow.end
          )
        });
      }));
    }
  });
}

function roleTransferRelationId(exemplarId: string): string {
  return `correspondence.${exemplarId}.visible-exponent-to-implicit-root-index`;
}

function relocateSourcePaintToCenter(
  track: KpNativeKatexPaintMeasuredSceneTrack,
  center: Readonly<{ x: number; y: number }>
) {
  const paintOffsetX = track.startPaintRect.left - track.startRect.left;
  const paintOffsetY = track.startPaintRect.top - track.startRect.top;
  const endPaintRect = Object.freeze({
    ...track.startPaintRect,
    left: center.x - track.startPaintRect.width / 2,
    top: center.y - track.startPaintRect.height / 2
  });
  return Object.freeze({
    endPaintRect,
    endRect: Object.freeze({
      ...track.startRect,
      left: endPaintRect.left - paintOffsetX,
      top: endPaintRect.top - paintOffsetY
    })
  });
}

function compileRootBodyKnot(input: {
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly resultRect: Readonly<{
    left: number;
    top: number;
    width: number;
    height: number;
  }>;
  readonly resultCenter: Readonly<{ x: number; y: number }>;
}) {
  const sourceRects = input.tracks.map(({ startRect }) => startRect);
  const sourceArea = summedRectArea(sourceRects);
  const targetArea = summedRectArea([input.resultRect]);
  const knotMetrics = compileKpNativeKatexInkKnotMetrics({
    sourceArea,
    targetArea
  });
  const bodyPoseByTrackId = new Map(input.tracks.map((track) => {
    // Root evaluation consumes the enclosure and contents as one expression,
    // so their compressed paint shares one exact locus rather than retaining
    // enough spacing to remain readable as separate miniature glyphs.
    return [track.id, Object.freeze({
      center: input.resultCenter
    })] as const;
  }));
  return Object.freeze({
    bodyPoseByTrackId,
    bodyKernelScale: knotMetrics.sourceKernelScale,
    resultKernelScale: knotMetrics.targetKernelScale
  });
}

function summedRectArea(rects: readonly Readonly<{
  width: number;
  height: number;
}>[]): number {
  return Math.max(1, rects.reduce(
    (area, rect) => area + Math.max(0, rect.width * rect.height),
    0
  ));
}

function rectCenter(rect: Readonly<{
  left: number;
  top: number;
  width: number;
  height: number;
}>) {
  return Object.freeze({
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  });
}

function session(
  transition: KpEvenRootTransitSession["transition"],
  canonical: KpCanonicalNativeKatexSceneSession,
  roleTransfer?: KpEvenRootVisibleToImplicitRoleTransfer
): KpEvenRootTransitSession {
  let retired = false;
  return Object.freeze({
    kind: "kp-even-root-transit-session" as const,
    lifecycle: "renderer-session" as const,
    transition,
    canonical,
    ...(roleTransfer === undefined ? {} : { roleTransfer }),
    apply(progress: number) {
      if (retired) throw new Error("Cannot apply a retired even-root session.");
      return canonical.session.apply(bounded(progress));
    },
    retire(
      reason: "surface-disposed" | "measurement-invalidated" |
        "scene-replaced" = "surface-disposed"
    ) {
      if (retired) return;
      retired = true;
      canonical.session.retire({
        kind: "native-katex-paint-preserving-retirement",
        reason,
        structuralSuccession: "retire-preserving-paint"
      });
    }
  });
}

function oneToOne(id: string, source: string, target: string) {
  return Object.freeze({
    id,
    kind: "one-to-one" as const,
    sourceEntityIds: [source],
    targetEntityIds: [target]
  });
}

function introduction(id: string, target: string) {
  return Object.freeze({
    id,
    kind: "introduction" as const,
    sourceEntityIds: [],
    targetEntityIds: [target]
  });
}

function removal(id: string, source: string) {
  return Object.freeze({
    id,
    kind: "removal" as const,
    sourceEntityIds: [source],
    targetEntityIds: []
  });
}

function entityByAtom(scene: KpNativeKatexRenderedSceneObservation) {
  return new Map(scene.atoms.map((atom) => [atom.id, atom.semanticEntityId]));
}

function sampleWindow(start: number, end: number) {
  return (progress: number): number => smoothstep(start, end, progress);
}

function smoothstep(start: number, end: number, value: number): number {
  if (value <= start) return 0;
  if (value >= end) return 1;
  const t = (value - start) / (end - start);
  return t * t * (3 - 2 * t);
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function bounded(progress: number): number {
  return Math.max(0, Math.min(1, progress));
}

function assertExemplar(exemplar: KpVerifiedEvenRootSolveExemplar): void {
  if (!isKpVerifiedEvenRootSolveExemplar(exemplar)) {
    throw new Error("Even-root transit requires a verified exemplar.");
  }
}

function assertEndpointPair(
  endpoints: Readonly<{
    readonly source: { readonly stateId: string };
    readonly target: { readonly stateId: string };
  }>,
  sourceStateId: string,
  targetStateId: string
): void {
  if (
    endpoints.source.stateId !== sourceStateId ||
    endpoints.target.stateId !== targetStateId
  ) {
    throw new Error(
      `Even-root transit expected ${sourceStateId} -> ${targetStateId}.`
    );
  }
}
