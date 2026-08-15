import assert from "node:assert/strict";
import test from "node:test";

import type { SelectorCorrespondenceRecord } from
  "../src/semantic/correspondence.ts";
import {
  createKpCanonicalCancellationPressureContract,
  kpCanonicalCancellationPressureContract
} from "../src/semantic/cancellation-pressure-contract.ts";
import {
  getGeneratedLinearSolveTutorialFixtureSpec
} from "../src/semantic/generated-algebra-fixture-registry.ts";
import {
  createGeneratedLinearSolveTutorialFixture,
  type GeneratedLinearSolveTutorialFixture
} from "../src/semantic/generated-algebra-tutorial-fixture.ts";

test("the cancellation pressure contract fixes exact native endpoints", () => {
  const contract = kpCanonicalCancellationPressureContract;

  assert.equal(contract.source.exactLatex, "x + 3 - 3 = 7 - 3");
  assert.equal(contract.target.exactLatex, "x = 7 - 3");
  assert.equal(contract.operationId, "kp.algebra.cancel-additive-inverses");
  assert.deepEqual(contract.inversePair.signedLabels, ["+3", "-3"]);
  assert.equal(contract.inversePair.relation, "cancelation");
  assert.equal(contract.witness.descriptorId, "witness.additive-identity.zero");
  assert.equal(contract.witness.semanticValue.latex, "0");
  assert.equal(contract.witness.presentation.mode, "presentation-controlled-transient");
});

test("only the left inverse pair retires while all surrounding context persists", () => {
  const contract = kpCanonicalCancellationPressureContract;

  assert.equal(contract.continuants.length, 4);
  assert.deepEqual(
    contract.continuants.map(({ role }) => role),
    ["variable", "relation", "right-value", "right-inverse"]
  );
  assert.deepEqual(
    contract.protectedEqualGlyphs.map(({ rule }) => rule),
    ["distinct-source-identity", "protected-target-successor"]
  );
  assert.equal(
    contract.protectedEqualGlyphs[1]?.targetSelectorId,
    contract.continuants[3]?.targetSelectorId
  );
});

test("witness retirement and survivor compaction have explicit causal order", () => {
  const contract = kpCanonicalCancellationPressureContract;
  const edges = contract.causalOrder.map(({ before, after }) =>
    `${before}->${after}`
  );

  assert.deepEqual(edges, [
    "inverse-contact-established->zero-witness-readable",
    "zero-witness-readable->cancelled-material-retired",
    "cancelled-material-retired->zero-witness-absorbed",
    "zero-witness-absorbed->survivors-compacted",
    "survivors-compacted->native-target-ready"
  ]);
  assert.deepEqual(contract.rewind, {
    targetObjectId: contract.source.objectId,
    exactLatex: "x + 3 - 3 = 7 - 3",
    reconstruction: "introduce-authored-inverse-pair-from-zero-witness"
  });
});

test("cancellation cannot proceed without the complete explicit inverse pair", () => {
  const fixture = canonicalFixture();
  const records = cancellationRecords(fixture).map((record) =>
    record.relation === "cancelation"
      ? { ...record, sourceSelectorIds: record.sourceSelectorIds.slice(0, 1) }
      : record
  );

  assert.throws(
    () => createKpCanonicalCancellationPressureContract({
      fixture: withCancellationRecords(fixture, records)
    }),
    /exact authored left inverse pair/
  );
});

test("equal minus-three glyphs cannot invent identity across equation sides", () => {
  const fixture = canonicalFixture();
  const contract = kpCanonicalCancellationPressureContract;
  const records = [...cancellationRecords(fixture), {
    id: "forged-glyph-identity",
    relation: "identity" as const,
    sourceSelectorIds: [contract.inversePair.sourceSelectorIds[1]],
    targetSelectorIds: [contract.continuants[3]!.targetSelectorId],
    summary: "Forged from equal glyphs."
  }];

  assert.throws(
    () => createKpCanonicalCancellationPressureContract({
      fixture: withCancellationRecords(fixture, records)
    }),
    /Canceled material cannot also preserve identity/
  );
});

test("the exact right-side inverse must keep its authored predecessor", () => {
  const fixture = canonicalFixture();
  const contract = kpCanonicalCancellationPressureContract;
  const records = cancellationRecords(fixture).filter((record) =>
    !record.targetSelectorIds.includes(
      contract.continuants[3]!.targetSelectorId
    )
  );

  assert.throws(
    () => createKpCanonicalCancellationPressureContract({
      fixture: withCancellationRecords(fixture, records)
    }),
    /continuant correspondence does not match the canonical frontier/
  );
});

function canonicalFixture(): GeneratedLinearSolveTutorialFixture {
  const spec = getGeneratedLinearSolveTutorialFixtureSpec(
    "generated.linear-solve.x-plus-3"
  );
  assert.ok(spec);
  return createGeneratedLinearSolveTutorialFixture(spec);
}

function cancellationRecords(
  fixture: GeneratedLinearSolveTutorialFixture
): readonly SelectorCorrespondenceRecord[] {
  const transformation = fixture.transformations.find(
    ({ transformType }) => transformType === "cancelAdditiveInverses"
  );
  assert.ok(transformation?.correspondenceMap);
  return transformation.correspondenceMap.records;
}

function withCancellationRecords(
  fixture: GeneratedLinearSolveTutorialFixture,
  records: readonly SelectorCorrespondenceRecord[]
): GeneratedLinearSolveTutorialFixture {
  return {
    ...fixture,
    transformations: fixture.transformations.map((transformation) =>
      transformation.transformType === "cancelAdditiveInverses"
        ? {
            ...transformation,
            correspondenceMap: {
              id: transformation.correspondenceMap!.id,
              records
            }
          }
        : transformation
    )
  };
}
