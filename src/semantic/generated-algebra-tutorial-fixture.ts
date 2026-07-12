import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  type CreateKpAssetSelectorInput,
  type KpAssetBundle
} from "./asset.ts";
import {
  createKpSemanticDiagramSequence,
  createKpTransformationDiagramLeaf,
  type KpSemanticDiagramSequence
} from "./asset-diagram.ts";
import {
  createKpFlashcardSpec,
  type KpFlashcardSpec
} from "./asset-flashcard.ts";
import {
  createKpSemanticTransformation,
  type KpSemanticTransformation
} from "./asset-transformation.ts";
import type { AlgebraTraceFixture } from "./algebra-trace-port-fixture.ts";

export interface CreateGeneratedLinearSolveTutorialFixtureInput {
  readonly id: string;
  readonly title: string;
  readonly variable: string;
  readonly addend: number;
  readonly solution: number;
}

export interface GeneratedLinearSolveTutorialFixture {
  readonly id: string;
  readonly title: string;
  readonly bundle: KpAssetBundle;
  readonly transformations: readonly KpSemanticTransformation[];
  readonly diagram: KpSemanticDiagramSequence;
  readonly trace: AlgebraTraceFixture;
  readonly flashcards: readonly KpFlashcardSpec[];
}

export function createGeneratedLinearSolveTutorialFixture(
  input: CreateGeneratedLinearSolveTutorialFixtureInput
): GeneratedLinearSolveTutorialFixture {
  assertNonEmpty(input.id, "Generated algebra fixture id");
  assertNonEmpty(input.title, `Generated algebra fixture ${input.id} title`);
  assertNonEmpty(input.variable, `Generated algebra fixture ${input.id} variable`);
  assertPositiveInteger(input.addend, `Generated algebra fixture ${input.id} addend`);

  const ids = generatedLinearSolveIds(input.id);
  const latex = generatedLinearSolveLatex(input);
  const bundle = createKpAssetBundle({
    id: ids.asset,
    title: input.title,
    objects: [
      equationObject(ids.initial, "Initial equation", latex.initial, [
        selector(ids.initial, "lhs.variable", "term", input.variable),
        selector(ids.initial, "lhs.addend", "term", formatPositiveTerm(input.addend)),
        selector(ids.initial, "equals", "relation", "="),
        selector(ids.initial, "rhs.value", "term", String(latex.rhs))
      ]),
      equationObject(
        ids.afterSubtract,
        "After subtracting the addend",
        latex.afterSubtract,
        [
          selector(ids.afterSubtract, "lhs.variable", "term", input.variable),
          selector(ids.afterSubtract, "lhs.addend", "term", formatPositiveTerm(input.addend)),
          selector(ids.afterSubtract, "lhs.subtract", "term", `-${input.addend}`),
          selector(ids.afterSubtract, "equals", "relation", "="),
          selector(ids.afterSubtract, "rhs.value", "term", String(latex.rhs)),
          selector(ids.afterSubtract, "rhs.subtract", "term", `-${input.addend}`)
        ]
      ),
      equationObject(
        ids.leftSimplified,
        "After cancellation",
        latex.leftSimplified,
        [
          selector(ids.leftSimplified, "lhs.variable", "term", input.variable),
          selector(ids.leftSimplified, "equals", "relation", "="),
          selector(ids.leftSimplified, "rhs.value", "term", String(latex.rhs)),
          selector(ids.leftSimplified, "rhs.subtract", "term", `-${input.addend}`)
        ]
      ),
      equationObject(ids.solved, "Solved equation", latex.solved, [
        selector(ids.solved, "lhs.variable", "term", input.variable),
        selector(ids.solved, "equals", "relation", "="),
        selector(ids.solved, "rhs.solution", "term", String(input.solution))
      ])
    ]
  });
  const transformations = createGeneratedLinearSolveTransformations(ids);
  const diagram = createKpSemanticDiagramSequence({
    id: ids.diagram,
    title: `${input.title} sequence`,
    children: transformations.map(createKpTransformationDiagramLeaf)
  });

  return {
    id: input.id,
    title: input.title,
    bundle,
    transformations,
    diagram,
    trace: createGeneratedLinearSolveTrace(input, ids, latex),
    flashcards: createGeneratedLinearSolveFlashcards(input, ids)
  };
}

function createGeneratedLinearSolveTransformations(
  ids: GeneratedLinearSolveIds
): readonly KpSemanticTransformation[] {
  return [
    createKpSemanticTransformation({
      id: ids.subtract,
      transformType: "subtractBothSides",
      title: "Subtract the addend from both sides",
      sourceObjectIds: [ids.initial],
      targetObjectIds: [ids.afterSubtract],
      preserves: ["value", "structure"],
      assumptions: ["Subtracting equal quantities preserves equality."],
      lawRefs: [{ id: "law.equation.subtract-both-sides", level: "strict" }],
      correspondence: [
        correspondence(ids.initial, "lhs.variable", ids.afterSubtract, "lhs.variable"),
        correspondence(ids.initial, "lhs.addend", ids.afterSubtract, "lhs.addend"),
        correspondence(ids.initial, "equals", ids.afterSubtract, "equals"),
        correspondence(ids.initial, "rhs.value", ids.afterSubtract, "rhs.value")
      ]
    }),
    createKpSemanticTransformation({
      id: ids.cancel,
      transformType: "cancelAdditiveInverses",
      title: "Cancel additive inverses",
      sourceObjectIds: [ids.afterSubtract],
      targetObjectIds: [ids.leftSimplified],
      preserves: ["value"],
      assumptions: ["A term plus its additive inverse simplifies to zero."],
      lawRefs: [{ id: "law.algebra.additive-inverse", level: "strict" }],
      correspondence: [
        correspondence(ids.afterSubtract, "lhs.variable", ids.leftSimplified, "lhs.variable"),
        correspondence(ids.afterSubtract, "equals", ids.leftSimplified, "equals"),
        correspondence(ids.afterSubtract, "rhs.value", ids.leftSimplified, "rhs.value"),
        correspondence(ids.afterSubtract, "rhs.subtract", ids.leftSimplified, "rhs.subtract")
      ]
    }),
    createKpSemanticTransformation({
      id: ids.simplify,
      transformType: "simplifyConstantDifference",
      title: "Simplify the constant difference",
      sourceObjectIds: [ids.leftSimplified],
      targetObjectIds: [ids.solved],
      preserves: ["value"],
      assumptions: ["The right-hand constant difference evaluates to the solution."],
      lawRefs: [{ id: "law.arithmetic.constant-difference", level: "strict" }],
      correspondence: [
        correspondence(ids.leftSimplified, "lhs.variable", ids.solved, "lhs.variable"),
        correspondence(ids.leftSimplified, "equals", ids.solved, "equals")
      ]
    })
  ];
}

function createGeneratedLinearSolveTrace(
  input: CreateGeneratedLinearSolveTutorialFixtureInput,
  ids: GeneratedLinearSolveIds,
  latex: GeneratedLinearSolveLatex
): AlgebraTraceFixture {
  return {
    id: ids.trace,
    title: `${input.title} generated algebra trace`,
    steps: [
      {
        id: `${ids.trace}.initial`,
        latex: latex.initial
      },
      {
        id: `${ids.trace}.after-subtract`,
        latex: latex.afterSubtract,
        transformationId: ids.subtract,
        rule: "subtractBothSides"
      },
      {
        id: `${ids.trace}.left-simplified`,
        latex: latex.leftSimplified,
        transformationId: ids.cancel,
        rule: "cancelAdditiveInverses"
      },
      {
        id: `${ids.trace}.solved`,
        latex: latex.solved,
        transformationId: ids.simplify,
        rule: "simplifyConstantDifference"
      }
    ]
  };
}

function createGeneratedLinearSolveFlashcards(
  input: CreateGeneratedLinearSolveTutorialFixtureInput,
  ids: GeneratedLinearSolveIds
): readonly KpFlashcardSpec[] {
  return [
    createKpFlashcardSpec({
      id: `card.${input.id}.cloze-addend`,
      kind: "cloze",
      title: "Hide the addend",
      assetId: ids.asset,
      prompt: "What term must be removed to isolate the variable?",
      selectorIds: [`${ids.initial}.lhs.addend`],
      answer: {
        kind: "text",
        value: formatPositiveTerm(input.addend)
      }
    }),
    createKpFlashcardSpec({
      id: `card.${input.id}.predict-subtract`,
      kind: "predict-next",
      title: "Predict the first transformation",
      assetId: ids.asset,
      prompt: "Which transformation preserves equality first?",
      transformationIds: [ids.subtract],
      timeMs: 0,
      answer: {
        kind: "transformation",
        value: ids.subtract
      }
    })
  ];
}

interface GeneratedLinearSolveIds {
  readonly asset: string;
  readonly diagram: string;
  readonly trace: string;
  readonly initial: string;
  readonly afterSubtract: string;
  readonly leftSimplified: string;
  readonly solved: string;
  readonly subtract: string;
  readonly cancel: string;
  readonly simplify: string;
}

function generatedLinearSolveIds(id: string): GeneratedLinearSolveIds {
  return {
    asset: `asset.${id}`,
    diagram: `diagram.${id}.sequence`,
    trace: `trace.${id}`,
    initial: `equation.${id}.initial`,
    afterSubtract: `equation.${id}.after-subtract`,
    leftSimplified: `equation.${id}.left-simplified`,
    solved: `equation.${id}.solved`,
    subtract: `transform.${id}.subtract-addend`,
    cancel: `transform.${id}.cancel-additive-inverse`,
    simplify: `transform.${id}.simplify-difference`
  };
}

interface GeneratedLinearSolveLatex {
  readonly rhs: number;
  readonly initial: string;
  readonly afterSubtract: string;
  readonly leftSimplified: string;
  readonly solved: string;
}

function generatedLinearSolveLatex(
  input: CreateGeneratedLinearSolveTutorialFixtureInput
): GeneratedLinearSolveLatex {
  const rhs = input.solution + input.addend;

  return {
    rhs,
    initial: `${input.variable} + ${input.addend} = ${rhs}`,
    afterSubtract: `${input.variable} + ${input.addend} - ${input.addend} = ${rhs} - ${input.addend}`,
    leftSimplified: `${input.variable} = ${rhs} - ${input.addend}`,
    solved: `${input.variable} = ${input.solution}`
  };
}

function equationObject(
  id: string,
  title: string,
  latex: string,
  selectors: readonly CreateKpAssetSelectorInput[]
) {
  return createKpSemanticAssetObject({
    id,
    objectType: "equation",
    title,
    value: { latex },
    selectors
  });
}

function selector(
  objectId: string,
  suffix: string,
  kind: string,
  label: string
): CreateKpAssetSelectorInput {
  return {
    id: `${objectId}.${suffix}`,
    kind,
    label
  };
}

function correspondence(
  sourceObjectId: string,
  sourceSuffix: string,
  targetObjectId: string,
  targetSuffix: string
) {
  return {
    sourceSelectorId: `${sourceObjectId}.${sourceSuffix}`,
    targetSelectorId: `${targetObjectId}.${targetSuffix}`,
    preserves: ["identity" as const]
  };
}

function formatPositiveTerm(value: number): string {
  return `+${value}`;
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
}
