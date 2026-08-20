import assert from "node:assert/strict";
import test from "node:test";

import {
  kpExponentialDifferenceToQuotientOperationRegistration,
  kpExponentialHomomorphismRecipeRegistration,
  kpExponentialSumToProductOperationRegistration
} from "../src/animation/equation-extension-packs/exponential-homomorphism.ts";
import {
  classifyKpNormalizedPowerApplicationSurface,
  resolveKpHomomorphicApplicationHandoff
} from "../src/animation/homomorphic-application-handoff-taxonomy.ts";
import { createKpExponentialHomomorphismNativeEndpoints } from
  "../src/rendering/exponential-homomorphism-native-endpoints.ts";
import { kpExponentialHomomorphismTransitProfile } from
  "../src/rendering/exponential-homomorphism-transit-session.ts";
import { kpCanonicalExponentialHomomorphismAuthority } from
  "../src/semantic/exponential-homomorphism-exemplar.ts";
import { kpExponentialQuotientPressureAuthority } from
  "../src/semantic/exponential-quotient-pressure.ts";

test("dual exponential operations share one semantic recipe and timing cohort", () => {
  assert.deepEqual(
    kpExponentialSumToProductOperationRegistration.recipeIds,
    kpExponentialDifferenceToQuotientOperationRegistration.recipeIds
  );
  assert.deepEqual(
    kpExponentialHomomorphismRecipeRegistration.operationKinds,
    [
      kpExponentialSumToProductOperationRegistration.id,
      kpExponentialDifferenceToQuotientOperationRegistration.id
    ]
  );
  assert.equal(
    kpExponentialHomomorphismTransitProfile.id,
    "timing.exponential-homomorphism.crossover.v1"
  );
  assert.equal(
    kpExponentialHomomorphismTransitProfile.homomorphicResolution.topology,
    "carrier-fission-with-connector-release"
  );
});

test("surface role selects carrier fission while target topology stays local", () => {
  const product = resolveKpHomomorphicApplicationHandoff({
    surface: classifyKpNormalizedPowerApplicationSurface(
      kpCanonicalExponentialHomomorphismAuthority.source
    ),
    targetTopology: "lateral-product"
  });
  const quotient = resolveKpHomomorphicApplicationHandoff({
    surface: classifyKpNormalizedPowerApplicationSurface(
      kpExponentialQuotientPressureAuthority.source
    ),
    targetTopology: "vertical-quotient"
  });
  assert.equal(product.visualHandoff, "carrier-fission");
  assert.equal(quotient.visualHandoff, "carrier-fission");
  assert.equal(product.targetTopology, "lateral-product");
  assert.equal(quotient.targetTopology, "vertical-quotient");

  const productEndpoints = createKpExponentialHomomorphismNativeEndpoints(
    kpCanonicalExponentialHomomorphismAuthority
  );
  const quotientEndpoints = createKpExponentialHomomorphismNativeEndpoints(
    kpExponentialQuotientPressureAuthority
  );
  assert.equal(productEndpoints.target.nodes.find(({ role }) =>
    role === "combination-connector"
  )?.measurement, "derived-adjacency");
  assert.equal(quotientEndpoints.target.nodes.find(({ role }) =>
    role === "combination-connector"
  )?.measurement, "native-ink");
});
