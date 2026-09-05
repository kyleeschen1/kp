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
  KpSemanticDerivedEvaluationError,
  resolveKpSemanticConcreteDependency
} from "../src/semantic-state/derived-evaluator.ts";
import {
  compileKpSemanticDerivedGraph,
  normalizeKpSemanticDerivedGraphInput
} from "../src/semantic-state/derived-graph.ts";
import { createKpSemanticProgress } from
  "../src/semantic-state/semantic-progress.ts";
import { createKpSemanticStateCompositionCohortResolver } from
  "../src/semantic-state/state-family-composition-cohort-resolver.ts";
import {
  createKpSemanticStateCompositionDerivedEvaluator,
  KpSemanticStateCompositionDerivedEvaluatorError
} from "../src/semantic-state/state-family-composition-derived-evaluation.ts";
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
  defineKpSemanticStateFamily,
  kpStateFamilyParameters
} from "../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from
  "../src/semantic-state/state-family-transition.ts";

test("one aggregate request evaluates a shared diamond once", () => {
  const data = fixture();
  const evaluator = data.derivedEvaluatorAt(1n, 2n);
  const result = evaluator.evaluate(data.handles.refs.total);
  const typed: NormalizedExactRational = result.value;

  assert.deepEqual(typed, createExactRational(14n));
  assert.equal(result.target, data.handles.refs.total);
  assert.equal(result.view.reference, data.handles.refs.total);
  assert.equal(result.view.source, evaluator.source);
  assert.equal(result.view.read(), result.value);
  assert.equal(result.view.read(), result.value);
  assert.deepEqual(data.calls, {
    shared: 1,
    left: 1,
    right: 1,
    total: 1,
    unaffected: 0,
    flaky: 0
  });
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.view), true);

  if (false) {
    // @ts-expect-error Negative type fixture remains unreachable.
    const wrong: string = result.value;
    void wrong;
  }
});

test("unaffected dependencies retain persistent authority", () => {
  const data = fixture();
  const evaluator = data.derivedEvaluatorAt(1n, 2n);
  const result = evaluator.evaluate(data.handles.refs.unaffected);
  const stable = resolveKpSemanticConcreteDependency({
    graph: data.graph,
    source: evaluator.source,
    dependency: data.dependencies.stable
  });
  const alpha = resolveKpSemanticConcreteDependency({
    graph: data.graph,
    source: evaluator.source,
    dependency: data.dependencies.alpha
  });

  assert.deepEqual(result.value, createExactRational(10n));
  assert.equal(stable.kind, "resolved-semantic-concrete-dependency");
  assert.equal(alpha.kind, "resolved-semantic-transient-dependency");
  assert.equal(stable.snapshotId, data.chain.before.id);
  assert.equal(alpha.baseSnapshotId, data.chain.before.id);
  assert.deepEqual(data.calls, {
    shared: 0,
    left: 0,
    right: 0,
    total: 0,
    unaffected: 1,
    flaky: 0
  });
});

test("a failed closure exposes no result and retries from a fresh memo", () => {
  const data = fixture();
  const evaluator = data.derivedEvaluatorAt(1n, 2n);
  let escaped = false;

  assert.throws(() => {
    evaluator.evaluate(data.handles.refs.flaky);
    escaped = true;
  }, (error: unknown) =>
    error instanceof KpSemanticDerivedEvaluationError &&
    error.code === "derived-compute-failed");
  assert.equal(escaped, false);
  assert.equal(data.calls.flaky, 1);

  data.allowFlaky();
  const retry = evaluator.evaluate(data.handles.refs.flaky);
  assert.deepEqual(retry.value, createExactRational(11n, 2n));
  assert.equal(data.calls.flaky, 2);
  assert.equal(data.calls.shared, 2);
});

test("composition evaluation obeys current graph authority", () => {
  const data = fixture();
  const staleShared = defineKpSemanticStateDerivation({
    compiled: data.schema,
    target: data.handles.refs.shared,
    dependencies: [data.handles.refs.stable],
    compute: ([stable]) => stable
  });
  const staleGraph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(data.schema, [
      ...data.definitions.filter(definition =>
        definition.target.slotId !== staleShared.target.slotId
      ),
      staleShared
    ])
  );
  const evaluator = createKpSemanticStateCompositionDerivedEvaluator({
    graph: staleGraph,
    resolution: data.cohortAt(1n, 2n)
  });

  assert.throws(() => evaluator.evaluate(data.handles.refs.total),
    (error: unknown) =>
      error instanceof KpSemanticDerivedEvaluationError &&
      error.code === "stale-derived-definition" &&
      error.slotId === data.handles.refs.shared.slotId);
  assert.equal(data.calls.total, 0);
});

test("settled cohort endpoints keep their existing evaluation path", () => {
  const data = fixture();
  assert.throws(() => createKpSemanticStateCompositionDerivedEvaluator({
    graph: data.graph,
    resolution: data.cohortAt(1n, 1n)
  }), (error: unknown) =>
    error instanceof KpSemanticStateCompositionDerivedEvaluatorError &&
    error.code === "persistent-cohort-sample");
});

function fixture() {
  const schema = compileKpSemanticStateSchema(
    "lesson.composition-derived-evaluation",
    kpStateGroup({
      alpha: kpStateValue<NormalizedExactRational>(createExactRational(0n)),
      beta: kpStateValue<NormalizedExactRational>(createExactRational(0n)),
      stable: kpStateValue<NormalizedExactRational>(createExactRational(5n)),
      shared: kpStateDerived<NormalizedExactRational>(),
      left: kpStateDerived<NormalizedExactRational>(),
      right: kpStateDerived<NormalizedExactRational>(),
      total: kpStateDerived<NormalizedExactRational>(),
      unaffected: kpStateDerived<NormalizedExactRational>(),
      flaky: kpStateDerived<NormalizedExactRational>()
    })
  );
  const handles = createKpSemanticStateHandleSet(schema);
  const calls = {
    shared: 0,
    left: 0,
    right: 0,
    total: 0,
    unaffected: 0,
    flaky: 0
  };
  let flakyAllowed = true;
  const shared = defineKpSemanticStateDerivation({
    compiled: schema,
    target: handles.refs.shared,
    dependencies: [handles.refs.alpha, handles.refs.beta],
    compute: ([alpha, beta]) => {
      calls.shared += 1;
      return addExactRationals(alpha, beta);
    }
  });
  const left = defineKpSemanticStateDerivation({
    compiled: schema,
    target: handles.refs.left,
    dependencies: [handles.refs.shared],
    compute: ([value]) => {
      calls.left += 1;
      return addExactRationals(value, createExactRational(1n));
    }
  });
  const right = defineKpSemanticStateDerivation({
    compiled: schema,
    target: handles.refs.right,
    dependencies: [handles.refs.shared],
    compute: ([value]) => {
      calls.right += 1;
      return addExactRationals(value, createExactRational(2n));
    }
  });
  const total = defineKpSemanticStateDerivation({
    compiled: schema,
    target: handles.refs.total,
    dependencies: [handles.refs.left, handles.refs.right],
    compute: ([leftValue, rightValue]) => {
      calls.total += 1;
      return addExactRationals(leftValue, rightValue);
    }
  });
  const unaffected = defineKpSemanticStateDerivation({
    compiled: schema,
    target: handles.refs.unaffected,
    dependencies: [handles.refs.stable],
    compute: ([stable]) => {
      calls.unaffected += 1;
      return addExactRationals(stable, stable);
    }
  });
  const flaky = defineKpSemanticStateDerivation({
    compiled: schema,
    target: handles.refs.flaky,
    dependencies: [handles.refs.shared],
    compute: ([value]) => {
      calls.flaky += 1;
      if (!flakyAllowed) throw new Error("retry requested");
      return value;
    }
  });
  const definitions = [total, right, unaffected, flaky, left, shared];
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(schema, definitions)
  );
  const initial = materializeKpSemanticStateInitialSnapshot(schema, {
    derivations: definitions
  });
  const family = (
    name: "alpha" | "beta",
    target: NormalizedExactRational
  ) => {
    const transition = declareKpSemanticStateInterpolation({
      id: `${name}-interpolation`,
      sourceId: `test.composition-derived.${name}.transition`,
      target: handles.refs[name]
    });
    const definition = defineKpSemanticStateFamily({
      compiled: schema,
      handles,
      id: `change-${name}`,
      sourceId: `test.composition-derived.${name}.family`,
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
      sourceId: `test.composition-derived.${name}.application`
    });
    return {
      definition,
      application,
      member: declareKpSemanticStateCompositionMember({
        name,
        sourceId: `test.composition-derived.${name}.member`,
        application
      })
    };
  };
  const alpha = family("alpha", createExactRational(4n));
  const beta = family("beta", createExactRational(7n));
  const declaration = declareKpSemanticStateComposition({
    namespace: schema.namespace,
    localId: "independent-change",
    sourceId: "test.composition-derived.composition",
    root: declareKpSemanticStateCompositionIndependent({
      name: "cohort",
      sourceId: "test.composition-derived.cohort",
      evidence: {
        id: "disjoint-writes",
        sourceId: "test.composition-derived.evidence"
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
  flakyAllowed = false;
  Object.assign(calls, {
    shared: 0,
    left: 0,
    right: 0,
    total: 0,
    unaffected: 0,
    flaky: 0
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
  const cohortResolver = createKpSemanticStateCompositionCohortResolver({
    chain,
    handles: compositionHandles,
    bindings
  });
  const dependency = (name: "alpha" | "stable") => {
    const found = graph.input.edges.find(({ dependency }) =>
      dependency.slotId === handles.refs[name].slotId
    )?.dependency;
    if (found === undefined) throw new Error(`Missing ${name} dependency.`);
    return found;
  };
  const cohortAt = (numerator: bigint, denominator: bigint) =>
    cohortResolver.resolveCohort(
      compositionHandles.root,
      createKpSemanticProgress(numerator, denominator)
    );
  return {
    calls,
    chain,
    cohortAt,
    definitions,
    dependencies: {
      alpha: dependency("alpha"),
      stable: dependency("stable")
    },
    graph,
    handles,
    schema,
    allowFlaky() {
      flakyAllowed = true;
    },
    derivedEvaluatorAt(numerator: bigint, denominator: bigint) {
      return createKpSemanticStateCompositionDerivedEvaluator({
        graph,
        resolution: cohortAt(numerator, denominator)
      });
    }
  };
}
