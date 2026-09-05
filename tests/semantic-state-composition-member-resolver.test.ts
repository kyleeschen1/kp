import assert from "node:assert/strict";
import test from "node:test";

import {
  addExactRationals,
  createExactRational,
  multiplyExactRationals,
  subtractExactRationals,
  type NormalizedExactRational
} from "../protocols/exact-rational.ts";
import { defineKpSemanticStateDerivation } from
  "../src/semantic-state/authoring-derived-definition.ts";
import { compileKpSemanticStateSchema } from
  "../src/semantic-state/authoring-schema-compiler.ts";
import { createKpSemanticStateHandleSet } from
  "../src/semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../src/semantic-state/authoring-state-materializer.ts";
import {
  kpStateDerived,
  kpStateGroup,
  kpStateValue
} from "../src/semantic-state/authoring-schema.ts";
import { evaluateKpSemanticDerivedValue } from
  "../src/semantic-state/derived-evaluator.ts";
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
  bindKpSemanticStateCompositionMemberEvaluator,
  createKpSemanticStateCompositionMemberTransitionResolver,
  KpSemanticStateCompositionMemberResolverError
} from "../src/semantic-state/state-family-composition-member-resolver.ts";
import {
  bindKpSemanticStateCompositionGraph,
  preflightKpSemanticStateComposition
} from "../src/semantic-state/state-family-composition-preflight.ts";
import { validateKpSemanticStateComposition } from
  "../src/semantic-state/state-family-composition-validation.ts";
import {
  defineKpSemanticStateFamily,
  kpStateFamilyParameters
} from "../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from
  "../src/semantic-state/state-family-transition.ts";

test("ordered members sample from their exact adjacent boundaries", () => {
  const data = fixture();
  const resolver = data.createResolver();
  const zero = resolver.resolveMember(
    data.compositionHandles.root.children.alpha,
    createKpSemanticProgress(0n, 1n)
  );
  const alphaHalf = resolver.resolveMember(
    data.compositionHandles.root.children.alpha,
    createKpSemanticProgress(1n, 2n)
  );
  const one = resolver.resolveMember(
    data.compositionHandles.root.children.alpha,
    createKpSemanticProgress(1n, 1n)
  );

  assert.equal(zero.beforeBoundary, data.chain.boundaries[0]);
  assert.equal(zero.sample.kind, "persistent-endpoint");
  assert.equal(one.afterBoundary, data.chain.boundaries[1]);
  assert.equal(one.sample.kind, "persistent-endpoint");
  if (zero.sample.kind !== "persistent-endpoint" ||
    one.sample.kind !== "persistent-endpoint" ||
    alphaHalf.sample.kind !== "ephemeral-interior") {
    throw new Error("Expected exact endpoint and interior sample forms.");
  }
  assert.equal(zero.sample.source.snapshot, data.chain.boundaries[0]!.snapshot);
  assert.equal(one.sample.source.snapshot, data.chain.boundaries[1]!.snapshot);
  assert.equal(
    alphaHalf.sample.source.base.snapshot,
    data.chain.boundaries[0]!.snapshot
  );
  assert.deepEqual(
    alphaHalf.sample.source.drivers[0]?.value,
    createExactRational(2n)
  );
  assert.equal("snapshot" in alphaHalf.sample, false);
});

test("prior state remains settled and later writes stay absent", () => {
  const data = fixture();
  const resolver = data.createResolver();
  const alpha = resolver.resolveMember(
    data.compositionHandles.root.children.alpha,
    createKpSemanticProgress(1n, 2n)
  );
  const beta = resolver.resolveMember(
    data.compositionHandles.root.children.beta,
    createKpSemanticProgress(1n, 2n)
  );
  if (alpha.sample.kind !== "ephemeral-interior" ||
    beta.sample.kind !== "ephemeral-interior") {
    throw new Error("Expected interior composition samples.");
  }

  assert.deepEqual(evaluateKpSemanticDerivedValue({
    graph: data.graph,
    source: alpha.sample.source,
    target: data.stateHandles.refs.total
  }), createExactRational(2n));
  assert.deepEqual(evaluateKpSemanticDerivedValue({
    graph: data.graph,
    source: beta.sample.source,
    target: data.stateHandles.refs.total
  }), createExactRational(15n, 2n));
  assert.deepEqual(data.derivedCalls, { total: 2, unrelated: 0 });
  assert.equal(
    beta.sample.source.base.snapshot,
    data.chain.boundaries[1]!.snapshot
  );
});

test("direct nonmonotonic seeks are history independent", () => {
  const data = fixture();
  const resolver = data.createResolver();
  const handle = data.compositionHandles.root.children.alpha;
  const quarter = resolver.resolveMember(
    handle,
    createKpSemanticProgress(1n, 4n)
  );
  const later = resolver.resolveMember(
    handle,
    createKpSemanticProgress(3n, 4n)
  );
  const quarterAgain = resolver.resolveMember(
    handle,
    createKpSemanticProgress(2n, 8n)
  );
  if (quarter.sample.kind !== "ephemeral-interior" ||
    later.sample.kind !== "ephemeral-interior" ||
    quarterAgain.sample.kind !== "ephemeral-interior") {
    throw new Error("Expected interior samples.");
  }

  assert.deepEqual(
    quarter.sample.source.drivers,
    quarterAgain.sample.source.drivers
  );
  assert.deepEqual(
    later.sample.source.drivers[0]?.value,
    createExactRational(3n)
  );
  assert.equal(quarter.sample.source.base.snapshot, later.sample.source.base.snapshot);
  assert.equal(data.authorCalls, 2);
});

test("member resolution rejects foreign and incomplete authority", () => {
  const data = fixture();
  const foreign = fixture("lesson.composition-member-resolver.foreign");
  const resolver = data.createResolver();
  const foreignAddress = createKpInTransitionSemanticStateCompositionAddress({
    handles: foreign.compositionHandles,
    target: foreign.compositionHandles.root.children.alpha,
    progress: createKpSemanticProgress(1n, 2n)
  });

  assert.throws(() => resolver.resolveAddress(foreignAddress),
    (error: unknown) =>
      (error as KpSemanticStateCompositionMemberResolverError).code ===
        "foreign-transition-address");
  assert.throws(() =>
    createKpSemanticStateCompositionMemberTransitionResolver({
      chain: data.chain,
      handles: data.compositionHandles,
      bindings: data.bindings.slice(0, 1)
    }), (error: unknown) =>
      (error as KpSemanticStateCompositionMemberResolverError).code ===
        "missing-member-evaluator-binding");

  if (false) {
    // @ts-expect-error Negative type fixture remains unreachable.
    const settled = createKpSettledSemanticStateCompositionAddress({
      handles: data.compositionHandles,
      boundary: data.compositionHandles.composition.before
    });
    // @ts-expect-error Settled addresses cannot enter transition resolution.
    resolver.resolveAddress(settled);
  }
});

function fixture(
  namespace = "lesson.composition-member-resolver"
) {
  const schema = compileKpSemanticStateSchema(namespace, kpStateGroup({
    alpha: kpStateValue<NormalizedExactRational>(createExactRational(0n)),
    beta: kpStateValue<NormalizedExactRational>(createExactRational(0n)),
    stable: kpStateValue<NormalizedExactRational>(createExactRational(5n)),
    total: kpStateDerived<NormalizedExactRational>(),
    unrelated: kpStateDerived<NormalizedExactRational>()
  }));
  const stateHandles = createKpSemanticStateHandleSet(schema);
  const derivedCalls = { total: 0, unrelated: 0 };
  const total = defineKpSemanticStateDerivation({
    compiled: schema,
    target: stateHandles.refs.total,
    dependencies: [stateHandles.refs.alpha, stateHandles.refs.beta],
    compute: ([alpha, beta]) => {
      derivedCalls.total += 1;
      return addExactRationals(alpha, beta);
    }
  });
  const unrelated = defineKpSemanticStateDerivation({
    compiled: schema,
    target: stateHandles.refs.unrelated,
    dependencies: [stateHandles.refs.stable],
    compute: ([stable]) => {
      derivedCalls.unrelated += 1;
      return addExactRationals(stable, stable);
    }
  });
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(schema, [total, unrelated])
  );
  const initial = materializeKpSemanticStateInitialSnapshot(schema, {
    derivations: [total, unrelated]
  });
  let authorCalls = 0;
  const family = (
    name: "alpha" | "beta",
    target: NormalizedExactRational
  ) => {
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
      parameters: kpStateFamilyParameters<{
        readonly target: NormalizedExactRational;
      }>(),
      transitions: builder => [builder.interpolate(
        transition,
        ({ before, after, progress }) => addExactRationals(
          before,
          multiplyExactRationals(
            subtractExactRationals(after, before),
            progress
          )
        )
      )] as const,
      author(parameters, draft) {
        authorCalls += 1;
        draft[name].update(() => parameters.target);
      }
    });
    const application = definition.prepareApplication({
      applicationId: name,
      parameters: { target },
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
  };
  const alpha = family("alpha", createExactRational(4n));
  const beta = family("beta", createExactRational(7n));
  const declaration = declareKpSemanticStateComposition({
    namespace,
    localId: "two-change",
    sourceId: `${namespace}.composition`,
    root: declareKpSemanticStateCompositionSequence({
      name: "timeline",
      sourceId: `${namespace}.timeline`,
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
  const chain = assembleKpSemanticStateCompositionEndpointChain({
    composition,
    base: initial,
    bindings: [alpha, beta].map(({ definition, application }) =>
      bindKpSemanticStateCompositionEndpoint({ definition, application })
    )
  });
  const alphaApplied = chain.applications.find(
    ({ memberId }) => memberId === compositionHandles.root.children.alpha.id
  );
  const betaApplied = chain.applications.find(
    ({ memberId }) => memberId === compositionHandles.root.children.beta.id
  );
  if (alphaApplied === undefined || betaApplied === undefined) {
    throw new Error("Expected both ordered member applications.");
  }
  const bindings = Object.freeze([
    bindKpSemanticStateCompositionMemberEvaluator({
      handle: compositionHandles.root.children.alpha,
      applied: alphaApplied,
      definition: alpha.definition
    }),
    bindKpSemanticStateCompositionMemberEvaluator({
      handle: compositionHandles.root.children.beta,
      applied: betaApplied,
      definition: beta.definition
    })
  ]);
  return {
    bindings,
    chain,
    compositionHandles,
    derivedCalls,
    graph,
    stateHandles,
    get authorCalls() {
      return authorCalls;
    },
    createResolver: () =>
      createKpSemanticStateCompositionMemberTransitionResolver({
        chain,
        handles: compositionHandles,
        bindings
      })
  };
}
