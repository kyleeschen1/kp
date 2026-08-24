import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { validateKpAnimationGenerationCapabilityPins } from
  "../src/architecture/animation-generation-request-capability.ts";
import { validateKpAnimationGenerationRequest } from
  "../src/domain-ir/animation-generation-request.ts";
import {
  KP_GRAPH_3D_SCENE_FRONTEND_ID,
  KP_GRAPH_3D_SCENE_TRANSFORMATION_CAPABILITY,
  kpGraph3DSaddleParameterRequest,
  validateKpGraph3DSceneGenerationRequest
} from "../src/domain-ir/graph-3d-scene-generation-request.ts";

test("the exact saddle parameter request is immutable", () => {
  const input = clone(kpGraph3DSaddleParameterRequest);
  const result = validateKpGraph3DSceneGenerationRequest(input);

  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  assert.equal(Object.isFrozen(result.request), true);
  assert.equal(Object.isFrozen(result.request.scene.domain), true);
  assert.equal(Object.isFrozen(result.request.preserve), true);
  assert.equal(Object.isFrozen(input), false);
  assert.deepEqual(result.request, kpGraph3DSaddleParameterRequest);
  assert.equal("equation" in result.request.scene, false);

  const reordered = {
    requestId: input.requestId,
    preserve: input.preserve,
    operation: input.operation,
    scene: input.scene,
    kind: input.kind,
    schemaVersion: input.schemaVersion
  };
  assert.equal(
    validateKpGraph3DSceneGenerationRequest(reordered).status,
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
    kpGraph3DSaddleParameterRequest
  );
});

test("formula text and equation-frontend routing fail closed", () => {
  const formula = clone(kpGraph3DSaddleParameterRequest) as
    Record<string, any>;
  formula["scene"]["formula"] = "z = (x^2 - y^2) / 8";
  const local = validateKpGraph3DSceneGenerationRequest(formula);
  assert.equal(local.status, "repair-required");
  if (local.status !== "repair-required") return;
  assert.deepEqual(local.diagnostics.slice(0, 2).map(({ code }) => code), [
    "graph-3d-scene.request.formula-forbidden",
    "graph-3d-scene.request.field-unknown"
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

test("nearby parameters domains and topologies remain typed gaps", () => {
  const denominator = clone(kpGraph3DSaddleParameterRequest) as
    Record<string, any>;
  denominator["scene"]["targetParameters"]["denominator"] = 12;
  denominator["operation"]["to"] = 12;
  const denominatorResult = validateKpGraph3DSceneGenerationRequest(
    denominator
  );
  assert.equal(denominatorResult.status, "repair-required");
  if (denominatorResult.status !== "repair-required") return;
  assert.deepEqual(denominatorResult.diagnostics.map(({ code }) => code), [
    "graph-3d-scene.request.exemplar-unsupported"
  ]);

  const domain = clone(kpGraph3DSaddleParameterRequest) as
    Record<string, any>;
  domain["scene"]["domain"]["x"] = [-4, 4];
  const domainResult = validateKpGraph3DSceneGenerationRequest(domain);
  assert.equal(domainResult.status, "repair-required");
  if (domainResult.status !== "repair-required") return;
  assert.deepEqual(domainResult.diagnostics.map(({ code }) => code), [
    "graph-3d-scene.request.exemplar-unsupported"
  ]);

  const topology = clone(kpGraph3DSaddleParameterRequest) as
    Record<string, any>;
  topology["operation"]["kind"] = "replace-with-torus";
  const topologyResult = validateKpGraph3DSceneGenerationRequest(topology);
  assert.equal(topologyResult.status, "repair-required");
  if (topologyResult.status !== "repair-required") return;
  assert.deepEqual(topologyResult.diagnostics.map(({ code }) => code), [
    "graph-3d-scene.request.exemplar-unsupported"
  ]);
});

test("camera geometry paint and sampling fields cannot enter semantic authority", () => {
  const presented = clone(kpGraph3DSaddleParameterRequest) as
    Record<string, any>;
  presented["camera"] = { azimuthDegrees: 45 };
  presented["scene"]["sampleCount"] = 41;
  presented["scene"]["material"] = "glossy";
  const result = validateKpGraph3DSceneGenerationRequest(presented);

  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.deepEqual(result.diagnostics.map(({ code, path }) => ({ code, path })), [
    {
      code: "graph-3d-scene.request.presentation-forbidden",
      path: "$.scene.sampleCount"
    }, {
      code: "graph-3d-scene.request.field-unknown",
      path: "$.scene.sampleCount"
    }, {
      code: "graph-3d-scene.request.presentation-forbidden",
      path: "$.scene.material"
    }, {
      code: "graph-3d-scene.request.field-unknown",
      path: "$.scene.material"
    }, {
      code: "graph-3d-scene.request.presentation-forbidden",
      path: "$.camera"
    }, {
      code: "graph-3d-scene.request.field-unknown",
      path: "$.camera"
    }, {
      code: "graph-3d-scene.request.presentation-forbidden",
      path: "$.camera.azimuthDegrees"
    }, {
      code: "graph-3d-scene.request.field-unknown",
      path: "$.camera.azimuthDegrees"
    }
  ]);
});

test("the boundary imports no formula grammar semantic model or renderer", () => {
  const source = readFileSync(new URL(
    "../src/domain-ir/graph-3d-scene-generation-request.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source, /^import\s/mu);
  assert.doesNotMatch(source,
    /from ["'][^"']*(?:math|equation|semantic|rendering|editor|scripts)\//u);
  assert.doesNotMatch(source,
    /(?:SVGElement|WebGLRenderingContext|HTMLElement|KaTeX|MathExpression)/u);
});

function outerRequest(): Record<string, unknown> {
  return {
    schemaVersion: "kp.animation-generation-request.v1",
    kind: "animation-generation-request",
    requestId: "request.graph-3d.saddle-parameter.gallery.v1",
    domain: "graph-3d",
    source: {
      kind: "graph-3d.scene-parameters",
      frontendId: KP_GRAPH_3D_SCENE_FRONTEND_ID,
      input: kpGraph3DSaddleParameterRequest
    },
    intent: {
      kind: "graph-3d.flatten-saddle",
      summary: "Flatten a fixed-camera saddle by increasing its denominator.",
      parameters: {
        operationId: "operation.graph-3d.flatten-saddle-denominator.v1"
      }
    },
    expectedOutputs: [
      "semantic-plan",
      "animation-artifact",
      "typed-diagnostics",
      "coverage-evidence"
    ],
    capabilityPins: [KP_GRAPH_3D_SCENE_TRANSFORMATION_CAPABILITY]
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
