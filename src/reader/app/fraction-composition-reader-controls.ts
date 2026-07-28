import {
  createKpFractionCompositionFoldIntent,
  type KpFractionCompositionFoldMode
} from "../../semantic/fraction-composition-fold-intent.ts";
import {
  compileKpFractionCompositionAdaptiveProjection,
  compileKpFractionCompositionStaticProjection
} from "../../semantic/fraction-composition-fold-projection.ts";
import {
  compileKpFractionCompositionFoldTimeline,
  projectKpFractionCompositionAnimationProgress,
  sampleKpFractionCompositionTimeline
} from "../../semantic/fraction-composition-fold-timeline.ts";
import {
  decodeKpFractionCompositionUrl,
  encodeKpFractionCompositionUrl,
  planKpFractionCompositionLayout,
  type KpReaderRuntimeRouteDescriptor
} from "../runtime/public-api.ts";
import {
  mountKpEvaluationReaderControls,
  type KpEvaluationReaderControls
} from "./evaluation-reader-controls.ts";

export type KpFractionCompositionReaderControls =
  KpEvaluationReaderControls;

export function mountKpFractionCompositionReaderControls(input: {
  readonly root: ParentNode;
  readonly stage: HTMLElement;
  readonly route: KpReaderRuntimeRouteDescriptor;
  readonly initialUrl: string | URL;
  readonly onChange: () => void;
}): KpFractionCompositionReaderControls {
  return mountKpEvaluationReaderControls({
    ...input,
    adapter: {
      decodeUrl: decodeKpFractionCompositionUrl,
      compileProjection({ mode, pinnedNodeIds, viewport }) {
        const intent = createKpFractionCompositionFoldIntent({
          mode: mode as KpFractionCompositionFoldMode,
          ...(mode === "pinned" ? { pinnedNodeIds } : {})
        });
        return mode === "expanded" || mode === "collapsed"
          ? compileKpFractionCompositionStaticProjection(intent)
          : compileKpFractionCompositionAdaptiveProjection({
              intent,
              detailBudget: viewport === "wide" ? "roomy" : "compact"
            });
      },
      compileTimeline: compileKpFractionCompositionFoldTimeline,
      sampleTimeline: sampleKpFractionCompositionTimeline,
      planLayout({ viewport }) {
        return planKpFractionCompositionLayout({ viewport });
      },
      projectAnimationProgress:
        projectKpFractionCompositionAnimationProgress,
      resolveLayoutPolicy({ layout, animationProgress }) {
        const index = Math.min(
          layout.phases.length - 1,
          Math.floor(animationProgress * layout.phases.length)
        );
        const phase = layout.phases[index];
        if (phase === undefined) {
          throw new Error("Fraction composition layout has no active phase.");
        }
        return phase.policy;
      },
      encodeUrl: encodeKpFractionCompositionUrl
    }
  });
}
