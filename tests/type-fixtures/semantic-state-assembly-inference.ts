import { assembleKpSemanticStateModel } from "../../src/semantic-state/authoring-model-assembly.ts";
import { assembleKpSemanticStateExplanation, bindKpSemanticStateExplanationMember,
  defineKpSemanticStateModelFamily } from "../../src/semantic-state/authoring-explanation-assembly.ts";
import { createKpSemanticStateQuerySession } from "../../src/semantic-state/authoring-query-session.ts";
import { kpStateDerived, kpStateGroup, kpStateValue } from "../../src/semantic-state/authoring-schema.ts";
import { kpStateFamilyParameters } from "../../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from "../../src/semantic-state/state-family-transition.ts";
import { createKpInTransitionSemanticStateCompositionAddress } from "../../src/semantic-state/state-family-composition-address.ts";
import { createKpSemanticProgress } from "../../src/semantic-state/semantic-progress.ts";

const model = assembleKpSemanticStateModel({ namespace: "fixture.assembly-inference",
  schema: kpStateGroup({ amount: kpStateValue<number>(0), label: kpStateValue<string>("units"),
    summary: kpStateDerived<{ readonly amount: number; readonly label: string }>() }),
  derive: ({ refs, derive }) => [derive({ target: refs.summary, dependencies: [refs.amount, refs.label],
    compute: ([amount, label]) => {
      const numeric: number = amount;
      const textual: string = label;
      // @ts-expect-error Explicit dependency order must not collapse to a union or any.
      const wrong: string = amount;
      void wrong;
      return { amount: numeric, label: textual };
    } })]
});
const family = defineKpSemanticStateModelFamily(model, {
  id: "set-amount", sourceId: "fixture.amount", parameters: kpStateFamilyParameters<{ amount: number }>(),
  transitions: builder => [builder.interpolate(declareKpSemanticStateInterpolation({
    id: "amount", sourceId: "fixture.amount.transition", target: model.handles.refs.amount
  }), ({ before, after, progress }) => before + (after - before) * Number(progress.numerator) / Number(progress.denominator))],
  author(parameters, state) { state.amount.update(() => parameters.amount); }
});
const member = bindKpSemanticStateExplanationMember({ name: "raise-amount", sourceId: "fixture.member",
  definition: family, application: family.prepareApplication({ applicationId: "raise",
    sourceId: "fixture.application", parameters: { amount: 4 } }) });
const explanation = assembleKpSemanticStateExplanation({ model, localId: "explanation",
  sourceId: "fixture.explanation", root: member.member, members: [member] });
const name: "raise-amount" = explanation.handles.root.name;
const session = createKpSemanticStateQuerySession(explanation, { cacheCapacity: 1 });
const address = createKpInTransitionSemanticStateCompositionAddress({ handles: explanation.handles,
  target: explanation.handles.root, progress: createKpSemanticProgress(1n, 2n) });
const summary: Readonly<{ amount: number; label: string }> = session.evaluate(address, model.handles.refs.summary);
// @ts-expect-error The inferred result cannot be assigned to an unrelated scalar.
const wrongResult: string = session.evaluate(address, model.handles.refs.summary);
// @ts-expect-error Named composition handles retain literal names.
const wrongName: "lower-amount" = explanation.handles.root.name;
// @ts-expect-error No undeclared author field appears in the assembled schema.
model.handles.refs.unknown;
family.prepareApplication({ applicationId: "bad", sourceId: "fixture.bad",
  // @ts-expect-error Assembly does not erase existing application parameter checking.
  parameters: { amount: "four" } });
void [name, summary, wrongResult, wrongName];
session.dispose();
