import assert from "node:assert/strict";
import { test } from "node:test";

import {
  evaluateKpDependencyDirection,
  kpDependencyDirectionPolicies
} from "../src/architecture/kp-dependency-direction-policy.ts";
import { kpModuleOwnershipZoneIds } from "../src/architecture/kp-module-ownership.ts";

test("every ownership zone has one immutable direction policy", () => {
  assert.deepEqual(Object.keys(kpDependencyDirectionPolicies), [
    ...kpModuleOwnershipZoneIds
  ]);
  for (const zoneId of kpModuleOwnershipZoneIds) {
    const policy = kpDependencyDirectionPolicies[zoneId];
    assert.equal(policy.sourceZone, zoneId);
    assert.equal(new Set(policy.sourceMayDependOn).size, policy.sourceMayDependOn.length);
    assert.ok(
      policy.runtimeMayDependOn.every((target) =>
        policy.sourceMayDependOn.includes(target)
      )
    );
  }
});

test("neutral contracts may flow into renderer-neutral and rendering libraries", () => {
  assert.equal(
    evaluateKpDependencyDirection(
      dependency(
        "src/animation/runtime-sampler.ts",
        "src/rendering/equation-visual-frame.ts",
        "runtime"
      )
    ),
    undefined
  );
  assert.equal(
    evaluateKpDependencyDirection(
      dependency(
        "src/reader/compiler/static-prose-compiler.ts",
        "src/reader/document/public-api.ts",
        "type-only"
      )
    ),
    undefined
  );
});

test("neutral core cannot import experience ownership through runtime or types", () => {
  const runtimeViolation = evaluateKpDependencyDirection(
    dependency(
      "src/semantic/program-trace-asset.ts",
      "src/tutorial/programming-execution-trace.ts",
      "runtime"
    )
  );
  assert.deepEqual(runtimeViolation, {
    ...dependency(
      "src/semantic/program-trace-asset.ts",
      "src/tutorial/programming-execution-trace.ts",
      "runtime"
    ),
    sourceZone: "neutral-core",
    targetZone: "experience",
    violatesSourcePolicy: true,
    violatesRuntimePolicy: true
  });

  const typeViolation = evaluateKpDependencyDirection(
    dependency(
      "src/animation/non-equation-sampled-frame-adapter.ts",
      "src/tutorial/programming-execution-trace.ts",
      "type-only"
    )
  );
  assert.equal(typeViolation?.violatesSourcePolicy, true);
  assert.equal(typeViolation?.violatesRuntimePolicy, false);
});

test("renderers and public APIs cannot reach into product applications", () => {
  assert.equal(
    evaluateKpDependencyDirection(
      dependency(
        "src/rendering/python-refactor-code-html.ts",
        "src/editor/html-output-encoding.ts",
        "runtime"
      )
    )?.targetZone,
    "application"
  );
  assert.equal(
    evaluateKpDependencyDirection(
      dependency(
        "src/public/kp-animation-sdk.ts",
        "src/editor/equation-animation-catalog.ts",
        "type-only"
      )
    )?.sourceZone,
    "public-api"
  );
});

test("application composition and audit-only governance can inspect lower layers", () => {
  assert.equal(
    evaluateKpDependencyDirection(
      dependency(
        "src/editor/animation-player-controller.ts",
        "src/animation/runtime-sampler.ts",
        "runtime"
      )
    ),
    undefined
  );
  assert.equal(
    evaluateKpDependencyDirection(
      dependency(
        "src/architecture/equation-surface-inventory.ts",
        "src/editor/animation-library.ts",
        "runtime"
      )
    ),
    undefined
  );
});

test("non-source assets and external modules are outside ownership direction", () => {
  assert.equal(
    evaluateKpDependencyDirection(
      dependency(
        "src/tutorial/card-runtime.ts",
        "content/lessons/example.kp.md",
        "runtime"
      )
    ),
    undefined
  );
});

function dependency(
  importer: string,
  target: string,
  kind: "runtime" | "type-only"
) {
  return { importer, target, kind, line: 1, column: 1 } as const;
}
