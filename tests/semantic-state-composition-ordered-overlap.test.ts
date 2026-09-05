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
  pinKpSemanticSlotVersion,
  recoverKpPinnedSnapshot,
  recoverKpPinnedVersion
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
  bindKpSemanticStateCompositionEndpoint
} from "../src/semantic-state/state-family-composition-endpoints.ts";
import {
  bindKpSemanticStateCompositionGraph,
  preflightKpSemanticStateComposition,
  type KpSemanticStateCompositionPreflightError
} from "../src/semantic-state/state-family-composition-preflight.ts";
import { validateKpSemanticStateComposition } from
  "../src/semantic-state/state-family-composition-validation.ts";
import {
  defineKpSemanticStateFamily,
  kpStateFamilyParameters
} from "../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from
  "../src/semantic-state/state-family-transition.ts";

function fixture() {
  const authored: number[] = [];
  const compiled = compileKpSemanticStateSchema(
    "lesson.composition-ordered-overlap",
    kpStateGroup({
      value: kpStateValue<number>(0),
      stable: kpStateValue("unchanged")
    })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const initial = materializeKpSemanticStateInitialSnapshot(compiled);
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, [])
  );
  const transition = declareKpSemanticStateInterpolation({
    id: "value-change",
    sourceId: "test.composition-ordered-overlap.value.transition",
    target: handles.refs.value
  });
  const family = defineKpSemanticStateFamily({
    compiled,
    handles,
    id: "set-value",
    sourceId: "test.composition-ordered-overlap.family",
    parameters: kpStateFamilyParameters<{ readonly value: number }>(),
    transitions: builder => [builder.interpolate(
      transition,
      ({ before }) => before
    )] as const,
    author(parameters, state) {
      authored.push(parameters.value);
      state.value.update(() => parameters.value);
    }
  });
  const firstApplication = family.prepareApplication({
    applicationId: "first",
    parameters: { value: 3 },
    sourceId: "test.composition-ordered-overlap.first.application"
  });
  const secondApplication = family.prepareApplication({
    applicationId: "second",
    parameters: { value: 8 },
    sourceId: "test.composition-ordered-overlap.second.application"
  });
  const first = declareKpSemanticStateCompositionMember({
    name: "first",
    sourceId: "test.composition-ordered-overlap.first.member",
    application: firstApplication
  });
  const second = declareKpSemanticStateCompositionMember({
    name: "second",
    sourceId: "test.composition-ordered-overlap.second.member",
    application: secondApplication
  });
  const prepare = (root: KpSemanticStateCompositionNodeDeclaration) => {
    const declaration = declareKpSemanticStateComposition({
      namespace: compiled.namespace,
      localId: "ordered-overlap",
      sourceId: "test.composition-ordered-overlap.composition",
      root
    });
    const composition = validateKpSemanticStateComposition({
      identities: compiled.identityScope,
      declaration,
      definitions: [family.declaration]
    });
    const preflight = preflightKpSemanticStateComposition({
      composition,
      base: initial,
      graphBindings: [bindKpSemanticStateCompositionGraph({
        definitionId: family.id,
        graph
      })]
    });
    return compileKpSemanticStateComposition({
      identities: compiled.identityScope,
      preflight
    });
  };
  const bindings = [firstApplication, secondApplication].map(application =>
    bindKpSemanticStateCompositionEndpoint({ definition: family, application })
  );
  return {
    authored,
    compiled,
    handles,
    initial,
    graph,
    family,
    first,
    second,
    prepare,
    bindings
  };
}

test("an explicit repeated-write sequence retains its middle boundary", () => {
  const data = fixture();
  const composition = data.prepare(declareKpSemanticStateCompositionSequence({
    name: "timeline",
    sourceId: "test.composition-ordered-overlap.timeline",
    members: [data.first, data.second]
  }));
  const chain = assembleKpSemanticStateCompositionEndpointChain({
    composition,
    base: data.initial,
    bindings: data.bindings
  });
  const middle = chain.boundaries[1]!.snapshot;
  const final = chain.boundaries[2]!.snapshot;

  assert.deepEqual(data.authored, [3, 8]);
  assert.equal(data.handles.pin(middle).value.read(), 3);
  assert.equal(data.handles.pin(final).value.read(), 8);
  assert.equal(chain.applications[0]?.application.commit.after, middle);
  assert.equal(chain.applications[1]?.application.commit.before, middle);
  assert.equal(chain.applications[1]?.application.commit.after, final);
  assert.equal(chain.confluence.length, 0);

  const recovery = createKpSemanticSnapshotRecoveryIndex(
    chain.boundaries.map(({ snapshot }) => snapshot)
  );
  assert.equal(recoverKpPinnedSnapshot(
    recovery,
    pinKpAggregateSemanticSnapshot(middle)
  ), middle);
  assert.equal(recoverKpPinnedSnapshot(
    recovery,
    pinKpAggregateSemanticSnapshot(final)
  ), final);
  assert.equal(recoverKpPinnedVersion(
    recovery,
    pinKpSemanticSlotVersion(middle, data.handles.refs.value.slotId)
  ).value, 3);
  assert.equal(recoverKpPinnedVersion(
    recovery,
    pinKpSemanticSlotVersion(final, data.handles.refs.value.slotId)
  ).value, 8);
});

test("repeated writes remain two ordinary transactions, not last-writer-wins", () => {
  const data = fixture();
  const chain = assembleKpSemanticStateCompositionEndpointChain({
    composition: data.prepare(declareKpSemanticStateCompositionSequence({
      name: "timeline",
      sourceId: "test.composition-ordered-overlap.timeline",
      members: [data.first, data.second]
    })),
    base: data.initial,
    bindings: data.bindings
  });
  const valueEntityId = data.initial.bindings[
    data.initial.bindingIndex[data.handles.refs.value.slotId]!
  ]!.entityId;

  assert.equal(chain.applications.length, 2);
  assert.equal(chain.applications.every(
    ({ application }) => application.commit.journal.length === 1
  ), true);
  assert.equal(chain.before.entityStores[
    chain.before.entityIndex[valueEntityId]!
  ]!.versions.length, 1);
  assert.equal(chain.boundaries[1]!.snapshot.entityStores[
    chain.boundaries[1]!.snapshot.entityIndex[valueEntityId]!
  ]!.versions.length, 2);
  assert.equal(chain.after.entityStores[
    chain.after.entityIndex[valueEntityId]!
  ]!.versions.length, 3);
});

test("reversing an explicit sequence reverses its inspectable meaning", () => {
  const data = fixture();
  const forward = data.prepare(declareKpSemanticStateCompositionSequence({
    name: "timeline",
    sourceId: "test.composition-ordered-overlap.timeline",
    members: [data.first, data.second]
  }));
  const reversed = data.prepare(declareKpSemanticStateCompositionSequence({
    name: "timeline",
    sourceId: "test.composition-ordered-overlap.timeline",
    members: [data.second, data.first]
  }));
  const reversedChain = assembleKpSemanticStateCompositionEndpointChain({
    composition: reversed,
    base: data.initial,
    bindings: [...data.bindings].reverse()
  });

  assert.notDeepEqual(forward.steps, reversed.steps);
  assert.equal(
    data.handles.pin(reversedChain.boundaries[1]!.snapshot).value.read(),
    8
  );
  assert.equal(data.handles.pin(reversedChain.after).value.read(), 3);
});

test("the same overlapping pair cannot claim independence", () => {
  const data = fixture();
  const declaration = declareKpSemanticStateComposition({
    namespace: data.compiled.namespace,
    localId: "ordered-overlap",
    sourceId: "test.composition-ordered-overlap.composition",
    root: declareKpSemanticStateCompositionIndependent({
      name: "cohort",
      sourceId: "test.composition-ordered-overlap.cohort",
      evidence: {
        id: "claimed-independent",
        sourceId: "test.composition-ordered-overlap.evidence"
      },
      members: [data.first, data.second]
    })
  });
  const composition = validateKpSemanticStateComposition({
    identities: data.compiled.identityScope,
    declaration,
    definitions: [data.family.declaration]
  });

  assert.throws(() => preflightKpSemanticStateComposition({
    composition,
    base: data.initial,
    graphBindings: [bindKpSemanticStateCompositionGraph({
      definitionId: data.family.id,
      graph: data.graph
    })]
  }), (error: unknown) =>
    (error as KpSemanticStateCompositionPreflightError).diagnostics.some(
      ({ code }) => code === "independent-write-conflict"
    ));
  assert.deepEqual(data.authored, []);
});
