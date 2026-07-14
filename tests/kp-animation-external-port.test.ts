import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpExternalAnimationPort,
  runKpExternalAnimationPort
} from "../src/animation/external-port.ts";
import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";

interface ExternalTrace {
  readonly id: string;
}

test("runKpExternalAnimationPort wraps deterministic imports as AnimationAssets", () => {
  const port = createKpExternalAnimationPort<ExternalTrace>({
    id: "port.animation.fixture.linear-solve",
    title: "Linear solve animation fixture port",
    sourceSystem: "fixture.cas",
    version: "0.1.0",
    preservation: "strict",
    importAnimation: () => ({
      animation: createLinearSolveAnimationAsset()
    })
  });
  const result = runKpExternalAnimationPort(port, { id: "trace.solve-x" });

  assert.equal(result.portId, "port.animation.fixture.linear-solve");
  assert.equal(result.sourceSystem, "fixture.cas");
  assert.equal(result.preservation, "strict");
  assert.equal(result.animation.id, "animation.linear-solve.solve-x");
  assert.deepEqual(result.diagnostics, []);
});

test("runKpExternalAnimationPort preserves import diagnostics and appends validation diagnostics", () => {
  const port = createKpExternalAnimationPort<ExternalTrace>({
    id: "port.animation.fixture.lossy",
    title: "Lossy animation fixture port",
    sourceSystem: "fixture.cas",
    version: "0.1.0",
    preservation: "lax",
    importAnimation: () => {
      const animation = createLinearSolveAnimationAsset();

      return {
        preservation: "lossy",
        animation: {
          ...animation,
          renderTargets: [
            {
              id: "render.bad",
              kind: "equation",
              objectIds: ["object.missing"],
              transformationIds: ["transform.missing"]
            }
          ]
        },
        diagnostics: [
          {
            severity: "warning",
            code: "external-step-opaque",
            lossKind: "opaque",
            message: "The external trace did not include a source rule.",
            path: "steps[1]"
          }
        ]
      };
    }
  });
  const result = runKpExternalAnimationPort(port, { id: "trace.lossy" });

  assert.equal(result.preservation, "lossy");
  assert.deepEqual(result.diagnostics, [
    {
      severity: "warning",
      code: "external-step-opaque",
      lossKind: "opaque",
      message: "The external trace did not include a source rule.",
      path: "steps[1]"
    },
    {
      severity: "error",
      code: "animation-validation",
      message:
        "Animation animation.linear-solve.solve-x failed validation: Layout layout.linear-solve.animation references missing render target render.linear-solve.equation.",
      path: "layout.targetId"
    },
    {
      severity: "error",
      code: "animation-validation",
      message:
        "Animation animation.linear-solve.solve-x failed validation: Render target render.bad references missing object object.missing.",
      path: "renderTargets[0].objectIds[0]"
    },
    {
      severity: "error",
      code: "animation-validation",
      message:
        "Animation animation.linear-solve.solve-x failed validation: Render target render.bad references missing transformation transform.missing.",
      path: "renderTargets[0].transformationIds[0]"
    }
  ]);
});

test("createKpExternalAnimationPort rejects empty metadata", () => {
  assert.throws(
    () =>
      createKpExternalAnimationPort({
        id: "port.bad",
        title: "Bad",
        sourceSystem: "",
        version: "0.1.0",
        preservation: "strict",
        importAnimation: () => ({ animation: createLinearSolveAnimationAsset() })
      }),
    /sourceSystem must not be empty/
  );
});
