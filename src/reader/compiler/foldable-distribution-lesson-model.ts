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
  createKpFoldableDistributionEquationAnimationAsset
} from "../../animation/foldable-distribution-equation-adapter.ts";
import {
  kpFoldableDistributionPreservationManifest as manifest
} from "./foldable-distribution-preservation-manifest.ts";
import {
  compileKpEquationExemplarLessonModel
} from "./equation-exemplar-lesson-model.ts";
import { emitKpReaderHydrationManifest } from "./hydration-manifest.ts";
import { compileKpStaticMathStates } from "./static-math-compiler.ts";
import { compileKpStaticLessonProse } from "./static-prose-compiler.ts";
import { readAffineCollectionLesson } from "./affine-collection-source.ts";
import { AffineCollectionRepair } from "../../semantic/affine-collection-source.ts";

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
  const authored = readAffineCollectionLesson(markdown), d = authored.derivation;
  const base = compileKpEquationExemplarLessonModel({
    animation: createKpFoldableDistributionEquationAnimationAsset(d),
    sourceId: "content/lessons/foldable-distribution.md",
    documentId: manifest.document.id,
    version: manifest.document.version,
    title: manifest.document.title,
    language: "en",
    markdown: authored.markdown,
    diagnosticLabel: "foldable-distribution"
  });
  const { document } = base;
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
  if (authored.authored) {
    const checkpoints = ["factored", "distributed", "products-evaluated", "grouped", "coefficient-factored", "collected"];
    const progress = [0, 230, 460, 650, 825, 1000];
    let previous = -1;
    for (const [index, beat] of story.beats.entries()) {
      const current = checkpoints.indexOf(beat.checkpoint.id);
      if (current <= previous || beat.checkpoint.progressPermille !== progress[current])
        throw new AffineCollectionRepair(`$.story.beats[${index}]`, "Select checkpoints in the checked derivation order at their canonical progress.");
      previous = current;
    }
  }
  const expressionChain = createKpFoldableDistributionExpressionChain(d);
  const rawProducts = { ...distributedProducts, latex: d.latex[1]! };
  const checkpointStates = new Map([
    ["factored", {
      latex: expressionChain[0]!.latex,
      label: "Three times x plus two, plus two times x minus one"
    }],
    ["distributed", {
      latex: rawProducts.latex,
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
    ["coefficient-factored", {
      latex: expressionChain[3]!.latex,
      label: "Three plus two, times x, plus six minus two"
    }],
    ["collected", {
      latex: expressionChain[4]!.latex,
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
      return d.isDefault ? state : { latex: state.latex, label: state.latex };
    }
  );
  const prose = compileKpStaticLessonProse(document, { staticMath });
  const tree = createKpFoldableDistributionEvaluationTree(d);
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
    [
      "coefficient-factored",
      semanticTransformationLeafRefs(tree.root.children[3]!)
    ],
    ["collected", semanticTransformationLeafRefs(tree.root.children[4]!)]
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
    ...base,
    derivation: d,
    authored: authored.authored,
    staticMath,
    prose,
    hydration: emitKpReaderHydrationManifest(base.resolved, staticMath),
    story,
    expressionChain,
    distributedProducts: rawProducts,
    transcript
  });
}
