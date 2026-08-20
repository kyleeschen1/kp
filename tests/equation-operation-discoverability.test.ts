import assert from "node:assert/strict";
import test from "node:test";

import generatedCatalog from
  "../src/authoring/equation-operation-discovery-catalog.generated.json" with {
    type: "json"
  };
import {
  createKpEquationOperationDiscoveryCatalog
} from "../src/authoring/equation-operation-discovery-catalog.ts";
import {
  kpEquationSeriesOperationRegistry
} from "../src/authoring/equation-series-operation-declarations.ts";

test("every planner operation carries complete derived discovery metadata", () => {
  for (const declaration of
    kpEquationSeriesOperationRegistry.declarations) {
    const discovery = declaration.discoverability;
    assert.equal(discovery.friendlyName.trim().length > 0, true);
    assert.equal(discovery.aliases.includes(declaration.operationId), true);
    assert.equal(discovery.meaning.trim().length > 0, true);
    assert.equal(discovery.positiveExamples.length > 0, true);
    assert.equal(discovery.counterexamples.length > 0, true);
    assert.equal(discovery.requiredEvidenceIds.length > 0, true,
      declaration.operationId);
    assert.equal(
      discovery.supportState,
      declaration.plannerExposure.kind === "alias" ? "alias" : "available"
    );
    const serialized = JSON.stringify(discovery);
    for (const forbidden of ["timing", "geometry", "coordinates", "renderer"])
      assert.equal(serialized.includes(`\"${forbidden}\"`), false);
  }
});

test("carrier operations expose friendly examples and honest negatives", () => {
  const additive = kpEquationSeriesOperationRegistry.byId[
    "kp.semantic-motion.absorb-additive-identity"
  ];
  const multiplicative = kpEquationSeriesOperationRegistry.byId[
    "kp.semantic-motion.absorb-multiplicative-identity"
  ];
  assert.ok(additive);
  assert.ok(multiplicative);
  assert.equal(additive.discoverability.aliases.includes("remove additive zero"),
    true);
  assert.match(additive.discoverability.positiveExamples[0] ?? "", /x \+ 0/u);
  assert.match(additive.discoverability.counterexamples[0] ?? "", /2 \+ 3/u);
  assert.equal(
    multiplicative.discoverability.aliases.includes("remove times one"),
    true
  );
  assert.match(multiplicative.discoverability.positiveExamples[0] ?? "", /2 × 1/u);
  assert.match(multiplicative.discoverability.counterexamples[0] ?? "", /2 × 3/u);
});

test("the generated catalog is fresh, immutable, and alias-unambiguous", () => {
  const catalog = createKpEquationOperationDiscoveryCatalog();
  assert.deepEqual(generatedCatalog, catalog);
  assert.equal(catalog.entries.length,
    kpEquationSeriesOperationRegistry.plannerIds.length);
  assert.equal(Object.isFrozen(catalog), true);
  assert.equal(Object.isFrozen(catalog.entries), true);
  assert.equal(new Set(catalog.aliases.map(({ alias }) => alias)).size,
    catalog.aliases.length);
  assert.ok(catalog.aliases.every(({ operationId }) =>
    kpEquationSeriesOperationRegistry.plannerIds.includes(operationId)
  ));
});
