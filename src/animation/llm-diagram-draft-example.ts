import type { KpAnimationAsset } from "./asset.ts";
import { compileKpLlmAnimationDraft } from "./llm-animation-draft-compiler.ts";
import {
  kpLlmAnimationDraftSchemaVersion,
  type KpLlmAnimationDraft
} from "./llm-animation-draft.ts";

export const acceptedGeneratedPipelineDiagramDraft: KpLlmAnimationDraft = {
  schemaVersion: kpLlmAnimationDraftSchemaVersion,
  id: "animation.generated.pipeline-diagram",
  title: "Generated: reveal a transformation pipeline",
  renderTarget: { id: "render.generated.pipeline-diagram", kind: "diagram" },
  objects: [
    {
      id: "diagram.generated.pipeline.before",
      title: "Direct input to output",
      scene: {
        nodes: [
          node("before.input", "before.input", "Input"),
          node("before.output", "before.output", "Output")
        ],
        edges: [edge("before.direct", "before.direct", "before.input", "before.output")],
        groups: [group("before.pipeline", "before.pipeline", ["before.input", "before.output"])],
        labels: [label("before.label", "before.label", "before.direct", "direct")]
      }
    },
    {
      id: "diagram.generated.pipeline.after",
      title: "Input transformed into output",
      scene: {
        nodes: [
          node("after.input", "after.input", "Input"),
          node("after.transform", "after.transform", "Transform"),
          node("after.output", "after.output", "Output")
        ],
        edges: [
          edge("after.into-transform", "after.into-transform", "after.input", "after.transform"),
          edge("after.into-output", "after.into-output", "after.transform", "after.output")
        ],
        groups: [group("after.pipeline", "after.pipeline", ["after.input", "after.transform", "after.output"])],
        labels: [label("after.label", "after.label", "after.transform", "semantic step")]
      }
    }
  ],
  transformations: [{
    id: "transform.generated.pipeline.reveal",
    transformType: "diagram-reveal-intermediate",
    title: "Reveal the semantic transformation step",
    sourceObjectIds: ["diagram.generated.pipeline.before"],
    targetObjectIds: ["diagram.generated.pipeline.after"],
    preserves: ["identity", "structure"],
    correspondenceMap: {
      id: "correspondence.generated.pipeline",
      records: [
        correspondence("input", "identity", ["before.input"], ["after.input"]),
        correspondence("output", "identity", ["before.output"], ["after.output"]),
        correspondence("pipeline", "identity", ["before.pipeline"], ["after.pipeline"]),
        correspondence("transform", "introduction", [], ["after.transform"]),
        correspondence("flow", "fan-out", ["before.direct"], ["after.into-transform", "after.into-output"]),
        correspondence("old-label", "removal", ["before.label"], []),
        correspondence("new-label", "introduction", [], ["after.label"])
      ]
    }
  }],
  sequence: ["transform.generated.pipeline.reveal"],
  timeline: { id: "timeline.generated.pipeline", durationMs: 1800, beatCount: 36 }
};

export function createAcceptedGeneratedPipelineDiagramAnimationAsset(): KpAnimationAsset {
  const result = compileKpLlmAnimationDraft(acceptedGeneratedPipelineDiagramDraft);
  if (result.status !== "accepted") {
    throw new Error(
      `Accepted generated diagram failed compilation: ${result.diagnostics[0]?.message ?? "unknown error"}`
    );
  }
  return result.animation;
}

function node(id: string, selectorId: string, label: string) {
  return { id, selectorId, shape: "rectangle" as const, label };
}

function edge(id: string, selectorId: string, sourceNodeId: string, targetNodeId: string) {
  return { id, selectorId, sourceNodeId, targetNodeId, directed: true };
}

function group(id: string, selectorId: string, nodeIds: readonly string[]) {
  return { id, selectorId, nodeIds, label: "Pipeline" };
}

function label(id: string, selectorId: string, targetId: string, text: string) {
  return { id, selectorId, targetId, text, placement: "above" as const };
}

function correspondence(
  id: string,
  relation: "identity" | "introduction" | "removal" | "fan-out",
  sourceSelectorIds: readonly string[],
  targetSelectorIds: readonly string[]
) {
  return {
    id: `relation.generated.pipeline.${id}`,
    relation,
    sourceSelectorIds,
    targetSelectorIds,
    summary: `${id} diagram lifecycle.`
  };
}
