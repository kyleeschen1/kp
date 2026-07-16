import assert from "node:assert/strict";
import test from "node:test";

import { createFunctionWrapAnimationAsset } from "../src/animation/function-wrap-adapter.ts";
import {
  compileKpChoreographyPlan
} from "../src/animation/choreography-compiler.ts";
import type { KpChoreographyVocabulary } from "../src/animation/choreography-vocabulary.ts";
import { createKpSemanticLineageGraph } from "../src/semantic/semantic-lineage-graph.ts";

function compilerInput() {
  const animation = createFunctionWrapAnimationAsset();
  const transformation = animation.transformations[0]!;
  const record = transformation.correspondenceMap!.records.find(
    (candidate) => candidate.relation === "role-change"
  )!;
  const wrapperTargets = transformation.correspondenceMap!.records
    .filter((candidate) => candidate.relation === "introduction")
    .flatMap((candidate) => candidate.targetSelectorIds);
  const vocabulary: KpChoreographyVocabulary = {
    id: "vocabulary.compiler.function-wrap",
    continuants: [{
      id: "continuant.function-wrap.x",
      meaning: "x persists as the wrapped argument.",
      relation: "role-change",
      source: {
        entityId: record.sourceSelectorIds[0]!,
        selectorIds: record.sourceSelectorIds
      },
      target: {
        entityId: record.targetSelectorIds[0]!,
        selectorIds: record.targetSelectorIds
      },
      identityAuthority: {
        kind: "correspondence",
        transformationId: transformation.id,
        correspondenceRecordId: record.id
      }
    }],
    representationalLineages: [],
    objectConstancy: [],
    materialContinuity: [],
    motionClassifications: [{
      id: "motion.function-wrap.act",
      entityIds: wrapperTargets,
      motionClass: "meaningful",
      reason: "Wrapper entry communicates function application."
    }]
  };
  const lineage = createKpSemanticLineageGraph({
    id: "lineage.function-wrap",
    sourceEntityIds: [record.sourceSelectorIds[0]!],
    targetEntityIds: [record.targetSelectorIds[0]!, ...wrapperTargets],
    edges: [
      {
        id: "lineage.function-wrap.x",
        relation: "persist",
        sourceEntityIds: record.sourceSelectorIds,
        targetEntityIds: record.targetSelectorIds,
        summary: "x persists."
      },
      {
        id: "lineage.function-wrap.wrapper",
        relation: "introduction",
        sourceEntityIds: [],
        targetEntityIds: wrapperTargets,
        summary: "The wrapper is introduced."
      }
    ]
  });
  return {
    id: "choreography.function-wrap.compiler-proof",
    timelineRefId: animation.timeline!.id,
    canonicalOperationId: "kp.core.wrap",
    transformation,
    bundle: animation.bundle,
    vocabulary,
    lifecycle: {
      id: "lifecycle.function-wrap",
      records: [
        {
          id: "lifecycle.function-wrap.x",
          kind: "continuant" as const,
          continuantId: "continuant.function-wrap.x",
          sourceEntityIds: record.sourceSelectorIds,
          targetEntityIds: record.targetSelectorIds,
          summary: "x persists."
        },
        {
          id: "lifecycle.function-wrap.wrapper",
          kind: "introduction" as const,
          cause: {
            kind: "structural-realization" as const,
            authorityId: "kp.core.wrap#wrapper"
          },
          sourceEntityIds: [],
          targetEntityIds: wrapperTargets,
          summary: "Function and delimiters enter because wrap realizes enclosure."
        }
      ]
    },
    lineage,
    salience: {
      id: "salience.function-wrap",
      kind: "transferable-salience-graph" as const,
      nodes: [
        {
          id: "salience.function-wrap.source",
          entityIds: record.sourceSelectorIds,
          role: "source" as const,
          readinessThreshold: 0.4
        },
        {
          id: "salience.function-wrap.target",
          entityIds: record.targetSelectorIds,
          role: "target" as const,
          readinessThreshold: 0.6
        }
      ],
      edges: [{
        id: "salience.function-wrap.transfer",
        sourceNodeId: "salience.function-wrap.source",
        targetNodeId: "salience.function-wrap.target",
        lineageEdgeId: "lineage.function-wrap.x",
        targetReadyAt: 0.55,
        sourceReleaseAt: 0.7
      }],
      branchGroups: []
    },
    traversal: {
      id: "traversal.function-wrap",
      kind: "semantic-traversal-plan" as const,
      policy: "execution" as const,
      authorityId: "kp.core.wrap",
      participants: [{
        id: "participant.function-wrap",
        entityIds: [...record.sourceSelectorIds, ...wrapperTargets],
        rank: 0
      }],
      ranks: [{
        rank: 0,
        participantIds: ["participant.function-wrap"],
        presentation: "show" as const
      }],
      cascade: {
        adjacentOnly: true as const,
        nextRankReadinessThreshold: 0.65
      }
    },
    layoutPlanId: "layout.function-wrap.measured",
    motifIds: ["wrap"]
  };
}

test("compiler combines semantic inputs into one governed choreography plan", () => {
  const result = compileKpChoreographyPlan(compilerInput());
  assert.equal(result.status, "compiled");
  if (result.status !== "compiled") return;
  assert.deepEqual(
    result.plan.phases.map((phase) => phase.id),
    ["orient", "reflow", "act", "settle", "release"]
  );
  assert.equal(result.plan.semantic.canonicalOperationId, "kp.core.wrap");
  assert.equal(result.plan.semantic.layoutPlanId, "layout.function-wrap.measured");
  assert.deepEqual(result.plan.semantic.motifIds, ["wrap"]);
  assert.equal(result.plan.equationTransition.transformType, "wrapFunction");
  assert.deepEqual(result, compileKpChoreographyPlan(compilerInput()));
});

test("compiler closes operation, salience, and traversal references", () => {
  const input = compilerInput();
  const result = compileKpChoreographyPlan({
    ...input,
    canonicalOperationId: "",
    salience: {
      ...input.salience,
      nodes: input.salience.nodes.map((node, index) =>
        index === 0 ? { ...node, entityIds: ["ghost.salience"] } : node
      )
    },
    traversal: {
      ...input.traversal,
      participants: input.traversal.participants.map((participant) => ({
        ...participant,
        entityIds: ["ghost.traversal"]
      }))
    }
  });
  assert.equal(result.status, "gap");
  if (result.status !== "gap") return;
  assert.deepEqual(
    result.gaps.filter((item) =>
      item.reason === "missing-operation" ||
      item.reason === "invalid-entity-reference"
    ).map((item) => item.reason),
    [
      "missing-operation",
      "invalid-entity-reference",
      "invalid-entity-reference"
    ]
  );
});

test("compiler refuses to guess when a correspondence has no continuant", () => {
  const input = compilerInput();
  const result = compileKpChoreographyPlan({
    ...input,
    vocabulary: {
      ...input.vocabulary,
      continuants: []
    }
  });
  assert.equal(result.status, "gap");
  if (result.status !== "gap") return;
  assert.ok(
    result.gaps.some((item) =>
      item.reason === "ambiguous-continuant" &&
      item.message.includes("0 semantic continuants")
    )
  );
});

test("compiler refuses duplicate identity claims instead of glyph matching", () => {
  const input = compilerInput();
  const result = compileKpChoreographyPlan({
    ...input,
    vocabulary: {
      ...input.vocabulary,
      continuants: [
        ...input.vocabulary.continuants,
        {
          ...input.vocabulary.continuants[0]!,
          id: "continuant.function-wrap.x.duplicate"
        }
      ]
    }
  });
  assert.equal(result.status, "gap");
  if (result.status !== "gap") return;
  assert.ok(result.gaps.some((item) => item.message.includes("2 semantic continuants")));
});

test("compiler returns typed gaps for missing layout or motif authority", () => {
  const input = compilerInput();
  const result = compileKpChoreographyPlan({
    ...input,
    layoutPlanId: "",
    motifIds: []
  });
  assert.equal(result.status, "gap");
  if (result.status !== "gap") return;
  assert.deepEqual(
    result.gaps.filter((item) =>
      item.reason === "missing-layout" || item.reason === "missing-motif"
    ).map((item) => item.reason),
    ["missing-layout", "missing-motif"]
  );
});
