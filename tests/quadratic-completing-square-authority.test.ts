import assert from "node:assert/strict";
import test from "node:test";

import { createCanonicalKpQuadraticSemanticFixture } from "../src/semantic/quadratic-branching-fixture.ts";
import {
  createCanonicalKpCompletingSquareAuthority,
  validateKpCompletingSquareAuthority,
  type KpCompletingSquareAuthority
} from "../src/semantic/quadratic-completing-square-authority.ts";

test("completing-square authority registers the exact structured state chain", () => {
  const authority = canonicalAuthority();

  assert.deepEqual(authority.states.map(({ kind }) => kind), [
    "standard-form",
    "constant-balanced",
    "square-completed",
    "perfect-square"
  ]);
  assert.deepEqual(authority.rewrites.map(({ operation }) => operation), [
    "balance-constant",
    "complete-square",
    "recognize-perfect-square"
  ]);
  assert.deepEqual(validateKpCompletingSquareAuthority(authority), []);
});

test("every rewrite has explicit roles, provenance, inverse, and solution-set preservation", () => {
  const authority = canonicalAuthority();

  for (const rewrite of authority.rewrites) {
    assert.equal(rewrite.relation, "same-solution-set");
    assert.ok(rewrite.roleBindings.length >= 2);
    assert.match(rewrite.lawId, /^law\./);
    assert.match(rewrite.inverseLawId, /^law\./);
  }
  assert.equal(authority.provenance.authority, "verified-structured-rewrite");
  assert.equal(
    new Set(authority.states.map(({ solutionSetId }) => solutionSetId)).size,
    1
  );
});

test("perfect-square recognition retains an authored AST rather than a display string", () => {
  const state = canonicalAuthority().states[3];
  assert.equal(state?.left.root.kind, "power");
  if (state?.left.root.kind !== "power") return;
  assert.equal(state.left.root.base.kind, "sum");
  assert.equal(state.left.root.exponent.kind, "number");
  assert.equal(state.right.root.kind, "quotient");
});

test("validator diagnoses broken role binding deterministically", () => {
  const authority = canonicalAuthority();
  const rewrite = authority.rewrites[1]!;
  const broken = {
    ...authority,
    rewrites: [
      authority.rewrites[0]!,
      {
        ...rewrite,
        roleBindings: [
          ...rewrite.roleBindings.slice(0, 2),
          {
            ...rewrite.roleBindings[2]!,
            targetSubtreeIds: ["missing.completion-term"]
          },
          ...rewrite.roleBindings.slice(3)
        ]
      },
      authority.rewrites[2]!
    ]
  } as KpCompletingSquareAuthority;

  assert.deepEqual(validateKpCompletingSquareAuthority(broken), [
    {
      code: "role-binding",
      path: "rewrites[1].roleBindings[2]",
      message:
        "Rewrite rewrite.quadratic.completing-square.add-square-term role completion-term references a missing structured subtree."
    }
  ]);
});

test("validator rejects normalized polynomial or solution-set drift", () => {
  const authority = canonicalAuthority();
  const broken = {
    ...authority,
    states: [
      authority.states[0]!,
      {
        ...authority.states[1]!,
        normalizedPolynomial: { a: "1", b: "-5", c: "5" }
      },
      ...authority.states.slice(2)
    ]
  } as KpCompletingSquareAuthority;

  assert.deepEqual(
    validateKpCompletingSquareAuthority(broken).map(({ code, path }) => [
      code,
      path
    ]),
    [["solution-set-drift", "states[1]"]]
  );
});

test("validator independently expands structured states with exact arithmetic", () => {
  const authority = canonicalAuthority();
  const balanced = authority.states[1]!;
  const broken = {
    ...authority,
    states: [
      authority.states[0]!,
      {
        ...balanced,
        right: {
          ...balanced.right,
          root: { id: "balanced.right.minus-six", kind: "number", value: -7 }
        }
      },
      ...authority.states.slice(2)
    ]
  } as KpCompletingSquareAuthority;

  assert.deepEqual(
    validateKpCompletingSquareAuthority(broken).map(({ code, path }) => [
      code,
      path
    ]),
    [["solution-set-drift", "states[1]"]]
  );
});

test("authority and structured states are immutable and JSON-stable", () => {
  const authority = canonicalAuthority();
  assert.equal(Object.isFrozen(authority), true);
  assert.equal(Object.isFrozen(authority.states), true);
  assert.equal(Object.isFrozen(authority.rewrites), true);
  assert.equal(Object.isFrozen(authority.states[0]?.left.root), true);
  assert.deepEqual(JSON.parse(JSON.stringify(authority)), authority);
});

function canonicalAuthority() {
  return createCanonicalKpCompletingSquareAuthority(
    createCanonicalKpQuadraticSemanticFixture()
  );
}
