import { compileKpSemanticStateSchema } from
  "../../src/semantic-state/authoring-schema-compiler.ts";
import { kpStateGroup, kpStateValue } from
  "../../src/semantic-state/authoring-schema.ts";
import { createKpSemanticStateHandleSet } from
  "../../src/semantic-state/authoring-state-handles.ts";
import {
  defineKpSemanticStateFamily,
  kpStateFamilyParameters
} from "../../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from
  "../../src/semantic-state/state-family-transition.ts";

interface Parameters {
  readonly multiplier: number;
  readonly label: "small" | "large";
}

const compiled = compileKpSemanticStateSchema(
  "type.state-family-definition",
  kpStateGroup({ amount: kpStateValue<number>(2) })
);
const handles = createKpSemanticStateHandleSet(compiled);
const amount = declareKpSemanticStateInterpolation({
  id: "amount",
  sourceId: "type.state-family-definition.amount",
  target: handles.refs.amount
});
const family = defineKpSemanticStateFamily({
  compiled,
  handles,
  id: "multiply",
  sourceId: "type.state-family-definition.multiply",
  parameters: kpStateFamilyParameters<Parameters>(),
  transitions: builder => [
    builder.interpolate(amount, ({ before, after, parameters }) => {
      const exactBefore: number = before;
      const exactAfter: number = after;
      const exactMultiplier: number = parameters.multiplier;
      void exactBefore;
      void exactAfter;
      void exactMultiplier;
      // @ts-expect-error parameter literals retain their declared union
      const invalidLabel: "medium" = parameters.label;
      void invalidLabel;
      return before;
    })
  ] as const,
  author(parameters, state) {
    const label: "small" | "large" = parameters.label;
    void label;
    state.amount.update(value => value * parameters.multiplier);
  }
});

family.prepareApplication({
  applicationId: "valid",
  parameters: { multiplier: 2, label: "small" },
  sourceId: "type.state-family-definition.valid"
});

family.prepareApplication({
  applicationId: "invalid-label",
  // @ts-expect-error prepared parameters preserve the exact label union
  parameters: { multiplier: 2, label: "medium" },
  sourceId: "type.state-family-definition.invalid-label"
});

family.prepareApplication({
  applicationId: "invalid-function",
  // @ts-expect-error executable closures cannot be family parameters
  parameters: { multiplier: () => 2, label: "small" },
  sourceId: "type.state-family-definition.invalid-function"
});
