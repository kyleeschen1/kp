import { compileKpSemanticStateSchema } from
  "../../src/semantic-state/authoring-schema-compiler.ts";
import { createKpSemanticStateHandleSet } from
  "../../src/semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../../src/semantic-state/authoring-state-materializer.ts";
import { defineKpSemanticStateTransform } from
  "../../src/semantic-state/authoring-state-transform.ts";
import { kpStateDerived, kpStateGroup, kpStateValue } from
  "../../src/semantic-state/authoring-schema.ts";

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

const compiled = compileKpSemanticStateSchema("lesson.transform-types", kpStateGroup({
  supply: kpStateValue<SupplyCurve>({
    kind: "supply",
    intercept: 2,
    slope: 1
  }),
  equilibrium: kpStateDerived<number>()
}));
const handles = createKpSemanticStateHandleSet(compiled);
const initial = materializeKpSemanticStateInitialSnapshot(compiled);
const transform = defineKpSemanticStateTransform({
  compiled,
  handles,
  id: "inspect",
  author(state) {
    const supply: SupplyCurve = state.supply.read();
    void supply;

    state.supply.update(previous => ({
      ...previous,
      intercept: previous.intercept + 2
    }));

    const demand: DemandCurve = {
      kind: "demand",
      intercept: 12,
      slope: -1
    };
    // @ts-expect-error Update callbacks must preserve the exact leaf value type.
    state.supply.update((_previous) => demand);

    // @ts-expect-error Derived values are read-only transaction inputs.
    state.equilibrium.update(previous => previous);

    // @ts-expect-error Scoped transaction reads are immutable.
    state.supply.read().intercept = 4;
  }
});

// Application identity is explicit rather than derived from call order.
transform.apply(initial, "first");
