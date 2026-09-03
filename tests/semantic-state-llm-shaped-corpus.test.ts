import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  kpLlmShapedTypeRepairInventory,
  runKpLlmShapedSemanticStateCorpus
} from "./fixtures/semantic-state-authoring/llm-shaped-corpus.ts";

const CORPUS_SOURCE =
  "tests/fixtures/semantic-state-authoring/llm-shaped-corpus.ts";
const TYPE_CONTRACT_SOURCE =
  "tests/type-contracts/semantic-state-llm-shaped-corpus.ts";

test("the fixed LLM-shaped corpus is deterministic and exact", () => {
  const first = runKpLlmShapedSemanticStateCorpus();
  const second = runKpLlmShapedSemanticStateCorpus();

  assert.deepEqual(second, first);
  assert.equal(JSON.stringify(second), JSON.stringify(first));
  assert.equal(Object.isFrozen(first), true);
  assert.deepEqual(first, [
    { id: "valid-update", status: "accepted", value: 3 },
    {
      id: "valid-optional-introduction",
      status: "accepted",
      value: "ready"
    },
    { id: "valid-explicit-derivation", status: "accepted", value: 7 },
    {
      id: "invalid-duplicate-definition",
      status: "repair",
      channel: "runtime",
      code: "duplicate-derived-definition",
      path: "total",
      dependencyPath: null
    },
    {
      id: "invalid-derived-cycle",
      status: "repair",
      channel: "runtime",
      code: "cyclic-derived-dependency",
      path: "first",
      dependencyPath: "second"
    },
    {
      id: "invalid-missing-definition",
      status: "repair",
      channel: "runtime",
      code: "missing-derived-definition",
      path: "missing",
      dependencyPath: null
    },
    ...kpLlmShapedTypeRepairInventory
  ]);
});

test("ordinary corpus cases contain no low-level authoring burden", () => {
  const source = readFileSync(CORPUS_SOURCE, "utf8");
  const authoring = source.split("// llm-shaped-authoring:start")[1]
    ?.split("// llm-shaped-authoring:end")[0];
  assert.notEqual(authoring, undefined);

  assert.doesNotMatch(
    authoring ?? "",
    /(?:createKpSemanticStateIdentityScope|createKpSemanticEntityVersionStore|createKpSemanticSlotAbsence|createKpAggregateSemanticSnapshot|beginKpSemanticTransaction)/u
  );
  assert.doesNotMatch(authoring ?? "", /\b(?:sourceId|revisionId|slotId|entityId):/u);
  assert.doesNotMatch(authoring ?? "", /\bas\s+(?:Kp|Readonly|unknown|never)\b/u);
  assert.doesNotMatch(authoring ?? "", /\.stage\w*\(/u);
});

test("the repair inventory is frozen and path-local", () => {
  const typeContracts = readFileSync(TYPE_CONTRACT_SOURCE, "utf8");
  assert.equal(Object.isFrozen(kpLlmShapedTypeRepairInventory), true);
  for (const repair of kpLlmShapedTypeRepairInventory) {
    assert.equal(typeContracts.includes(repair.id), true);
  }
  assert.deepEqual(
    kpLlmShapedTypeRepairInventory.map(({ id, code, path }) => ({
      id,
      code,
      path
    })),
    [
      {
        id: "invalid-value-update",
        code: "value-type-mismatch",
        path: "market.supply"
      },
      {
        id: "invalid-required-removal",
        code: "invalid-lifecycle-operation",
        path: "market.supply"
      },
      {
        id: "invalid-derived-write",
        code: "derived-write-not-allowed",
        path: "outcomes.total"
      }
    ]
  );
});
