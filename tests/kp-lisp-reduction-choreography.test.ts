import assert from "node:assert/strict";
import test from "node:test";

import { compileKpLispBoundValuePropagation } from
  "../src/animation/lisp-bound-value-propagation.ts";
import { planKpLispLambdaBindingGeometry } from
  "../src/animation/lisp-lambda-binding-geometry.ts";
import {
  compileKpLispReconstructionChoreography
} from "../src/animation/lisp-reconstruction-choreography.ts";
import {
  compileKpLispReductionChoreography,
  sampleKpLispReductionChoreography
} from "../src/animation/lisp-reduction-choreography.ts";
import { projectKpLispExpressionBeads } from
  "../src/animation/lisp-s-expression-beads.ts";
import { projectKpLispLambdaSourceMaterial } from
  "../src/animation/lisp-s-expression-material-projection.ts";
import { projectKpLispResponsiveGeometry } from
  "../src/animation/lisp-s-expression-responsive-geometry.ts";
import { createKpLispLambdaApplicationFixture } from
  "../src/semantic/lisp-lambda-application-fixture.ts";

const fixture = createKpLispLambdaApplicationFixture();
const material = projectKpLispLambdaSourceMaterial(fixture);
const application = material.canonicalStates[0]!;
const responsive = projectKpLispResponsiveGeometry(
  fixture.semantic,
  application,
  720,
  "expr.application"
);
const binding = planKpLispLambdaBindingGeometry(fixture.semantic, responsive);
const propagation = compileKpLispBoundValuePropagation(fixture, binding);
const reconstruction = compileKpLispReconstructionChoreography(
  fixture,
  material,
  projectKpLispExpressionBeads(fixture.semantic),
  propagation
);
const plan = compileKpLispReductionChoreography(
  fixture,
  material,
  reconstruction
);

test("models reduction as value creation rather than a structural fold", () => {
  assert.equal(plan.operation, "reduce");
  assert.equal(plan.preservesStructure, false);
  assert.equal(plan.sourceNativeCode, "(+ 4 1)");
  assert.equal(plan.resultNativeCode, "5");
  assert.deepEqual(plan.operator, {
    materialId: "derived.plus",
    nativeCode: "+",
    structuralBeadId: "bead.reduction.derived.plus"
  });
  assert.deepEqual(plan.operands.map(({ materialId, nativeCode }) => ({
    materialId,
    nativeCode
  })), [
    { materialId: "derived.argument.four", nativeCode: "4" },
    { materialId: "derived.body.one", nativeCode: "1" }
  ]);
});

test("holds the structural operator before any computation occurs", () => {
  const structure = sampleKpLispReductionChoreography(plan, 0.1);

  assert.equal(structure.phase, "structural-hold");
  assert.equal(structure.operator.beadOpacity, 1);
  assert.equal(structure.operator.causalPulse, 0);
  assert.equal(structure.result.opacity, 0);
  assert.ok(structure.operands.every(({ gatherProgress, opacity, absorbed }) =>
    gatherProgress === 0 && opacity === 1 && absorbed === false));
});

test("gathers and absorbs both inputs before the operator creates a result", () => {
  const gathering = sampleKpLispReductionChoreography(plan, 0.4);
  const operating = sampleKpLispReductionChoreography(plan, 0.64);
  const emitting = sampleKpLispReductionChoreography(plan, 0.81);

  assert.equal(gathering.phase, "gather");
  assert.ok(gathering.operands.every(({ gatherProgress }) =>
    gatherProgress > 0 && gatherProgress < 1));
  assert.equal(operating.phase, "operate");
  assert.ok(operating.operands.every(({ absorbed, opacity }) =>
    absorbed && opacity === 0));
  assert.ok(operating.operator.causalPulse > 0);
  assert.equal(operating.result.opacity, 0);
  assert.equal(emitting.phase, "emit");
  assert.ok(emitting.result.opacity > 0);
  assert.equal(emitting.result.emittedFromOperatorId, "derived.plus");
});

test("settles as ordinary exact result code with complete causal metadata", () => {
  assert.deepEqual(plan.result, {
    materialId: "value.result.five",
    exactInteger: 5,
    nativeCode: "5",
    emittedFromOperatorId: "derived.plus",
    inputOriginIds: ["occurrence.argument.four", "occurrence.body.one"]
  });
  const endpoint = sampleKpLispReductionChoreography(plan, 1);
  assert.equal(endpoint.phase, "settle");
  assert.equal(endpoint.shellOpacity, 0);
  assert.equal(endpoint.operator.beadOpacity, 0);
  assert.ok(endpoint.operands.every(({ opacity, absorbed }) =>
    opacity === 0 && absorbed));
  assert.deepEqual(endpoint.result, {
    materialId: "value.result.five",
    nativeCode: "5",
    opacity: 1,
    scale: 1,
    emittedFromOperatorId: "derived.plus"
  });
});

test("records an explicit disposition for every reconstructed material", () => {
  assert.equal(plan.ledger.length, 5);
  assert.equal(new Set(plan.ledger.map(({ materialId }) => materialId)).size, 5);
  assert.deepEqual(plan.ledger.map(({ disposition }) => disposition), [
    "reduction-shell-consumed",
    "operator-root",
    "input-consumed",
    "input-consumed",
    "reduction-shell-consumed"
  ]);
});

test("samples identically under forward and reverse direct seeks", () => {
  const forward = Array.from({ length: 101 }, (_, index) =>
    sampleKpLispReductionChoreography(plan, index / 100));
  const reverse = Array.from({ length: 101 }, (_, index) =>
    sampleKpLispReductionChoreography(plan, (100 - index) / 100));

  assert.deepEqual(reverse, [...forward].reverse());
  assert.equal(Object.isFrozen(plan), true);
  assert.equal(Object.isFrozen(forward[0]?.operands), true);
});

test("rejects a result missing either certified input origin", () => {
  const result = material.canonicalStates[2]!;
  const broken = {
    ...material,
    canonicalStates: [
      material.canonicalStates[0]!,
      material.canonicalStates[1]!,
      {
        ...result,
        tokens: [{
          ...result.tokens[0]!,
          originIds: ["occurrence.argument.four"]
        }]
      }
    ]
  };
  assert.throws(
    () => compileKpLispReductionChoreography(fixture, broken, reconstruction),
    /missing certified input provenance/
  );
});
