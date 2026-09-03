import {
  kpStateDerived,
  kpStateGroup,
  kpStateOptional,
  kpStateValue,
  type KpSemanticStateDescriptorValue
} from "../../src/semantic-state/authoring-schema.ts";

interface SupplyCurve {
  readonly kind: "supply";
  readonly intercept: number;
  readonly slope: number;
}

interface DemandCurve {
  readonly kind: "demand";
  readonly intercept: number;
  readonly slope: number;
}

const schema = kpStateGroup({
  market: kpStateGroup({
    supply: kpStateValue<SupplyCurve>({
      kind: "supply",
      intercept: 2,
      slope: 1
    }),
    demand: kpStateValue<DemandCurve>({
      kind: "demand",
      intercept: 12,
      slope: -1
    })
  }),
  equilibrium: kpStateDerived<Readonly<{
    price: number;
    quantity: number;
  }>>(),
  governmentRevenue: kpStateOptional<number>(),
  policyPair: kpStateValue(["baseline", 0] as const)
});

type StateValue = KpSemanticStateDescriptorValue<typeof schema>;
const supply: SupplyCurve = schema.members.market.members.supply.initialValue;
const stateSupply: SupplyCurve = null as unknown as StateValue["market"]["supply"];
const revenue: number = null as unknown as StateValue["governmentRevenue"];
const policyKind: "baseline" = schema.members.policyPair.initialValue[0];
void supply;
void stateSupply;
void revenue;
void policyKind;

// @ts-expect-error A supply descriptor retains its distinct domain value type.
const wrongCurve: DemandCurve = schema.members.market.members.supply.initialValue;
void wrongCurve;

kpStateValue({
  label: "invalid",
  // @ts-expect-error Executable closures are not persistent state data.
  evaluate() { return 1; }
});

// @ts-expect-error Groups contain descriptors, not untyped nested values.
kpStateGroup({ invalid: { intercept: 2, slope: 1 } });

// @ts-expect-error Descriptor values are immutable after declaration.
schema.members.market.members.supply.initialValue.intercept = 4;
