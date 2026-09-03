import assert from "node:assert/strict";
import test from "node:test";

import {
  kpStateDerived,
  kpStateGroup,
  kpStateOptional,
  kpStateValue
} from "../src/semantic-state/authoring-schema.ts";

interface MarketCurve {
  readonly kind: "market-curve";
  readonly intercept: number;
  readonly slope: number;
}

test("schema descriptors retain nested leaf kinds and immutable initial data", () => {
  const mutableSupply = {
    kind: "market-curve" as const,
    intercept: 2,
    slope: 1
  };
  const schema = kpStateGroup({
    market: kpStateGroup({
      supply: kpStateValue<MarketCurve>(mutableSupply),
      demand: kpStateValue({
        kind: "market-curve" as const,
        intercept: 12,
        slope: -1
      })
    }),
    equilibrium: kpStateDerived<Readonly<{ price: number; quantity: number }>>(),
    governmentRevenue: kpStateOptional<number>()
  });

  mutableSupply.intercept = 99;

  assert.equal(schema.kind, "group");
  assert.equal(schema.members.market.members.supply.kind, "required-value");
  assert.equal(schema.members.market.members.supply.initialValue.intercept, 2);
  assert.equal(schema.members.equilibrium.kind, "derived-value");
  assert.equal(schema.members.governmentRevenue.kind, "optional-value");
  assert.ok(Object.isFrozen(schema));
  assert.ok(Object.isFrozen(schema.members));
  assert.ok(Object.isFrozen(
    schema.members.market.members.supply.initialValue
  ));
});

test("schema values reject nonpersistent data before state construction", () => {
  assert.throws(
    () => kpStateValue({ value: Number.NaN } as { readonly value: number }),
    /finite numbers/u
  );
  assert.throws(
    () => kpStateValue({ run() { return 1; } } as never),
    /structural data/u
  );
  assert.throws(
    () => kpStateGroup({}),
    /at least one member/u
  );
});
