import assert from "node:assert/strict";
import test from "node:test";

import {
  validateKpAssetBundle
} from "../src/semantic/asset.ts";
import {
  createKpTwoTimesOneCarrierExemplar,
  kpTwoTimesOneCarrierSelectorIds
} from "../src/semantic/carrier-preserving-simplification-exemplar.ts";
import {
  validateCorrespondenceMap
} from "../src/semantic/correspondence.ts";

test("two times one names one semantic carrier and two removals", () => {
  const exemplar = createKpTwoTimesOneCarrierExemplar();
  const [source, target] = exemplar.bundle.objects;
  const map = exemplar.transformation.correspondenceMap;
  assert.ok(map);

  assert.deepEqual(source?.value, { latex: "2 \\times 1" });
  assert.deepEqual(target?.value, { latex: "2" });
  assert.equal(
    exemplar.transformation.transformType,
    "simplifyMultiplicativeIdentity"
  );
  assert.deepEqual(
    map.records.map(({ relation }) => relation),
    ["identity", "removal", "removal"]
  );
  assert.deepEqual(
    map.records[0],
    {
      id:
        "transform.operation-evaluation.two-times-one-carrier." +
        "simplify-identity.carrier-persists",
      relation: "identity",
      sourceSelectorIds: [kpTwoTimesOneCarrierSelectorIds.sourceCarrier],
      targetSelectorIds: [kpTwoTimesOneCarrierSelectorIds.targetCarrier],
      summary: "The left factor remains the same semantic value in the result."
    }
  );
  assert.notEqual(
    kpTwoTimesOneCarrierSelectorIds.sourceCarrier,
    kpTwoTimesOneCarrierSelectorIds.targetCarrier
  );
  assert.equal(
    source?.selectors[0]?.metadata?.["evaluationRole"],
    "carrier"
  );
  assert.equal(
    source?.selectors[2]?.metadata?.["identityLawId"],
    "law.arithmetic.multiplicative-identity"
  );
  assert.deepEqual(validateKpAssetBundle(exemplar.bundle), []);
  assert.deepEqual(
    validateCorrespondenceMap(map, {
      sourceSelectorIds: source?.selectors.map(({ id }) => id) ?? [],
      targetSelectorIds: target?.selectors.map(({ id }) => id) ?? []
    }),
    []
  );
});

test("duplicate state-local selector ids cannot counterfeit identity", () => {
  const exemplar = createKpTwoTimesOneCarrierExemplar();
  const [source, target] = exemplar.bundle.objects;
  assert.ok(source);
  assert.ok(target);
  const duplicateIdBundle = {
    ...exemplar.bundle,
    objects: [
      source,
      {
        ...target,
        selectors: target.selectors.map((selector) => ({
          ...selector,
          id: kpTwoTimesOneCarrierSelectorIds.sourceCarrier
        }))
      }
    ]
  };

  assert.match(
    validateKpAssetBundle(duplicateIdBundle)[0]?.message ?? "",
    /Duplicate asset selector id/
  );
});

test("a second identity record cannot claim the same result by glyph equality", () => {
  const exemplar = createKpTwoTimesOneCarrierExemplar();
  const [source, target] = exemplar.bundle.objects;
  const map = exemplar.transformation.correspondenceMap;
  assert.ok(source);
  assert.ok(target);
  assert.ok(map);
  const ambiguousMap = {
    ...map,
    records: [
      ...map.records,
      {
        id: `${map.id}.forged-glyph-identity`,
        relation: "identity" as const,
        sourceSelectorIds: [
          kpTwoTimesOneCarrierSelectorIds.sourceIdentityWitness
        ],
        targetSelectorIds: [kpTwoTimesOneCarrierSelectorIds.targetCarrier],
        summary: "Invalid: equal-looking glyphs do not establish identity."
      }
    ]
  };

  const issues = validateCorrespondenceMap(ambiguousMap, {
    sourceSelectorIds: source.selectors.map(({ id }) => id),
    targetSelectorIds: target.selectors.map(({ id }) => id)
  });
  assert.equal(
    issues.some(({ message }) =>
      message.includes("assigns source selector") ||
      message.includes("assigns target selector")),
    true
  );
});
