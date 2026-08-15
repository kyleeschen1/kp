import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpCanonicalDistributionPressureContract,
  kpCanonicalDistributionPressureContract
} from "../src/semantic/distribution-pressure-contract.ts";
import {
  createGeneratedDistributionTutorialFixture
} from "../src/semantic/generated-algebra-tutorial-fixture.ts";
import {
  getGeneratedDistributionTutorialFixtureSpec
} from "../src/semantic/generated-algebra-fixture-registry.ts";

test("the distribution pressure caller reuses the exact canonical endpoints", () => {
  const contract = kpCanonicalDistributionPressureContract;

  assert.equal(contract.animationId, "animation.generated.distribution.expand-a-sum");
  assert.equal(contract.source.exactLatex, "a(b + c)");
  assert.equal(contract.target.exactLatex, "ab + ac");
  assert.deepEqual(contract.rewriteFrontier.anchoredContextSelectorIds, []);
  assert.equal(contract.rewind.exactLatex, contract.source.exactLatex);
});

test("one source factor derives two ordered copies without false identity", () => {
  const contract = kpCanonicalDistributionPressureContract;

  assert.deepEqual(contract.factorFanOut, {
    relation: "fan-out",
    sourceFactorSelectorId:
      "expression.generated.distribution.expand-a-sum.factored.factor",
    targetFactorSelectorIds: [
      "expression.generated.distribution.expand-a-sum.expanded.left-factor",
      "expression.generated.distribution.expand-a-sum.expanded.right-factor"
    ],
    provenance: "derived-copies",
    order: "source-addend-order"
  });
  assert.deepEqual(
    contract.forbiddenIdentityPairs.map((pair) => [
      pair.sourceSelectorId,
      pair.targetSelectorId
    ]),
    contract.factorFanOut.targetFactorSelectorIds.map((targetSelectorId) => [
      contract.factorFanOut.sourceFactorSelectorId,
      targetSelectorId
    ])
  );
  assert.equal(
    contract.operationExecution.lineageGraph.edges[0]?.relation,
    "split"
  );
});

test("persistent terms and plus retain explicit product attachment", () => {
  const contract = kpCanonicalDistributionPressureContract;

  assert.deepEqual(
    contract.productAttachments.map(({ memberSelectorIds }) => memberSelectorIds),
    [
      [
        "expression.generated.distribution.expand-a-sum.expanded.left-factor",
        "expression.generated.distribution.expand-a-sum.expanded.left-term"
      ],
      [
        "expression.generated.distribution.expand-a-sum.expanded.right-factor",
        "expression.generated.distribution.expand-a-sum.expanded.right-term"
      ]
    ]
  );
  assert.deepEqual(contract.connectorAttachment, {
    sourceSelectorId:
      "expression.generated.distribution.expand-a-sum.factored.plus",
    targetSelectorId:
      "expression.generated.distribution.expand-a-sum.expanded.plus",
    relation: "identity",
    betweenProductAttachmentIds: [
      "attachment.distribution.product.left",
      "attachment.distribution.product.right"
    ],
    motionConstraint: "follow-products-on-math-axis"
  });
  assert.deepEqual(
    contract.continuants.map(({ role }) => role),
    ["left-addend", "connector", "right-addend"]
  );
});

test("grouping retirement and native settlement have semantic ordering", () => {
  const contract = kpCanonicalDistributionPressureContract;

  assert.deepEqual(contract.groupingRetirement.sourceSelectorIds, [
    "expression.generated.distribution.expand-a-sum.factored.left-paren",
    "expression.generated.distribution.expand-a-sum.factored.right-paren"
  ]);
  assert.deepEqual(contract.causalOrder, [
    { before: "target-slots-reserved", after: "factor-fan-out" },
    { before: "factor-fan-out", after: "products-settled" },
    { before: "source-content-departed", after: "grouping-retired" },
    { before: "products-settled", after: "native-target-ready" },
    { before: "connector-attached", after: "native-target-ready" },
    { before: "grouping-retired", after: "native-target-ready" }
  ]);
});

test("the pressure contract rejects correspondence that infers identity from equal glyphs", () => {
  const spec = getGeneratedDistributionTutorialFixtureSpec(
    "generated.distribution.expand-a-sum"
  );
  assert.ok(spec !== undefined);
  const fixture = createGeneratedDistributionTutorialFixture(spec);
  const transformation = fixture.transformations[0]!;
  const correspondenceMap = transformation.correspondenceMap!;
  const invalidFixture = {
    ...fixture,
    transformations: [{
      ...transformation,
      correspondenceMap: {
        ...correspondenceMap,
        records: correspondenceMap.records.map((record, index) =>
          index === 0 ? { ...record, relation: "identity" as const } : record
        )
      }
    }]
  };

  assert.throws(
    () => createKpCanonicalDistributionPressureContract({
      fixture: invalidFixture
    }),
    /factor fan-out correspondence/
  );
});

test("the pressure contract rejects a plus detached from its semantic lineage", () => {
  const spec = getGeneratedDistributionTutorialFixtureSpec(
    "generated.distribution.expand-a-sum"
  );
  assert.ok(spec !== undefined);
  const fixture = createGeneratedDistributionTutorialFixture(spec);
  const expanded = fixture.bundle.objects[1]!;
  const invalidFixture = {
    ...fixture,
    bundle: {
      ...fixture.bundle,
      objects: [
        fixture.bundle.objects[0]!,
        {
          ...expanded,
          selectors: expanded.selectors.filter(({ id }) => !id.endsWith(".plus"))
        }
      ]
    }
  };

  assert.throws(
    () => createKpCanonicalDistributionPressureContract({
      fixture: invalidFixture
    }),
    /target connector selector/
  );
});
