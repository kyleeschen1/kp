import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpLispBoundValuePropagation,
  sampleKpLispBoundValuePropagation
} from "../src/animation/lisp-bound-value-propagation.ts";
import { planKpLispLambdaBindingGeometry } from
  "../src/animation/lisp-lambda-binding-geometry.ts";
import { projectKpLispLambdaSourceMaterial } from
  "../src/animation/lisp-s-expression-material-projection.ts";
import { projectKpLispResponsiveGeometry } from
  "../src/animation/lisp-s-expression-responsive-geometry.ts";
import { createKpLispLambdaApplicationFixture } from
  "../src/semantic/lisp-lambda-application-fixture.ts";

const fixture = createKpLispLambdaApplicationFixture();
const application = projectKpLispLambdaSourceMaterial(fixture).canonicalStates[0]!;
const responsive = projectKpLispResponsiveGeometry(
  fixture.semantic,
  application,
  720,
  "expr.application"
);
const binding = planKpLispLambdaBindingGeometry(fixture.semantic, responsive);
const plan = compileKpLispBoundValuePropagation(fixture, binding);

test("compiles value flow from evaluator truth and certified destinations", () => {
  assert.equal(plan.bindingId, "binding.x");
  assert.deepEqual(plan.value, {
    sourceMaterialId: "occurrence.argument.four",
    nativeCode: "4",
    exactInteger: 4
  });
  assert.equal(plan.parameterMaterialId, "occurrence.x.binder");
  assert.deepEqual(plan.destinations, [{
    destinationId: "destination.body.x",
    referenceMaterialId: "occurrence.x.reference",
    derivedMaterialId: "derived.argument.four",
    order: 0,
    nativeCode: "4",
    originIds: ["occurrence.argument.four", "occurrence.x.reference"],
    interval: { start: 0.58, end: 0.86 }
  }]);
});

test("moves through the arch before contracting at the parameter", () => {
  const entering = sampleKpLispBoundValuePropagation(plan, 0.21);
  const arrived = sampleKpLispBoundValuePropagation(plan, 0.42);
  const contracting = sampleKpLispBoundValuePropagation(plan, 0.5);

  assert.equal(entering.phase, "transfer");
  assert.equal(entering.source.location, "path");
  assert.ok(entering.source.pathProgress > 0 && entering.source.pathProgress < 1);
  assert.ok(entering.wakeOpacity > 0);
  assert.deepEqual(arrived.source, {
    location: "parameter",
    pathProgress: 1,
    scale: 1,
    opacity: 1
  });
  assert.equal(contracting.source.location, "parameter");
  assert.ok(contracting.source.scale < 1 && contracting.source.scale > 0);
  assert.equal(contracting.source.scale, contracting.source.opacity);
});

test("fully consumes the transferred value before destination reappearance", () => {
  const consumed = sampleKpLispBoundValuePropagation(plan, 0.58);
  const emerging = sampleKpLispBoundValuePropagation(plan, 0.72);
  const settled = sampleKpLispBoundValuePropagation(plan, 1);

  assert.deepEqual(consumed.source, {
    location: "consumed",
    pathProgress: 1,
    scale: 0,
    opacity: 0
  });
  assert.equal(consumed.destinations[0]?.valueOpacity, 0);
  assert.ok(emerging.destinations[0]!.valueOpacity > 0);
  assert.ok(emerging.destinations[0]!.referenceOpacity < 1);
  assert.deepEqual(settled.destinations[0], {
    destinationId: "destination.body.x",
    referenceMaterialId: "occurrence.x.reference",
    derivedMaterialId: "derived.argument.four",
    nativeCode: "4",
    valueOpacity: 1,
    valueScale: 1,
    referenceOpacity: 0
  });
});

test("keeps parameter and occurrence emphasis causally separate", () => {
  assert.equal(
    sampleKpLispBoundValuePropagation(plan, 0.3).parameterBoxActive,
    true
  );
  assert.equal(
    sampleKpLispBoundValuePropagation(plan, 0.3).occurrenceBoxesActive,
    false
  );
  assert.equal(
    sampleKpLispBoundValuePropagation(plan, 0.7).parameterBoxActive,
    false
  );
  assert.equal(
    sampleKpLispBoundValuePropagation(plan, 0.7).occurrenceBoxesActive,
    true
  );
});

test("is deterministic under direct seek and rewind order", () => {
  const forward = Array.from({ length: 101 }, (_, index) =>
    sampleKpLispBoundValuePropagation(plan, index / 100));
  const reverse = Array.from({ length: 101 }, (_, index) =>
    sampleKpLispBoundValuePropagation(plan, (100 - index) / 100));

  assert.deepEqual(reverse, [...forward].reverse());
  assert.equal(Object.isFrozen(plan.destinations), true);
  assert.equal(Object.isFrozen(forward[0]?.destinations), true);
});

test("rejects geometry that is disconnected from the certified binding", () => {
  assert.throws(
    () => compileKpLispBoundValuePropagation(fixture, {
      ...binding,
      argumentMaterialId: "occurrence.body.one"
    }),
    /propagation route is inconsistent/
  );
});
