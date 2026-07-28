import assert from "node:assert/strict";
import test from "node:test";

import type {
  KpInverseCancellationPresentationPlanDraft
} from "../src/animation/operation-presentation-plan-types.ts";
import {
  runKpOperationPresentationLaws,
  type KpOperationPresentationLawContext
} from "../src/animation/operation-presentation-laws.ts";
import {
  validateAndMintKpOperationPresentationPlan
} from "../src/animation/operation-presentation-plan-validator.ts";
import {
  createKpOperationPresentationBundle,
  createKpOperationPresentationGroup,
  createKpOperationPresentationRoles
} from "../src/animation/operation-presentation-roles.ts";

function createDraft(
  contactBundleIds: readonly [string, string] = [
    "bundle.left",
    "bundle.right"
  ]
): KpInverseCancellationPresentationPlanDraft {
  return {
    schemaVersion: "kp.verified-operation-presentation-plan.v1",
    id: "plan.inverse",
    transformationId: "transform.inverse",
    kind: "inverse-cancellation",
    roles: createKpOperationPresentationRoles({
      bundles: [
        createKpOperationPresentationBundle({
          id: "bundle.left",
          role: "source-material",
          semanticEntityIds: ["source.left"]
        }),
        createKpOperationPresentationBundle({
          id: "bundle.right",
          role: "source-material",
          semanticEntityIds: ["source.right"]
        }),
        createKpOperationPresentationBundle({
          id: "bundle.x",
          role: "continuant",
          semanticEntityIds: ["shared.x"]
        })
      ],
      groups: [
        createKpOperationPresentationGroup({
          id: "group.contact",
          groupKind: "contact",
          bundleIds: contactBundleIds
        })
      ]
    }),
    contactGroupId: "group.contact",
    inverseBundleIds: ["bundle.left", "bundle.right"]
  };
}

const validContext: KpOperationPresentationLawContext = {
  sourceSelectorIds: ["source.left", "source.right", "shared.x"],
  targetSelectorIds: ["shared.x"],
  scheduledGroupIds: ["group.contact"],
  endpointSettlement: "native-source-and-target",
  rewind: "exact-semantic-inverse"
};

function verifiedPlan(
  draft: KpInverseCancellationPresentationPlanDraft = createDraft()
) {
  const result = validateAndMintKpOperationPresentationPlan({
    draft,
    expectedSelectorIds: [
      "source.left",
      "source.right",
      "shared.x"
    ]
  });
  assert.equal(result.status, "verified");
  if (result.status !== "verified") {
    throw new Error("Expected structurally verified presentation plan.");
  }
  return result.plan;
}

test("core presentation laws accept a complete semantic cancellation", () => {
  assert.deepEqual(runKpOperationPresentationLaws({
    plan: verifiedPlan(),
    context: validContext
  }), []);
});

test("lineage and temporal laws diagnose semantic omissions", () => {
  const diagnostics = runKpOperationPresentationLaws({
    plan: verifiedPlan(),
    context: {
      ...validContext,
      targetSelectorIds: ["source.left"],
      scheduledGroupIds: []
    }
  });

  assert.ok(diagnostics.some(({ code }) =>
    code === "lineage.continuant-not-bidirectional"
  ));
  assert.ok(diagnostics.some(({ code }) =>
    code === "temporal-group.unscheduled"
  ));
});

test("contact law binds the exact two inverse bundles", () => {
  const diagnostics = runKpOperationPresentationLaws({
    plan: verifiedPlan(createDraft(["bundle.left", "bundle.x"])),
    context: validContext
  });

  assert.ok(diagnostics.some(({ code }) =>
    code === "contact.inverse-bundles-mismatch"
  ));
});

test("endpoint and rewind laws fail without explicit semantic guarantees", () => {
  const diagnostics = runKpOperationPresentationLaws({
    plan: verifiedPlan(),
    context: {
      ...validContext,
      endpointSettlement: "unspecified",
      rewind: "unsupported"
    }
  });

  assert.ok(diagnostics.some(({ code }) =>
    code === "endpoint.native-settlement-missing"
  ));
  assert.ok(diagnostics.some(({ code }) =>
    code === "rewind.exact-inverse-missing"
  ));
  assert.equal(
    JSON.stringify(diagnostics).match(/(?:pixel|DOM|rect|geometry)/gi),
    null
  );
});
