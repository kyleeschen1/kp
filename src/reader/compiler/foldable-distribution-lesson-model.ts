import {
  createKpFoldableDistributionExpressionChain
} from "../../semantic/foldable-distribution-expression-chain.ts";
import {
  createKpFoldableDistributionEvaluationTree
} from "../../semantic/foldable-distribution-evaluation-tree.ts";
import {
  semanticTransformationLeafRefs
} from "../../semantic/transformation-composition.ts";
import {
  kpFoldableDistributionPreservationManifest as manifest
} from "./foldable-distribution-preservation-manifest.ts";
import { parseKpLessonMarkdown } from "./lesson-markdown-parser.ts";
import { compileKpStaticMathStates } from "./static-math-compiler.ts";
import { compileKpStaticLessonProse } from "./static-prose-compiler.ts";

export interface KpFoldableDistributionTranscriptEntry {
  readonly beatId: string;
  readonly checkpointId: string;
  readonly title: string;
  readonly narration: string;
  readonly operationIds: readonly string[];
}

const distributedProducts = Object.freeze({
  id: "expression.foldable-distribution.distributed-raw",
  latex: "3x + 3 \\cdot 2 + 2x + 2 \\cdot (-1)",
  title: "Four distributed products"
});

export function compileKpFoldableDistributionLessonModel(markdown: string) {
  const document = parseKpLessonMarkdown({
    sourceId: "content/lessons/foldable-distribution.md",
    id: manifest.document.id,
    version: manifest.document.version,
    title: manifest.document.title,
    language: "en",
    markdown
  });
  const story = document.blocks.find(
    (block) => block.kind === "animation-story"
  );
  if (story === undefined) {
    throw new Error("Foldable distribution lesson requires one animation story.");
  }
  if (story.asset.id !== manifest.libraryEntryId) {
    throw new Error(
      `Foldable distribution story targets unexpected asset ${story.asset.id}.`
    );
  }
  const expressionChain = createKpFoldableDistributionExpressionChain();
  const checkpointStates = new Map([
    ["factored", {
      latex: expressionChain[0]!.latex,
      label: "Three times x plus two, plus two times x minus one"
    }],
    ["distributed", {
      latex: distributedProducts.latex,
      label:
        "Three x plus three times two, plus two x plus two times negative one"
    }],
    ["products-evaluated", {
      latex: expressionChain[1]!.latex,
      label: "Three x plus six, plus two x minus two"
    }],
    ["grouped", {
      latex: expressionChain[2]!.latex,
      label: "Three x plus two x, grouped with six minus two"
    }],
    ["collected", {
      latex: expressionChain[3]!.latex,
      label: "Five x plus four"
    }]
  ]);
  const staticMath = compileKpStaticMathStates(
    document,
    ({ checkpointId }) => {
      const state = checkpointStates.get(checkpointId);
      if (state === undefined) {
        throw new Error(
          `Foldable distribution checkpoint ${checkpointId} has no static state.`
        );
      }
      return state;
    }
  );
  const prose = compileKpStaticLessonProse(document, { staticMath });
  const tree = createKpFoldableDistributionEvaluationTree();
  if (tree.root.kind !== "sequence") {
    throw new Error("Foldable distribution transcript requires a sequence root.");
  }
  const operationsByCheckpoint = new Map([
    ["factored", []],
    ["distributed", semanticTransformationLeafRefs(tree.root.children[0]!)],
    [
      "products-evaluated",
      semanticTransformationLeafRefs(tree.root.children[1]!)
    ],
    ["grouped", semanticTransformationLeafRefs(tree.root.children[2]!)],
    ["collected", semanticTransformationLeafRefs(tree.root.children[3]!)]
  ]);
  const transcript = Object.freeze(story.beats.map((beat) => Object.freeze({
    beatId: beat.id,
    checkpointId: beat.checkpoint.id,
    title: beat.title,
    narration: beat.content.map((inline) =>
      inline.kind === "text" ? inline.value : inline.text
    ).join(""),
    operationIds: Object.freeze(
      (operationsByCheckpoint.get(beat.checkpoint.id) ?? [])
        .map(({ id }) => id)
    )
  })));

  return Object.freeze({
    document,
    story,
    expressionChain,
    distributedProducts,
    staticMath,
    prose,
    transcript
  });
}
