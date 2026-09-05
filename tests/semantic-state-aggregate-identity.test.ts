import assert from "node:assert/strict";
import test from "node:test";

import {
  areSameKpSemanticStateId,
  createKpSemanticStateIdentityScope
} from "../src/semantic-state/identity.ts";

test("aggregate identities extend the deterministic semantic identity scope", () => {
  const first = createKpSemanticStateIdentityScope("economics.market-history");
  const reconstructed = createKpSemanticStateIdentityScope(
    "economics.market-history"
  );
  const composition = first.composition("policy-sequence");
  const reconstructedComposition = reconstructed.composition(
    "policy-sequence"
  );

  assert.equal(composition, reconstructedComposition);
  assert.equal(
    first.compositionGroup(composition, "market.adjustments"),
    reconstructed.compositionGroup(
      reconstructedComposition,
      "market.adjustments"
    )
  );
  assert.equal(
    first.compositionMember(composition, "market.adjustments.tax"),
    "kp-state/economics.market-history/composition/policy-sequence/member/market.adjustments.tax"
  );
  assert.equal(
    first.compositionBoundary(composition, "market.adjustments.after-tax"),
    "kp-state/economics.market-history/composition/policy-sequence/boundary/market.adjustments.after-tax"
  );
  assert.equal(
    areSameKpSemanticStateId(composition, reconstructedComposition),
    true
  );
});

test("scoped aggregate names remain stable under unrelated sibling insertion", () => {
  const ids = createKpSemanticStateIdentityScope("economics.market-history");
  const composition = ids.composition("policy-sequence");
  const before = Object.freeze({
    group: ids.compositionGroup(composition, "market.adjustments"),
    member: ids.compositionMember(composition, "market.adjustments.tax"),
    boundary: ids.compositionBoundary(
      composition,
      "market.adjustments.after-tax"
    )
  });

  ids.compositionGroup(composition, "market.context");
  ids.compositionMember(composition, "market.context.baseline");
  ids.compositionBoundary(composition, "market.context.after-baseline");

  assert.deepEqual(before, {
    group: ids.compositionGroup(composition, "market.adjustments"),
    member: ids.compositionMember(composition, "market.adjustments.tax"),
    boundary: ids.compositionBoundary(
      composition,
      "market.adjustments.after-tax"
    )
  });
});

test("aggregate identity creation rejects foreign scopes and invalid local names", () => {
  const left = createKpSemanticStateIdentityScope("economics.left");
  const right = createKpSemanticStateIdentityScope("economics.right");
  const composition = left.composition("policy-sequence");

  assert.throws(
    () => right.compositionGroup(composition, "market"),
    /does not belong to identity scope/u
  );
  assert.throws(
    () => left.composition("Policy Sequence"),
    /Invalid semantic state composition id/u
  );
  assert.throws(
    () => left.compositionMember(composition, "market//tax"),
    /Invalid semantic state composition member name/u
  );
  assert.throws(
    () => left.compositionBoundary(composition, ""),
    /Invalid semantic state composition boundary name/u
  );
});

test("aggregate identity kinds stay nominally disjoint", () => {
  const ids = createKpSemanticStateIdentityScope("economics.market-history");
  const composition = ids.composition("policy-sequence");
  const group = ids.compositionGroup(composition, "market");
  const member = ids.compositionMember(composition, "market.tax");
  const boundary = ids.compositionBoundary(composition, "market.after-tax");

  assert.equal(new Set([composition, group, member, boundary]).size, 4);
  if (false) {
    // @ts-expect-error A group identity cannot stand in for a composition.
    ids.compositionMember(group, "market.tax");
    // @ts-expect-error A member identity cannot stand in for a composition.
    ids.compositionBoundary(member, "market.after-tax");
  }
});
