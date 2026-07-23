import assert from "node:assert/strict";
import test from "node:test";

import { validateKpAssetBundle } from "../src/semantic/asset.ts";
import { validateKpSemanticTransformation } from "../src/semantic/asset-transformation.ts";
import {
  validateCorrespondenceMap
} from "../src/semantic/correspondence.ts";
import { kpDistributionAreaExemplarContract } from "../src/semantic/distribution-area-exemplar-contract.ts";
import {
  createKpDistributionAreaExemplarSemanticTrace
} from "../src/semantic/distribution-area-exemplar-trace.ts";
import { createKpDistributionAreaSelectorAnnotatedLatex } from "../src/rendering/distribution-area-selector-annotated-latex.ts";

test("area trace keeps distribution and constant evaluation as distinct reversible steps", () => {
  const trace = createKpDistributionAreaExemplarSemanticTrace();
  const latexById = new Map(
    trace.bundle.objects.map((object) => [
      object.id,
      createKpDistributionAreaSelectorAnnotatedLatex(object).rawLatex
    ])
  );

  assert.deepEqual(
    ["factored", "distributed", "expanded"].map((stateId) =>
      latexById.get(trace.stateObjectIds[stateId as keyof typeof trace.stateObjectIds])
    ),
    ["3(x+2)", "3x+3\\cdot2", "3x+6"]
  );
  assert.deepEqual(
    trace.forward.map(({ sourceStateId, targetStateId }) => [sourceStateId, targetStateId]),
    [["factored", "distributed"], ["distributed", "expanded"]]
  );
  assert.deepEqual(
    trace.reverse.map(({ sourceStateId, targetStateId }) => [sourceStateId, targetStateId]),
    [["expanded", "distributed"], ["distributed", "factored"]]
  );
});

test("area trace stores structured expressions and binds semantic selectors to subtree ids", () => {
  const trace = createKpDistributionAreaExemplarSemanticTrace();
  const factored = trace.bundle.objects.find(({ id }) => id === trace.stateObjectIds.factored)!;
  const value = factored.value as {
    readonly structuredExpression: { readonly root: { readonly id: string } };
  };

  assert.equal(value.structuredExpression.root.id, "distribution.factored.root");
  assert.equal("latex" in (factored.value as object), false);
  assert.equal(
    factored.selectors.find(({ id }) => id.endsWith("factor.3"))?.metadata?.["structuredSubtreeId"],
    "distribution.factored.factor.3"
  );
});

test("area trace reserves canonical authority for distribution and factoring", () => {
  const trace = createKpDistributionAreaExemplarSemanticTrace();

  assert.deepEqual(
    [trace.forward[0], trace.reverse[1]].map((transition) => [
      transition?.operationId,
      transition?.authority
    ]),
    [
      [kpDistributionAreaExemplarContract.algebra.forwardOperationId, "canonical"],
      [kpDistributionAreaExemplarContract.algebra.reverseOperationId, "canonical"]
    ]
  );
  assert.deepEqual(
    [trace.forward[1], trace.reverse[0]].map((transition) => transition?.authority),
    ["exemplar-local", "exemplar-local"]
  );
});

test("area trace has total, valid lifecycle correspondence in both directions", () => {
  const trace = createKpDistributionAreaExemplarSemanticTrace();
  assert.deepEqual(validateKpAssetBundle(trace.bundle), []);

  for (const transition of [...trace.forward, ...trace.reverse]) {
    const transformation = transition.transformation;
    const map = transformation.correspondenceMap!;
    const sourceObject = trace.bundle.objects.find(
      ({ id }) => id === transformation.sourceObjectIds[0]
    )!;
    const targetObject = trace.bundle.objects.find(
      ({ id }) => id === transformation.targetObjectIds[0]
    )!;

    assert.deepEqual(validateKpSemanticTransformation(transformation, trace.bundle), []);
    assert.deepEqual(
      validateCorrespondenceMap(map, {
        sourceSelectorIds: sourceObject.selectors.map(({ id }) => id),
        targetSelectorIds: targetObject.selectors.map(({ id }) => id)
      }),
      [],
      transition.id
    );
  }
});

test("area trace expresses fan-out and fan-in instead of replacement", () => {
  const trace = createKpDistributionAreaExemplarSemanticTrace();

  assert.equal(trace.forward[0]?.transformation.correspondenceMap?.records[0]?.relation, "fan-out");
  assert.equal(trace.forward[1]?.transformation.correspondenceMap?.records[3]?.relation, "fan-in");
  assert.equal(trace.reverse[0]?.transformation.correspondenceMap?.records[3]?.relation, "fan-out");
  assert.equal(trace.reverse[1]?.transformation.correspondenceMap?.records[0]?.relation, "fan-in");
});
