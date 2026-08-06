import {
  createKpFractionCompositionEquationAnimationAsset
} from "../../animation/fraction-composition-equation-adapter.ts";
import {
  kpFractionCompositionPreservationManifest as manifest
} from "./fraction-composition-preservation-manifest.ts";
import {
  compileKpEquationExemplarLessonModel
} from "./equation-exemplar-lesson-model.ts";
import {
  createKpFractionCompositionEvaluationTree
} from "../../semantic/fraction-composition-evaluation-tree.ts";
import {
  createKpFractionCompositionSalienceInventory
} from "./fraction-composition-salience-inventory.ts";

export interface KpFractionCompositionTranscriptEntry {
  readonly beatId: string;
  readonly checkpointId: string;
  readonly title: string;
  readonly narration: string;
  readonly operationIds: readonly string[];
}

export function compileKpFractionCompositionLessonModel(markdown: string) {
  const base = compileKpEquationExemplarLessonModel({
    animation: createKpFractionCompositionEquationAnimationAsset(),
    sourceId: "content/lessons/fraction-composition.md",
    documentId: manifest.document.id,
    version: manifest.document.version,
    title: manifest.document.title,
    language: "en",
    markdown,
    diagnosticLabel: "fraction-composition"
  });
  const story = base.document.blocks.find(
    (block) => block.kind === "animation-story"
  );
  if (story === undefined) {
    throw new Error("Fraction composition lesson requires one animation story.");
  }
  const tree = createKpFractionCompositionEvaluationTree();
  const inventory = createKpFractionCompositionSalienceInventory();
  const operationsByCheckpoint = new Map(inventory.checkpoints.map(
    ({ id, operationIds }) => [id, operationIds] as const
  ));
  const transcript = Object.freeze(story.beats.map((beat) => Object.freeze({
    beatId: beat.id,
    checkpointId: beat.checkpoint.id,
    title: beat.title,
    narration: beat.content.map((inline) =>
      inline.kind === "text" ? inline.value : inline.text
    ).join(""),
    operationIds: Object.freeze(
      operationsByCheckpoint.get(
        beat.checkpoint.id as typeof inventory.checkpoints[number]["id"]
      ) ?? []
    )
  })));

  return Object.freeze({
    ...base,
    story,
    transcript,
    annotations: tree.annotations
  });
}
