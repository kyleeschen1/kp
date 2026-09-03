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
import { createKpSemanticProgress } from
  "../../src/semantic-state/semantic-progress.ts";
import { createKpSemanticStateFamilyEvaluator } from
  "../../src/semantic-state/state-family-evaluator.ts";
import {
  defineKpSemanticStateFamily,
  kpStateFamilyParameters
} from "../../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from
  "../../src/semantic-state/state-family-transition.ts";

const compiled = compileKpSemanticStateSchema(
  "fixture.family-inference",
  kpStateGroup({
    input: kpStateValue<number>(2),
    output: kpStateDerived<number>()
  })
);
const handles = createKpSemanticStateHandleSet(compiled);
const output = defineKpSemanticStateDerivation({
  compiled,
  target: handles.refs.output,
  dependencies: [handles.refs.input],
  compute: ([input]) => input * 2
});
const initial = materializeKpSemanticStateInitialSnapshot(compiled, {
  derivations: [output]
});
const graph = compileKpSemanticDerivedGraph(
  normalizeKpSemanticDerivedGraphInput(compiled, [output])
);
const transition = declareKpSemanticStateInterpolation({
  id: "input-interpolation",
  sourceId: "fixture.family-inference.input",
  target: handles.refs.input
});
const family = defineKpSemanticStateFamily({
  compiled,
  handles,
  id: "change-input",
  sourceId: "fixture.family-inference.change-input",
  parameters: kpStateFamilyParameters<{ readonly target: number }>(),
  transitions: builder => [builder.interpolate(
    transition,
    ({ before, after }) => (before + after) / 2
  )] as const,
  author(parameters, state) {
    state.input.update(() => parameters.target);
  }
});
const application = family.apply(initial, {
  applicationId: "first",
  parameters: { target: 6 },
  sourceId: "fixture.family-inference.application.first"
});
const evaluator = createKpSemanticStateFamilyEvaluator({
  definition: family,
  application,
  sampleCacheCapacity: 2
});
const sample = evaluator.at(createKpSemanticProgress(1n, 2n));
if (sample.kind === "ephemeral-interior") {
  const inferred: number = evaluateKpSemanticDerivedValue({
    graph,
    source: sample.source,
    target: handles.refs.output
  });
  void inferred;
}

family.apply(initial, {
  applicationId: "invalid",
  // @ts-expect-error Family parameters retain their inferred authored type.
  parameters: { target: "six" },
  sourceId: "fixture.family-inference.application.invalid"
});
