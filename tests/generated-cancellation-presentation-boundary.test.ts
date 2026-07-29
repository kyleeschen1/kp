import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpGeneratedCancellationPresentation,
  kpGeneratedCancellationDraftSchemaVersion
} from "../src/animation/generated-cancellation-presentation-boundary.ts";

test("semantic generated draft receives compiler-derived cancellation roles", () => {
  const result = compileKpGeneratedCancellationPresentation({
    schemaVersion: kpGeneratedCancellationDraftSchemaVersion,
    familyId: "generated.linear-solve",
    id: "generated.linear-solve.external-three-x",
    title: "Generated solve 3x",
    variable: "x",
    coefficient: 3,
    solution: 4
  });

  assert.equal(result.kind, "accepted");
  if (result.kind !== "accepted") return;
  assert.equal(result.fixtureId, "generated.linear-solve.external-three-x");
  assert.equal(result.presentations.length, 1);
  assert.equal(
    result.presentations[0]?.operationId,
    "kp.algebra.cancel-multiplicative-inverses"
  );
  assert.equal(
    result.presentations[0]?.plan.planKind,
    "inverse-cancellation"
  );
  assert.equal(result.presentations[0]?.plan.inverseBundleIds.length, 2);
});

test("two-step generated draft compiles both registered cancellation operations", () => {
  const result = compileKpGeneratedCancellationPresentation({
    schemaVersion: kpGeneratedCancellationDraftSchemaVersion,
    familyId: "generated.linear-solve",
    id: "generated.linear-solve.external-two-step",
    title: "Generated solve 2x plus 3",
    variable: "x",
    coefficient: 2,
    addend: 3,
    solution: 4
  });

  assert.equal(result.kind, "accepted");
  if (result.kind !== "accepted") return;
  assert.deepEqual(
    result.presentations.map(({ operationId }) => operationId),
    [
      "kp.algebra.cancel-additive-inverses",
      "kp.algebra.cancel-multiplicative-inverses"
    ]
  );
});

test("invalid algebra receives typed repair rather than animation fallback", () => {
  assert.deepEqual(compileKpGeneratedCancellationPresentation({
    schemaVersion: kpGeneratedCancellationDraftSchemaVersion,
    familyId: "generated.linear-solve",
    id: "generated.linear-solve.invalid",
    title: "Invalid generated solve",
    variable: "x",
    coefficient: 0,
    solution: 4
  }), {
    kind: "repair",
    issues: [{
      code: "semantic.repair",
      path: "$.coefficient",
      message: "coefficient must be a non-zero integer."
    }]
  });
});

test("generated output cannot author selectors roles DOM geometry timing or paths", () => {
  const result = compileKpGeneratedCancellationPresentation({
    schemaVersion: kpGeneratedCancellationDraftSchemaVersion,
    familyId: "generated.linear-solve",
    id: "generated.linear-solve.unsafe",
    title: "Unsafe generated solve",
    variable: "x",
    addend: 3,
    solution: 4,
    selectorIds: ["source.left", "source.right"],
    presentationRoles: ["inverse-a", "inverse-b"],
    dom: "<span>x</span>",
    geometry: { x: 0, y: 0 },
    durationMs: 20,
    motionPath: "M0 0",
    recipe: "fade"
  });

  assert.deepEqual(result, {
    kind: "rejected",
    issues: [{
      code: "draft.unsupported",
      path: "$",
      message:
        "Generated cancellation drafts cannot author fields: dom, " +
        "durationMs, geometry, motionPath, presentationRoles, recipe, " +
        "selectorIds."
    }]
  });
});
