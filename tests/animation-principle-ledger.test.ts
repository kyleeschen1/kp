import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpAnimationPrincipleLedger,
  kpAnimationPrinciples,
  kpCompiledAnimationPrincipleLedger,
  kpRequiredAnimationPrinciples,
  resolveKpAnimationPrincipleEnforcement,
  type KpAnimationPrinciple
} from "../src/architecture/animation-principle-ledger.ts";

test("principle status derives enforcement instead of accepting caller policy", () => {
  assert.deepEqual(
    kpCompiledAnimationPrincipleLedger.map(({ principle, enforcement }) => [
      principle.status,
      enforcement
    ]),
    [
      ["promoted", "required"],
      ["promoted", "required"],
      ["approved-exemplar", "advisory"],
      ["approved-exemplar", "advisory"],
      ["candidate", "none"],
      ["deprecated", "none"],
      ["blocked", "none"]
    ]
  );
  assert.deepEqual(
    kpRequiredAnimationPrinciples.map(({ id }) => id),
    [
      "principle.animation.semantic-lineage-authority",
      "principle.animation.deterministic-single-clock"
    ]
  );
});

test("promoted principles carry evidence, two distinct exemplars, and contracts", () => {
  for (const principle of kpAnimationPrinciples) {
    assert.ok(principle.evidenceSourceIds.length > 0);
    if (principle.status !== "promoted") continue;
    assert.ok(principle.exemplarAnimationIds.length >= 2);
    assert.equal(
      new Set(principle.exemplarAnimationIds).size,
      principle.exemplarAnimationIds.length
    );
    assert.ok(principle.contractIds.length > 0);
  }
});

test("ledger rejects duplicate IDs, duplicate exemplars, and missing replacements", () => {
  const promoted = kpAnimationPrinciples[0];
  assert.throws(
    () => compileKpAnimationPrincipleLedger([promoted, promoted]),
    /Duplicate animation principle/u
  );

  const repeatedExemplar = {
    ...promoted,
    exemplarAnimationIds: ["animation.same", "animation.same"]
  } as unknown as KpAnimationPrinciple;
  assert.throws(
    () => compileKpAnimationPrincipleLedger([repeatedExemplar]),
    /distinct exemplars/u
  );

  const deprecated = kpAnimationPrinciples.find(
    ({ status }) => status === "deprecated"
  )!;
  assert.throws(
    () => compileKpAnimationPrincipleLedger([deprecated]),
    /missing replacement/u
  );
});

test("an approved exemplar remains advisory until explicitly promoted", () => {
  const relationClearing = kpAnimationPrinciples.find(
    ({ id }) => id === "principle.animation.relation-clearing-transit"
  )!;
  assert.equal(relationClearing.status, "approved-exemplar");
  assert.equal(
    resolveKpAnimationPrincipleEnforcement(relationClearing),
    "advisory"
  );
});
