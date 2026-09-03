import { defineKpSemanticStateDerivation } from
  "../../src/semantic-state/authoring-derived-definition.ts";
import { compileKpSemanticStateSchema } from
  "../../src/semantic-state/authoring-schema-compiler.ts";
import {
  kpStateDerived,
  kpStateGroup,
  kpStateValue
} from "../../src/semantic-state/authoring-schema.ts";
import { createKpSemanticStateHandleSet } from
  "../../src/semantic-state/authoring-state-handles.ts";

interface Curve {
  readonly kind: "curve";
  readonly intercept: number;
}

interface Crossing {
  readonly kind: "crossing";
  readonly price: number;
}

const schema = kpStateGroup({
  supply: kpStateValue<Curve>({ kind: "curve", intercept: 2 }),
  demand: kpStateValue<Curve>({ kind: "curve", intercept: 12 }),
  crossing: kpStateDerived<Crossing>()
});
const compiled = compileKpSemanticStateSchema("type.derived-definition", schema);
const handles = createKpSemanticStateHandleSet(compiled);

const crossing = defineKpSemanticStateDerivation({
  compiled,
  target: handles.refs.crossing,
  dependencies: [handles.refs.demand, handles.refs.supply],
  compute: ([demand, supply]) => ({
    kind: "crossing",
    price: demand.intercept - supply.intercept
  })
});

const value: Crossing = crossing.compute([
  { kind: "curve", intercept: 12 },
  { kind: "curve", intercept: 2 }
]);
void value;

defineKpSemanticStateDerivation({
  compiled,
  target: handles.refs.crossing,
  dependencies: [handles.refs.demand],
  // @ts-expect-error a compute result must match the derived target value
  compute: () => ({ kind: "curve" as const, intercept: 2 })
});

defineKpSemanticStateDerivation({
  compiled,
  // @ts-expect-error only a derived leaf may be a derivation target
  target: handles.refs.supply,
  dependencies: [handles.refs.demand],
  compute: () => ({ kind: "curve", intercept: 2 })
});
