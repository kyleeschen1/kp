import assert from "node:assert/strict";
import test from "node:test";

import { createKpScalarSystem } from "../src/math/algebra/algebraic-structures.ts";
import { createKpEquality } from "../src/math/algebra/law-evidence.ts";
import { createKpMathAuthoringContext } from "../src/math/authoring/context.ts";

test("authoring contexts derive stable IDs and provenance from semantic paths", () => {
  const first = createKpMathAuthoringContext({ namespace: "lesson.elasticity" });
  const second = createKpMathAuthoringContext({ namespace: "lesson.elasticity" });
  const firstFunction = first.at("functions", "demand");
  const secondFunction = second.at("functions", "demand");

  const firstParameter = firstFunction.ref("parameters", "price");
  secondFunction.ref("output");
  const secondParameter = secondFunction.ref("parameters", "price");

  assert.deepEqual(firstParameter, secondParameter);
  assert.equal(
    firstParameter.id,
    "lesson.elasticity.functions.demand.parameters.price"
  );
  assert.deepEqual(firstParameter.semanticPath, [
    "functions",
    "demand",
    "parameters",
    "price"
  ]);
  assert.deepEqual(firstParameter.provenance, {
    kind: "authored",
    sourceId: firstParameter.id
  });
  assert.equal(Object.isFrozen(firstParameter.semanticPath), true);
  assert.equal(Object.isFrozen(first), true);
});

test("semantic segment encoding prevents dotted and escaped path collisions", () => {
  const context = createKpMathAuthoringContext({ namespace: "lesson.paths" });
  const dottedSegment = context.id("a.b", "c");
  const splitSegments = context.id("a", "b.c");
  const encodedText = context.id("a%2Eb", "c");

  assert.equal(dottedSegment, "lesson.paths.a%2Eb.c");
  assert.equal(splitSegments, "lesson.paths.a.b%2Ec");
  assert.equal(encodedText, "lesson.paths.a%252Eb.c");
  assert.notEqual(dottedSegment, splitSegments);
  assert.notEqual(dottedSegment, encodedText);
});

test("context defaults are visible, immutable, and explicitly overridable", () => {
  const equality = createKpEquality<number>({
    id: "kp.equality.authoring-context.exact",
    mode: "exact",
    equals: Object.is
  });
  const scalars = createKpScalarSystem({
    id: "kp.scalars.authoring-context.exact",
    carrierId: "kp.carrier.authoring-context.exact",
    equality,
    zero: 0,
    one: 1,
    add: (left, right) => left + right,
    multiply: (left, right) => left * right,
    negate: (value) => -value
  });
  const defaults = createKpMathAuthoringContext({ namespace: "lesson.default" });
  const customized = createKpMathAuthoringContext({
    namespace: "lesson.custom",
    defaults: {
      scalars,
      notation: { derivative: "\\mathrm{d}" }
    }
  });

  assert.equal(defaults.defaults.notation.derivative, "D");
  assert.equal(defaults.defaults.notation.jacobian, "J");
  assert.equal(defaults.defaults.scalars, undefined);
  assert.equal(customized.defaults.scalars, scalars);
  assert.deepEqual(customized.defaults.notation, {
    derivative: "\\mathrm{d}",
    jacobian: "J",
    hessian: "H"
  });
  assert.equal(
    customized.at("functions").defaults,
    customized.defaults
  );
  assert.equal(Object.isFrozen(customized.defaults.notation), true);
});

test("authoring contexts reject ambiguous identity inputs", () => {
  assert.throws(
    () => createKpMathAuthoringContext({ namespace: "bad namespace" }),
    /dotted identifier/
  );
  const context = createKpMathAuthoringContext({ namespace: "lesson.valid" });
  assert.throws(
    () => context.id(" "),
    /must be non-empty and trimmed/
  );
});
