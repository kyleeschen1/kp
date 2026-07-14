import {
  createKpAssetBundle,
  createKpSemanticAssetObject,
  type CreateKpAssetSelectorInput
} from "./asset.ts";
import {
  createKpSemanticDiagramSequence,
  createKpTransformationDiagramLeaf
} from "./asset-diagram.ts";
import { createKpFlashcardSpec, type KpFlashcardSpec } from "./asset-flashcard.ts";
import { createKpSemanticTransformation } from "./asset-transformation.ts";
import type { AlgebraTraceFixture } from "./algebra-trace-port-fixture.ts";
import type { GeneratedProblemAnimationFixture } from "./generated-problem-fixture.ts";

export type GeneratedLinearAlgebraProblemFamilyId =
  "generated.linear-algebra.matrix-vector";

export interface GeneratedMatrixVectorProblemFixtureSpec {
  readonly familyId: "generated.linear-algebra.matrix-vector";
  readonly id: string;
  readonly title: string;
  readonly matrixRows: readonly (readonly number[])[];
  readonly vector: readonly number[];
}

export type GeneratedLinearAlgebraProblemFixtureSpec =
  GeneratedMatrixVectorProblemFixtureSpec;

export interface GeneratedLinearAlgebraProblemFixture
  extends GeneratedProblemAnimationFixture {
  readonly familyId: GeneratedLinearAlgebraProblemFamilyId;
}

export const generatedLinearAlgebraProblemFixtureSpecs:
  readonly GeneratedLinearAlgebraProblemFixtureSpec[] = [
    {
      familyId: "generated.linear-algebra.matrix-vector",
      id: "generated.linear-algebra.matrix-vector.two-by-two",
      title: "Generated matrix-vector product",
      matrixRows: [
        [2, 1],
        [0, 3]
      ],
      vector: [4, 5]
    }
  ];

export function listGeneratedLinearAlgebraProblemFixtureSpecs():
  readonly GeneratedLinearAlgebraProblemFixtureSpec[] {
  return generatedLinearAlgebraProblemFixtureSpecs;
}

export function getGeneratedLinearAlgebraProblemFixtureSpec(
  id: string
): GeneratedLinearAlgebraProblemFixtureSpec | undefined {
  return generatedLinearAlgebraProblemFixtureSpecs.find((spec) => spec.id === id);
}

export function createGeneratedLinearAlgebraProblemFixtures():
  readonly GeneratedLinearAlgebraProblemFixture[] {
  return generatedLinearAlgebraProblemFixtureSpecs.map(
    createGeneratedLinearAlgebraProblemFixture
  );
}

export function createGeneratedLinearAlgebraProblemFixture(
  fixtureOrId: GeneratedLinearAlgebraProblemFixtureSpec | string
): GeneratedLinearAlgebraProblemFixture {
  const spec =
    typeof fixtureOrId === "string"
      ? getGeneratedLinearAlgebraProblemFixtureSpec(fixtureOrId)
      : fixtureOrId;

  if (spec === undefined) {
    throw new Error(`Unknown generated linear algebra fixture: ${fixtureOrId}`);
  }

  return createGeneratedMatrixVectorProblemFixture(spec);
}

function createGeneratedMatrixVectorProblemFixture(
  input: GeneratedMatrixVectorProblemFixtureSpec
): GeneratedLinearAlgebraProblemFixture {
  assertNonEmpty(input.id, "Generated linear algebra fixture id");
  assertNonEmpty(input.title, `Generated linear algebra fixture ${input.id} title`);
  validateMatrixVectorDimensions(input);

  const ids = generatedMatrixVectorProblemIds(input);
  const result = multiplyMatrixVector(input.matrixRows, input.vector);
  const latex = generatedMatrixVectorProblemLatex(input, result);
  const bundle = createKpAssetBundle({
    id: ids.asset,
    title: input.title,
    objects: [
      expressionObject(
        ids.initial,
        "Matrix-vector product",
        latex.initial,
        [
          ...matrixRowSelectors(ids.initial, input.matrixRows),
          ...matrixEntrySelectors(ids.initial, input.matrixRows),
          ...vectorSelectors(ids.initial, input.vector, "vector")
        ],
        {
          matrixRows: input.matrixRows,
          vector: input.vector
        }
      ),
      expressionObject(
        ids.result,
        "Computed product vector",
        latex.result,
        vectorSelectors(ids.result, result, "result"),
        {
          result
        }
      )
    ]
  });
  const transformations = [
    createKpSemanticTransformation({
      id: ids.transform,
      definitionId:
        "definition.generated.linear-algebra.matrix-vector.multiply",
      transformType: "multiplyMatrixVector",
      title: "Multiply the matrix by the vector",
      sourceObjectIds: [ids.initial],
      targetObjectIds: [ids.result],
      preserves: ["value", "structure"],
      correspondence: input.matrixRows.map((_, rowIndex) => ({
        sourceSelectorId: `${ids.initial}.matrix.row.${rowIndex}`,
        targetSelectorId: `${ids.result}.result.component.${rowIndex}`,
        preserves: ["value" as const],
        summary: `Row ${rowIndex + 1} dot product produces result component ${rowIndex + 1}.`
      })),
      assumptions: [
        "The matrix column count equals the vector dimension.",
        "Each result component is the dot product of one matrix row with the vector."
      ],
      lawRefs: [
        {
          id: "law.linear-algebra.matrix-vector-product",
          level: "strict"
        }
      ]
    })
  ];
  const diagram = createKpSemanticDiagramSequence({
    id: ids.diagram,
    title: `${input.title} sequence`,
    children: transformations.map(createKpTransformationDiagramLeaf)
  });

  return {
    id: input.id,
    familyId: "generated.linear-algebra.matrix-vector",
    title: input.title,
    bundle,
    transformations,
    diagram,
    trace: createGeneratedMatrixVectorProblemTrace(ids, latex),
    drillDownHooks: [],
    flashcards: createGeneratedMatrixVectorProblemFlashcards(input, ids, result)
  };
}

interface GeneratedMatrixVectorProblemIds {
  readonly asset: string;
  readonly diagram: string;
  readonly trace: string;
  readonly initial: string;
  readonly result: string;
  readonly transform: string;
}

interface GeneratedMatrixVectorProblemLatex {
  readonly initial: string;
  readonly result: string;
}

function generatedMatrixVectorProblemIds(
  input: GeneratedMatrixVectorProblemFixtureSpec
): GeneratedMatrixVectorProblemIds {
  return {
    asset: `asset.${input.id}`,
    diagram: `diagram.${input.id}.sequence`,
    trace: `trace.${input.id}`,
    initial: `expression.${input.id}.initial`,
    result: `expression.${input.id}.result`,
    transform: `transform.${input.id}.multiply-matrix-vector`
  };
}

function generatedMatrixVectorProblemLatex(
  input: GeneratedMatrixVectorProblemFixtureSpec,
  result: readonly number[]
): GeneratedMatrixVectorProblemLatex {
  return {
    initial: `${matrixLatex(input.matrixRows)}${vectorLatex(input.vector)}`,
    result: vectorLatex(result)
  };
}

function createGeneratedMatrixVectorProblemTrace(
  ids: GeneratedMatrixVectorProblemIds,
  latex: GeneratedMatrixVectorProblemLatex
): AlgebraTraceFixture {
  return {
    id: ids.trace,
    title: `${ids.trace} generated linear algebra trace`,
    steps: [
      {
        id: `${ids.trace}.initial`,
        latex: latex.initial
      },
      {
        id: `${ids.trace}.result`,
        latex: latex.result,
        transformationId: ids.transform,
        rule: "multiplyMatrixVector"
      }
    ]
  };
}

function createGeneratedMatrixVectorProblemFlashcards(
  input: GeneratedMatrixVectorProblemFixtureSpec,
  ids: GeneratedMatrixVectorProblemIds,
  result: readonly number[]
): readonly KpFlashcardSpec[] {
  return [
    createKpFlashcardSpec({
      id: `card.${input.id}.predict-matrix-vector-product`,
      kind: "predict-next",
      title: "Predict the matrix-vector operation",
      assetId: ids.asset,
      prompt: "Which transformation computes the product vector?",
      transformationIds: [ids.transform],
      timeMs: 0,
      answer: {
        kind: "transformation",
        value: ids.transform
      }
    }),
    createKpFlashcardSpec({
      id: `card.${input.id}.cloze-first-component`,
      kind: "cloze",
      title: "Hide the first product component",
      assetId: ids.asset,
      prompt: "What is the first component of the product vector?",
      selectorIds: [`${ids.result}.result.component.0`],
      timeMs: 1200,
      answer: {
        kind: "text",
        value: String(result[0])
      }
    }),
    createKpFlashcardSpec({
      id: `card.${input.id}.explain-row-dot-product`,
      kind: "explain-transform",
      title: "Explain a row dot product",
      assetId: ids.asset,
      prompt: "How does a matrix row determine one output component?",
      objectIds: [ids.initial, ids.result],
      transformationIds: [ids.transform],
      timeMs: 1200,
      answer: {
        kind: "text",
        value:
          "Each output component is the dot product of the matching matrix row with the input vector."
      }
    })
  ];
}

function expressionObject(
  id: string,
  title: string,
  latex: string,
  selectors: readonly CreateKpAssetSelectorInput[],
  value: object
) {
  return createKpSemanticAssetObject({
    id,
    objectType: "expression",
    title,
    value: {
      latex,
      ...value
    },
    selectors
  });
}

function matrixRowSelectors(
  objectId: string,
  rows: readonly (readonly number[])[]
): readonly CreateKpAssetSelectorInput[] {
  return rows.map((row, rowIndex) =>
    selector(
      objectId,
      `matrix.row.${rowIndex}`,
      "row",
      `[${row.join(", ")}]`
    )
  );
}

function matrixEntrySelectors(
  objectId: string,
  rows: readonly (readonly number[])[]
): readonly CreateKpAssetSelectorInput[] {
  return rows.flatMap((row, rowIndex) =>
    row.map((entry, columnIndex) =>
      selector(
        objectId,
        `matrix.entry.${rowIndex}.${columnIndex}`,
        "entry",
        String(entry)
      )
    )
  );
}

function vectorSelectors(
  objectId: string,
  vector: readonly number[],
  prefix: "vector" | "result"
): readonly CreateKpAssetSelectorInput[] {
  return vector.map((component, index) =>
    selector(objectId, `${prefix}.component.${index}`, "component", String(component))
  );
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

function multiplyMatrixVector(
  rows: readonly (readonly number[])[],
  vector: readonly number[]
): readonly number[] {
  return rows.map((row) =>
    row.reduce((sum, entry, index) => sum + entry * (vector[index] ?? 0), 0)
  );
}

function matrixLatex(rows: readonly (readonly number[])[]): string {
  const body = rows.map((row) => row.join(" & ")).join(String.raw` \\ `);

  return String.raw`\begin{bmatrix}${body}\end{bmatrix}`;
}

function vectorLatex(vector: readonly number[]): string {
  const body = vector.join(String.raw` \\ `);

  return String.raw`\begin{bmatrix}${body}\end{bmatrix}`;
}

function validateMatrixVectorDimensions(
  input: GeneratedMatrixVectorProblemFixtureSpec
): void {
  if (input.matrixRows.length === 0) {
    throw new Error(
      `Generated linear algebra fixture ${input.id} matrix must have at least one row.`
    );
  }

  const columnCount = input.matrixRows[0]?.length ?? 0;

  if (columnCount === 0) {
    throw new Error(
      `Generated linear algebra fixture ${input.id} matrix must have at least one column.`
    );
  }

  if (input.matrixRows.some((row) => row.length !== columnCount)) {
    throw new Error(
      `Generated linear algebra fixture ${input.id} matrix must be rectangular.`
    );
  }

  if (input.vector.length !== columnCount) {
    throw new Error(
      `Generated linear algebra fixture ${input.id} vector dimension must match matrix columns.`
    );
  }
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
