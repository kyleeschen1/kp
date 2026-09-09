import assert from "node:assert/strict";
import test from "node:test";
import { ProbabilityRepairGap } from "../domains/probability/binary-joint-model.ts";
import { createBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { readBayesSourceEnvelope } from "../src/experiments/bayesian-reasoning/editorial-source.ts";
import { editorialFixture } from "./fixtures/bayes-editorial-source.ts";

test("editorial source is normalized immutable syntax and keeps v1 disjoint", () => {
  const raw = editorialFixture(), parsed = readBayesSourceEnvelope(raw);
  assert.equal(parsed.schemaVersion, "kp.bayes-source.v2");
  if (parsed.schemaVersion !== "kp.bayes-source.v2") return;
  assert.equal(Object.isFrozen(parsed.editorial.passages[0]!.body[1]), true);
  raw.editorial.title = "Changed elsewhere";
  assert.equal(parsed.editorial.title, "An authored probability explanation");
  assert.equal(readBayesSourceEnvelope(createBayesDraft()).schemaVersion, "kp.bayes-source.v1");
  assert.throws(() => readBayesSourceEnvelope({ ...raw, schemaVersion: "kp.bayes-source.v1" }), /Unsupported author field/);
});

test("editorial boundary rejects unknown facts, answer authority, missing stops and oversized prose", () => {
  const raw = editorialFixture();
  for (const [editorial, path] of [
    [{ ...raw.editorial, setup: [{ fact: "proof" }] }, "$.editorial.setup[0].fact"],
    [{ ...raw.editorial, prompts: { ...raw.editorial.prompts, prediction: { ...raw.editorial.prompts.prediction, answer: "1" } } }, "$.editorial.prompts.prediction.answer"],
    [{ ...raw.editorial, passages: raw.editorial.passages.slice(1) }, "$.editorial.passages"],
    [{ ...raw.editorial, title: "x".repeat(161) }, "$.editorial.title"],
    [{ ...raw.editorial, duration: 100 }, "$.editorial.duration"]
  ] as const) assert.throws(() => readBayesSourceEnvelope({ ...raw, editorial }),
    (error: unknown) => error instanceof ProbabilityRepairGap && error.diagnostic.path === path);
  assert.throws(() => readBayesSourceEnvelope({ ...raw, schemaVersion: "kp.bayes-source.v3" }), /Use kp.bayes-source/);
});
