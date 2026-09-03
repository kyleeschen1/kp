import { defineKpSemanticStateDerivation } from
  "../../src/semantic-state/authoring-derived-definition.ts";
import { compileKpSemanticStateSchema } from
  "../../src/semantic-state/authoring-schema-compiler.ts";
import {
  kpStateDerived,
  kpStateGroup,
  kpStateOptional,
  kpStateValue
} from "../../src/semantic-state/authoring-schema.ts";
import { createKpSemanticStateHandleSet } from
  "../../src/semantic-state/authoring-state-handles.ts";
import { defineKpSemanticStateTransform } from
  "../../src/semantic-state/authoring-state-transform.ts";

interface SupplyCurve {
  readonly kind: "supply";
  readonly intercept: number;
}

const compiled = compileKpSemanticStateSchema(
  "corpus.typecheck.repairs",
  kpStateGroup({
    market: kpStateGroup({
      supply: kpStateValue<SupplyCurve>({ kind: "supply", intercept: 2 }),
      note: kpStateOptional<string>()
    }),
    outcomes: kpStateGroup({
      total: kpStateDerived<number>()
    })
  })
);
const handles = createKpSemanticStateHandleSet(compiled);

defineKpSemanticStateTransform({
  compiled,
  handles,
  id: "invalid-corpus-cases",
  author(state) {
    // invalid-value-update: return the declared SupplyCurve value.
    // @ts-expect-error Update callbacks preserve the leaf's exact value type.
    state.market.supply.update(() => "higher");

    // invalid-required-removal: declare an optional leaf before using remove.
    // @ts-expect-error Required leaves have no optional lifecycle operations.
    state.market.supply.remove();

    // invalid-derived-write: declare a derivation and keep this read-only.
    // @ts-expect-error Derived leaves cannot be updated as entity values.
    state.outcomes.total.update(previous => previous + 1);

    state.market.note.introduce("ready");
  }
});

defineKpSemanticStateDerivation({
  compiled,
  target: handles.refs.outcomes.total,
  dependencies: [handles.refs.market.supply],
  // @ts-expect-error Derived results preserve the target's exact number type.
  compute: ([supply]) => supply.kind
});
