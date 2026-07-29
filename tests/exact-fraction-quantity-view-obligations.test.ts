import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpExactFractionQuantityTrace
} from "../src/semantic/exact-fraction-quantity-trace.ts";
import {
  certifyKpExactFractionQuantityViewBundle,
  createKpExactFractionQuantityViewObligation,
  isKpExactFractionQuantityViewBundle,
  type KpExactFractionQuantityProjectionSet
} from "../src/semantic/exact-fraction-quantity-view-obligations.ts";

function completeSet(): KpExactFractionQuantityProjectionSet {
  const trace = createKpExactFractionQuantityTrace();
  return {
    symbolic: createKpExactFractionQuantityViewObligation(
      "symbolic",
      trace,
      "The fractions refine, align, merge, and simplify."
    ),
    "partitioned-circle": createKpExactFractionQuantityViewObligation(
      "partitioned-circle",
      trace,
      "Sectors of the same circle preserve the selected half."
    ),
    "fraction-bar": createKpExactFractionQuantityViewObligation(
      "fraction-bar",
      trace,
      "Lengths of the same bar preserve the selected half."
    ),
    "number-line": createKpExactFractionQuantityViewObligation(
      "number-line",
      trace,
      "Exact intervals add to the endpoint one half."
    )
  };
}

test("a complete four-view set mints one sealed bundle", () => {
  const trace = createKpExactFractionQuantityTrace();
  const bundle = certifyKpExactFractionQuantityViewBundle(
    trace,
    completeSet()
  );

  assert.ok(isKpExactFractionQuantityViewBundle(bundle));
  assert.deepEqual(Object.keys(bundle.projections), [
    "symbolic",
    "partitioned-circle",
    "fraction-bar",
    "number-line"
  ]);
});

test("the mapped type rejects an omitted required view", () => {
  const trace = createKpExactFractionQuantityTrace();
  if (false as boolean) {
    // @ts-expect-error Number-line projection is a required type obligation.
    const incomplete: KpExactFractionQuantityProjectionSet = {
      symbolic: createKpExactFractionQuantityViewObligation(
        "symbolic",
        trace,
        "summary"
      ),
      "partitioned-circle": createKpExactFractionQuantityViewObligation(
        "partitioned-circle",
        trace,
        "summary"
      ),
      "fraction-bar": createKpExactFractionQuantityViewObligation(
        "fraction-bar",
        trace,
        "summary"
      )
    };
    assert.ok(incomplete);
  }
  assert.ok(trace.states.length > 0);
});

test("decoded missing, mislabeled, or inaccessible views fail closed", () => {
  const trace = createKpExactFractionQuantityTrace();
  const complete = completeSet();
  const { "number-line": _missing, ...incomplete } = complete;
  assert.throws(
    () => certifyKpExactFractionQuantityViewBundle(
      trace,
      incomplete as unknown as KpExactFractionQuantityProjectionSet
    ),
    /every required view exactly once/
  );
  assert.throws(
    () => certifyKpExactFractionQuantityViewBundle(trace, {
      ...complete,
      symbolic: {
        ...complete.symbolic,
        kind: "fraction-bar"
      } as unknown as typeof complete.symbolic
    }),
    /symbolic projection reports kind/
  );
  assert.throws(
    () => certifyKpExactFractionQuantityViewBundle(trace, {
      ...complete,
      "number-line": {
        ...complete["number-line"],
        accessibleSummary: ""
      }
    }),
    /requires an accessible summary/
  );
});

test("a copied bundle cannot forge the runtime seal", () => {
  const trace = createKpExactFractionQuantityTrace();
  const bundle = certifyKpExactFractionQuantityViewBundle(
    trace,
    completeSet()
  );

  assert.equal(
    isKpExactFractionQuantityViewBundle({ ...bundle }),
    false
  );
});
