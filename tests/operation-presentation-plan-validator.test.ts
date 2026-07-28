import assert from "node:assert/strict";
import test from "node:test";

import type {
  KpInverseCancellationPresentationPlanDraft
} from "../src/animation/operation-presentation-plan-types.ts";
import {
  validateAndMintKpOperationPresentationPlan
} from "../src/animation/operation-presentation-plan-validator.ts";
import {
  createKpOperationPresentationBundle,
  createKpOperationPresentationGroup,
  createKpOperationPresentationRoles
} from "../src/animation/operation-presentation-roles.ts";

function cancellationDraft(input?: {
  readonly leftSelectorIds?: readonly string[];
  readonly rightSelectorIds?: readonly string[];
}): KpInverseCancellationPresentationPlanDraft {
  const left = createKpOperationPresentationBundle({
    id: "bundle.inverse.left",
    role: "source-material",
    semanticEntityIds: input?.leftSelectorIds ?? ["selector.plus", "selector.four"]
  });
  const right = createKpOperationPresentationBundle({
    id: "bundle.inverse.right",
    role: "source-material",
    semanticEntityIds:
      input?.rightSelectorIds ?? ["selector.minus", "selector.negative-four"]
  });
  const continuant = createKpOperationPresentationBundle({
    id: "bundle.continuant",
    role: "continuant",
    semanticEntityIds: ["selector.x"]
  });
  return {
    schemaVersion: "kp.verified-operation-presentation-plan.v1",
    id: "plan.additive-cancellation",
    transformationId: "transform.additive-cancellation",
    planKind: "inverse-cancellation",
    roles: createKpOperationPresentationRoles({
      bundles: [left, right, continuant],
      groups: [
        createKpOperationPresentationGroup({
          id: "group.inverse.contact",
          groupKind: "contact",
          bundleIds: [left.id, right.id]
        })
      ]
    }),
    contactGroupId: "group.inverse.contact",
    inverseBundleIds: [left.id, right.id]
  };
}

test("trusted validator mints an immutable total selector-role plan", () => {
  const result = validateAndMintKpOperationPresentationPlan({
    draft: cancellationDraft(),
    expectedSelectorIds: [
      "selector.plus",
      "selector.four",
      "selector.minus",
      "selector.negative-four",
      "selector.x"
    ]
  });

  assert.equal(result.status, "verified");
  if (result.status !== "verified") return;
  assert.equal(result.plan.planKind, "inverse-cancellation");
  assert.equal(Object.isFrozen(result.plan), true);
  assert.equal(Object.isFrozen(result.plan.roles), true);
  assert.equal(Object.isFrozen(result.plan.roles.bundles), true);
});

test("validator rejects missing and duplicated selector inventory", () => {
  const missing = validateAndMintKpOperationPresentationPlan({
    draft: cancellationDraft(),
    expectedSelectorIds: [
      "selector.plus",
      "selector.four",
      "selector.minus",
      "selector.negative-four",
      "selector.x",
      "selector.unassigned"
    ]
  });
  assert.equal(missing.status, "invalid");
  if (missing.status === "invalid") {
    assert.ok(missing.issues.some(({ code, selectorId }) =>
      code === "selector.missing-role" &&
      selectorId === "selector.unassigned"
    ));
  }

  const duplicate = validateAndMintKpOperationPresentationPlan({
    draft: cancellationDraft(),
    expectedSelectorIds: ["selector.plus", "selector.plus"]
  });
  assert.equal(duplicate.status, "invalid");
  if (duplicate.status === "invalid") {
    assert.ok(duplicate.issues.some(({ code }) =>
      code === "selector.invalid-inventory"
    ));
  }
});

test("validator rejects foreign and ambiguously assigned selectors", () => {
  const result = validateAndMintKpOperationPresentationPlan({
    draft: cancellationDraft({
      leftSelectorIds: ["selector.shared", "selector.foreign"],
      rightSelectorIds: ["selector.shared"]
    }),
    expectedSelectorIds: ["selector.shared", "selector.x"]
  });

  assert.equal(result.status, "invalid");
  if (result.status !== "invalid") return;
  assert.ok(result.issues.some(({ code, selectorId }) =>
    code === "selector.foreign" && selectorId === "selector.foreign"
  ));
  assert.ok(result.issues.some(({ code, selectorId }) =>
    code === "selector.ambiguous-role" && selectorId === "selector.shared"
  ));
});

test("validator rejects foreign bundles and wrong group kinds", () => {
  const draft = cancellationDraft();
  const result = validateAndMintKpOperationPresentationPlan({
    draft: {
      ...draft,
      roles: createKpOperationPresentationRoles({
        bundles: draft.roles.bundles,
        groups: [
          createKpOperationPresentationGroup({
            id: "group.inverse.contact",
            groupKind: "fusion",
            bundleIds: [
              "bundle.inverse.left",
              "bundle.missing"
            ]
          })
        ]
      })
    },
    expectedSelectorIds: [
      "selector.plus",
      "selector.four",
      "selector.minus",
      "selector.negative-four",
      "selector.x"
    ]
  });

  assert.equal(result.status, "invalid");
  if (result.status !== "invalid") return;
  assert.ok(result.issues.some(({ code }) => code === "group.foreign-bundle"));
  assert.ok(result.issues.some(({ code }) => code === "plan.group-kind"));
});
