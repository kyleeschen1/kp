import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpOperationPresentationBundle,
  createKpOperationPresentationGroup,
  createKpOperationPresentationRoles
} from "../src/animation/operation-presentation-roles.ts";

test("operation presentation roles stay semantic and renderer-neutral", () => {
  const left = createKpOperationPresentationBundle({
    id: "bundle.inverse.left",
    role: "source-material",
    semanticEntityIds: ["equation.left.plus", "equation.left.four"]
  });
  const right = createKpOperationPresentationBundle({
    id: "bundle.inverse.right",
    role: "source-material",
    semanticEntityIds: ["equation.right.minus", "equation.right.four"]
  });
  const catalyst = createKpOperationPresentationBundle({
    id: "bundle.operator",
    role: "catalyst",
    semanticEntityIds: ["equation.product.operator"]
  });
  const roles = createKpOperationPresentationRoles({
    bundles: [left, right, catalyst],
    groups: [
      createKpOperationPresentationGroup({
        id: "group.inverse.contact",
        groupKind: "contact",
        bundleIds: [left.id, right.id]
      })
    ]
  });

  assert.deepEqual(roles.groups[0]?.bundleIds, [
    "bundle.inverse.left",
    "bundle.inverse.right"
  ]);
  assert.equal(
    JSON.stringify(roles).match(
      /(?:DOM|HTMLElement|pixel|rect|width|height)/gi
    ),
    null
  );
  assert.equal(Object.isFrozen(roles), true);
  assert.equal(Object.isFrozen(roles.bundles[0]?.semanticEntityIds), true);
});

test("contact groups require exactly two distinct bundles", () => {
  assert.throws(() => createKpOperationPresentationGroup({
    id: "group.invalid.contact",
    groupKind: "contact",
    bundleIds: ["bundle.only"]
  }), /exactly two bundles/);
  assert.throws(() => createKpOperationPresentationGroup({
    id: "group.invalid.contact",
    groupKind: "contact",
    bundleIds: ["bundle.same", "bundle.same"]
  }), /unique and non-empty/);
});

test("bundle and role constructors reject empty or repeated semantic identities", () => {
  assert.throws(() => createKpOperationPresentationBundle({
    id: "bundle.empty",
    role: "artifact",
    semanticEntityIds: []
  }), /must not be empty/);
  assert.throws(() => createKpOperationPresentationBundle({
    id: "bundle.duplicate",
    role: "continuant",
    semanticEntityIds: ["entity.x", "entity.x"]
  }), /unique and non-empty/);
  assert.throws(() => createKpOperationPresentationRoles({
    bundles: [
      createKpOperationPresentationBundle({
        id: "bundle.same",
        role: "source-material",
        semanticEntityIds: ["entity.a"]
      }),
      createKpOperationPresentationBundle({
        id: "bundle.same",
        role: "target-material",
        semanticEntityIds: ["entity.b"]
      })
    ]
  }), /unique and non-empty/);
});

test("branch, fusion, and fission groups retain open bounded cardinality", () => {
  for (const groupKind of ["branch", "fusion", "fission"] as const) {
    assert.deepEqual(
      createKpOperationPresentationGroup({
        id: `group.${groupKind}`,
        groupKind,
        bundleIds: ["bundle.a", "bundle.b", "bundle.c"]
      }).bundleIds,
      ["bundle.a", "bundle.b", "bundle.c"]
    );
  }
});
