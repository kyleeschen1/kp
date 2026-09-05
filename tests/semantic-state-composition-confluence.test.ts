import assert from "node:assert/strict";
import test from "node:test";

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
import { evaluateKpSemanticDerivedGraphTargetValue } from
  "../src/semantic-state/derived-evaluator.ts";
import {
  compileKpSemanticDerivedGraph,
  normalizeKpSemanticDerivedGraphInput
} from "../src/semantic-state/derived-graph.ts";
import {
  createKpSemanticSnapshotRecoveryIndex,
  pinKpAggregateSemanticSnapshot,
  recoverKpPinnedSnapshot
} from "../src/semantic-state/pinned-recovery.ts";
import { compileKpSemanticStateComposition } from
  "../src/semantic-state/state-family-composition-compiler.ts";
import {
  declareKpSemanticStateComposition,
  declareKpSemanticStateCompositionIndependent,
  declareKpSemanticStateCompositionMember
} from "../src/semantic-state/state-family-composition-declaration.ts";
import {
  assembleKpSemanticStateCompositionEndpointChain,
  bindKpSemanticStateCompositionEndpoint,
  type KpSemanticStateCompositionEndpointError
} from "../src/semantic-state/state-family-composition-endpoints.ts";
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

function fixture(input: {
  readonly hiddenBetaRead?: boolean;
  readonly onAuthor?: (name: "alpha" | "beta") => void;
} = {}) {
  const compiled = compileKpSemanticStateSchema(
    "lesson.composition-confluence",
    kpStateGroup({
      alpha: kpStateValue<number>(0),
      beta: kpStateValue<number>(0),
      stable: kpStateValue("unchanged"),
      sum: kpStateDerived<number>()
    })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const sum = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.sum,
    dependencies: [handles.refs.alpha, handles.refs.beta],
    compute: ([alpha, beta]) => alpha + beta
  });
  const initial = materializeKpSemanticStateInitialSnapshot(compiled, {
    derivations: [sum]
  });
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, [sum])
  );
  const family = (name: "alpha" | "beta") => {
    const transition = declareKpSemanticStateInterpolation({
      id: `${name}-change`,
      sourceId: `test.composition-confluence.${name}.transition`,
      target: handles.refs[name]
    });
    return defineKpSemanticStateFamily({
      compiled,
      handles,
      id: `change-${name}`,
      sourceId: `test.composition-confluence.${name}.family`,
      parameters: kpStateFamilyParameters<{ readonly value: number }>(),
      transitions: builder => [builder.interpolate(
        transition,
        ({ before }) => before
      )] as const,
      author(parameters, state) {
        input.onAuthor?.(name);
        const hiddenAlpha = name === "beta" && input.hiddenBetaRead
          ? state.alpha.read()
          : 0;
        state[name].update(() => parameters.value + hiddenAlpha);
      }
    });
  };
  const alphaFamily = family("alpha");
  const betaFamily = family("beta");
  const alphaApplication = alphaFamily.prepareApplication({
    applicationId: "alpha",
    parameters: { value: 4 },
    sourceId: "test.composition-confluence.alpha.application"
  });
  const betaApplication = betaFamily.prepareApplication({
    applicationId: "beta",
    parameters: { value: 7 },
    sourceId: "test.composition-confluence.beta.application"
  });
  const alpha = declareKpSemanticStateCompositionMember({
    name: "alpha",
    sourceId: "test.composition-confluence.alpha.member",
    application: alphaApplication
  });
  const beta = declareKpSemanticStateCompositionMember({
    name: "beta",
    sourceId: "test.composition-confluence.beta.member",
    application: betaApplication
  });
  const compile = (members: readonly [
    typeof alpha | typeof beta,
    typeof alpha | typeof beta
  ]) => {
    const declaration = declareKpSemanticStateComposition({
      namespace: compiled.namespace,
      localId: "lesson-change",
      sourceId: "test.composition-confluence.composition",
      root: declareKpSemanticStateCompositionIndependent({
        name: "cohort",
        sourceId: "test.composition-confluence.cohort",
        evidence: {
          id: "disjoint-writes",
          sourceId: "test.composition-confluence.evidence"
        },
        members
      })
    });
    const composition = validateKpSemanticStateComposition({
      identities: compiled.identityScope,
      declaration,
      definitions: [alphaFamily.declaration, betaFamily.declaration]
    });
    const preflight = preflightKpSemanticStateComposition({
      composition,
      base: initial,
      graphBindings: [alphaFamily, betaFamily].map(definition =>
        bindKpSemanticStateCompositionGraph({
          definitionId: definition.id,
          graph
        }))
    });
    return compileKpSemanticStateComposition({
      identities: compiled.identityScope,
      preflight
    });
  };
  const bindings = [
    bindKpSemanticStateCompositionEndpoint({
      definition: alphaFamily,
      application: alphaApplication
    }),
    bindKpSemanticStateCompositionEndpoint({
      definition: betaFamily,
      application: betaApplication
    })
  ] as const;
  return {
    compiled,
    handles,
    initial,
    graph,
    alpha,
    beta,
    compile,
    bindings
  };
}

test("cohort declaration permutations retain one canonical endpoint", () => {
  const data = fixture();
  const forward = data.compile([data.alpha, data.beta]);
  const reverse = data.compile([data.beta, data.alpha]);
  const forwardChain = assembleKpSemanticStateCompositionEndpointChain({
    composition: forward,
    base: data.initial,
    bindings: data.bindings,
    graph: data.graph
  });
  const reverseChain = assembleKpSemanticStateCompositionEndpointChain({
    composition: reverse,
    base: data.initial,
    bindings: [...data.bindings].reverse(),
    graph: data.graph
  });

  assert.deepEqual(forward, reverse);
  assert.deepEqual(forwardChain.after, reverseChain.after);
  assert.deepEqual(
    forwardChain.applications.map(({ memberId }) => memberId),
    forward.steps[0]?.members.map(({ id }) => id)
  );
  assert.deepEqual(
    forwardChain.confluence[0]?.canonicalMemberIds,
    forward.steps[0]?.members.map(({ id }) => id)
  );
  assert.deepEqual(
    forwardChain.confluence[0]?.oppositeMemberIds,
    [...forward.steps[0]!.members].reverse().map(({ id }) => id)
  );
  assert.equal(forwardChain.confluence[0]?.valueEquivalent, true);
  assert.equal(
    forwardChain.confluence[0]?.canonicalEndpointId,
    forwardChain.after.id
  );
});

test("confluence executes affected and shared-derived value checks", () => {
  const data = fixture();
  const composition = data.compile([data.alpha, data.beta]);
  const chain = assembleKpSemanticStateCompositionEndpointChain({
    composition,
    base: data.initial,
    bindings: data.bindings,
    graph: data.graph
  });
  const certificate = chain.confluence[0]!;

  assert.equal(data.handles.pin(chain.after).alpha.read(), 4);
  assert.equal(data.handles.pin(chain.after).beta.read(), 7);
  assert.equal(evaluateKpSemanticDerivedGraphTargetValue({
    graph: data.graph,
    snapshot: chain.after,
    targetSlotId: data.handles.refs.sum.slotId
  }), 11);
  assert.deepEqual(certificate.affectedSlotIds, [
    data.handles.refs.alpha.slotId,
    data.handles.refs.beta.slotId
  ].sort());
  assert.deepEqual(certificate.checkedDerivedSlotIds, [
    data.handles.refs.sum.slotId
  ]);
  assert.deepEqual(certificate.checkedSlotIds, [
    data.handles.refs.alpha.slotId,
    data.handles.refs.beta.slotId,
    data.handles.refs.stable.slotId,
    data.handles.refs.sum.slotId
  ].sort());
  assert.equal(Object.isFrozen(certificate), true);
  assert.equal(Object.isFrozen(chain.confluence), true);
});

test("canonical cohort history retains no private opposite-order endpoint", () => {
  const data = fixture();
  const chain = assembleKpSemanticStateCompositionEndpointChain({
    composition: data.compile([data.alpha, data.beta]),
    base: data.initial,
    bindings: data.bindings,
    graph: data.graph
  });
  const history = [
    chain.before,
    ...chain.applications.map(({ application }) => application.commit.after)
  ];

  assert.equal(chain.boundaries.length, 2);
  assert.equal(chain.applications.length, 2);
  assert.equal(chain.boundaries[1]?.snapshot, history[2]);
  assert.equal(chain.after, history[2]);
  assert.equal(chain.confluence.length, 1);
  const recovery = createKpSemanticSnapshotRecoveryIndex(history);
  for (const snapshot of history) {
    assert.equal(recoverKpPinnedSnapshot(
      recovery,
      pinKpAggregateSemanticSnapshot(snapshot)
    ), snapshot);
  }

  const stableSlotId = data.handles.refs.stable.slotId;
  const initialBinding = data.initial.bindings[
    data.initial.bindingIndex[stableSlotId]!
  ]!;
  const finalBinding = chain.after.bindings[
    chain.after.bindingIndex[stableSlotId]!
  ]!;
  assert.equal(finalBinding, initialBinding);
  assert.equal(
    chain.after.entityStores[chain.after.entityIndex[finalBinding.entityId]!],
    data.initial.entityStores[
      data.initial.entityIndex[initialBinding.entityId]!
    ]
  );
});

test("a hidden cross-member read fails executed confluence", () => {
  const authored: string[] = [];
  const data = fixture({
    hiddenBetaRead: true,
    onAuthor: name => authored.push(name)
  });
  let escaped: unknown;

  assert.throws(() => {
    escaped = assembleKpSemanticStateCompositionEndpointChain({
      composition: data.compile([data.alpha, data.beta]),
      base: data.initial,
      bindings: data.bindings,
      graph: data.graph
    });
  }, (error: unknown) =>
    (error as KpSemanticStateCompositionEndpointError).code ===
      "independent-confluence-failed");
  assert.equal(escaped, undefined);
  assert.deepEqual(authored, ["alpha", "beta", "beta", "alpha"]);
  assert.equal(data.handles.pin(data.initial).alpha.read(), 0);
  assert.equal(data.handles.pin(data.initial).beta.read(), 0);
});

test("missing or incompatible graph authority fails before cohort work", () => {
  const authored: string[] = [];
  const data = fixture({ onAuthor: name => authored.push(name) });
  const composition = data.compile([data.alpha, data.beta]);
  const foreignCompiled = compileKpSemanticStateSchema(
    "lesson.foreign-confluence",
    kpStateGroup({ value: kpStateValue(0) })
  );
  const foreignGraph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(foreignCompiled, [])
  );

  assert.throws(() => assembleKpSemanticStateCompositionEndpointChain({
    composition,
    base: data.initial,
    bindings: data.bindings
  }), (error: unknown) =>
    (error as KpSemanticStateCompositionEndpointError).code ===
      "missing-confluence-graph");
  assert.throws(() => assembleKpSemanticStateCompositionEndpointChain({
    composition,
    base: data.initial,
    bindings: data.bindings,
    graph: foreignGraph
  }), (error: unknown) =>
    (error as KpSemanticStateCompositionEndpointError).code ===
      "incompatible-confluence-graph");
  assert.deepEqual(authored, []);
});
