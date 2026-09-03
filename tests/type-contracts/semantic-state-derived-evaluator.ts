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
import { materializeKpSemanticStateInitialSnapshot } from
  "../../src/semantic-state/authoring-state-materializer.ts";
import { evaluateKpSemanticDerivedValue } from
  "../../src/semantic-state/derived-evaluator.ts";
import {
  compileKpSemanticDerivedGraph,
  normalizeKpSemanticDerivedGraphInput
} from "../../src/semantic-state/derived-graph.ts";

interface Summary {
  readonly kind: "summary";
  readonly amount: number;
}

const compiled = compileKpSemanticStateSchema(
  "type.derived-evaluator",
  kpStateGroup({
    base: kpStateValue({ amount: 3 }),
    doubled: kpStateDerived<number>(),
    summary: kpStateDerived<Summary>()
  })
);
const handles = createKpSemanticStateHandleSet(compiled);
const doubled = defineKpSemanticStateDerivation({
  compiled,
  target: handles.refs.doubled,
  dependencies: [handles.refs.base],
  compute: ([base]) => base.amount * 2
});
const summary = defineKpSemanticStateDerivation({
  compiled,
  target: handles.refs.summary,
  dependencies: [handles.refs.doubled],
  compute: ([amount]) => ({ kind: "summary", amount })
});
const snapshot = materializeKpSemanticStateInitialSnapshot(compiled, {
  derivations: [doubled, summary]
});
const graph = compileKpSemanticDerivedGraph(
  normalizeKpSemanticDerivedGraphInput(compiled, [doubled, summary])
);

const amount: number = evaluateKpSemanticDerivedValue({
  graph,
  snapshot,
  target: handles.refs.doubled
});
const exactSummary: Summary = evaluateKpSemanticDerivedValue({
  graph,
  snapshot,
  target: handles.refs.summary
});
void amount;
void exactSummary;

// @ts-expect-error derived evaluation retains the target's exact result type
const wrong: string = evaluateKpSemanticDerivedValue({
  graph,
  snapshot,
  target: handles.refs.doubled
});
void wrong;

evaluateKpSemanticDerivedValue({
  graph,
  snapshot,
  // @ts-expect-error concrete handles cannot be requested as derived values
  target: handles.refs.base
});
