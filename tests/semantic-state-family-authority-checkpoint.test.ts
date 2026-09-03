import assert from "node:assert/strict";
import test from "node:test";

import { defineKpSemanticStateDerivation } from
  "../src/semantic-state/authoring-derived-definition.ts";
import { compileKpSemanticStateSchema } from
  "../src/semantic-state/authoring-schema-compiler.ts";
import {
  kpStateDerived,
  kpStateGroup,
  kpStateValue
} from "../src/semantic-state/authoring-schema.ts";
import { createKpSemanticStateHandleSet } from
  "../src/semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../src/semantic-state/authoring-state-materializer.ts";
import {
  createKpSemanticStateSampleView,
  evaluateKpSemanticDerivedValue
} from "../src/semantic-state/derived-evaluator.ts";
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
import {
  createKpSemanticProgress,
  encodeKpSemanticProgress
} from "../src/semantic-state/semantic-progress.ts";
import { createKpSemanticStateFamilyEvaluator } from
  "../src/semantic-state/state-family-evaluator.ts";
import {
  defineKpSemanticStateFamily,
  kpStateFamilyParameters
} from "../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from
  "../src/semantic-state/state-family-transition.ts";
import {
  projectKpSemanticTransactionToExistingAuthority,
  type KpSemanticStateAuthorityProjection,
  type KpSemanticStateEntityDescriptor
} from "../src/semantic/semantic-state-authority-adapter.ts";

test("sampling and cache lifecycle create no durable semantic authority", () => {
  const fixture = createFixture();
  const projection = project(fixture);
  const inventory = exactAuthorityInventory(fixture, projection);
  const beforeSnapshotReference = pinKpAggregateSemanticSnapshot(
    fixture.application.commit.before
  );
  const afterSnapshotReference = pinKpAggregateSemanticSnapshot(
    fixture.application.commit.after
  );
  const beforeValueReference = pinKpSemanticSlotVersion(
    fixture.application.commit.before,
    fixture.handles.refs.value.slotId
  );
  const afterValueReference = pinKpSemanticSlotVersion(
    fixture.application.commit.after,
    fixture.handles.refs.value.slotId
  );
  const originalRecovery = createKpSemanticSnapshotRecoveryIndex([
    fixture.application.commit.before,
    fixture.application.commit.after
  ]);
  const beforeVersion = recoverKpPinnedVersion(
    originalRecovery,
    beforeValueReference
  );
  const afterVersion = recoverKpPinnedVersion(
    originalRecovery,
    afterValueReference
  );
  const evaluator = fixture.createEvaluator(2);

  for (const progress of [
    createKpSemanticProgress(1n, 4n),
    createKpSemanticProgress(1n, 2n),
    createKpSemanticProgress(1n, 4n),
    createKpSemanticProgress(3n, 4n)
  ]) {
    const sample = evaluator.at(progress);
    assert.equal(sample.kind, "ephemeral-interior");
    if (sample.kind !== "ephemeral-interior") {
      throw new Error("Expected an ephemeral interior sample.");
    }
    const view = createKpSemanticStateSampleView({
      graph: fixture.graph,
      source: sample.source,
      target: fixture.handles.refs.summary
    });
    assert.equal(view.read(), `sample:${encodeKpSemanticProgress(progress)}`);
    assert.equal("snapshotId" in sample, false);
    assert.equal("versionId" in view, false);
  }
  evaluator.reset();
  evaluator.at(createKpSemanticProgress(1n, 3n));
  evaluator.dispose();
  const recreated = fixture.createEvaluator(1);
  const endpoint = recreated.at(createKpSemanticProgress(1n));
  assert.equal(endpoint.kind, "persistent-endpoint");
  if (endpoint.kind !== "persistent-endpoint") {
    throw new Error("Expected a persistent endpoint sample.");
  }
  assert.equal(evaluateKpSemanticDerivedValue({
    graph: fixture.graph,
    snapshot: endpoint.source.snapshot,
    target: fixture.handles.refs.summary
  }), "sample:1/1");
  recreated.dispose();

  const afterProjection = project(fixture);
  assert.deepEqual(afterProjection, projection);
  assert.equal(exactAuthorityInventory(fixture, afterProjection), inventory);
  assert.equal(fixture.application.commit.before, fixture.initial);
  assert.equal(fixture.application.commit.after, fixture.updated);

  const rebuiltRecovery = createKpSemanticSnapshotRecoveryIndex([
    fixture.application.commit.after,
    fixture.application.commit.before
  ]);
  assert.equal(
    recoverKpPinnedSnapshot(rebuiltRecovery, beforeSnapshotReference),
    fixture.application.commit.before
  );
  assert.equal(
    recoverKpPinnedSnapshot(rebuiltRecovery, afterSnapshotReference),
    fixture.application.commit.after
  );
  assert.equal(
    recoverKpPinnedVersion(rebuiltRecovery, beforeValueReference),
    beforeVersion
  );
  assert.equal(
    recoverKpPinnedVersion(rebuiltRecovery, afterValueReference),
    afterVersion
  );
});

function createFixture() {
  const namespace = "lesson.family-authority-checkpoint";
  const compiled = compileKpSemanticStateSchema(namespace, kpStateGroup({
    value: kpStateValue<string>("0/1"),
    stable: kpStateValue("unchanged"),
    summary: kpStateDerived<string>()
  }));
  const handles = createKpSemanticStateHandleSet(compiled);
  const summary = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.summary,
    dependencies: [handles.refs.value],
    compute: ([value]) => `sample:${value}`
  });
  const initial = materializeKpSemanticStateInitialSnapshot(compiled, {
    derivations: [summary]
  });
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, [summary])
  );
  const transition = declareKpSemanticStateInterpolation({
    id: "value-interpolation",
    sourceId: `${namespace}.value`,
    target: handles.refs.value
  });
  const definition = defineKpSemanticStateFamily({
    compiled,
    handles,
    id: "advance-value",
    sourceId: `${namespace}.advance-value`,
    parameters: kpStateFamilyParameters<{ readonly target: string }>(),
    transitions: builder => [builder.interpolate(
      transition,
      ({ progress }) => encodeKpSemanticProgress(progress)
    )] as const,
    author(parameters, state) {
      state.value.update(() => parameters.target);
    }
  });
  const application = definition.apply(initial, {
    applicationId: "first",
    parameters: { target: "1/1" },
    sourceId: `${namespace}.application.first`
  });
  const descriptors: readonly KpSemanticStateEntityDescriptor[] = compiled.leaves
    .filter((leaf) => leaf.descriptor.kind !== "derived-value")
    .map((leaf) => ({
      entityId: leaf.identities.initialEntityId,
      semanticKind: "authority-checkpoint-value",
      label: leaf.encodedPath,
      provenance: {
        kind: "authored" as const,
        sourceId: leaf.identities.sourceIds.initialValue
      }
    }));
  return {
    application,
    definition,
    descriptors,
    graph,
    handles,
    initial,
    updated: application.commit.after,
    createEvaluator(sampleCacheCapacity: number) {
      return createKpSemanticStateFamilyEvaluator({
        definition,
        application,
        sampleCacheCapacity
      });
    }
  };
}

function project(
  fixture: ReturnType<typeof createFixture>
): KpSemanticStateAuthorityProjection {
  return projectKpSemanticTransactionToExistingAuthority({
    commit: fixture.application.commit,
    entityDescriptors: fixture.descriptors
  });
}

function exactAuthorityInventory(
  fixture: ReturnType<typeof createFixture>,
  projection: KpSemanticStateAuthorityProjection
): string {
  const commit = fixture.application.commit;
  return JSON.stringify({
    snapshots: [commit.before, commit.after],
    versions: [commit.before, commit.after].map((snapshot) =>
      snapshot.entityStores.map((store) => ({
        entityId: store.entityId,
        versions: store.versions
      }))
    ),
    journal: commit.journal,
    changeRecords: projection.changeSet.records,
    correspondence: projection.correspondenceMap,
    provenance: {
      source: projection.sourceRegistry,
      target: projection.targetRegistry
    },
    lineage: projection.lineageGraph
  });
}
