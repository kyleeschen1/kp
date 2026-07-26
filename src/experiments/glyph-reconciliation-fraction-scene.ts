import {
  createKpFractionMergeGlyphReconciliationCase,
  createKpFractionSplitGlyphReconciliationCase
} from "../animation/semantic-glyph-reconciliation-cases.ts";
import type {
  KpEquationFontReadiness
} from "../rendering/equation-font-readiness.ts";
import {
  settleAndObserveKpNativeKatexRenderedScene
} from "../rendering/native-katex-rendered-scene.ts";
import {
  compileKpNativeKatexHierarchicalScenePlan,
  compileKpNativeKatexSceneTracks,
  compileKpNativeKatexTypographyStylePlan,
  correlateKpNativeKatexSceneHandoff,
  createKpNativeKatexScenePlayback,
  measureKpNativeKatexCorrelatedHandoff,
  measureKpNativeKatexGlyphHandoff,
  measureKpNativeKatexRuleHandoff,
  reconcileKpNativeKatexScenes,
  realizeKpNativeKatexTypographyStylePlan,
  sampleKpNativeKatexTypographyStylePlan,
  traceKpNativeKatexHandoffOwnership
} from "../rendering/native-katex-scene-compositor.ts";

export type KpFractionExperimentDirection = "merge" | "split";

export async function createKpFractionExperimentScene(input: {
  readonly direction: KpFractionExperimentDirection;
  readonly stage: HTMLElement;
  readonly splitRoot: HTMLElement;
  readonly mergedRoot: HTMLElement;
  readonly fontReadiness: KpEquationFontReadiness;
}) {
  const split = input.direction === "split";
  const caseInput = split
    ? createKpFractionSplitGlyphReconciliationCase()
    : createKpFractionMergeGlyphReconciliationCase();
  const sourceRoot = split ? input.mergedRoot : input.splitRoot;
  const targetRoot = split ? input.splitRoot : input.mergedRoot;
  const [sourceScene, targetScene] = await Promise.all([
    settleAndObserveKpNativeKatexRenderedScene({
      endpoint: "source",
      stage: input.stage,
      root: sourceRoot,
      semanticEntityId: "fraction.expression",
      presentationGroupId: split
        ? "group.fraction.target"
        : "group.fraction.source",
      fontReadiness: input.fontReadiness
    }),
    settleAndObserveKpNativeKatexRenderedScene({
      endpoint: "target",
      stage: input.stage,
      root: targetRoot,
      semanticEntityId: "fraction.expression",
      presentationGroupId: split
        ? "group.fraction.source"
        : "group.fraction.target",
      fontReadiness: input.fontReadiness
    })
  ]);
  const relation = split ? "split" : "merge";
  const reconciliation = reconcileKpNativeKatexScenes({
    source: sourceScene,
    target: targetScene,
    relations: [{
      id: "lineage.fraction.denominators",
      relation,
      sourceEntityIds: caseInput.sourceGlyphs.map(({ entityId }) => entityId),
      targetEntityIds: caseInput.targetGlyphs.map(({ entityId }) => entityId)
    }, {
      id: "lineage.structural.rules",
      relation,
      sourceEntityIds: split
        ? ["fraction.merged"]
        : ["fraction.left", "fraction.right"],
      targetEntityIds: split
        ? ["fraction.left", "fraction.right"]
        : ["fraction.merged"]
    }]
  });
  const tracks = compileKpNativeKatexSceneTracks(
    compileKpNativeKatexHierarchicalScenePlan(reconciliation)
  );
  const correlations = correlateKpNativeKatexSceneHandoff({
    reconciliation,
    tracks
  });
  const playback = createKpNativeKatexScenePlayback({
    stage: input.stage,
    sourceRoot,
    targetRoot,
    reconciliation,
    tracks
  });
  const microscope = {
    stage: input.stage,
    reconciliation,
    correlations,
    fontRevision: input.fontReadiness.revision,
    viewportKey: targetScene.viewportKey
  };
  const typographyStart = 0.96;
  playback.apply(typographyStart);
  const typographyPlan = compileKpNativeKatexTypographyStylePlan({
    telemetry: measureKpNativeKatexCorrelatedHandoff({
      ...microscope,
      progress: typographyStart
    }),
    correlations,
    tolerancePx: 0.1,
    maximumTranslationPx: 2,
    maximumScaleRatio: 1.1
  });
  playback.apply(0);
  const applyTypographyHandoff = (progress: number) => {
    const ownership = playback.apply(progress);
    const styleProgress = Math.max(
      0,
      Math.min(1, (progress - typographyStart) / (1 - typographyStart))
    );
    const styleFrame = sampleKpNativeKatexTypographyStylePlan(
      typographyPlan,
      styleProgress
    );
    const realization =
      progress >= typographyStart && ownership.visualOwner === "material-scene"
        ? realizeKpNativeKatexTypographyStylePlan({
          stage: input.stage,
          target: targetScene,
          plan: typographyPlan,
          frame: styleFrame
        })
        : Object.freeze({
          kind: "native-katex-typography-realization" as const,
          lifecycle: "renderer-session" as const,
          realizedIds: Object.freeze([]),
          deferredIds: Object.freeze([]),
          deferred: Object.freeze([]),
          nativeMutationCount: 0 as const
        });
    return Object.freeze({
      ownership,
      plan: typographyPlan,
      styleFrame,
      realization
    });
  };

  return Object.freeze({
    direction: input.direction,
    caseInput,
    sourceRoot,
    targetRoot,
    sourceScene,
    targetScene,
    reconciliation,
    tracks,
    correlations,
    ruleTracks: Object.freeze(tracks.filter(({ paintKind }) =>
      paintKind === "rule"
    )),
    playback,
    typographyPlan,
    measureGlyphHandoff(progress: number) {
      applyTypographyHandoff(progress);
      return measureKpNativeKatexGlyphHandoff({
        ...microscope,
        progress
      });
    },
    measureCorrelatedHandoff(progress: number) {
      applyTypographyHandoff(progress);
      return measureKpNativeKatexCorrelatedHandoff({
        ...microscope,
        progress
      });
    },
    measureRuleHandoff(progress: number) {
      applyTypographyHandoff(progress);
      return measureKpNativeKatexRuleHandoff({
        ...microscope,
        progress
      });
    },
    realizeTypographyHandoff: applyTypographyHandoff,
    traceHandoffOwnership(progresses: readonly number[]) {
      return traceKpNativeKatexHandoffOwnership({
        ...microscope,
        playback,
        progresses
      });
    }
  });
}
