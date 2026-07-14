import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpExternalAnimationPortLossDiagnostics,
  createKpExternalAnimationPort,
  runKpExternalAnimationPort,
  summarizeKpExternalAnimationPortDiagnostics
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
  assert.deepEqual(result.diagnosticSummary, {
    total: 0,
    bySeverity: {
      info: 0,
      warning: 0,
      error: 0
    },
    byLossKind: {},
    codes: [],
    hasErrors: false,
    hasLoss: false,
    preservation: "strict"
  });
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
      lossKind: "unsupported",
      message:
        "Animation animation.linear-solve.solve-x failed validation: Layout layout.linear-solve.animation references missing render target render.linear-solve.equation.",
      path: "layout.targetId"
    },
    {
      severity: "error",
      code: "animation-validation",
      lossKind: "unsupported",
      message:
        "Animation animation.linear-solve.solve-x failed validation: Render target render.bad references missing object object.missing.",
      path: "renderTargets[0].objectIds[0]"
    },
    {
      severity: "error",
      code: "animation-validation",
      lossKind: "unsupported",
      message:
        "Animation animation.linear-solve.solve-x failed validation: Render target render.bad references missing transformation transform.missing.",
      path: "renderTargets[0].transformationIds[0]"
    }
  ]);
  assert.deepEqual(result.diagnosticSummary, {
    total: 4,
    bySeverity: {
      info: 0,
      warning: 1,
      error: 3
    },
    byLossKind: {
      opaque: 1,
      unsupported: 3
    },
    codes: ["external-step-opaque", "animation-validation"],
    hasErrors: true,
    hasLoss: true,
    preservation: "lossy"
  });
  assert.deepEqual(
    summarizeKpExternalAnimationPortDiagnostics(result),
    result.diagnosticSummary
  );
  assert.deepEqual(checkKpExternalAnimationPortLossDiagnostics(result), {
    lawId: "animation-port.loss-reporting",
    passed: true,
    failures: []
  });
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

test("checkKpExternalAnimationPortLossDiagnostics reports silent or unnamed losses", () => {
  const silent = runKpExternalAnimationPort(
    createKpExternalAnimationPort<ExternalTrace>({
      id: "port.animation.fixture.silent",
      title: "Silent lossy animation fixture port",
      sourceSystem: "fixture.cas",
      version: "0.1.0",
      preservation: "lax",
      importAnimation: () => ({
        preservation: "lax",
        animation: createLinearSolveAnimationAsset()
      })
    }),
    { id: "trace.silent" }
  );
  const unnamed = runKpExternalAnimationPort(
    createKpExternalAnimationPort<ExternalTrace>({
      id: "port.animation.fixture.unnamed",
      title: "Unnamed lossy animation fixture port",
      sourceSystem: "fixture.cas",
      version: "0.1.0",
      preservation: "lossy",
      importAnimation: () => ({
        preservation: "lossy",
        animation: createLinearSolveAnimationAsset(),
        diagnostics: [
          {
            severity: "warning",
            code: "external-step-opaque",
            message: "The external trace did not include a source rule."
          }
        ]
      })
    }),
    { id: "trace.unnamed" }
  );
  const strictLoss = runKpExternalAnimationPort(
    createKpExternalAnimationPort<ExternalTrace>({
      id: "port.animation.fixture.strict-loss",
      title: "Strict lossy animation fixture port",
      sourceSystem: "fixture.cas",
      version: "0.1.0",
      preservation: "strict",
      importAnimation: () => ({
        animation: createLinearSolveAnimationAsset(),
        diagnostics: [
          {
            severity: "warning",
            code: "external-step-opaque",
            lossKind: "opaque",
            message: "The external trace did not include a source rule."
          }
        ]
      })
    }),
    { id: "trace.strict-loss" }
  );

  assert.deepEqual(checkKpExternalAnimationPortLossDiagnostics(silent), {
    lawId: "animation-port.loss-reporting",
    passed: false,
    failures: [
      {
        path: "diagnostics",
        message:
          "Animation port port.animation.fixture.silent must report diagnostics when preservation is lax."
      }
    ]
  });
  assert.deepEqual(checkKpExternalAnimationPortLossDiagnostics(unnamed), {
    lawId: "animation-port.loss-reporting",
    passed: false,
    failures: [
      {
        path: "diagnostics[0].lossKind",
        message:
          "Animation port port.animation.fixture.unnamed diagnostic external-step-opaque must name the loss kind."
      }
    ]
  });
  assert.deepEqual(checkKpExternalAnimationPortLossDiagnostics(strictLoss), {
    lawId: "animation-port.loss-reporting",
    passed: false,
    failures: [
      {
        path: "diagnostics",
        message:
          "Animation port port.animation.fixture.strict-loss cannot claim strict preservation while reporting loss diagnostics."
      }
    ]
  });
});
