import { compileKpSemanticStateSchema } from
  "../../src/semantic-state/authoring-schema-compiler.ts";
import {
  defineKpSemanticStateDerivation,
  type KpSemanticStateDerivationDefinition
} from "../../src/semantic-state/authoring-derived-definition.ts";
import { createKpSemanticStateHandleSet } from
  "../../src/semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../../src/semantic-state/authoring-state-materializer.ts";
import { defineKpSemanticStateTransform } from
  "../../src/semantic-state/authoring-state-transform.ts";
import {
  kpStateDerived,
  kpStateGroup,
  kpStateOptional,
  kpStateValue
} from
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
  supplyAlias: kpStateValue<SupplyCurve>({
    kind: "supply",
    intercept: 3,
    slope: 1
  }),
  demand: kpStateValue<DemandCurve>({
    kind: "demand",
    intercept: 12,
    slope: -1
  }),
  policy: kpStateOptional<{ readonly rate: number }>(),
  equilibrium: kpStateDerived<number>()
}));
const handles = createKpSemanticStateHandleSet(compiled);
const initialEquilibrium = defineKpSemanticStateDerivation({
  compiled,
  target: handles.refs.equilibrium,
  dependencies: [handles.refs.supply, handles.refs.demand],
  compute: ([supply, demand]) => demand.intercept - supply.intercept
});
const revisedEquilibrium = defineKpSemanticStateDerivation({
  compiled,
  target: handles.refs.equilibrium,
  dependencies: [handles.refs.supply],
  compute: ([supply]) => supply.intercept
});
const incompatibleDerivedResult: KpSemanticStateDerivationDefinition<
  number,
  readonly [typeof handles.refs.supply]
> = defineKpSemanticStateDerivation({
  compiled,
  target: handles.refs.equilibrium,
  dependencies: [handles.refs.supply],
  // @ts-expect-error A derived definition preserves its exact result type.
  compute: ([supply]) => supply.kind
});
// @ts-expect-error Dependency tuples preserve each handle's value type.
const incompatibleDerivedDependency: KpSemanticStateDerivationDefinition<
  number,
  readonly [typeof handles.refs.demand]
> = revisedEquilibrium;
defineKpSemanticStateDerivation({
  compiled,
  // @ts-expect-error Only a derived leaf can be a derivation target.
  target: handles.refs.supply,
  dependencies: [handles.refs.demand],
  compute: ([demand]) => ({
    kind: "supply",
    intercept: demand.intercept,
    slope: 1
  })
});
void incompatibleDerivedResult;
void incompatibleDerivedDependency;
const initial = materializeKpSemanticStateInitialSnapshot(compiled, {
  derivations: [initialEquilibrium]
});
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

    state.supplyAlias.bind(state.supply);
    state.supplyAlias.bindCopy(state.supply);

    state.policy.introduce({ rate: 2 });
    state.policy.remove();

    state.equilibrium.derive(revisedEquilibrium);

    // @ts-expect-error Optional introduction preserves the exact value type.
    state.policy.introduce({ rate: "two" });

    // @ts-expect-error Required values cannot enter the optional lifecycle.
    state.supply.remove();

    // @ts-expect-error Bind requires matching semantic value types.
    state.supply.bind(state.demand);

    // @ts-expect-error Copy binding requires matching semantic value types.
    state.supply.bindCopy(state.demand);

    // @ts-expect-error Derived handles cannot be shared into writable state.
    state.supply.bind(state.equilibrium);

    // @ts-expect-error Derived handles cannot be copied into writable state.
    state.supply.bindCopy(state.equilibrium);

    // @ts-expect-error Derived values are read-only transaction inputs.
    state.equilibrium.update(previous => previous);

    // @ts-expect-error Writable values cannot install derivations.
    state.supply.derive(revisedEquilibrium);

    // @ts-expect-error Scoped transaction reads are immutable.
    state.supply.read().intercept = 4;
  }
});

// Application identity is explicit rather than derived from call order.
transform.apply(initial, "first");
