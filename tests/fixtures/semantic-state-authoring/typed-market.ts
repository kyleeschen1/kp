import { compileKpSemanticStateSchema } from
  "../../../src/semantic-state/authoring-schema-compiler.ts";
import { defineKpSemanticStateDerivation } from
  "../../../src/semantic-state/authoring-derived-definition.ts";
import {
  kpStateDerived,
  kpStateGroup,
  kpStateOptional,
  kpStateValue
} from "../../../src/semantic-state/authoring-schema.ts";
import { createKpSemanticStateHandleSet } from
  "../../../src/semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../../../src/semantic-state/authoring-state-materializer.ts";
import { defineKpSemanticStateTransform } from
  "../../../src/semantic-state/authoring-state-transform.ts";

export interface TypedMarketCurve {
  readonly intercept: number;
  readonly slope: number;
}

export interface TypedMarketEquilibrium {
  readonly price: number;
  readonly quantity: number;
}

export function createTypedMarketAuthoringApiGate() {
  // authoring-api-gate:start
  const schema = kpStateGroup({
    market: kpStateGroup({
      supply: kpStateValue<TypedMarketCurve>({ intercept: 2, slope: 1 }),
      demand: kpStateValue<TypedMarketCurve>({ intercept: 12, slope: -1 })
    }),
    equilibrium: kpStateDerived<TypedMarketEquilibrium>(),
    governmentRevenue: kpStateOptional<number>()
  });
  const compiled = compileKpSemanticStateSchema("lesson.tax", schema);
  const handles = createKpSemanticStateHandleSet(compiled);
  const equilibrium = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.equilibrium,
    dependencies: [handles.refs.market.demand, handles.refs.market.supply],
    compute: ([demand, supply]) => ({
      price: (demand.intercept + supply.intercept) / 2,
      quantity: (demand.intercept - supply.intercept) / 2
    })
  });
  const initial = materializeKpSemanticStateInitialSnapshot(compiled, {
    derivations: [equilibrium]
  });
  const addTax = defineKpSemanticStateTransform({
    compiled,
    handles,
    id: "add-tax",
    author(state) {
      state.market.supply.update(previous => ({
        ...previous,
        intercept: previous.intercept + 4
      }));
    }
  });
  const applied = addTax.apply(initial, "first");
  // authoring-api-gate:end

  return Object.freeze({
    schema,
    compiled,
    handles,
    equilibrium,
    initial,
    applied
  });
}
