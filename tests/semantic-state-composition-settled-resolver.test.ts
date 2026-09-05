import assert from "node:assert/strict";
import test from "node:test";

import { compileKpSemanticStateSchema } from
  "../src/semantic-state/authoring-schema-compiler.ts";
import { createKpSemanticStateHandleSet } from
  "../src/semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../src/semantic-state/authoring-state-materializer.ts";
import { kpStateGroup, kpStateValue } from
  "../src/semantic-state/authoring-schema.ts";
import {
  compileKpSemanticDerivedGraph,
  normalizeKpSemanticDerivedGraphInput
} from "../src/semantic-state/derived-graph.ts";
import { createKpSemanticProgress } from
  "../src/semantic-state/semantic-progress.ts";
import {
  createKpInTransitionSemanticStateCompositionAddress,
  createKpSettledSemanticStateCompositionAddress
} from "../src/semantic-state/state-family-composition-address.ts";
import { compileKpSemanticStateComposition } from
  "../src/semantic-state/state-family-composition-compiler.ts";
import {
  declareKpSemanticStateComposition,
  declareKpSemanticStateCompositionMember,
  declareKpSemanticStateCompositionSequence
} from "../src/semantic-state/state-family-composition-declaration.ts";
import {
  assembleKpSemanticStateCompositionEndpointChain,
  bindKpSemanticStateCompositionEndpoint
} from "../src/semantic-state/state-family-composition-endpoints.ts";
import { createKpSemanticStateCompositionHandleSet } from
  "../src/semantic-state/state-family-composition-handles.ts";
import {
  bindKpSemanticStateCompositionGraph,
  preflightKpSemanticStateComposition
} from "../src/semantic-state/state-family-composition-preflight.ts";
import {
  createKpSettledSemanticStateCompositionResolver,
  KpSettledSemanticStateCompositionResolverError
} from "../src/semantic-state/state-family-composition-settled-resolver.ts";
import { validateKpSemanticStateComposition } from
  "../src/semantic-state/state-family-composition-validation.ts";
import {
  defineKpSemanticStateFamily,
  kpStateFamilyParameters
} from "../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from
  "../src/semantic-state/state-family-transition.ts";

function fixture(
  namespace = "lesson.composition-settled-resolver",
  onAuthor?: (name: "alpha" | "beta") => void
) {
  const schema = compileKpSemanticStateSchema(namespace, kpStateGroup({
    alpha: kpStateValue<number>(0),
    beta: kpStateValue<number>(0),
    stable: kpStateValue("retained")
  }));
  const stateHandles = createKpSemanticStateHandleSet(schema);
  const initial = materializeKpSemanticStateInitialSnapshot(schema);
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(schema, [])
  );
  const family = (name: "alpha" | "beta") => {
    const definition = defineKpSemanticStateFamily({
      compiled: schema,
      handles: stateHandles,
      id: `change-${name}`,
      sourceId: `test.composition-settled-resolver.${name}.family`,
      parameters: kpStateFamilyParameters<{ readonly value: number }>(),
      transitions: builder => [builder.interpolate(
        declareKpSemanticStateInterpolation({
          id: `${name}-change`,
          sourceId: `test.composition-settled-resolver.${name}.transition`,
          target: stateHandles.refs[name]
        }),
        ({ before }) => before
      )] as const,
      author(parameters, draft) {
        onAuthor?.(name);
        draft[name].update(() => parameters.value);
      }
    });
    const application = definition.prepareApplication({
      applicationId: name,
      parameters: { value: name === "alpha" ? 4 : 7 },
      sourceId: `test.composition-settled-resolver.${name}.application`
    });
    return { definition, application, member:
      declareKpSemanticStateCompositionMember({
        name,
        sourceId: `test.composition-settled-resolver.${name}.member`,
        application
      }) };
  };
  const alpha = family("alpha");
  const beta = family("beta");
  const declaration = declareKpSemanticStateComposition({
    namespace: schema.namespace,
    localId: "lesson-change",
    sourceId: "test.composition-settled-resolver.composition",
    root: declareKpSemanticStateCompositionSequence({
      name: "timeline",
      sourceId: "test.composition-settled-resolver.timeline",
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
      bindKpSemanticStateCompositionGraph({
        definitionId: definition.id,
        graph
      }))
  });
  const composition = compileKpSemanticStateComposition({
    identities: schema.identityScope,
    preflight
  });
  const compositionHandles =
    createKpSemanticStateCompositionHandleSet(composition);
  const chain = assembleKpSemanticStateCompositionEndpointChain({
    composition,
    base: initial,
    bindings: [alpha, beta].map(({ definition, application }) =>
      bindKpSemanticStateCompositionEndpoint({ definition, application }))
  });
  return {
    stateHandles,
    compositionHandles,
    chain,
    createResolver: () => createKpSettledSemanticStateCompositionResolver({
      chain,
      compositionHandles,
      stateHandles
    })
  };
}

test("every settled handle resolves to its exact retained snapshot", () => {
  let authorCalls = 0;
  const data = fixture(undefined, () => {
    authorCalls += 1;
  });
  const resolver = data.createResolver();
  const callsAfterAssembly = authorCalls;

  data.compositionHandles.boundaries.forEach((handle, index) => {
    const resolution = resolver.resolveBoundary(handle);
    const retained = data.chain.boundaries[index]!;
    assert.equal(resolution.handle, handle);
    assert.equal(resolution.boundary, retained);
    assert.equal(resolution.snapshot, retained.snapshot);
    assert.equal(resolution.state.alpha.read(), index === 0 ? 0 : 4);
    assert.equal(resolution.state.beta.read(), index < 2 ? 0 : 7);
    assert.equal(resolution.state.stable.read(), "retained");
    assert.equal(Object.isFrozen(resolution), true);
  });
  assert.equal(authorCalls, callsAfterAssembly);
});

test("historical settled address lookup does not follow the final boundary", () => {
  const data = fixture();
  const resolver = data.createResolver();
  const middleHandle = data.compositionHandles.boundaries[1]!;
  const middleAddress = createKpSettledSemanticStateCompositionAddress({
    handles: data.compositionHandles,
    boundary: middleHandle
  });
  const middle = resolver.resolveAddress(middleAddress);

  assert.equal(middle.snapshot, data.chain.boundaries[1]!.snapshot);
  assert.notEqual(middle.snapshot, data.chain.after);
  assert.equal(middle.state.alpha.read(), 4);
  assert.equal(middle.state.beta.read(), 0);
  assert.equal(data.stateHandles.pin(data.chain.after).beta.read(), 7);
  assert.equal(resolver.resolveAddress(middleAddress).snapshot, middle.snapshot);
});

test("settled resolution rejects foreign addresses and handle sets", () => {
  const data = fixture();
  const foreign = fixture("lesson.composition-settled-foreign");
  const resolver = data.createResolver();
  const foreignAddress = createKpSettledSemanticStateCompositionAddress({
    handles: foreign.compositionHandles,
    boundary: foreign.compositionHandles.composition.before
  });
  assert.throws(() => resolver.resolveAddress(foreignAddress),
    (error: unknown) =>
      (error as KpSettledSemanticStateCompositionResolverError).code ===
        "foreign-settled-address");
  assert.throws(() => createKpSettledSemanticStateCompositionResolver({
    chain: data.chain,
    compositionHandles: foreign.compositionHandles,
    stateHandles: data.stateHandles
  }), (error: unknown) =>
    (error as KpSettledSemanticStateCompositionResolverError).code ===
      "composition-handle-mismatch");

  if (false) {
    // @ts-expect-error Negative type fixture remains unreachable.
    const transition = createKpInTransitionSemanticStateCompositionAddress({
      handles: data.compositionHandles,
      target: data.compositionHandles.root.children.alpha,
      progress: createKpSemanticProgress(1n, 2n)
    });
    // @ts-expect-error Transition addresses cannot enter settled resolution.
    resolver.resolveAddress(transition);
  }
});
