import { compileKpSemanticStateSchema } from
  "../../src/semantic-state/authoring-schema-compiler.ts";
import { createKpSemanticStateHandleSet } from
  "../../src/semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../../src/semantic-state/authoring-state-materializer.ts";
import { kpStateGroup, kpStateValue } from
  "../../src/semantic-state/authoring-schema.ts";
import {
  compileKpSemanticDerivedGraph,
  normalizeKpSemanticDerivedGraphInput
} from "../../src/semantic-state/derived-graph.ts";
import { createKpSemanticProgress } from
  "../../src/semantic-state/semantic-progress.ts";
import { createKpSemanticStateCompositionCohortResolver } from
  "../../src/semantic-state/state-family-composition-cohort-resolver.ts";
import { compileKpSemanticStateComposition } from
  "../../src/semantic-state/state-family-composition-compiler.ts";
import {
  declareKpSemanticStateComposition,
  declareKpSemanticStateCompositionIndependent,
  declareKpSemanticStateCompositionMember
} from "../../src/semantic-state/state-family-composition-declaration.ts";
import {
  assembleKpSemanticStateCompositionEndpointChain,
  bindKpSemanticStateCompositionEndpoint
} from "../../src/semantic-state/state-family-composition-endpoints.ts";
import {
  createKpSemanticStateCompositionHandleSet,
  type KpSemanticStateCompositionMemberHandleParameters
} from "../../src/semantic-state/state-family-composition-handles.ts";
import { bindKpSemanticStateCompositionMemberEvaluator } from
  "../../src/semantic-state/state-family-composition-member-resolver.ts";
import {
  bindKpSemanticStateCompositionGraph,
  preflightKpSemanticStateComposition
} from "../../src/semantic-state/state-family-composition-preflight.ts";
import { validateKpSemanticStateComposition } from
  "../../src/semantic-state/state-family-composition-validation.ts";
import {
  defineKpSemanticStateFamily,
  kpStateFamilyParameters
} from "../../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from
  "../../src/semantic-state/state-family-transition.ts";

const namespace = "fixture.semantic-state-composition-inference";
const schema = compileKpSemanticStateSchema(namespace, kpStateGroup({
  alpha: kpStateValue<number>(0),
  beta: kpStateValue<number>(0)
}));
const stateHandles = createKpSemanticStateHandleSet(schema);
const initial = materializeKpSemanticStateInitialSnapshot(schema);
const graph = compileKpSemanticDerivedGraph(
  normalizeKpSemanticDerivedGraphInput(schema, [])
);

function family<const Name extends "alpha" | "beta">(name: Name) {
  const transition = declareKpSemanticStateInterpolation({
    id: `${name}-interpolation`,
    sourceId: `${namespace}.${name}.transition`,
    target: stateHandles.refs[name]
  });
  const definition = defineKpSemanticStateFamily({
    compiled: schema,
    handles: stateHandles,
    id: `change-${name}`,
    sourceId: `${namespace}.${name}.family`,
    parameters: kpStateFamilyParameters<{ readonly target: number }>(),
    transitions: builder => [builder.interpolate(
      transition,
      ({ before, after }) => (before + after) / 2
    )] as const,
    author(parameters, draft) {
      draft[name].update(() => parameters.target);
    }
  });
  const application = definition.prepareApplication({
    applicationId: name,
    parameters: { target: name === "alpha" ? 4 : 7 },
    sourceId: `${namespace}.${name}.application`
  });
  return {
    definition,
    application,
    member: declareKpSemanticStateCompositionMember({
      name,
      sourceId: `${namespace}.${name}.member`,
      application
    })
  };
}

const alpha = family("alpha");
const beta = family("beta");
const declaration = declareKpSemanticStateComposition({
  namespace,
  localId: "cohort",
  sourceId: `${namespace}.composition`,
  root: declareKpSemanticStateCompositionIndependent({
    name: "cohort",
    sourceId: `${namespace}.cohort`,
    evidence: {
      id: "disjoint-writes",
      sourceId: `${namespace}.evidence`
    },
    members: [alpha.member, beta.member]
  })
});
const validated = validateKpSemanticStateComposition({
  identities: schema.identityScope,
  declaration,
  definitions: [alpha.definition.declaration, beta.definition.declaration]
});
const preflight = preflightKpSemanticStateComposition({
  composition: validated,
  base: initial,
  graphBindings: [alpha.definition, beta.definition].map(definition =>
    bindKpSemanticStateCompositionGraph({ definitionId: definition.id, graph })
  )
});
const composition = compileKpSemanticStateComposition({
  identities: schema.identityScope,
  preflight
});
const compositionHandles = createKpSemanticStateCompositionHandleSet(
  composition
);
const endpointBindings = [alpha, beta].map(({ definition, application }) =>
  bindKpSemanticStateCompositionEndpoint({ definition, application })
);
const chain = assembleKpSemanticStateCompositionEndpointChain({
  composition,
  base: initial,
  graph,
  bindings: endpointBindings
});
const appliedByMemberId = new Map(chain.applications.map(applied =>
  [applied.memberId, applied] as const
));
const memberBindings = [
  [compositionHandles.root.children.alpha, alpha.definition],
  [compositionHandles.root.children.beta, beta.definition]
] as const;
const evaluatorBindings = memberBindings.map(([handle, definition]) => {
  const applied = appliedByMemberId.get(handle.id);
  if (applied === undefined) throw new Error("Missing inferred member authority.");
  return bindKpSemanticStateCompositionMemberEvaluator({
    handle,
    applied,
    definition
  });
});
const resolver = createKpSemanticStateCompositionCohortResolver({
  chain,
  handles: compositionHandles,
  bindings: evaluatorBindings
});
const sample = resolver.resolveCohort(
  compositionHandles.root,
  createKpSemanticProgress(1n, 2n)
);

type AlphaParameters = KpSemanticStateCompositionMemberHandleParameters<
  typeof compositionHandles.root.children.alpha
>;
const inferredAlphaParameters: AlphaParameters = { target: 4 };
void inferredAlphaParameters;
void sample;

const invalidAlphaParameters: AlphaParameters = {
  // @ts-expect-error Composition handles retain the family parameter type.
  target: "four"
};
void invalidAlphaParameters;
