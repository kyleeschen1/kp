import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpPropagation,
  type KpPropagationCompileInput,
  type KpPropagationRule
} from "../src/animation/propagation-compiler.ts";
import type { KpSemanticTraversalPlan } from "../src/animation/semantic-traversal.ts";

const constraints = {
  maximumStaggerSpan: 0.36,
  requestedStaggerSpan: 0.3,
  readinessThreshold: 0.55,
  latestOverlappingStartProgress: 0.85,
  minimumParticipantDuration: 0.16,
  stableVariationStrength: 0.08
};

test("all canonical propagation rules compile deterministic semantic ranks", () => {
  const cases: ReadonlyArray<{
    rule: Exclude<KpPropagationRule, "semantic-traversal-rank">;
    participants: KpPropagationCompileInput["participants"];
    order: readonly string[];
  }> = [
    {
      rule: "causal",
      participants: participants("causalRank", [2, 0, 1]),
      order: ["item.1", "item.2", "item.0"]
    },
    {
      rule: "far-to-near",
      participants: participants("distance", [2, 8, 5]),
      order: ["item.1", "item.2", "item.0"]
    },
    {
      rule: "near-to-far",
      participants: participants("distance", [2, 8, 5]),
      order: ["item.0", "item.2", "item.1"]
    },
    {
      rule: "reading-order",
      participants: participants("readingIndex", [2, 0, 1]),
      order: ["item.1", "item.2", "item.0"]
    },
    {
      rule: "radial",
      participants: participants("radialRank", [1, 2, 0]),
      order: ["item.2", "item.0", "item.1"]
    },
    {
      rule: "branch-order",
      participants: participants("branchIndex", [1, 0, 2]),
      order: ["item.1", "item.0", "item.2"]
    }
  ];

  cases.forEach(({ rule, participants: items, order }) => {
    const plan = compileKpPropagation({
      id: `propagation.${rule}`,
      rule,
      participants: items,
      constraints
    });
    assert.equal(plan.promotable, true);
    assert.deepEqual(
      [...plan.entries]
        .sort((left, right) => left.rank - right.rank)
        .map((entry) => entry.participantId),
      order
    );
    assert.deepEqual(
      plan,
      compileKpPropagation({
        id: `propagation.${rule}`,
        rule,
        participants: items,
        constraints
      })
    );
  });
});

test("symmetric participants share a rank and onset", () => {
  const plan = compileKpPropagation({
    id: "propagation.symmetric",
    rule: "symmetric",
    participants: [
      participant("left.outer", { symmetryGroupId: "outer" }),
      participant("right.outer", { symmetryGroupId: "outer" }),
      participant("left.inner", { symmetryGroupId: "inner" }),
      participant("right.inner", { symmetryGroupId: "inner" })
    ],
    constraints
  });
  const byRank = new Map<number, typeof plan.entries>();
  plan.entries.forEach((entry) => {
    byRank.set(entry.rank, [...(byRank.get(entry.rank) ?? []), entry]);
  });
  assert.equal(byRank.size, 2);
  for (const entries of byRank.values()) {
    assert.equal(new Set(entries.map((entry) => entry.start)).size, 1);
  }
});

test("dot-product stagger follows semantic index traversal rather than screen order", () => {
  const traversal = dotProductTraversal();
  const plan = compileKpPropagation({
    id: "propagation.dot-product",
    rule: "semantic-traversal-rank",
    participants: [2, 0, 1].map((index) =>
      participant(`visual.slot.${index}`, {
        traversalParticipantId: `dot.${index}`
      })
    ),
    traversalPlan: traversal,
    constraints
  });
  assert.deepEqual(
    [...plan.entries]
      .sort((left, right) => left.start - right.start)
      .map((entry) => entry.participantId),
    ["visual.slot.0", "visual.slot.1", "visual.slot.2"]
  );
  assert.ok(
    plan.entries.every(
      (entry) =>
        entry.startsAfterPreviousReadiness && entry.overlapsPreviousRank
    )
  );
});

test("impossible cohesion and readiness bounds stop promotion", () => {
  const plan = compileKpPropagation({
    id: "propagation.too-tight",
    rule: "reading-order",
    participants: participants("readingIndex", [0, 1, 2, 3]),
    constraints: {
      ...constraints,
      maximumStaggerSpan: 0.06,
      requestedStaggerSpan: 0.06,
      minimumParticipantDuration: 0.2
    }
  });
  assert.equal(plan.promotable, false);
  assert.match(plan.diagnostics[0]!, /cohesion stagger ceiling/);
});

test("stable variation never changes semantic rank order", () => {
  const plan = compileKpPropagation({
    id: "propagation.varied",
    rule: "reading-order",
    participants: participants("readingIndex", [0, 1, 2, 3, 4]),
    constraints: {
      ...constraints,
      stableVariationStrength: 0.1,
      minimumParticipantDuration: 0.1
    }
  });
  assert.equal(plan.promotable, true);
  assert.deepEqual(
    [...plan.entries]
      .sort((left, right) => left.start - right.start)
      .map((entry) => entry.rank),
    [0, 1, 2, 3, 4]
  );
});

function participants(
  field:
    | "causalRank"
    | "distance"
    | "readingIndex"
    | "radialRank"
    | "branchIndex",
  values: readonly number[]
): KpPropagationCompileInput["participants"] {
  return values.map((value, index) =>
    participant(`item.${index}`, { [field]: value })
  );
}

function participant(
  id: string,
  fields: Partial<KpPropagationCompileInput["participants"][number]>
): KpPropagationCompileInput["participants"][number] {
  return {
    id,
    semanticEntityIds: [`entity.${id}`],
    ...fields
  };
}

function dotProductTraversal(): KpSemanticTraversalPlan {
  const items = [0, 1, 2].map((index) => ({
    id: `dot.${index}`,
    entityIds: [`left.${index}`, `right.${index}`],
    rank: index,
    semanticIndex: index
  }));
  return {
    id: "traversal.dot",
    kind: "semantic-traversal-plan",
    policy: "ranked-index",
    authorityId: "operation.dot-product",
    participants: items,
    ranks: items.map((item) => ({
      rank: item.rank,
      participantIds: [item.id],
      presentation: "show"
    })),
    cascade: {
      adjacentOnly: true,
      nextRankReadinessThreshold: 0.55
    }
  };
}
