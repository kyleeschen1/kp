import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw
} from "../src/animation/asset.ts";
import { createGeneratedProblemAnimationAsset } from
  "../src/animation/generated-problem-import.ts";
import {
  createGeneratedLinearAlgebraProblemFixture,
  getGeneratedLinearAlgebraProblemFixtureSpec
} from "../src/semantic/generated-linear-algebra-problem-fixture.ts";
import { createKpEditorAnimationLibrary } from
  "../src/editor/animation-library.ts";
import { kpEditorAnimationSelectionHref } from
  "../src/editor/animation-selection-route.ts";

const fixtureId = "generated.linear-algebra.matrix-vector.two-by-two";
const animationId = `animation.${fixtureId}`;
const initialId = `expression.${fixtureId}.initial`;
const resultId = `expression.${fixtureId}.result`;
const transformId = `transform.${fixtureId}.multiply-matrix-vector`;

test("rank-6 keeps one exact two-by-two matrix-vector fixture", () => {
  assert.deepEqual(getGeneratedLinearAlgebraProblemFixtureSpec(fixtureId), {
    familyId: "generated.linear-algebra.matrix-vector",
    id: fixtureId,
    title: "Generated matrix-vector product",
    matrixRows: [[2, 1], [0, 3]],
    vector: [4, 5]
  });

  const fixture = createGeneratedLinearAlgebraProblemFixture(fixtureId);
  assert.deepEqual(fixture.bundle.objects.map(({ id }) => id), [
    initialId,
    `${initialId}.intermediate.row-dot-product.0`,
    `${initialId}.intermediate.row-dot-product.1`,
    resultId
  ]);
  assert.deepEqual(fixture.bundle.objects.map(({ value }) => value), [
    {
      latex: String.raw`\begin{bmatrix}2 & 1 \\ 0 & 3\end{bmatrix}\begin{bmatrix}4 \\ 5\end{bmatrix}`,
      matrixRows: [[2, 1], [0, 3]],
      vector: [4, 5]
    },
    {
      latex: String.raw`2 \times 4 + 1 \times 5 = 13`,
      representation: "matrix-vector-row-dot-product",
      semanticIndex: 0,
      rowValues: [2, 1],
      vectorValues: [4, 5],
      products: [8, 5],
      result: 13,
      rowLatex: String.raw`2 \times 4 + 1 \times 5 = 13`
    },
    {
      latex: String.raw`0 \times 4 + 3 \times 5 = 15`,
      representation: "matrix-vector-row-dot-product",
      semanticIndex: 1,
      rowValues: [0, 3],
      vectorValues: [4, 5],
      products: [0, 15],
      result: 15,
      rowLatex: String.raw`0 \times 4 + 3 \times 5 = 15`
    },
    {
      latex: String.raw`\begin{bmatrix}13 \\ 15\end{bmatrix}`,
      result: [13, 15]
    }
  ]);
});

test("rank-6 preserves selector and transformation lineage", () => {
  const fixture = createGeneratedLinearAlgebraProblemFixture(fixtureId);
  const [initial, firstRow, secondRow, result] = fixture.bundle.objects;
  assert.ok(firstRow);
  assert.ok(secondRow);
  assert.deepEqual(initial?.selectors.map(({ id }) => id), [
    `${initialId}.matrix.entry.0.0`,
    `${initialId}.matrix.entry.0.1`,
    `${initialId}.matrix.entry.1.0`,
    `${initialId}.matrix.entry.1.1`,
    `${initialId}.matrix.left-bracket`,
    `${initialId}.matrix.right-bracket`,
    `${initialId}.vector.component.0`,
    `${initialId}.vector.component.1`,
    `${initialId}.vector.left-bracket`,
    `${initialId}.vector.right-bracket`
  ]);
  assert.equal(firstRow?.selectors.at(-1)?.id, `${firstRow.id}.result-component`);
  assert.equal(secondRow?.selectors.at(-1)?.id, `${secondRow.id}.result-component`);
  assert.deepEqual(result?.selectors.map(({ id }) => id), [
    `${resultId}.result.component.0`,
    `${resultId}.result.component.1`,
    `${resultId}.result.left-bracket`,
    `${resultId}.result.right-bracket`
  ]);

  const [transformation] = fixture.transformations;
  assert.ok(transformation);
  assert.equal(transformation.id, transformId);
  assert.equal(
    transformation.definitionId,
    "definition.generated.linear-algebra.matrix-vector.multiply"
  );
  assert.equal(transformation.transformType, "multiplyMatrixVector");
  assert.deepEqual(transformation.sourceObjectIds, [initialId]);
  assert.deepEqual(transformation.targetObjectIds, [resultId]);
  assert.deepEqual(transformation.preserves, ["value", "structure"]);
  assert.deepEqual(transformation.lawRefs, [{
      id: "law.linear-algebra.matrix-vector-product",
      level: "strict"
  }]);
});

test("rank-6 upgrades the canonical catalogue asset in place", () => {
  const fixture = createGeneratedLinearAlgebraProblemFixture(fixtureId);
  const animation = createGeneratedProblemAnimationAsset(fixture);
  assert.equal(animation.id, animationId);
  assert.equal(animation.bundle.id, `asset.${fixtureId}`);
  assert.deepEqual(animation.timeline, {
    id: `timeline.${fixtureId}.shared`,
    durationMs: 2_400,
    beatCount: 50
  });
  assert.deepEqual(animation.renderTargets, [{
    id: `render.${fixtureId}.equation`,
    kind: "equation",
    objectIds: fixture.bundle.objects.map(({ id }) => id),
    transformationIds: [transformId],
    timelineId: `timeline.${fixtureId}.shared`
  }]);
  assert.equal(checkKpAnimationAssetReferenceClosure(animation).passed, true);
  assert.equal(checkKpAnimationAssetSeekRewindLaw(animation).passed, true);

  const descriptor = createKpEditorAnimationLibrary().find(
    ({ sampleId }) => sampleId === "sample.animation.matrix-vector.basic"
  );
  assert.ok(descriptor);
  assert.equal(descriptor.id, "editor-animation.sample.animation.matrix-vector.basic");
  assert.equal(descriptor.animationId, animationId);
  assert.equal(descriptor.familyId, "family.linear-algebra.matrix-vector");
  assert.equal(kpEditorAnimationSelectionHref({
    pathname: "/",
    search: "",
    hash: "",
    descriptorId: descriptor.id
  }), "/?animation=editor-animation.sample.animation.matrix-vector.basic");
});
