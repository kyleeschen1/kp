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
  declareKpSemanticStateCompositionIndependent,
  declareKpSemanticStateCompositionMember,
  declareKpSemanticStateCompositionSequence
} from "../src/semantic-state/state-family-composition-declaration.ts";
import {
  assembleKpSemanticStateCompositionEndpointChain,
  bindKpSemanticStateCompositionEndpoint
} from "../src/semantic-state/state-family-composition-endpoints.ts";
import {
  createKpSemanticStateCompositionEvaluator,
  KpSemanticStateCompositionEvaluatorError
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

test("default and zero capacity retain no aggregate transition history", () => {
  for (const [suffix, cacheCapacity] of [
    ["default", undefined],
    ["zero", 0]
  ] as const) {
    const data = fixture(
      `lesson.composition-evaluator.${suffix}`,
      cacheCapacity === undefined ? {} : { cacheCapacity }
    );
    const address = data.address(1n, 2n);
    const first = data.evaluator.resolveAddress(address);
    const second = data.evaluator.resolveAddress(address);

    assert.notEqual(first, second);
    assert.deepEqual(data.evaluator.inspect(), {
      schemaVersion: "kp.semantic-state-composition-evaluator-stats.v1",
      kind: "semantic-state-composition-evaluator-stats",
      status: "active",
      capacity: 0,
      entries: 0,
      hits: 0,
      misses: 2
    });
    const settled = data.settledBefore();
    const firstSettled = data.evaluator.resolveAddress(settled);
    const secondSettled = data.evaluator.resolveAddress(settled);
    assert.equal(firstSettled.kind,
      "settled-semantic-state-composition-resolution");
    assert.equal(secondSettled.kind,
      "settled-semantic-state-composition-resolution");
    if (firstSettled.kind !==
      "settled-semantic-state-composition-resolution" ||
      secondSettled.kind !==
        "settled-semantic-state-composition-resolution") {
      throw new Error("Expected settled aggregate resolutions.");
    }
    assert.equal(firstSettled.snapshot, data.chain.before);
    assert.equal(secondSettled.snapshot, data.chain.before);
    assert.equal(data.evaluator.inspect().misses, 2);
  }
});

test("bounded capacity evicts exact aggregate addresses deterministically", () => {
  const data = fixture("lesson.composition-evaluator.eviction", {
    cacheCapacity: 2
  });
  const quarter = data.address(1n, 4n);
  const half = data.address(1n, 2n);
  const threeQuarters = data.address(3n, 4n);
  const firstQuarter = data.evaluator.resolveAddress(quarter);
  const firstHalf = data.evaluator.resolveAddress(half);

  assert.equal(data.evaluator.resolveAddress(data.address(2n, 8n)),
    firstQuarter);
  data.evaluator.resolveAddress(threeQuarters);
  assert.notEqual(data.evaluator.resolveAddress(half), firstHalf);
  assert.deepEqual(data.evaluator.inspect(), {
    schemaVersion: "kp.semantic-state-composition-evaluator-stats.v1",
    kind: "semantic-state-composition-evaluator-stats",
    status: "active",
    capacity: 2,
    entries: 2,
    hits: 1,
    misses: 4
  });
});

test("one lifecycle dispatches ordered member and cohort addresses", () => {
  const cohort = fixture("lesson.composition-evaluator.cohort-dispatch", {
    cacheCapacity: 1
  });
  const ordered = fixture("lesson.composition-evaluator.member-dispatch", {
    cacheCapacity: 1,
    form: "sequence"
  });
  const cohortResolution = cohort.evaluator.resolveAddress(
    cohort.address(1n, 2n)
  );
  const memberResolution = ordered.evaluator.resolveAddress(
    ordered.address(1n, 2n)
  );

  assert.equal(cohortResolution.kind,
    "semantic-state-composition-cohort-resolution");
  assert.equal(memberResolution.kind,
    "semantic-state-composition-member-transition-resolution");
  if (memberResolution.kind !==
    "semantic-state-composition-member-transition-resolution") {
    throw new Error("Expected ordered member transition resolution.");
  }
  assert.equal(memberResolution.beforeBoundary.snapshot, ordered.chain.before);
  assert.equal(ordered.evaluator.resolveAddress(ordered.address(2n, 4n)),
    memberResolution);
});

test("aggregate reset and disposal leave member evaluators isolated", () => {
  const data = fixture("lesson.composition-evaluator.lifecycle", {
    cacheCapacity: 1
  });
  const address = data.address(1n, 2n);
  data.evaluator.resolveAddress(address);
  const afterMiss = data.memberEvaluators.map(evaluator => evaluator.inspect());
  assert.equal(afterMiss.every(stats =>
    stats.capacity === 0 && stats.entries === 0 && stats.misses === 1
  ), true);

  assert.equal(data.evaluator.resolveAddress(address),
    data.evaluator.resolveAddress(address));
  assert.deepEqual(
    data.memberEvaluators.map(evaluator => evaluator.inspect()),
    afterMiss
  );
  data.evaluator.reset();
  assert.deepEqual(data.evaluator.inspect(), {
    schemaVersion: "kp.semantic-state-composition-evaluator-stats.v1",
    kind: "semantic-state-composition-evaluator-stats",
    status: "active",
    capacity: 1,
    entries: 0,
    hits: 0,
    misses: 0
  });
  assert.deepEqual(
    data.memberEvaluators.map(evaluator => evaluator.inspect()),
    afterMiss
  );

  data.evaluator.resolveAddress(address);
  const beforeDisposal = data.memberEvaluators.map(evaluator =>
    evaluator.inspect()
  );
  data.evaluator.dispose();
  data.evaluator.dispose();
  assert.equal(data.evaluator.inspect().status, "disposed");
  assert.equal(data.evaluator.inspect().entries, 0);
  assert.deepEqual(
    data.memberEvaluators.map(evaluator => evaluator.inspect()),
    beforeDisposal
  );
  assert.equal(beforeDisposal.every(stats => stats.status === "active"), true);
  assert.throws(() => data.evaluator.resolveAddress(address),
    isCompositionEvaluatorError("composition-evaluator-disposed"));
  assert.throws(() => data.evaluator.reset(),
    isCompositionEvaluatorError("composition-evaluator-disposed"));
});

test("failed aggregate samples never enter the cache", () => {
  const data = fixture("lesson.composition-evaluator.failure", {
    cacheCapacity: 1,
    failFirstHalf: true
  });
  const address = data.address(1n, 2n);

  assert.throws(() => data.evaluator.resolveAddress(address),
    (error: unknown) => error instanceof KpSemanticStateFamilyEvaluatorError &&
      error.code === "interpolation-failed");
  assert.equal(data.evaluator.inspect().entries, 0);
  assert.equal(data.evaluator.inspect().misses, 1);
  const retry = data.evaluator.resolveAddress(address);
  assert.equal(data.evaluator.inspect().entries, 1);
  assert.equal(data.evaluator.inspect().misses, 2);
  assert.equal(data.evaluator.resolveAddress(address), retry);
  assert.equal(data.evaluator.inspect().hits, 1);
});

test("composition evaluators retain independent caller-owned caches", () => {
  const first = fixture("lesson.composition-evaluator.first", {
    cacheCapacity: 1
  });
  const second = fixture("lesson.composition-evaluator.second", {
    cacheCapacity: 1
  });
  first.evaluator.resolveAddress(first.address(1n, 2n));

  assert.equal(first.evaluator.inspect().entries, 1);
  assert.equal(second.evaluator.inspect().entries, 0);
  second.evaluator.resolveAddress(second.address(1n, 2n));
  assert.equal(first.evaluator.inspect().entries, 1);
  assert.equal(second.evaluator.inspect().entries, 1);
  assert.throws(() => second.evaluator.resolveAddress(first.address(1n, 2n)));
  assert.equal(first.evaluator.inspect().entries, 1);
  assert.equal(second.evaluator.inspect().entries, 1);
});

test("composition cache capacity is an explicit bounded integer", () => {
  const data = fixture("lesson.composition-evaluator.capacity");
  for (const cacheCapacity of [-1, 1.5, Number.NaN]) {
    assert.throws(() => createKpSemanticStateCompositionEvaluator({
      ...data.evaluatorInput,
      cacheCapacity
    }), isCompositionEvaluatorError(
      "invalid-composition-evaluator-cache-capacity"
    ));
  }
});

function fixture(
  namespace: string,
  options: {
    readonly cacheCapacity?: number;
    readonly failFirstHalf?: boolean;
    readonly form?: "independent" | "sequence";
  } = {}
) {
  const schema = compileKpSemanticStateSchema(namespace, kpStateGroup({
    alpha: kpStateValue<number>(0),
    beta: kpStateValue<number>(0)
  }));
  const stateHandles = createKpSemanticStateHandleSet(schema);
  const initial = materializeKpSemanticStateInitialSnapshot(schema);
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(schema, [])
  );
  let halfAttempts = 0;
  const family = (name: "alpha" | "beta", target: number) => {
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
        ({ before, after, progress }) => {
          if (name === "alpha" && options.failFirstHalf === true &&
            progress.numerator === 1n && progress.denominator === 2n &&
            halfAttempts++ === 0) {
            throw new Error("first half sample failed");
          }
          return before + (after - before) * Number(progress.numerator) /
            Number(progress.denominator);
        }
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
  const alpha = family("alpha", 4);
  const beta = family("beta", 7);
  const root = options.form === "sequence"
    ? declareKpSemanticStateCompositionSequence({
      name: "sequence",
      sourceId: `${namespace}.sequence`,
      members: [alpha.member, beta.member]
    })
    : declareKpSemanticStateCompositionIndependent({
      name: "cohort",
      sourceId: `${namespace}.cohort`,
      evidence: {
        id: "disjoint-writes",
        sourceId: `${namespace}.evidence`
      },
      members: [alpha.member, beta.member]
    });
  const declaration = declareKpSemanticStateComposition({
    namespace,
    localId: "cohort",
    sourceId: `${namespace}.composition`,
    root
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
  const memberEvaluators: Array<ReturnType<
    ReturnType<typeof bindKpSemanticStateCompositionMemberEvaluator>["createEvaluator"]
  >> = [];
  const bindings = [alpha, beta].map(({ definition }) => {
    const handle = compositionHandles.members.find(candidate =>
      candidate.definitionId === definition.id
    );
    const applied = chain.applications.find(candidate =>
      candidate.application.definitionId === definition.id
    );
    if (handle === undefined || applied === undefined) {
      throw new Error("Missing evaluator lifecycle member authority.");
    }
    const binding = bindKpSemanticStateCompositionMemberEvaluator({
      handle,
      applied,
      definition
    });
    return Object.freeze({
      ...binding,
      createEvaluator(input?: { readonly sampleCacheCapacity?: number }) {
        const evaluator = binding.createEvaluator(input);
        memberEvaluators.push(evaluator);
        return evaluator;
      }
    });
  });
  const evaluatorInput = {
    chain,
    compositionHandles,
    stateHandles,
    bindings
  } as const;
  const evaluator = createKpSemanticStateCompositionEvaluator({
    ...evaluatorInput,
    ...(options.cacheCapacity === undefined
      ? {}
      : { cacheCapacity: options.cacheCapacity })
  });
  return {
    address(numerator: bigint, denominator: bigint) {
      const target = compositionHandles.root.nodeKind === "independent"
        ? compositionHandles.root
        : compositionHandles.root.children.alpha;
      return createKpInTransitionSemanticStateCompositionAddress({
        handles: compositionHandles,
        target,
        progress: createKpSemanticProgress(numerator, denominator)
      });
    },
    chain,
    evaluator,
    evaluatorInput,
    memberEvaluators,
    settledBefore() {
      return createKpSettledSemanticStateCompositionAddress({
        handles: compositionHandles,
        boundary: compositionHandles.composition.before
      });
    }
  };
}

function isCompositionEvaluatorError(
  code: KpSemanticStateCompositionEvaluatorError["code"]
) {
  return (error: unknown) =>
    error instanceof KpSemanticStateCompositionEvaluatorError &&
    error.code === code;
}
