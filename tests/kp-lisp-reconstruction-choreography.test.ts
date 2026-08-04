import assert from "node:assert/strict";
import test from "node:test";

import { compileKpLispBoundValuePropagation } from
  "../src/animation/lisp-bound-value-propagation.ts";
import { planKpLispLambdaBindingGeometry } from
  "../src/animation/lisp-lambda-binding-geometry.ts";
import {
  compileKpLispReconstructionChoreography,
  sampleKpLispReconstructionChoreography
} from "../src/animation/lisp-reconstruction-choreography.ts";
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
const beads = projectKpLispExpressionBeads(fixture.semantic);
const plan = compileKpLispReconstructionChoreography(
  fixture,
  material,
  beads,
  propagation
);

test("accounts for every source material exactly once with an explicit reason", () => {
  assert.equal(plan.ledger.length, 14);
  assert.equal(new Set(plan.ledger.map(({ sourceMaterialId }) =>
    sourceMaterialId)).size, 14);
  assert.equal(plan.ledger.filter(({ disposition }) =>
    disposition === "reconstructed").length, 6);
  assert.equal(plan.ledger.filter(({ disposition }) =>
    disposition === "provenance-bead").length, 8);
  assert.ok(plan.ledger.every(({ reason, targetMaterialIds, disposition }) =>
    disposition === "reconstructed"
      ? reason === "native-reconstruction" && targetMaterialIds.length > 0
      : reason === "application-shell-consumed" && targetMaterialIds.length === 0));
});

test("folds consumed shells recursively before the provenance hold", () => {
  assert.deepEqual(plan.shellFold.map(({ expressionId }) => expressionId), [
    "expr.parameters",
    "expr.lambda",
    "expr.application"
  ]);
  for (let index = 1; index < plan.shellFold.length; index += 1) {
    assert.ok(plan.shellFold[index]!.contents.start >=
      plan.shellFold[index - 1]!.parentheses.end);
  }
  assert.ok(plan.shellFold.every(({ contents, parentheses }) =>
    contents.start < parentheses.start));
  const leaf = sampleKpLispReconstructionChoreography(plan, 0.08);
  const parent = sampleKpLispReconstructionChoreography(plan, 0.2);
  assert.ok(compression(leaf, "delimiter.expr.parameters.open") > 0);
  assert.equal(compression(leaf, "occurrence.lambda"), 0);
  assert.equal(compression(leaf, "delimiter.expr.application.open"), 0);
  assert.equal(compression(parent, "delimiter.expr.parameters.open"), 1);
  assert.ok(compression(parent, "occurrence.lambda") > 0);
});

test("uses a temporary source-derived bead before native reconstruction", () => {
  assert.equal(plan.provenanceBead.sourceBeadId, "bead.expr.application");
  assert.equal(plan.provenanceBead.temporary, true);
  assert.equal(plan.provenanceBead.exitReason, "native-reconstruction-settled");
  assert.deepEqual(
    new Set(plan.provenanceBead.consumedMaterialIds),
    new Set(plan.ledger.filter(({ disposition }) =>
      disposition === "provenance-bead").map(({ sourceMaterialId }) =>
        sourceMaterialId))
  );
  const hold = sampleKpLispReconstructionChoreography(plan, 0.48);
  assert.equal(hold.phase, "hold-provenance");
  assert.deepEqual(hold.provenanceBead, { opacity: 1, scale: 1 });
  assert.equal(hold.reconstructed.opacity, 0);
});

test("settles as exact ordinary Lisp after every source material exits", () => {
  const endpoint = sampleKpLispReconstructionChoreography(plan, 1);

  assert.equal(endpoint.reconstructed.nativeCode, "(+ 4 1)");
  assert.deepEqual(endpoint.reconstructed, {
    nativeCode: "(+ 4 1)",
    opacity: 1,
    scale: 1,
    recenterProgress: 1
  });
  assert.equal(endpoint.provenanceBead.opacity, 0);
  assert.ok(endpoint.sourceMaterials.every(({ opacity }) => opacity === 0));
});

test("is an exact pure rewind of every sampled reconstruction frame", () => {
  const forward = Array.from({ length: 101 }, (_, index) =>
    sampleKpLispReconstructionChoreography(plan, index / 100));
  const reverse = Array.from({ length: 101 }, (_, index) =>
    sampleKpLispReconstructionChoreography(plan, (100 - index) / 100));

  assert.deepEqual(reverse, [...forward].reverse());
  assert.equal(Object.isFrozen(plan.ledger), true);
  assert.equal(Object.isFrozen(forward[0]?.sourceMaterials), true);
});

test("rejects a reconstructed endpoint with missing certified origins", () => {
  const reconstructed = material.canonicalStates[1]!;
  const broken = {
    ...material,
    canonicalStates: [
      material.canonicalStates[0]!,
      {
        ...reconstructed,
        tokens: reconstructed.tokens.filter(({ id }) => id !== "derived.argument.four")
      },
      material.canonicalStates[2]!
    ]
  };
  assert.throws(
    () => compileKpLispReconstructionChoreography(
      fixture,
      broken,
      beads,
      propagation
    ),
    /missing certified source provenance/
  );
});

function compression(
  frame: ReturnType<typeof sampleKpLispReconstructionChoreography>,
  materialId: string
) {
  return frame.sourceMaterials.find((material) =>
    material.materialId === materialId)!.compression;
}
