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
  declareKpSemanticStateCompositionMember,
  declareKpSemanticStateCompositionSequence,
  type KpSemanticStateCompositionNodeDeclaration
} from "../src/semantic-state/state-family-composition-declaration.ts";
import {
  assembleKpSemanticStateCompositionEndpointChain,
  bindKpSemanticStateCompositionEndpoint,
  type KpSemanticStateCompositionEndpointChain,
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
import { projectKpSemanticTransactionToExistingAuthority } from
  "../src/semantic/semantic-state-authority-adapter.ts";

function fixture(input: {
  readonly failBeta?: Error;
  readonly onAuthor?: (name: "alpha" | "beta") => void;
} = {}) {
  const compiled = compileKpSemanticStateSchema(
    "lesson.composition-endpoints",
    kpStateGroup({
      alpha: kpStateValue<number>(0),
      beta: kpStateValue<number>(0),
      stable: kpStateValue("unchanged")
    })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const initial = materializeKpSemanticStateInitialSnapshot(compiled);
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, [])
  );
  const family = (name: "alpha" | "beta") => {
    const transition = declareKpSemanticStateInterpolation({
      id: `${name}-change`,
      sourceId: `test.composition-endpoints.${name}.transition`,
      target: handles.refs[name]
    });
    return defineKpSemanticStateFamily({
      compiled,
      handles,
      id: `change-${name}`,
      sourceId: `test.composition-endpoints.${name}.family`,
      parameters: kpStateFamilyParameters<{ readonly value: number }>(),
      transitions: builder => [builder.interpolate(
        transition,
        ({ before }) => before
      )] as const,
      author(parameters, state) {
        input.onAuthor?.(name);
        if (name === "beta" && input.failBeta !== undefined) {
          throw input.failBeta;
        }
        state[name].update(() => parameters.value);
      }
    });
  };
  const alphaFamily = family("alpha");
  const betaFamily = family("beta");
  const alphaApplication = alphaFamily.prepareApplication({
    applicationId: "alpha",
    parameters: { value: 4 },
    sourceId: "test.composition-endpoints.alpha.application"
  });
  const betaApplication = betaFamily.prepareApplication({
    applicationId: "beta",
    parameters: { value: 7 },
    sourceId: "test.composition-endpoints.beta.application"
  });
  const alpha = declareKpSemanticStateCompositionMember({
    name: "alpha",
    sourceId: "test.composition-endpoints.alpha.member",
    application: alphaApplication
  });
  const beta = declareKpSemanticStateCompositionMember({
    name: "beta",
    sourceId: "test.composition-endpoints.beta.member",
    application: betaApplication
  });
  const compile = (root: KpSemanticStateCompositionNodeDeclaration) => {
    const declaration = declareKpSemanticStateComposition({
      namespace: compiled.namespace,
      localId: "lesson-change",
      sourceId: "test.composition-endpoints.composition",
      root
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
  const bindings = () => [
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
    alphaFamily,
    betaFamily,
    alphaApplication,
    betaApplication,
    alpha,
    beta,
    compile,
    bindings
  };
}

test("ordered endpoint assembly retains every existing family snapshot", () => {
  const data = fixture();
  const composition = data.compile(declareKpSemanticStateCompositionSequence({
    name: "timeline",
    sourceId: "test.composition-endpoints.timeline",
    members: [data.alpha, data.beta]
  }));
  const chain = assembleKpSemanticStateCompositionEndpointChain({
    composition,
    base: data.initial,
    bindings: data.bindings()
  });

  assert.equal(chain.boundaries[0]?.snapshot, data.initial);
  assert.equal(
    chain.boundaries[1]?.snapshot,
    chain.applications[0]?.application.commit.after
  );
  assert.equal(
    chain.boundaries[2]?.snapshot,
    chain.applications[1]?.application.commit.after
  );
  assert.equal(chain.applications[0]?.application.commit.before, data.initial);
  assert.equal(
    chain.applications[1]?.application.commit.before,
    chain.applications[0]?.application.commit.after
  );
  assert.equal(data.handles.pin(chain.after).alpha.read(), 4);
  assert.equal(data.handles.pin(chain.after).beta.read(), 7);
  assert.deepEqual(
    chain.boundaries.map(({ id }) => id),
    composition.boundaries.map(({ id }) => id)
  );
  assert.equal(Object.isFrozen(chain), true);
  assert.equal(Object.isFrozen(chain.applications), true);
  assert.equal(Object.isFrozen(chain.boundaries), true);

  const stableSlotId = data.handles.refs.stable.slotId;
  const bindings = chain.boundaries.map(({ snapshot }) =>
    snapshot.bindings[snapshot.bindingIndex[stableSlotId]!]!);
  const stores = chain.boundaries.map(({ snapshot }, index) =>
    snapshot.entityStores[snapshot.entityIndex[bindings[index]!.entityId]!]!);
  assert.equal(bindings.every(binding => binding === bindings[0]), true);
  assert.equal(stores.every(store => store === stores[0]), true);

  const descriptors = data.compiled.leaves.map(leaf => ({
    entityId: leaf.identities.initialEntityId,
    semanticKind: "composition-endpoint-value",
    label: leaf.encodedPath,
    provenance: {
      kind: "authored" as const,
      sourceId: leaf.identities.sourceIds.initialValue
    }
  }));
  const projections = chain.applications.map(({ application }) =>
    projectKpSemanticTransactionToExistingAuthority({
      commit: application.commit,
      entityDescriptors: descriptors
    }));
  assert.deepEqual(
    projections.map(({ transactionId }) => transactionId),
    chain.applications.map(({ application }) =>
      application.commit.transactionId)
  );
  assert.equal(projections.every(
    ({ correspondenceMap }) => correspondenceMap.records.length > 0
  ), true);

  const recovery = createKpSemanticSnapshotRecoveryIndex(
    chain.boundaries.map(({ snapshot }) => snapshot)
  );
  for (const boundary of chain.boundaries) {
    assert.equal(recoverKpPinnedSnapshot(
      recovery,
      pinKpAggregateSemanticSnapshot(boundary.snapshot)
    ), boundary.snapshot);
  }
});

test("the complete binding set is validated before any family applies", () => {
  const authored: string[] = [];
  const data = fixture({ onAuthor: name => authored.push(name) });
  const composition = data.compile(declareKpSemanticStateCompositionSequence({
    name: "timeline",
    sourceId: "test.composition-endpoints.timeline",
    members: [data.alpha, data.beta]
  }));

  assert.throws(() => assembleKpSemanticStateCompositionEndpointChain({
    composition,
    base: data.initial,
    bindings: [data.bindings()[0]]
  }), (error: unknown) =>
    (error as KpSemanticStateCompositionEndpointError).code ===
      "missing-endpoint-binding");
  assert.deepEqual(authored, []);
});

test("a mismatched prepared application fails before endpoint work", () => {
  const authored: string[] = [];
  const data = fixture({ onAuthor: name => authored.push(name) });
  const composition = data.compile(data.alpha);
  const altered = data.alphaFamily.prepareApplication({
    applicationId: data.alphaApplication.applicationId,
    parameters: { value: 99 },
    sourceId: data.alphaApplication.source.sourceId
  });

  assert.throws(() => assembleKpSemanticStateCompositionEndpointChain({
    composition,
    base: data.initial,
    bindings: [bindKpSemanticStateCompositionEndpoint({
      definition: data.alphaFamily,
      application: altered
    })]
  }), (error: unknown) =>
    (error as KpSemanticStateCompositionEndpointError).code ===
      "application-binding-mismatch");
  assert.deepEqual(authored, []);
});

test("mid-chain author failure exposes no partial chain or input mutation", () => {
  const authored: string[] = [];
  const failure = new Error("second family stopped");
  const data = fixture({
    failBeta: failure,
    onAuthor: name => authored.push(name)
  });
  const composition = data.compile(declareKpSemanticStateCompositionSequence({
    name: "timeline",
    sourceId: "test.composition-endpoints.timeline",
    members: [data.alpha, data.beta]
  }));
  let chain: KpSemanticStateCompositionEndpointChain<
    typeof data.compiled.root
  > | undefined;

  assert.throws(() => {
    chain = assembleKpSemanticStateCompositionEndpointChain({
      composition,
      base: data.initial,
      bindings: data.bindings()
    });
  }, (error: unknown) => error === failure);
  assert.equal(chain, undefined);
  assert.deepEqual(authored, ["alpha", "beta"]);
  assert.equal(data.handles.pin(data.initial).alpha.read(), 0);
  assert.equal(data.handles.pin(data.initial).beta.read(), 0);
  assert.equal(data.initial.entityStores.every(
    store => store.versions.length === 1
  ), true);
});

test("independent cohorts remain closed until confluence certification", () => {
  const authored: string[] = [];
  const data = fixture({ onAuthor: name => authored.push(name) });
  const composition = data.compile(
    declareKpSemanticStateCompositionIndependent({
      name: "cohort",
      sourceId: "test.composition-endpoints.cohort",
      evidence: {
        id: "disjoint",
        sourceId: "test.composition-endpoints.cohort.evidence"
      },
      members: [data.alpha, data.beta]
    })
  );

  assert.throws(() => assembleKpSemanticStateCompositionEndpointChain({
    composition,
    base: data.initial,
    bindings: data.bindings()
  }), (error: unknown) =>
    (error as KpSemanticStateCompositionEndpointError).code ===
      "independent-endpoint-unsupported");
  assert.deepEqual(authored, []);
});
