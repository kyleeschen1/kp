import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpLogExponentCoverageInventory
} from "../src/architecture/log-exponent-animation-coverage.ts";

test("exponent-log coverage distinguishes semantic declarations from animated laws", () => {
  const inventory = createKpLogExponentCoverageInventory();

  assert.equal(inventory.familyId, "family.algebra.exponent-log-laws");
  assert.equal(inventory.declaredDefinitionCount, 6);
  assert.equal(inventory.concreteRuntimeSampleCount, 3);
  assert.equal(inventory.concretelySampledDefinitionCount, 2);
  assert.deepEqual(inventory.supportingSampleAnimationIds, [
    "animation.generated.function-wrap.apply-f"
  ]);

  assert.deepEqual(
    inventory.operations.map(({ transformType, status, animationIds }) => ({
      transformType,
      status,
      animationIds
    })),
    [
      {
        transformType: "multiplySameBasePowers",
        status: "concrete-law-sample",
        animationIds: ["animation.generated.exponent.square-as-product"]
      },
      {
        transformType: "divideSameBasePowers",
        status: "semantic-definition-only",
        animationIds: []
      },
      {
        transformType: "powerOfPower",
        status: "semantic-definition-only",
        animationIds: []
      },
      {
        transformType: "powerToRoot",
        status: "concrete-law-sample",
        animationIds: ["animation.generated.radical.square-root-as-power"]
      },
      {
        transformType: "logExpInverse",
        status: "semantic-definition-only",
        animationIds: []
      },
      {
        transformType: "logProduct",
        status: "semantic-definition-only",
        animationIds: []
      }
    ]
  );
});

test("generic function wrapping is support evidence, not a logarithm-law claim", () => {
  const inventory = createKpLogExponentCoverageInventory();
  const logOperations = inventory.operations.filter(({ transformType }) =>
    transformType.startsWith("log")
  );

  assert.deepEqual(
    logOperations.map(({ status }) => status),
    ["semantic-definition-only", "semantic-definition-only"]
  );
  assert.ok(
    inventory.supportingSampleAnimationIds.includes(
      "animation.generated.function-wrap.apply-f"
    )
  );
});

