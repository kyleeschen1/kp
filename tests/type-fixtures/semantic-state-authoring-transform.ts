import { compileKpSemanticStateSchema } from
  "../../src/semantic-state/authoring-schema-compiler.ts";
import { createKpSemanticStateHandleSet } from
  "../../src/semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../../src/semantic-state/authoring-state-materializer.ts";
import { defineKpSemanticStateTransform } from
  "../../src/semantic-state/authoring-state-transform.ts";
import { kpStateGroup, kpStateValue } from
  "../../src/semantic-state/authoring-schema.ts";

interface SupplyCurve {
  readonly kind: "supply";
  readonly intercept: number;
  readonly slope: number;
}

const compiled = compileKpSemanticStateSchema("lesson.transform-types", kpStateGroup({
  supply: kpStateValue<SupplyCurve>({
    kind: "supply",
    intercept: 2,
    slope: 1
  })
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

    // @ts-expect-error Mutation operations are not present before their compiler slices.
    state.supply.update(previous => previous);

    // @ts-expect-error Scoped transaction reads are immutable.
    state.supply.read().intercept = 4;
  }
});

// Application identity is explicit rather than derived from call order.
transform.apply(initial, "first");
