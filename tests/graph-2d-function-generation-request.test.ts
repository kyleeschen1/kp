import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { validateKpAnimationGenerationCapabilityPins } from
  "../src/architecture/animation-generation-request-capability.ts";
import {
  KP_GRAPH_2D_FUNCTION_FRONTEND_ID,
  KP_GRAPH_2D_FUNCTION_TRANSFORMATION_CAPABILITY,
  kpGraph2DQuadraticTranslationRequest,
  validateKpGraph2DFunctionGenerationRequest
} from "../src/domain-ir/graph-2d-function-generation-request.ts";
import { validateKpAnimationGenerationRequest } from
  "../src/domain-ir/animation-generation-request.ts";

test("the exact quadratic translation request is immutable", () => {
  const input = clone(kpGraph2DQuadraticTranslationRequest);
  const result = validateKpGraph2DFunctionGenerationRequest(input);

  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  assert.equal(Object.isFrozen(result.request), true);
  assert.equal(Object.isFrozen(result.request.function), true);
  assert.equal(Object.isFrozen(result.request.preserve), true);
  assert.equal(Object.isFrozen(input), false);
  assert.deepEqual(result.request, kpGraph2DQuadraticTranslationRequest);
  assert.equal("equation" in result.request.function, false);

  const reordered = {
    requestId: input.requestId,
    preserve: input.preserve,
    operation: input.operation,
    function: input.function,
    kind: input.kind,
    schemaVersion: input.schemaVersion
  };
  assert.equal(
    validateKpGraph2DFunctionGenerationRequest(reordered).status,
    "accepted"
  );
});

test("the request composes opaquely with exact frontend and capability pins", () => {
  const envelope = validateKpAnimationGenerationRequest(outerRequest());

  assert.equal(envelope.status, "accepted");
  if (envelope.status !== "accepted") return;
  assert.deepEqual(
    validateKpAnimationGenerationCapabilityPins(envelope.request),
    []
  );
  assert.deepEqual(
    envelope.request.source.input,
    kpGraph2DQuadraticTranslationRequest
  );
});

test("formula text and equation-frontend routing fail closed", () => {
  const formula = clone(kpGraph2DQuadraticTranslationRequest) as
    Record<string, any>;
  formula["function"]["formula"] = "y = (x - 2)^2";
  const local = validateKpGraph2DFunctionGenerationRequest(formula);
  assert.equal(local.status, "repair-required");
  if (local.status !== "repair-required") return;
  assert.deepEqual(local.diagnostics.slice(0, 2).map(({ code }) => code), [
    "graph-2d-function.request.formula-forbidden",
    "graph-2d-function.request.field-unknown"
  ]);

  const equationRoute = outerRequest() as Record<string, any>;
  equationRoute["source"]["kind"] = "equation.native-latex-series";
  equationRoute["source"]["frontendId"] =
    "frontend.equation.native-latex.v1";
  const outer = validateKpAnimationGenerationRequest(equationRoute);
  assert.equal(outer.status, "repair-required");
  if (outer.status !== "repair-required") return;
  assert.deepEqual(outer.diagnostics.map(({ code }) => code), [
    "animation-generation.source.domain-mismatch"
  ]);
});

test("other quadratic shifts and transformation topologies remain typed gaps", () => {
  const shifted = clone(kpGraph2DQuadraticTranslationRequest) as
    Record<string, any>;
  shifted["function"]["targetParameters"]["horizontalShift"] = 3;
  shifted["operation"]["displacement"] = 3;
  const shiftedResult = validateKpGraph2DFunctionGenerationRequest(shifted);
  assert.equal(shiftedResult.status, "repair-required");
  if (shiftedResult.status !== "repair-required") return;
  assert.deepEqual(shiftedResult.diagnostics.map(({ code }) => code), [
    "graph-2d-function.request.exemplar-unsupported"
  ]);

  const reflected = clone(kpGraph2DQuadraticTranslationRequest) as
    Record<string, any>;
  reflected["operation"]["kind"] = "reflection";
  const reflectedResult = validateKpGraph2DFunctionGenerationRequest(reflected);
  assert.equal(reflectedResult.status, "repair-required");
  if (reflectedResult.status !== "repair-required") return;
  assert.deepEqual(reflectedResult.diagnostics.map(({ code }) => code), [
    "graph-2d-function.request.exemplar-unsupported"
  ]);
});

test("presentation and sampling fields cannot enter semantic authority", () => {
  const presented = clone(kpGraph2DQuadraticTranslationRequest) as
    Record<string, any>;
  presented["renderer"] = "svg";
  presented["function"]["sampleCount"] = 101;
  const result = validateKpGraph2DFunctionGenerationRequest(presented);

  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.deepEqual(result.diagnostics.map(({ code, path }) => ({ code, path })), [
    {
      code: "graph-2d-function.request.presentation-forbidden",
      path: "$.function.sampleCount"
    }, {
      code: "graph-2d-function.request.field-unknown",
      path: "$.function.sampleCount"
    }, {
      code: "graph-2d-function.request.presentation-forbidden",
      path: "$.renderer"
    }, {
      code: "graph-2d-function.request.field-unknown",
      path: "$.renderer"
    }
  ]);
});

test("the boundary imports no equation grammar semantic model or renderer", () => {
  const source = readFileSync(new URL(
    "../src/domain-ir/graph-2d-function-generation-request.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source, /^import\s/mu);
  assert.doesNotMatch(source,
    /from ["'][^"']*(?:math|equation|semantic|rendering|editor|scripts)\//u);
  assert.doesNotMatch(source,
    /(?:SVGElement|WebGL|HTMLElement|KaTeX|MathExpression)/u);
});

function outerRequest(): Record<string, unknown> {
  return {
    schemaVersion: "kp.animation-generation-request.v1",
    kind: "animation-generation-request",
    requestId: "request.graph-2d.quadratic-translation.gallery.v1",
    domain: "graph-2d",
    source: {
      kind: "graph-2d.function-parameters",
      frontendId: KP_GRAPH_2D_FUNCTION_FRONTEND_ID,
      input: kpGraph2DQuadraticTranslationRequest
    },
    intent: {
      kind: "graph-2d.translate-function-horizontally",
      summary: "Translate y = x^2 right by two units.",
      parameters: {
        operationId: "operation.graph-2d.translate-horizontal.v1"
      }
    },
    expectedOutputs: [
      "semantic-plan",
      "animation-artifact",
      "typed-diagnostics",
      "coverage-evidence"
    ],
    capabilityPins: [KP_GRAPH_2D_FUNCTION_TRANSFORMATION_CAPABILITY]
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
