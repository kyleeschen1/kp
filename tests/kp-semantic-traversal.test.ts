import assert from "node:assert/strict";
import test from "node:test";

import {
  orderedKpSemanticTraversalParticipants,
  validateKpSemanticTraversalPlan,
  type KpSemanticTraversalPlan
} from "../src/animation/semantic-traversal.ts";

function dotProductPlan(): KpSemanticTraversalPlan {
  const participants = [0, 1, 2].map((index) => ({
    id: `dot.contribution.${index}`,
    entityIds: [`left.${index}`, `right.${index}`, `product.${index}`],
    rank: index,
    semanticIndex: index
  }));
  return {
    id: "traversal.dot-product.three-term",
    kind: "semantic-traversal-plan",
    policy: "ranked-index",
    authorityId: "operation.dot-product.index-pairing",
    participants,
    ranks: participants.map((participant) => ({
      rank: participant.rank,
      participantIds: [participant.id],
      presentation: "show"
    })),
    cascade: {
      adjacentOnly: true,
      nextRankReadinessThreshold: 0.65
    }
  };
}

test("indexed dot-product traversal is deterministic and index-authoritative", () => {
  const plan = dotProductPlan();
  assert.deepEqual(validateKpSemanticTraversalPlan(plan), []);
  assert.deepEqual(
    orderedKpSemanticTraversalParticipants(plan).map((item) => item.semanticIndex),
    [0, 1, 2]
  );
  assert.deepEqual(
    orderedKpSemanticTraversalParticipants(plan),
    orderedKpSemanticTraversalParticipants(plan)
  );
});

test("screen reading order cannot replace explicit semantic index order", () => {
  const plan = dotProductPlan();
  const imported = {
    ...plan,
    ranks: [...plan.ranks].reverse()
  };
  assert.deepEqual(validateKpSemanticTraversalPlan(imported), []);
  assert.deepEqual(
    orderedKpSemanticTraversalParticipants(imported).map(
      (participant) => participant.semanticIndex
    ),
    [0, 1, 2]
  );
});

test("symmetric traversal may share a rank only with declared symmetry", () => {
  const plan: KpSemanticTraversalPlan = {
    ...dotProductPlan(),
    policy: "symmetric",
    participants: [
      {
        id: "pair.left",
        entityIds: ["left"],
        rank: 0,
        symmetryGroupId: "pair"
      },
      {
        id: "pair.right",
        entityIds: ["right"],
        rank: 0,
        symmetryGroupId: "pair"
      }
    ],
    ranks: [{
      rank: 0,
      participantIds: ["pair.left", "pair.right"],
      presentation: "show"
    }]
  };
  assert.deepEqual(validateKpSemanticTraversalPlan(plan), []);
});

test("dependency traversal requires every prerequisite at an earlier rank", () => {
  const plan: KpSemanticTraversalPlan = {
    ...dotProductPlan(),
    policy: "dependency",
    participants: [
      {
        id: "proof.conclusion",
        entityIds: ["conclusion"],
        rank: 0,
        dependsOnParticipantIds: ["proof.premise"]
      },
      {
        id: "proof.premise",
        entityIds: ["premise"],
        rank: 1
      }
    ],
    ranks: [
      { rank: 0, participantIds: ["proof.conclusion"], presentation: "show" },
      { rank: 1, participantIds: ["proof.premise"], presentation: "show" }
    ]
  };
  assert.ok(
    validateKpSemanticTraversalPlan(plan)
      .some((issue) => issue.message.includes("must occupy an earlier rank"))
  );
});

test("long traversal compression remains explicit semantic pedagogy", () => {
  const plan: KpSemanticTraversalPlan = {
    ...dotProductPlan(),
    policy: "compressed",
    ranks: [
      { rank: 0, participantIds: ["dot.contribution.0"], presentation: "show" },
      { rank: 1, participantIds: ["dot.contribution.1"], presentation: "compress" },
      { rank: 2, participantIds: ["dot.contribution.2"], presentation: "show" }
    ]
  };
  assert.deepEqual(validateKpSemanticTraversalPlan(plan), []);
});

test("gestalt styles cannot decide traversal ranks or omitted contributions", () => {
  const imported = {
    ...dotProductPlan(),
    styleId: "kp.organic-subtle@1.0.0"
  } as KpSemanticTraversalPlan & { styleId: string };
  assert.deepEqual(
    validateKpSemanticTraversalPlan(imported)
      .filter((issue) => issue.message.includes("cannot own semantic traversal")),
    [{
      path: "$.styleId",
      message: "Gestalt style field styleId cannot own semantic traversal."
    }]
  );
});
