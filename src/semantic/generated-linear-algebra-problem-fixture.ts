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
  | "generated.linear-algebra.matrix-vector"
  | "generated.linear-algebra.dot-product"
  | "generated.linear-algebra.matrix-matrix";

export interface GeneratedMatrixVectorProblemFixtureSpec {
  readonly familyId: "generated.linear-algebra.matrix-vector";
  readonly id: string;
  readonly title: string;
  readonly matrixRows: readonly (readonly number[])[];
  readonly vector: readonly number[];
}

export interface GeneratedDotProductProblemFixtureSpec {
  readonly familyId: "generated.linear-algebra.dot-product";
  readonly id: string;
  readonly title: string;
  readonly leftVector: readonly number[];
  readonly rightVector: readonly number[];
}

export interface GeneratedMatrixMatrixProblemFixtureSpec {
  readonly familyId: "generated.linear-algebra.matrix-matrix";
  readonly id: string;
  readonly title: string;
  readonly leftRows: readonly (readonly number[])[];
  readonly rightRows: readonly (readonly number[])[];
}

export type GeneratedLinearAlgebraProblemFixtureSpec =
  | GeneratedMatrixVectorProblemFixtureSpec
  | GeneratedDotProductProblemFixtureSpec
  | GeneratedMatrixMatrixProblemFixtureSpec;

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
    },
    {
      familyId: "generated.linear-algebra.dot-product",
      id: "generated.linear-algebra.dot-product.three-vector",
      title: "Generated dot product",
      leftVector: [1, 2, 3],
      rightVector: [4, 5, 6]
    },
    {
      familyId: "generated.linear-algebra.matrix-matrix",
      id: "generated.linear-algebra.matrix-matrix.two-by-two",
      title: "Generated matrix-matrix product",
      leftRows: [
        [1, 2],
        [3, 4]
      ],
      rightRows: [
        [2, 0],
        [1, 2]
      ]
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

  if (spec.familyId === "generated.linear-algebra.dot-product") {
    return createGeneratedDotProductProblemFixture(spec);
  }

  if (spec.familyId === "generated.linear-algebra.matrix-matrix") {
    return createGeneratedMatrixMatrixProblemFixture(spec);
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
  const sourceSelectors = [
    ...matrixEntrySelectors(ids.initial, input.matrixRows),
    ...matrixBracketSelectors(ids.initial, "matrix"),
    ...vectorSelectors(ids.initial, input.vector, "vector"),
    ...matrixBracketSelectors(ids.initial, "vector")
  ];
  const resultSelectors = [
    ...vectorSelectors(ids.result, result, "result"),
    ...matrixBracketSelectors(ids.result, "result")
  ];
  const bundle = createKpAssetBundle({
    id: ids.asset,
    title: input.title,
    objects: [
      expressionObject(
        ids.initial,
        "Matrix-vector product",
        latex.initial,
        sourceSelectors,
        {
          matrixRows: input.matrixRows,
          vector: input.vector
        }
      ),
      expressionObject(
        ids.result,
        "Computed product vector",
        latex.result,
        resultSelectors,
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
      correspondenceMap: replacementMap(
        ids.transform,
        sourceSelectors.map((selector) => selector.id),
        resultSelectors.map((selector) => selector.id),
        "Matrix and vector entries are consumed by row dot products.",
        "Computed result components enter at their vector positions."
      ),
      correspondence: [],
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

function createGeneratedDotProductProblemFixture(
  input: GeneratedDotProductProblemFixtureSpec
): GeneratedLinearAlgebraProblemFixture {
  assertNonEmpty(input.id, "Generated linear algebra fixture id");
  assertNonEmpty(input.title, `Generated linear algebra fixture ${input.id} title`);
  validateDotProductDimensions(input);

  const ids = generatedDotProductProblemIds(input);
  const result = dotProduct(input.leftVector, input.rightVector);
  const latex = generatedDotProductProblemLatex(input, result);
  const bundle = createKpAssetBundle({
    id: ids.asset,
    title: input.title,
    objects: [
      expressionObject(
        ids.initial,
        "Dot product",
        latex.initial,
        [
          ...vectorSelectors(ids.initial, input.leftVector, "leftVector"),
          ...vectorSelectors(ids.initial, input.rightVector, "rightVector")
        ],
        {
          leftVector: input.leftVector,
          rightVector: input.rightVector
        }
      ),
      expressionObject(
        ids.result,
        "Computed dot product",
        latex.result,
        [selector(ids.result, "result.scalar", "scalar", String(result))],
        {
          result
        }
      )
    ]
  });
  const transformations = [
    createKpSemanticTransformation({
      id: ids.transform,
      definitionId: "definition.generated.linear-algebra.dot-product.compute",
      transformType: "computeDotProduct",
      title: "Compute the vector dot product",
      sourceObjectIds: [ids.initial],
      targetObjectIds: [ids.result],
      preserves: ["value", "structure"],
      correspondence: [
        {
          sourceSelectorId: `${ids.initial}.leftVector.component.0`,
          targetSelectorId: `${ids.result}.result.scalar`,
          preserves: ["value"],
          summary: "Componentwise products sum to the scalar dot product."
        }
      ],
      assumptions: [
        "Both vectors have the same dimension.",
        "The dot product is the sum of componentwise products."
      ],
      lawRefs: [
        {
          id: "law.linear-algebra.dot-product",
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
    familyId: "generated.linear-algebra.dot-product",
    title: input.title,
    bundle,
    transformations,
    diagram,
    trace: createGeneratedDotProductProblemTrace(ids, latex),
    drillDownHooks: [],
    flashcards: createGeneratedDotProductProblemFlashcards(input, ids, result)
  };
}

function createGeneratedMatrixMatrixProblemFixture(
  input: GeneratedMatrixMatrixProblemFixtureSpec
): GeneratedLinearAlgebraProblemFixture {
  assertNonEmpty(input.id, "Generated linear algebra fixture id");
  assertNonEmpty(input.title, `Generated linear algebra fixture ${input.id} title`);
  validateMatrixMatrixDimensions(input);

  const ids = generatedMatrixMatrixProblemIds(input);
  const result = multiplyMatrices(input.leftRows, input.rightRows);
  const latex = generatedMatrixMatrixProblemLatex(input, result);
  const sourceSelectors = [
    ...matrixEntrySelectors(ids.initial, input.leftRows, "left.matrix"),
    ...matrixBracketSelectors(ids.initial, "left.matrix"),
    ...matrixEntrySelectors(ids.initial, input.rightRows, "right.matrix"),
    ...matrixBracketSelectors(ids.initial, "right.matrix")
  ];
  const resultSelectors = [
    ...matrixEntrySelectors(ids.result, result, "result.matrix"),
    ...matrixBracketSelectors(ids.result, "result.matrix")
  ];
  const bundle = createKpAssetBundle({
    id: ids.asset,
    title: input.title,
    objects: [
      expressionObject(
        ids.initial,
        "Matrix-matrix product",
        latex.initial,
        sourceSelectors,
        {
          leftRows: input.leftRows,
          rightRows: input.rightRows
        }
      ),
      expressionObject(
        ids.result,
        "Computed matrix product",
        latex.result,
        resultSelectors,
        {
          result
        }
      )
    ]
  });
  const transformations = [
    createKpSemanticTransformation({
      id: ids.transform,
      definitionId: "definition.generated.linear-algebra.matrix-matrix.multiply",
      transformType: "multiplyMatrices",
      title: "Multiply the matrices",
      sourceObjectIds: [ids.initial],
      targetObjectIds: [ids.result],
      preserves: ["value", "structure"],
      correspondenceMap: replacementMap(
        ids.transform,
        sourceSelectors.map((selector) => selector.id),
        resultSelectors.map((selector) => selector.id),
        "Both input matrices are consumed by row-column dot products.",
        "Computed result entries enter at their matrix positions."
      ),
      correspondence: [],
      assumptions: [
        "The left matrix column count equals the right matrix row count.",
        "Each result entry is a row-column dot product."
      ],
      lawRefs: [
        {
          id: "law.linear-algebra.matrix-matrix-product",
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
    familyId: "generated.linear-algebra.matrix-matrix",
    title: input.title,
    bundle,
    transformations,
    diagram,
    trace: createGeneratedMatrixMatrixProblemTrace(ids, latex),
    drillDownHooks: [],
    flashcards: createGeneratedMatrixMatrixProblemFlashcards(input, ids, result)
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

interface GeneratedDotProductProblemIds {
  readonly asset: string;
  readonly diagram: string;
  readonly trace: string;
  readonly initial: string;
  readonly result: string;
  readonly transform: string;
}

interface GeneratedDotProductProblemLatex {
  readonly initial: string;
  readonly result: string;
}

interface GeneratedMatrixMatrixProblemIds {
  readonly asset: string;
  readonly diagram: string;
  readonly trace: string;
  readonly initial: string;
  readonly result: string;
  readonly transform: string;
}

interface GeneratedMatrixMatrixProblemLatex {
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

function generatedDotProductProblemIds(
  input: GeneratedDotProductProblemFixtureSpec
): GeneratedDotProductProblemIds {
  return {
    asset: `asset.${input.id}`,
    diagram: `diagram.${input.id}.sequence`,
    trace: `trace.${input.id}`,
    initial: `expression.${input.id}.initial`,
    result: `expression.${input.id}.result`,
    transform: `transform.${input.id}.compute-dot-product`
  };
}

function generatedDotProductProblemLatex(
  input: GeneratedDotProductProblemFixtureSpec,
  result: number
): GeneratedDotProductProblemLatex {
  return {
    initial:
      `${vectorLatex(input.leftVector)} \\cdot ${vectorLatex(input.rightVector)}`,
    result: String(result)
  };
}

function generatedMatrixMatrixProblemIds(
  input: GeneratedMatrixMatrixProblemFixtureSpec
): GeneratedMatrixMatrixProblemIds {
  return {
    asset: `asset.${input.id}`,
    diagram: `diagram.${input.id}.sequence`,
    trace: `trace.${input.id}`,
    initial: `expression.${input.id}.initial`,
    result: `expression.${input.id}.result`,
    transform: `transform.${input.id}.multiply-matrices`
  };
}

function generatedMatrixMatrixProblemLatex(
  input: GeneratedMatrixMatrixProblemFixtureSpec,
  result: readonly (readonly number[])[]
): GeneratedMatrixMatrixProblemLatex {
  return {
    initial: `${matrixLatex(input.leftRows)}${matrixLatex(input.rightRows)}`,
    result: matrixLatex(result)
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

function createGeneratedDotProductProblemTrace(
  ids: GeneratedDotProductProblemIds,
  latex: GeneratedDotProductProblemLatex
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
        rule: "computeDotProduct"
      }
    ]
  };
}

function createGeneratedMatrixMatrixProblemTrace(
  ids: GeneratedMatrixMatrixProblemIds,
  latex: GeneratedMatrixMatrixProblemLatex
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
        rule: "multiplyMatrices"
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

function createGeneratedDotProductProblemFlashcards(
  input: GeneratedDotProductProblemFixtureSpec,
  ids: GeneratedDotProductProblemIds,
  result: number
): readonly KpFlashcardSpec[] {
  return [
    createKpFlashcardSpec({
      id: `card.${input.id}.predict-dot-product`,
      kind: "predict-next",
      title: "Predict the dot-product operation",
      assetId: ids.asset,
      prompt: "Which transformation computes the scalar dot product?",
      transformationIds: [ids.transform],
      timeMs: 0,
      answer: {
        kind: "transformation",
        value: ids.transform
      }
    }),
    createKpFlashcardSpec({
      id: `card.${input.id}.cloze-dot-product-result`,
      kind: "cloze",
      title: "Hide the dot-product result",
      assetId: ids.asset,
      prompt: "What scalar does the dot product produce?",
      selectorIds: [`${ids.result}.result.scalar`],
      timeMs: 1200,
      answer: {
        kind: "text",
        value: String(result)
      }
    }),
    createKpFlashcardSpec({
      id: `card.${input.id}.explain-dot-product`,
      kind: "explain-transform",
      title: "Explain the dot product",
      assetId: ids.asset,
      prompt: "How do the paired vector components produce one scalar?",
      objectIds: [ids.initial, ids.result],
      transformationIds: [ids.transform],
      timeMs: 1200,
      answer: {
        kind: "text",
        value:
          "Multiply matching components and add the products to get the scalar dot product."
      }
    })
  ];
}

function createGeneratedMatrixMatrixProblemFlashcards(
  input: GeneratedMatrixMatrixProblemFixtureSpec,
  ids: GeneratedMatrixMatrixProblemIds,
  result: readonly (readonly number[])[]
): readonly KpFlashcardSpec[] {
  return [
    createKpFlashcardSpec({
      id: `card.${input.id}.predict-matrix-matrix-product`,
      kind: "predict-next",
      title: "Predict the matrix-matrix operation",
      assetId: ids.asset,
      prompt: "Which transformation computes the product matrix?",
      transformationIds: [ids.transform],
      timeMs: 0,
      answer: {
        kind: "transformation",
        value: ids.transform
      }
    }),
    createKpFlashcardSpec({
      id: `card.${input.id}.cloze-entry-0-0`,
      kind: "cloze",
      title: "Hide the first product entry",
      assetId: ids.asset,
      prompt: "What is the top-left entry of the product matrix?",
      selectorIds: [`${ids.result}.result.matrix.entry.0.0`],
      timeMs: 1200,
      answer: {
        kind: "text",
        value: String(result[0]?.[0])
      }
    }),
    createKpFlashcardSpec({
      id: `card.${input.id}.explain-row-column-product`,
      kind: "explain-transform",
      title: "Explain a row-column product",
      assetId: ids.asset,
      prompt: "How does a row-column pair determine one matrix entry?",
      objectIds: [ids.initial, ids.result],
      transformationIds: [ids.transform],
      timeMs: 1200,
      answer: {
        kind: "text",
        value:
          "Each product entry is the dot product of one row from the left matrix and one column from the right matrix."
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

function matrixEntrySelectors(
  objectId: string,
  rows: readonly (readonly number[])[],
  prefix = "matrix"
): readonly CreateKpAssetSelectorInput[] {
  return rows.flatMap((row, rowIndex) =>
    row.map((entry, columnIndex) =>
      selector(
        objectId,
        `${prefix}.entry.${rowIndex}.${columnIndex}`,
        "entry",
        String(entry)
      )
    )
  );
}

function matrixBracketSelectors(
  objectId: string,
  prefix: string
): readonly CreateKpAssetSelectorInput[] {
  return [
    selector(objectId, `${prefix}.left-bracket`, "artifact", "["),
    selector(objectId, `${prefix}.right-bracket`, "artifact", "]")
  ];
}

function vectorSelectors(
  objectId: string,
  vector: readonly number[],
  prefix: string
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

function replacementMap(
  transformationId: string,
  sourceSelectorIds: readonly string[],
  targetSelectorIds: readonly string[],
  sourceSummary: string,
  targetSummary: string
) {
  return {
    id: `${transformationId}.correspondence`,
    records: [
      {
        id: "inputs-consumed",
        relation: "removal" as const,
        sourceSelectorIds,
        targetSelectorIds: [],
        summary: sourceSummary
      },
      {
        id: "results-enter",
        relation: "introduction" as const,
        sourceSelectorIds: [],
        targetSelectorIds,
        summary: targetSummary
      }
    ]
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

function dotProduct(
  leftVector: readonly number[],
  rightVector: readonly number[]
): number {
  return leftVector.reduce(
    (sum, component, index) => sum + component * (rightVector[index] ?? 0),
    0
  );
}

function multiplyMatrices(
  leftRows: readonly (readonly number[])[],
  rightRows: readonly (readonly number[])[]
): readonly (readonly number[])[] {
  const rightColumnCount = rightRows[0]?.length ?? 0;

  return leftRows.map((leftRow) =>
    Array.from({ length: rightColumnCount }, (_, columnIndex) =>
      leftRow.reduce(
        (sum, leftEntry, sharedIndex) =>
          sum + leftEntry * (rightRows[sharedIndex]?.[columnIndex] ?? 0),
        0
      )
    )
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

function validateDotProductDimensions(
  input: GeneratedDotProductProblemFixtureSpec
): void {
  if (input.leftVector.length === 0) {
    throw new Error(
      `Generated linear algebra fixture ${input.id} vectors must have at least one component.`
    );
  }

  if (input.leftVector.length !== input.rightVector.length) {
    throw new Error(
      `Generated linear algebra fixture ${input.id} dot-product vectors must have equal dimension.`
    );
  }
}

function validateMatrixMatrixDimensions(
  input: GeneratedMatrixMatrixProblemFixtureSpec
): void {
  validateRectangularMatrix(input.id, "left matrix", input.leftRows);
  validateRectangularMatrix(input.id, "right matrix", input.rightRows);

  const leftColumnCount = input.leftRows[0]?.length ?? 0;
  const rightRowCount = input.rightRows.length;

  if (leftColumnCount !== rightRowCount) {
    throw new Error(
      `Generated linear algebra fixture ${input.id} left matrix columns must match right matrix rows.`
    );
  }
}

function validateRectangularMatrix(
  fixtureId: string,
  label: string,
  rows: readonly (readonly number[])[]
): void {
  if (rows.length === 0) {
    throw new Error(
      `Generated linear algebra fixture ${fixtureId} ${label} must have at least one row.`
    );
  }

  const columnCount = rows[0]?.length ?? 0;

  if (columnCount === 0) {
    throw new Error(
      `Generated linear algebra fixture ${fixtureId} ${label} must have at least one column.`
    );
  }

  if (rows.some((row) => row.length !== columnCount)) {
    throw new Error(
      `Generated linear algebra fixture ${fixtureId} ${label} must be rectangular.`
    );
  }
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
