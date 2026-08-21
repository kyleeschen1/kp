import assert from "node:assert/strict";
import test from "node:test";

import { orchestrateKpCodeGeneration } from
  "../scripts/code-generation-orchestrator.ts";
import { sampleKpPythonRefactorMotionFrame } from
  "../src/animation/python-refactor-motion-frame.ts";
import { sampleKpTypeScriptRefactorMotionFrame } from
  "../src/animation/typescript-refactor-motion-frame.ts";
import { createKpPythonFreeShippingAnimationAsset } from
  "../src/semantic/python-free-shipping-animation-asset.ts";
import { kpPythonFreeShippingRefactorContract } from
  "../src/semantic/python-free-shipping-refactor-contract.ts";
import { createKpTypeScriptFreeShippingAnimationAsset } from
  "../src/semantic/typescript-free-shipping-animation-asset.ts";
import { kpTypeScriptFreeShippingRefactorContract } from
  "../src/semantic/typescript-free-shipping-refactor-contract.ts";

const routes = {
  typescript: {
    frontendId: "frontend.code.typescript-compiler.v1",
    capabilityId: "capability.code.typescript-refactoring",
    contract: kpTypeScriptFreeShippingRefactorContract
  },
  python: {
    frontendId: "frontend.code.python-ast.v1",
    capabilityId: "capability.code.python-refactoring",
    contract: kpPythonFreeShippingRefactorContract
  }
} as const;

test("canonical requests reuse existing artifacts and their one timeline", () => {
  const typescript = orchestrateKpCodeGeneration(envelope("typescript"));
  const python = orchestrateKpCodeGeneration(envelope("python"));
  assert.equal(typescript.status, "accepted");
  assert.equal(python.status, "accepted");
  if (typescript.status !== "accepted" || python.status !== "accepted") return;

  const typescriptAsset = createKpTypeScriptFreeShippingAnimationAsset();
  const pythonAsset = createKpPythonFreeShippingAnimationAsset();
  assert.deepEqual(typescript.target, {
    status: "existing-artifact",
    artifactId: typescriptAsset.id,
    timelineId: typescriptAsset.score.timeline.id,
    clockAuthority: "canonical-artifact-timeline",
    paintAuthority: "canonical-artifact-renderer"
  });
  assert.deepEqual(python.target, {
    status: "existing-artifact",
    artifactId: pythonAsset.id,
    timelineId: pythonAsset.score.timeline.id,
    clockAuthority: "canonical-artifact-timeline",
    paintAuthority: "canonical-artifact-renderer"
  });
  assert.equal(typescriptAsset.animation.timeline?.id,
    typescript.target.timelineId);
  assert.equal(pythonAsset.animation.timeline?.id, python.target.timelineId);
});

test("direct seek and rewind remain functions of the canonical clock", () => {
  const points = [0, 0.2, 0.34, 0.5, 0.68, 0.84, 1];
  const typescriptScore = createKpTypeScriptFreeShippingAnimationAsset().score;
  const pythonScore = createKpPythonFreeShippingAnimationAsset().score;
  const forward = points.map((progress) => ({
    typescript: sampleKpTypeScriptRefactorMotionFrame({
      score: typescriptScore,
      progress
    }),
    python: sampleKpPythonRefactorMotionFrame({ score: pythonScore, progress })
  }));
  const rewind = [...points].reverse().map((progress) => ({
    typescript: sampleKpTypeScriptRefactorMotionFrame({
      score: typescriptScore,
      progress
    }),
    python: sampleKpPythonRefactorMotionFrame({ score: pythonScore, progress })
  })).reverse();

  assert.deepEqual(rewind, forward);
});

test("valid variants remain semantic plans instead of counterfeit artifacts", () => {
  for (const language of ["typescript", "python"] as const) {
    const result = orchestrateKpCodeGeneration(envelope(language, {
      replaceThreshold: ["50", "75"]
    }));
    assert.equal(result.status, "accepted");
    if (result.status !== "accepted") continue;
    assert.deepEqual(result.target, {
      status: "semantic-plan-only",
      reason: "generated-semantics-require-governed-artifact-compilation"
    });
  }
});

test("artifact output and routing mismatches return typed repairs", () => {
  const unavailable = orchestrateKpCodeGeneration(envelope("typescript", {
    replaceThreshold: ["50", "75"],
    expectedOutputs: ["semantic-plan", "animation-artifact"]
  }));
  assert.equal(unavailable.status, "repair-required");
  assert.equal(
    unavailable.status === "repair-required" &&
      unavailable.diagnostics[0]?.code,
    "code-generation.artifact-unavailable"
  );

  const mismatch = envelope("python");
  mismatch["source"].frontendId = routes.typescript.frontendId;
  const rejected = orchestrateKpCodeGeneration(mismatch);
  assert.equal(rejected.status, "repair-required");
  assert.equal(
    rejected.status === "repair-required" && rejected.diagnostics[0]?.code,
    "code-generation.orchestration-route-mismatch"
  );
});

test("orchestration is immutable and carries no clock or paint implementation", () => {
  const result = orchestrateKpCodeGeneration(envelope("typescript"));
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.semanticPlan), true);
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /(?:durationMs|playhead|keyframe|coordinates)/u);
});

function envelope(
  language: "typescript" | "python",
  options: Readonly<{
    replaceThreshold?: readonly [string, string];
    expectedOutputs?: readonly string[];
  }> = {}
): Record<string, any> {
  const route = routes[language];
  const replace = (source: string) => options.replaceThreshold === undefined
    ? source
    : source.replaceAll(...options.replaceThreshold);
  return {
    schemaVersion: "kp.animation-generation-request.v1",
    kind: "animation-generation-request",
    requestId: `request.code.${language}.extract-helper.orchestration.v1`,
    domain: "code",
    source: {
      kind: "code.source-revisions",
      frontendId: route.frontendId,
      input: {
        schemaVersion: "kp.code-refactor-generation-request.v1",
        kind: "code-refactor-generation-request",
        requestId: `request.code.${language}.extract-helper.v1`,
        language,
        revisions: [{
          revisionId: route.contract.before.revisionId,
          role: "before",
          path: route.contract.before.path,
          sourceText: replace(route.contract.before.source)
        }, {
          revisionId: route.contract.after.revisionId,
          role: "after",
          path: route.contract.after.path,
          sourceText: replace(route.contract.after.source)
        }],
        intent: {
          kind: "extract-helper",
          preserve: ["behavior", "program-identity"]
        }
      }
    },
    intent: {
      kind: "code.extract-helper",
      summary: "Extract one duplicated predicate into a shared helper.",
      parameters: { operation: "extract-helper" }
    },
    expectedOutputs: options.expectedOutputs ?? [
      "semantic-plan",
      "typed-diagnostics"
    ],
    capabilityPins: [route.capabilityId]
  };
}
