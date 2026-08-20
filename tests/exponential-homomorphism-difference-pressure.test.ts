import assert from "node:assert/strict";
import test from "node:test";

import {
  kpExponentialQuotientPressureAuthority,
  kpExponentialQuotientPressureLatex
} from "../src/semantic/exponential-quotient-pressure.ts";
import { kpExponentialDifferenceToQuotientLaw } from
  "../src/semantic/exponential-homomorphism-law.ts";

test("difference pressure declares quotient semantics without presentation fields", () => {
  assert.deepEqual(kpExponentialQuotientPressureLatex, {
    source: "e^{a-b}",
    target: "\\frac{e^{a}}{e^{b}}"
  });
  assert.equal(kpExponentialQuotientPressureAuthority.lawId,
    kpExponentialDifferenceToQuotientLaw.id);
  assert.equal(
    kpExponentialQuotientPressureAuthority.source.superscriptRegion
      .combination.kind,
    "difference"
  );
  assert.doesNotMatch(
    JSON.stringify(kpExponentialQuotientPressureAuthority),
    /geometry|timing|opacity|renderer|DOM/u
  );
});

test("difference payloads persist while quotient structure is derived", () => {
  const authority = kpExponentialQuotientPressureAuthority;
  const payloadRecords = authority.correspondenceMap.records.filter(({ id }) =>
    id.includes("payload")
  );
  assert.deepEqual(payloadRecords.map(({ relation }) => relation), [
    "role-change",
    "role-change"
  ]);
  assert.deepEqual(
    authority.occurrences.filter(({ endpoint, role }) =>
      endpoint === "target" && role === "base"
    ).map(({ referentId }) => referentId),
    ["semantic.exponential.base.e", "semantic.exponential.base.e"]
  );
  assert.equal(authority.successorCohorts.find(({ id }) =>
    id.endsWith("combination")
  )?.summary, "difference exponent structure derives quotient target structure.");
});

test("minus and quotient bar have lineage but never occurrence identity", () => {
  const authority = kpExponentialQuotientPressureAuthority;
  const connectorCohort = authority.successorCohorts.find(({ id }) =>
    id.endsWith("connector-0")
  );
  assert.equal(connectorCohort?.relation, "one-to-one-derived");
  assert.match(connectorCohort?.summary ?? "", /difference.*quotient/u);
  assert.ok(authority.forbiddenIdentityPairs.some(({ reason }) =>
    /difference connector derives quotient structure/u.test(reason)
  ));
});
