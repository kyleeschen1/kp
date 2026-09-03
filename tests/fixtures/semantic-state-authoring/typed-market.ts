import { compileKpSemanticStateSchema } from
  "../../../src/semantic-state/authoring-schema-compiler.ts";
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
  const initial = materializeKpSemanticStateInitialSnapshot(compiled, {
    derived: [{
      targetSlotId: handles.refs.equilibrium.slotId,
      dependencySlotIds: [
        handles.refs.market.demand.slotId,
        handles.refs.market.supply.slotId
      ]
    }]
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

  return Object.freeze({ schema, compiled, handles, initial, applied });
}
