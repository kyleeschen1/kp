import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateKpPromotionMemory,
  parseKpPromotionLedger,
  type KpPromotionMemoryInput
} from "./check-animation-promotion-memory.ts";

const table = `
## Stable Frontier Order

| Rank | Stable ID | Canonical exemplar | Status | Catalog animation ID | Purpose |
| ---: | --- | --- | --- | --- | --- |
| 1 | \`kp.promotion.done\` | \`1 + 1 = 2\` | promoted | \`animation.done\` | Proven |
| 2 | \`kp.promotion.current\` | \`1/3 + 1/6 = 1/2\` across four views | next | — | Current |
| 3 | \`kp.promotion.later\` | \`278 + 156 = 434\` | queued | — | Later |
`;

const base = (): KpPromotionMemoryInput => ({
  threadMarkdown: `# Thread

Status: active
Current Next Action: Complete \`1/3 + 1/6 = 1/2\`.

${table}`,
  roadmapMarkdown:
    "See `threads/animation-library-promotion.md`; current is `1/3 + 1/6 = 1/2`.",
  nextActionsMarkdown: `# Next

## Current Queue

1. Complete \`1/3 + 1/6 = 1/2\`.
2. Continue later.
`,
  activePlanRevision: {
    status: "active",
    planRevision: {
      approval: { status: "approved" },
      phases: [{
        id: "exact-fraction",
        objective: "Show 1/3 + 1/6 = 1/2.",
        status: "active",
        evidence: ["run.current"]
      }]
    }
  },
  runContractsById: new Map([[
    "run.current",
    {
      status: "ready",
      slices: [{ id: "s01", status: "in-progress" }]
    }
  ]]),
  catalogStatusByAnimationId: new Map([
    ["animation.done", "ported"]
  ])
});

test("ledger parsing derives rank and reference keys from the sole table", () => {
  const rows = parseKpPromotionLedger(table);

  assert.deepEqual(
    rows.map(({ rank, stableId, referenceKey, status }) => ({
      rank,
      stableId,
      referenceKey,
      status
    })),
    [
      {
        rank: 1,
        stableId: "kp.promotion.done",
        referenceKey: "1 + 1 = 2",
        status: "promoted"
      },
      {
        rank: 2,
        stableId: "kp.promotion.current",
        referenceKey: "1/3 + 1/6 = 1/2",
        status: "next"
      },
      {
        rank: 3,
        stableId: "kp.promotion.later",
        referenceKey: "278 + 156 = 434",
        status: "queued"
      }
    ]
  );
});

test("aligned promotion memory resolves the first unfinished rank", () => {
  const report = evaluateKpPromotionMemory(base());

  assert.equal(report.current.stableId, "kp.promotion.current");
  assert.equal(report.activePhaseId, "exact-fraction");
  assert.equal(report.activeRunContractId, "run.current");
  assert.deepEqual(report.diagnostics, []);
});

test("a stale current action and Theseus phase fail together", () => {
  const input = base();
  const report = evaluateKpPromotionMemory({
    ...input,
    threadMarkdown: input.threadMarkdown.replace(
      "Complete `1/3 + 1/6 = 1/2`.",
      "Repeat `1 + 1 = 2`."
    ),
    activePlanRevision: {
      status: "active",
      planRevision: {
        approval: { status: "approved" },
        phases: []
      }
    }
  });

  assert.ok(
    report.diagnostics.some((issue) =>
      issue.includes("Current Next Action")
    )
  );
  assert.ok(
    report.diagnostics.some((issue) =>
      issue.includes("exactly one active phase")
    )
  );
});

test("promoted is impossible without a ported catalog certificate", () => {
  const input = base();
  const report = evaluateKpPromotionMemory({
    ...input,
    catalogStatusByAnimationId: new Map([
      ["animation.done", "partial"]
    ])
  });

  assert.ok(
    report.diagnostics.some((issue) =>
      issue.includes("is not evidence-derived as ported")
    )
  );
});

test("the next marker cannot skip the first unresolved row", () => {
  const input = base();
  const report = evaluateKpPromotionMemory({
    ...input,
    threadMarkdown: input.threadMarkdown
      .replace("| next | — | Current |", "| queued | — | Current |")
      .replace("| queued | — | Later |", "| next | — | Later |")
  });

  assert.ok(
    report.diagnostics.includes(
      "Exactly the first unresolved promotion row must have status next."
    )
  );
});
