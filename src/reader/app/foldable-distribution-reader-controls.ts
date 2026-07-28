import {
  createKpFoldableDistributionFoldIntent,
  type KpFoldableDistributionFoldMode
} from "../../semantic/foldable-distribution-fold-intent.ts";
import {
  compileKpFoldableDistributionAdaptiveProjection,
  compileKpFoldableDistributionStaticProjection
} from "../../semantic/foldable-distribution-fold-projection.ts";
import {
  compileKpFoldableDistributionFoldTimeline,
  sampleKpFoldableDistributionTimeline
} from "../../semantic/foldable-distribution-fold-timeline.ts";
import {
  decodeKpFoldableDistributionUrl,
  encodeKpFoldableDistributionUrl,
  planKpFoldableDistributionLayout,
  type KpReaderRuntimeRouteDescriptor
} from "../runtime/public-api.ts";
import {
  mountKpEvaluationReaderControls,
  type KpEvaluationReaderControls
} from "./evaluation-reader-controls.ts";

export type KpFoldableDistributionReaderControls =
  KpEvaluationReaderControls;

export function mountKpFoldableDistributionReaderControls(input: {
  readonly root: ParentNode;
  readonly stage: HTMLElement;
  readonly route: KpReaderRuntimeRouteDescriptor;
  readonly initialUrl: string | URL;
  readonly onChange: () => void;
}): KpFoldableDistributionReaderControls {
  return mountKpEvaluationReaderControls({
    ...input,
    adapter: {
      decodeUrl: decodeKpFoldableDistributionUrl,
      compileProjection({ mode, pinnedNodeIds, viewport }) {
        const intent = createKpFoldableDistributionFoldIntent({
          mode: mode as KpFoldableDistributionFoldMode,
          ...(mode === "pinned" ? { pinnedNodeIds } : {})
        });
        return mode === "expanded" || mode === "collapsed"
          ? compileKpFoldableDistributionStaticProjection(intent)
          : compileKpFoldableDistributionAdaptiveProjection({
              intent,
              detailBudget: viewport === "wide" ? "roomy" : "compact"
            });
      },
      compileTimeline: compileKpFoldableDistributionFoldTimeline,
      sampleTimeline: sampleKpFoldableDistributionTimeline,
      planLayout: planKpFoldableDistributionLayout,
      projectAnimationProgress({ timeline, sample }) {
        const phaseIndex = timeline.phases.findIndex(
          ({ nodeId }) => nodeId === sample.activeNodeId
        );
        if (phaseIndex < 0) {
          throw new Error(
            `Unknown foldable distribution phase ${sample.activeNodeId}.`
          );
        }
        return (
          phaseIndex + sample.phaseProgress
        ) / timeline.phases.length;
      },
      resolveLayoutPolicy({ layout, sample }) {
        const phase = layout.phases.find(
          ({ nodeId }) => nodeId === sample.activeNodeId
        );
        if (phase === undefined) {
          throw new Error(
            `Missing foldable distribution layout ${sample.activeNodeId}.`
          );
        }
        return phase.policy;
      },
      encodeUrl: encodeKpFoldableDistributionUrl
    }
  });
}
