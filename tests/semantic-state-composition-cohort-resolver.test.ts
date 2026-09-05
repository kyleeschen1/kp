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
import { kpStateDerived, kpStateGroup, kpStateValue } from
  "../src/semantic-state/authoring-schema.ts";
import {
  resolveKpSemanticConcreteDependency
} from "../src/semantic-state/derived-evaluator.ts";
import {
  compileKpSemanticDerivedGraph,
  normalizeKpSemanticDerivedGraphInput
} from "../src/semantic-state/derived-graph.ts";
import { createKpSemanticProgress } from
  "../src/semantic-state/semantic-progress.ts";
import { createKpInTransitionSemanticStateCompositionAddress } from
  "../src/semantic-state/state-family-composition-address.ts";
import {
  createKpSemanticStateCompositionCohortResolver,
  KpSemanticStateCompositionCohortResolverError
} from "../src/semantic-state/state-family-composition-cohort-resolver.ts";
import { compileKpSemanticStateComposition } from
  "../src/semantic-state/state-family-composition-compiler.ts";
import {
  declareKpSemanticStateComposition,
  declareKpSemanticStateCompositionIndependent,
  declareKpSemanticStateCompositionMember
} from "../src/semantic-state/state-family-composition-declaration.ts";
import {
  assembleKpSemanticStateCompositionEndpointChain,
  bindKpSemanticStateCompositionEndpoint
} from "../src/semantic-state/state-family-composition-endpoints.ts";
import { createKpSemanticStateCompositionHandleSet } from
  "../src/semantic-state/state-family-composition-handles.ts";
import { bindKpSemanticStateCompositionMemberEvaluator } from
  "../src/semantic-state/state-family-composition-member-resolver.ts";
import {
  bindKpSemanticStateCompositionGraph,
  preflightKpSemanticStateComposition
} from "../src/semantic-state/state-family-composition-preflight.ts";
import { validateKpSemanticStateComposition } from
  "../src/semantic-state/state-family-composition-validation.ts";
import {
  createKpAggregateEphemeralSemanticStateReadSource,
  KpSemanticStateSampleSourceError
} from "../src/semantic-state/state-family-sample-source.ts";
import {
  defineKpSemanticStateFamily,
  kpStateFamilyParameters
} from "../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from
  "../src/semantic-state/state-family-transition.ts";

test("independent drivers share one aggregate ephemeral base", () => {
  const data = fixture();
  const half = data.resolver.resolveCohort(
    data.compositionHandles.root,
    createKpSemanticProgress(1n, 2n)
  );
  assert.equal(half.sample.kind, "ephemeral-interior");
  if (half.sample.kind !== "ephemeral-interior") {
    throw new Error("Expected an aggregate interior sample.");
  }

  assert.equal(half.sample.source.base.snapshot, data.chain.before);
  assert.equal(half.sample.source.drivers.length, 2);
  assert.deepEqual(
    half.sample.source.drivers.map(({ value }) => value),
    [createExactRational(2n), createExactRational(7n, 2n)]
  );
  assert.equal(new Set(half.sample.source.drivers.map(
    ({ targetSlotId }) => targetSlotId
  )).size, 2);
  assert.equal("snapshot" in half.sample.source, false);
  assert.equal("entityStores" in half.sample.source, false);
  assert.equal(Object.isFrozen(half.sample.source), true);
  assert.equal(Object.isFrozen(half.sample.source.drivers), true);
});

test("aggregate dependency tokens retain distinct member authority", () => {
  const data = fixture();
  const half = data.resolver.resolveCohort(
    data.compositionHandles.root,
    createKpSemanticProgress(1n, 2n)
  );
  if (half.sample.kind !== "ephemeral-interior") {
    throw new Error("Expected an aggregate interior sample.");
  }
  const alpha = resolveKpSemanticConcreteDependency({
    graph: data.graph,
    source: half.sample.source,
    dependency: data.dependencies.alpha
  });
  const beta = resolveKpSemanticConcreteDependency({
    graph: data.graph,
    source: half.sample.source,
    dependency: data.dependencies.beta
  });
  assert.equal(alpha.kind, "resolved-semantic-transient-dependency");
  assert.equal(beta.kind, "resolved-semantic-transient-dependency");
  if (alpha.kind !== "resolved-semantic-transient-dependency" ||
    beta.kind !== "resolved-semantic-transient-dependency") {
    throw new Error("Expected transient aggregate dependencies.");
  }
  assert.notEqual(alpha.token.transformationId, beta.token.transformationId);
  assert.notEqual(alpha.token.slotId, beta.token.slotId);
  assert.equal(alpha.baseSnapshotId, data.chain.before.id);
  assert.equal(beta.baseSnapshotId, data.chain.before.id);
});

test("cohort endpoints retain exact persistent boundary snapshots", () => {
  const data = fixture();
  const before = data.resolver.resolveCohort(
    data.compositionHandles.root,
    createKpSemanticProgress(0n, 1n)
  );
  const after = data.resolver.resolveCohort(
    data.compositionHandles.root,
    createKpSemanticProgress(1n, 1n)
  );

  assert.equal(before.sample.kind, "persistent-endpoint");
  assert.equal(after.sample.kind, "persistent-endpoint");
  if (before.sample.kind !== "persistent-endpoint" ||
    after.sample.kind !== "persistent-endpoint") {
    throw new Error("Expected persistent cohort endpoints.");
  }
  assert.equal(before.sample.source.snapshot, data.chain.boundaries[0]!.snapshot);
  assert.equal(after.sample.source.snapshot, data.chain.boundaries[1]!.snapshot);
  assert.equal(after.sample.source.snapshot, data.chain.after);
});

test("equivalent progress cannot grow persistent history", () => {
  const data = fixture();
  const boundaries = data.chain.boundaries;
  const applications = data.chain.applications;
  const first = data.resolver.resolveCohort(
    data.compositionHandles.root,
    createKpSemanticProgress(1n, 2n)
  );
  const second = data.resolver.resolveCohort(
    data.compositionHandles.root,
    createKpSemanticProgress(2n, 4n)
  );
  if (first.sample.kind !== "ephemeral-interior" ||
    second.sample.kind !== "ephemeral-interior") {
    throw new Error("Expected aggregate interior samples.");
  }

  assert.deepEqual(first.sample.source, second.sample.source);
  assert.equal(data.chain.boundaries, boundaries);
  assert.equal(data.chain.applications, applications);
  assert.equal(data.chain.boundaries.length, 2);
  assert.equal(data.chain.applications.length, 2);
  assert.equal(first.sample.source.drivers.some(
    ({ targetSlotId }) => targetSlotId === data.stateHandles.refs.total.slotId
  ), false);
});

test("aggregate source rejects duplicate applications and driver targets", () => {
  const data = fixture();
  const sources = data.bindings.map(binding => {
    const sample = binding.createEvaluator().at(
      createKpSemanticProgress(1n, 2n)
    );
    if (sample.kind !== "ephemeral-interior") {
      throw new Error("Expected a member interior source.");
    }
    return sample.source;
  });
  assert.throws(() => createKpAggregateEphemeralSemanticStateReadSource({
    compositionId: data.chain.composition.id,
    cohortId: data.compositionHandles.root.id,
    progress: createKpSemanticProgress(1n, 2n),
    base: data.chain.before,
    sources: [sources[0]!, sources[0]!]
  }), (error: unknown) =>
    (error as KpSemanticStateSampleSourceError).code ===
      "duplicate-aggregate-application");

  const collided = Object.freeze({
    ...sources[0]!,
    application: sources[1]!.application
  });
  assert.throws(() => createKpAggregateEphemeralSemanticStateReadSource({
    compositionId: data.chain.composition.id,
    cohortId: data.compositionHandles.root.id,
    progress: createKpSemanticProgress(1n, 2n),
    base: data.chain.before,
    sources: [sources[0]!, collided]
  }), (error: unknown) =>
    (error as KpSemanticStateSampleSourceError).code ===
      "duplicate-overlay-driver");
});

test("cohort resolution rejects member and foreign addresses", () => {
  const data = fixture();
  const foreign = fixture("lesson.composition-cohort-resolver.foreign");
  const memberAddress = createKpInTransitionSemanticStateCompositionAddress({
    handles: data.compositionHandles,
    target: data.compositionHandles.root.children.alpha,
    progress: createKpSemanticProgress(1n, 2n)
  });
  const foreignAddress = createKpInTransitionSemanticStateCompositionAddress({
    handles: foreign.compositionHandles,
    target: foreign.compositionHandles.root,
    progress: createKpSemanticProgress(1n, 2n)
  });

  assert.throws(() => data.resolver.resolveAddress(memberAddress),
    (error: unknown) =>
      (error as KpSemanticStateCompositionCohortResolverError).code ===
        "member-transition-not-supported");
  assert.throws(() => data.resolver.resolveAddress(foreignAddress),
    (error: unknown) =>
      (error as KpSemanticStateCompositionCohortResolverError).code ===
        "foreign-cohort-address");
});

function fixture(
  namespace = "lesson.composition-cohort-resolver"
) {
  const schema = compileKpSemanticStateSchema(namespace, kpStateGroup({
    alpha: kpStateValue<NormalizedExactRational>(createExactRational(0n)),
    beta: kpStateValue<NormalizedExactRational>(createExactRational(0n)),
    total: kpStateDerived<NormalizedExactRational>()
  }));
  const stateHandles = createKpSemanticStateHandleSet(schema);
  const total = defineKpSemanticStateDerivation({
    compiled: schema,
    target: stateHandles.refs.total,
    dependencies: [stateHandles.refs.alpha, stateHandles.refs.beta],
    compute: ([alpha, beta]) => addExactRationals(alpha, beta)
  });
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(schema, [total])
  );
  const initial = materializeKpSemanticStateInitialSnapshot(schema, {
    derivations: [total]
  });
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
    localId: "independent-change",
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
  const chain = assembleKpSemanticStateCompositionEndpointChain({
    composition,
    base: initial,
    graph,
    bindings: [alpha, beta].map(({ definition, application }) =>
      bindKpSemanticStateCompositionEndpoint({ definition, application })
    )
  });
  const applied = (memberId: string) => {
    const found = chain.applications.find(candidate =>
      candidate.memberId === memberId
    );
    if (found === undefined) throw new Error("Missing cohort application.");
    return found;
  };
  const bindings = Object.freeze([
    bindKpSemanticStateCompositionMemberEvaluator({
      handle: compositionHandles.root.children.alpha,
      applied: applied(compositionHandles.root.children.alpha.id),
      definition: alpha.definition
    }),
    bindKpSemanticStateCompositionMemberEvaluator({
      handle: compositionHandles.root.children.beta,
      applied: applied(compositionHandles.root.children.beta.id),
      definition: beta.definition
    })
  ]);
  const dependency = (name: "alpha" | "beta") => {
    const found = graph.input.edges.find(({ dependency }) =>
      dependency.slotId === stateHandles.refs[name].slotId
    )?.dependency;
    if (found === undefined) throw new Error(`Missing ${name} dependency.`);
    return found;
  };
  const resolver = createKpSemanticStateCompositionCohortResolver({
    chain,
    handles: compositionHandles,
    bindings
  });
  return {
    bindings,
    chain,
    compositionHandles,
    dependencies: {
      alpha: dependency("alpha"),
      beta: dependency("beta")
    },
    graph,
    resolver,
    stateHandles
  };
}
