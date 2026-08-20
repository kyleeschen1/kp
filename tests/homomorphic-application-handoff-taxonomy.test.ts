import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyKpNormalizedPowerApplicationSurface,
  defineKpPrefixFunctionApplicationSurface,
  kpHomomorphicApplicationExplicitFallback,
  kpHomomorphicApplicationSurfaceTaxonomy,
  resolveKpHomomorphicApplicationHandoff
} from "../src/animation/homomorphic-application-handoff-taxonomy.ts";
import { normalizeKpPowerApplicationEndpoint } from
  "../src/semantic/power-application-endpoint-normalizer.ts";

test("surface form selects choreography without changing semantic lineage", () => {
  const normalized = normalizeKpPowerApplicationEndpoint("e^{a+b}");
  assert.equal(normalized.status, "normalized");
  if (normalized.status !== "normalized") return;

  const power = resolveKpHomomorphicApplicationHandoff({
    surface: classifyKpNormalizedPowerApplicationSurface(normalized.endpoint),
    targetTopology: "lateral-product"
  });
  const exp = resolveKpHomomorphicApplicationHandoff({
    surface: defineKpPrefixFunctionApplicationSurface({
      operatorReferentId: "function.exp",
      enclosureRole: "argument-scope"
    }),
    targetTopology: "lateral-product"
  });

  assert.equal(power.semanticLineage,
    "one-application-to-many-derived-successors");
  assert.equal(exp.semanticLineage, power.semanticLineage);
  assert.equal(power.visualHandoff, "carrier-fission");
  assert.equal(exp.visualHandoff, "scope-release-and-rewrap");
  assert.equal(power.reception, "native-scale-carrier-fan-out");
  assert.equal(exp.reception, "canonical-function-wrap");
});

test("classification follows representation roles rather than operator spelling", () => {
  const exp = defineKpPrefixFunctionApplicationSurface({
    operatorReferentId: "function.exp",
    enclosureRole: "argument-scope"
  });
  const log = defineKpPrefixFunctionApplicationSurface({
    operatorReferentId: "function.ln",
    enclosureRole: "argument-scope"
  });
  assert.equal(
    resolveKpHomomorphicApplicationHandoff({
      surface: exp,
      targetTopology: "lateral-product"
    }).visualHandoff,
    "scope-release-and-rewrap"
  );
  assert.equal(
    resolveKpHomomorphicApplicationHandoff({
      surface: log,
      targetTopology: "lateral-product"
    }).visualHandoff,
    "scope-release-and-rewrap"
  );

  for (const latex of ["e^{a+b}", "b^{x+y}"]) {
    const normalized = normalizeKpPowerApplicationEndpoint(latex);
    assert.equal(normalized.status, "normalized");
    if (normalized.status !== "normalized") continue;
    assert.equal(resolveKpHomomorphicApplicationHandoff({
      surface: classifyKpNormalizedPowerApplicationSurface(
        normalized.endpoint
      ),
      targetTopology: "lateral-product"
    }).visualHandoff, "carrier-fission");
  }
});

test("matched dissolve remains an explicit fallback rather than a surface default", () => {
  assert.equal(kpHomomorphicApplicationExplicitFallback.visualHandoff,
    "matched-dissolve");
  assert.equal(kpHomomorphicApplicationExplicitFallback.selection,
    "explicit-evidence-only");
  assert.deepEqual(
    kpHomomorphicApplicationSurfaceTaxonomy.map(({ defaultVisualHandoff }) =>
      defaultVisualHandoff
    ),
    ["carrier-fission", "scope-release-and-rewrap"]
  );
  assert.equal(Object.isFrozen(kpHomomorphicApplicationSurfaceTaxonomy), true);
});

test("prefix-function surface authority is explicit and validated", () => {
  assert.throws(() => defineKpPrefixFunctionApplicationSurface({
    operatorReferentId: " ",
    enclosureRole: "argument-scope"
  }), /operator referent/u);
});
