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
  createKpSettledSemanticStateCompositionAddress,
  encodeKpSemanticStateCompositionLogicalAddress,
  type KpSemanticStateCompositionLogicalAddress
} from "../src/semantic-state/state-family-composition-address.ts";
import { compileKpSemanticStateComposition } from
  "../src/semantic-state/state-family-composition-compiler.ts";
import {
  declareKpSemanticStateComposition,
  declareKpSemanticStateCompositionGroup,
  declareKpSemanticStateCompositionIndependent,
  declareKpSemanticStateCompositionMember,
  declareKpSemanticStateCompositionSequence
} from "../src/semantic-state/state-family-composition-declaration.ts";
import {
  assembleKpSemanticStateCompositionEndpointChain,
  bindKpSemanticStateCompositionEndpoint
} from "../src/semantic-state/state-family-composition-endpoints.ts";
import {
  createKpSemanticStateCompositionEvaluator
} from "../src/semantic-state/state-family-composition-evaluator.ts";
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
  defineKpSemanticStateFamily,
  kpStateFamilyParameters
} from "../src/semantic-state/state-family-definition.ts";
import { KpSemanticStateFamilyEvaluatorError } from
  "../src/semantic-state/state-family-evaluator.ts";
import { declareKpSemanticStateInterpolation } from
  "../src/semantic-state/state-family-transition.ts";

test("arbitrary nested seek permutations equal isolated direct resolution", () => {
  const data = fixture();
  const addresses = data.addresses();
  const isolated = addresses.map(address =>
    project(data.createEvaluator(0).resolveAddress(address), data)
  );
  const permutations = [
    addresses.map((_address, index) => index),
    addresses.map((_address, index) => addresses.length - index - 1),
    [4, 0, 8, 2, 6, 1, 7, 3, 5]
  ];

  for (const permutation of permutations) {
    const evaluator = data.createEvaluator(3);
    for (const index of permutation) {
      assert.deepEqual(
        project(evaluator.resolveAddress(addresses[index]!), data),
        isolated[index]
      );
    }
    assert.ok(evaluator.inspect().entries <= 3);
  }
});

test("deep handles and equivalent progress resolve one canonical sample", () => {
  const data = fixture();
  const evaluator = data.createEvaluator(2);
  const half = data.cohortAddress(1n, 2n);
  const equivalentHalf = data.cohortAddress(2n, 4n);

  assert.deepEqual(half.target.path, ["lesson", "timeline", "middle", "joint"]);
  assert.equal(half.progress, "1/2");
  assert.equal(equivalentHalf.progress, "1/2");
  const first = evaluator.resolveAddress(half);
  assert.equal(evaluator.resolveAddress(equivalentHalf), first);
  assert.equal(evaluator.inspect().hits, 1);
});

test("historical local reads cannot move or rewrite the newest boundary", () => {
  const data = fixture();
  const evaluator = data.createEvaluator(2);
  const finalSnapshot = data.chain.after;
  const boundaryReferences = data.chain.boundaries.map(({ snapshot }) =>
    snapshot
  );
  const current = data.stateHandles.pin(finalSnapshot);
  assert.deepEqual(readState(current), { alpha: 9, beta: 7, gamma: 11 });

  const middleAddress = data.settledAddress(2);
  const middle = evaluator.resolveAddress(middleAddress);
  assert.equal(middle.kind, "settled-semantic-state-composition-resolution");
  if (middle.kind !== "settled-semantic-state-composition-resolution") {
    throw new Error("Expected a historical settled resolution.");
  }
  assert.deepEqual(readState(middle.state), { alpha: 4, beta: 7, gamma: 11 });
  evaluator.resolveAddress(data.openingAddress(3n, 4n));
  evaluator.resolveAddress(data.cohortAddress(1n, 3n));
  evaluator.resolveAddress(data.closingAddress(1n, 4n));
  const middleAgain = evaluator.resolveAddress(middleAddress);
  if (middleAgain.kind !== "settled-semantic-state-composition-resolution") {
    throw new Error("Expected a repeated settled resolution.");
  }

  assert.equal(middleAgain.snapshot, boundaryReferences[2]);
  assert.equal(data.chain.after, finalSnapshot);
  assert.equal(data.chain.boundaries.every((boundary, index) =>
    boundary.snapshot === boundaryReferences[index]), true);
  assert.deepEqual(readState(current), { alpha: 9, beta: 7, gamma: 11 });
});

test("failed nested sampling can retry without a cached or directional trace", () => {
  const data = fixture({ failFirstCohortHalf: true });
  const evaluator = data.createEvaluator(2);
  const failing = data.cohortAddress(1n, 2n);

  assert.throws(() => evaluator.resolveAddress(failing),
    (error: unknown) => error instanceof KpSemanticStateFamilyEvaluatorError &&
      error.code === "interpolation-failed");
  assert.deepEqual(evaluator.inspect(), {
    schemaVersion: "kp.semantic-state-composition-evaluator-stats.v1",
    kind: "semantic-state-composition-evaluator-stats",
    status: "active",
    capacity: 2,
    entries: 0,
    hits: 0,
    misses: 1
  });
  evaluator.resolveAddress(data.closingAddress(2n, 3n));
  const retry = evaluator.resolveAddress(failing);
  const fresh = data.createEvaluator(0).resolveAddress(failing);
  assert.deepEqual(project(retry, data), project(fresh, data));
  assert.equal(evaluator.inspect().entries, 2);
});

test("disposal and recreation preserve absolute nested resolution", () => {
  const data = fixture();
  const first = data.createEvaluator(2);
  const addresses = [
    data.closingAddress(3n, 5n),
    data.cohortAddress(2n, 5n),
    data.openingAddress(1n, 5n)
  ];
  const beforeDisposal = addresses.map(address =>
    project(first.resolveAddress(address), data)
  );
  first.dispose();
  const recreated = data.createEvaluator(2);
  const afterRecreation = [...addresses].reverse().map(address =>
    project(recreated.resolveAddress(address), data)
  ).reverse();

  assert.deepEqual(afterRecreation, beforeDisposal);
  assert.equal(first.inspect().status, "disposed");
  assert.equal(recreated.inspect().status, "active");
});

function fixture(input: {
  readonly failFirstCohortHalf?: boolean;
} = {}) {
  const namespace = "lesson.composition-access-laws";
  const schema = compileKpSemanticStateSchema(namespace, kpStateGroup({
    alpha: kpStateValue<number>(0),
    beta: kpStateValue<number>(0),
    gamma: kpStateValue<number>(0)
  }));
  const stateHandles = createKpSemanticStateHandleSet(schema);
  const initial = materializeKpSemanticStateInitialSnapshot(schema);
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(schema, [])
  );
  let failedCohortHalf = false;
  const family = (name: "alpha" | "beta" | "gamma") => {
    const transition = declareKpSemanticStateInterpolation({
      id: `${name}-interpolation`,
      sourceId: `${namespace}.${name}.transition`,
      target: stateHandles.refs[name]
    });
    return defineKpSemanticStateFamily({
      compiled: schema,
      handles: stateHandles,
      id: `change-${name}`,
      sourceId: `${namespace}.${name}.family`,
      parameters: kpStateFamilyParameters<{ readonly target: number }>(),
      transitions: builder => [builder.interpolate(
        transition,
        ({ before, after, progress }) => {
          if (name === "beta" && input.failFirstCohortHalf === true &&
            progress.numerator === 1n && progress.denominator === 2n &&
            !failedCohortHalf) {
            failedCohortHalf = true;
            throw new Error("first nested cohort sample failed");
          }
          return before + (after - before) * Number(progress.numerator) /
            Number(progress.denominator);
        }
      )] as const,
      author(parameters, draft) {
        draft[name].update(() => parameters.target);
      }
    });
  };
  const alphaDefinition = family("alpha");
  const betaDefinition = family("beta");
  const gammaDefinition = family("gamma");
  const prepare = (
    definition: typeof alphaDefinition,
    applicationId: string,
    target: number
  ) => definition.prepareApplication({
    applicationId,
    parameters: { target },
    sourceId: `${namespace}.${applicationId}.application`
  });
  const alphaFirst = prepare(alphaDefinition, "alpha-first", 4);
  const beta = prepare(betaDefinition, "beta", 7);
  const gamma = prepare(gammaDefinition, "gamma", 11);
  const alphaFinal = prepare(alphaDefinition, "alpha-final", 9);
  const member = <const Name extends string>(
    name: Name,
    application: typeof alphaFirst
  ) => declareKpSemanticStateCompositionMember({
    name,
    sourceId: `${namespace}.${name}.member`,
    application
  });
  const root = declareKpSemanticStateCompositionGroup({
    name: "lesson",
    sourceId: `${namespace}.lesson`,
    body: declareKpSemanticStateCompositionSequence({
      name: "timeline",
      sourceId: `${namespace}.timeline`,
      members: [
        declareKpSemanticStateCompositionGroup({
          name: "opening",
          sourceId: `${namespace}.opening`,
          body: member("alpha-first", alphaFirst)
        }),
        declareKpSemanticStateCompositionGroup({
          name: "middle",
          sourceId: `${namespace}.middle`,
          body: declareKpSemanticStateCompositionIndependent({
            name: "joint",
            sourceId: `${namespace}.joint`,
            evidence: {
              id: "beta-gamma-disjoint",
              sourceId: `${namespace}.joint.evidence`
            },
            members: [member("beta", beta), member("gamma", gamma)]
          })
        }),
        declareKpSemanticStateCompositionGroup({
          name: "closing",
          sourceId: `${namespace}.closing`,
          body: member("alpha-final", alphaFinal)
        })
      ]
    })
  });
  const declaration = declareKpSemanticStateComposition({
    namespace,
    localId: "nested-access",
    sourceId: `${namespace}.composition`,
    root
  });
  const definitions = [alphaDefinition, betaDefinition, gammaDefinition];
  const validated = validateKpSemanticStateComposition({
    identities: schema.identityScope,
    declaration,
    definitions: definitions.map(definition => definition.declaration)
  });
  const preflight = preflightKpSemanticStateComposition({
    composition: validated,
    base: initial,
    graphBindings: definitions.map(definition =>
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
  const applications = [
    { definition: alphaDefinition, application: alphaFirst },
    { definition: betaDefinition, application: beta },
    { definition: gammaDefinition, application: gamma },
    { definition: alphaDefinition, application: alphaFinal }
  ];
  const chain = assembleKpSemanticStateCompositionEndpointChain({
    composition,
    base: initial,
    graph,
    bindings: applications.map(({ definition, application }) =>
      bindKpSemanticStateCompositionEndpoint({ definition, application })
    )
  });
  const bindings = applications.map(({ definition, application }) => {
    const handle = compositionHandles.members.find(candidate =>
      candidate.transformationId === application.transformationId
    );
    const applied = chain.applications.find(candidate =>
      candidate.application.transformationId === application.transformationId
    );
    if (handle === undefined || applied === undefined) {
      throw new Error("Missing nested access evaluator authority.");
    }
    return bindKpSemanticStateCompositionMemberEvaluator({
      handle,
      applied,
      definition
    });
  });
  const evaluatorInput = {
    chain,
    compositionHandles,
    stateHandles,
    bindings
  } as const;
  const handles = compositionHandles.root.children.timeline.children;
  const transitionAddress = (
    target: typeof handles.opening.children["alpha-first"] |
      typeof handles.middle.children.joint |
      typeof handles.closing.children["alpha-final"],
    numerator: bigint,
    denominator: bigint
  ) => createKpInTransitionSemanticStateCompositionAddress({
    handles: compositionHandles,
    target,
    progress: createKpSemanticProgress(numerator, denominator)
  });
  const settledAddress = (ordinal: number) => {
    const boundary = compositionHandles.boundaries[ordinal];
    if (boundary === undefined) throw new Error("Missing settled boundary.");
    return createKpSettledSemanticStateCompositionAddress({
      handles: compositionHandles,
      boundary
    });
  };
  return {
    chain,
    closingAddress: (numerator: bigint, denominator: bigint) =>
      transitionAddress(
        handles.closing.children["alpha-final"],
        numerator,
        denominator
      ),
    cohortAddress: (numerator: bigint, denominator: bigint) =>
      transitionAddress(handles.middle.children.joint, numerator, denominator),
    createEvaluator: (cacheCapacity: number) =>
      createKpSemanticStateCompositionEvaluator({
        ...evaluatorInput,
        cacheCapacity
      }),
    addresses: (): readonly KpSemanticStateCompositionLogicalAddress[] => [
      settledAddress(0),
      transitionAddress(handles.opening.children["alpha-first"], 1n, 3n),
      settledAddress(1),
      transitionAddress(handles.middle.children.joint, 1n, 4n),
      transitionAddress(handles.middle.children.joint, 1n, 2n),
      settledAddress(2),
      transitionAddress(handles.closing.children["alpha-final"], 1n, 3n),
      transitionAddress(handles.closing.children["alpha-final"], 2n, 3n),
      settledAddress(3)
    ],
    openingAddress: (numerator: bigint, denominator: bigint) =>
      transitionAddress(
        handles.opening.children["alpha-first"],
        numerator,
        denominator
      ),
    settledAddress,
    stateHandles
  };
}

function project(
  resolution: AccessResolution,
  data: AccessFixture
): unknown {
  const address = encodeKpSemanticStateCompositionLogicalAddress(
    resolution.address
  );
  if (resolution.kind ===
    "settled-semantic-state-composition-resolution") {
    return {
      kind: resolution.kind,
      address,
      snapshotId: resolution.snapshot.id,
      state: readState(resolution.state)
    };
  }
  const sample = resolution.sample;
  if (sample.kind === "persistent-endpoint") {
    return {
      kind: resolution.kind,
      address,
      beforeId: resolution.beforeBoundary.snapshot.id,
      afterId: resolution.afterBoundary.snapshot.id,
      sampleKind: sample.kind,
      endpoint: sample.endpoint,
      snapshotId: sample.source.snapshot.id,
      state: readState(data.stateHandles.pin(sample.source.snapshot))
    };
  }
  return {
    kind: resolution.kind,
    address,
    beforeId: resolution.beforeBoundary.snapshot.id,
    afterId: resolution.afterBoundary.snapshot.id,
    sampleKind: sample.kind,
    baseSnapshotId: sample.source.base.snapshot.id,
    drivers: sample.source.drivers.map(driver => ({
      slotId: driver.targetSlotId,
      value: driver.value
    })).sort((left, right) => left.slotId.localeCompare(right.slotId)),
    presentationTransitionCount: sample.presentationTransitions.length
  };
}

type AccessFixture = ReturnType<typeof fixture>;
type AccessEvaluator = ReturnType<AccessFixture["createEvaluator"]>;
type AccessResolution = ReturnType<AccessEvaluator["resolveAddress"]>;

function readState(state: {
  readonly alpha: { read(): number };
  readonly beta: { read(): number };
  readonly gamma: { read(): number };
}) {
  return {
    alpha: state.alpha.read(),
    beta: state.beta.read(),
    gamma: state.gamma.read()
  };
}
