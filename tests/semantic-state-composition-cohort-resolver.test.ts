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
import {
  createKpSemanticSnapshotRecoveryIndex,
  pinKpAggregateSemanticSnapshot,
  recoverKpPinnedSnapshot
} from "../src/semantic-state/pinned-recovery.ts";
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
import {
  declareKpSemanticStateDiscreteTransition,
  declareKpSemanticStateInterpolation,
  declareKpSemanticStatePresentationTransition
} from "../src/semantic-state/state-family-transition.ts";

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

test("cohort mode authority stays distinct from semantic state and history", () => {
  const data = modeFixture();
  const boundaries = data.chain.boundaries;
  const applications = data.chain.applications;
  const boundaryReferences = data.chain.boundaries.map(boundary =>
    boundary.snapshot
  );
  const applicationReferences = data.chain.applications.map(({ application }) =>
    application
  );
  const serializedHistory = JSON.stringify({
    boundaries: data.chain.boundaries,
    applications: data.chain.applications
  });
  const resolve = (numerator: bigint, denominator: bigint) =>
    data.resolver.resolveCohort(
      data.compositionHandles.root,
      createKpSemanticProgress(numerator, denominator)
    );
  const quarter = resolve(1n, 4n);
  const half = resolve(1n, 2n);
  const threeQuarters = resolve(3n, 4n);

  assert.deepEqual(
    half.transitionAuthority.map(({ declaration }) => declaration.transitionMode)
      .sort(),
    ["discrete", "presentation-only", "semantic-interpolation"]
  );
  const presentationAuthority = half.transitionAuthority.find(
    ({ declaration }) => declaration.transitionMode === "presentation-only"
  );
  assert.equal(presentationAuthority?.declaration, data.presentation);
  assert.equal(Object.isFrozen(half.transitionAuthority), true);
  assert.equal(half.transitionAuthority.every(Object.isFrozen), true);
  assert.equal(half.sample.kind, "ephemeral-interior");
  if (half.sample.kind !== "ephemeral-interior" ||
    quarter.sample.kind !== "ephemeral-interior" ||
    threeQuarters.sample.kind !== "ephemeral-interior") {
    throw new Error("Expected aggregate interior mode samples.");
  }

  assert.deepEqual(
    half.sample.source.drivers.map(({ targetSlotId }) => targetSlotId).sort(),
    [data.stateHandles.refs.amount.slotId, data.stateHandles.refs.phase.slotId]
      .sort()
  );
  assert.equal(half.sample.source.drivers.some(({ targetSlotId }) =>
    targetSlotId === data.stateHandles.refs.label.slotId), false);
  assert.equal(data.stateHandles.pin(half.sample.source.base.snapshot).label.read(),
    "stable label");
  assert.deepEqual(
    half.sample.presentationTransitions,
    presentationAuthority === undefined ? [] : [presentationAuthority]
  );
  assert.equal(Object.isFrozen(half.sample.presentationTransitions), true);
  assert.equal("progress" in data.presentation, false);
  assert.equal("duration" in data.presentation, false);
  assert.equal("easing" in data.presentation, false);

  assert.equal(readDriverValue(
    quarter.sample.source.drivers,
    data.stateHandles.refs.phase.slotId
  ), "before");
  assert.equal(readDriverValue(
    half.sample.source.drivers,
    data.stateHandles.refs.phase.slotId
  ), "middle");
  assert.equal(readDriverValue(
    threeQuarters.sample.source.drivers,
    data.stateHandles.refs.phase.slotId
  ), "after");
  assert.deepEqual(data.discrete.changePoints.map(({ id, at }) => ({ id, at })), [
    { id: "middle", at: "1/3" },
    { id: "after", at: "2/3" }
  ]);

  data.resolver.resolveCohort(
    data.compositionHandles.root,
    createKpSemanticProgress(1n, 1n)
  );
  data.resolver.resolveCohort(
    data.compositionHandles.root,
    createKpSemanticProgress(0n, 1n)
  );
  assert.equal(data.chain.boundaries, boundaries);
  assert.equal(data.chain.applications, applications);
  assert.equal(data.chain.boundaries.every((boundary, index) =>
    boundary.snapshot === boundaryReferences[index]), true);
  assert.equal(data.chain.applications.every(({ application }, index) =>
    application === applicationReferences[index]), true);
  assert.equal(JSON.stringify({
    boundaries: data.chain.boundaries,
    applications: data.chain.applications
  }), serializedHistory);
  const recovery = createKpSemanticSnapshotRecoveryIndex(boundaryReferences);
  for (const snapshot of boundaryReferences) {
    assert.equal(recoverKpPinnedSnapshot(
      recovery,
      pinKpAggregateSemanticSnapshot(snapshot)
    ), snapshot);
  }
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

function modeFixture() {
  const namespace = "lesson.composition-cohort-modes";
  const schema = compileKpSemanticStateSchema(namespace, kpStateGroup({
    amount: kpStateValue<number>(0),
    phase: kpStateValue<"before" | "middle" | "after">("before"),
    label: kpStateValue("stable label")
  }));
  const stateHandles = createKpSemanticStateHandleSet(schema);
  const initial = materializeKpSemanticStateInitialSnapshot(schema);
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(schema, [])
  );
  const interpolation = declareKpSemanticStateInterpolation({
    id: "amount-interpolation",
    sourceId: `${namespace}.amount.transition`,
    target: stateHandles.refs.amount
  });
  const discrete = declareKpSemanticStateDiscreteTransition({
    id: "phase-change",
    sourceId: `${namespace}.phase.transition`,
    target: stateHandles.refs.phase,
    changePoints: [
      {
        id: "after",
        at: createKpSemanticProgress(2n, 3n),
        valueSourceId: `${namespace}.phase.after`
      },
      {
        id: "middle",
        at: createKpSemanticProgress(1n, 3n),
        valueSourceId: `${namespace}.phase.middle`
      }
    ]
  });
  const presentation = declareKpSemanticStatePresentationTransition({
    id: "label-emphasis",
    sourceId: `${namespace}.label.transition`,
    target: stateHandles.refs.label
  });
  const amountDefinition = defineKpSemanticStateFamily({
    compiled: schema,
    handles: stateHandles,
    id: "change-amount",
    sourceId: `${namespace}.amount.family`,
    parameters: kpStateFamilyParameters<{ readonly amount: number }>(),
    transitions: builder => [builder.interpolate(
      interpolation,
      ({ before, after, progress }) =>
        before + (after - before) * Number(progress.numerator) /
          Number(progress.denominator)
    )] as const,
    author(parameters, draft) {
      draft.amount.update(() => parameters.amount);
    }
  });
  const phaseDefinition = defineKpSemanticStateFamily({
    compiled: schema,
    handles: stateHandles,
    id: "change-phase",
    sourceId: `${namespace}.phase.family`,
    parameters: kpStateFamilyParameters<{ readonly phase: "after" }>(),
    transitions: builder => [
      builder.discrete(discrete, ({ changePointId }) =>
        changePointId === "middle" ? "middle" : "after"
      ),
      builder.presentation(presentation)
    ] as const,
    author(parameters, draft) {
      draft.phase.update(() => parameters.phase);
    }
  });
  const amountApplication = amountDefinition.prepareApplication({
    applicationId: "amount",
    parameters: { amount: 8 },
    sourceId: `${namespace}.amount.application`
  });
  const phaseApplication = phaseDefinition.prepareApplication({
    applicationId: "phase",
    parameters: { phase: "after" },
    sourceId: `${namespace}.phase.application`
  });
  const declaration = declareKpSemanticStateComposition({
    namespace,
    localId: "mode-change",
    sourceId: `${namespace}.composition`,
    root: declareKpSemanticStateCompositionIndependent({
      name: "cohort",
      sourceId: `${namespace}.cohort`,
      evidence: {
        id: "mode-writes-are-disjoint",
        sourceId: `${namespace}.evidence`
      },
      members: [
        declareKpSemanticStateCompositionMember({
          name: "amount",
          sourceId: `${namespace}.amount.member`,
          application: amountApplication
        }),
        declareKpSemanticStateCompositionMember({
          name: "phase",
          sourceId: `${namespace}.phase.member`,
          application: phaseApplication
        })
      ]
    })
  });
  const validated = validateKpSemanticStateComposition({
    identities: schema.identityScope,
    declaration,
    definitions: [amountDefinition.declaration, phaseDefinition.declaration]
  });
  const preflight = preflightKpSemanticStateComposition({
    composition: validated,
    base: initial,
    graphBindings: [amountDefinition, phaseDefinition].map(definition =>
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
    bindings: [
      bindKpSemanticStateCompositionEndpoint({
        definition: amountDefinition,
        application: amountApplication
      }),
      bindKpSemanticStateCompositionEndpoint({
        definition: phaseDefinition,
        application: phaseApplication
      })
    ]
  });
  const evaluatorBinding = (
    definition: typeof amountDefinition | typeof phaseDefinition
  ) => {
    const handle = compositionHandles.members.find(
      candidate => candidate.definitionId === definition.id
    );
    const applied = chain.applications.find(
      candidate => candidate.application.definitionId === definition.id
    );
    if (handle === undefined || applied === undefined) {
      throw new Error("Missing mode cohort member authority.");
    }
    return { handle, applied };
  };
  const amountEvaluator = evaluatorBinding(amountDefinition);
  const phaseEvaluator = evaluatorBinding(phaseDefinition);
  const evaluatorBindings = [
    bindKpSemanticStateCompositionMemberEvaluator({
      ...amountEvaluator,
      definition: amountDefinition
    }),
    bindKpSemanticStateCompositionMemberEvaluator({
      ...phaseEvaluator,
      definition: phaseDefinition
    })
  ];
  return {
    chain,
    compositionHandles,
    discrete,
    presentation,
    resolver: createKpSemanticStateCompositionCohortResolver({
      chain,
      handles: compositionHandles,
      bindings: evaluatorBindings
    }),
    stateHandles
  };
}

function readDriverValue(
  drivers: readonly { readonly targetSlotId: string; readonly value: unknown }[],
  targetSlotId: string
) {
  return drivers.find(driver => driver.targetSlotId === targetSlotId)?.value;
}
