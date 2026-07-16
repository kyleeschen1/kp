import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAnimationSaliencePlan,
  validateKpAnimationSaliencePlan,
  type KpAnimationSaliencePlan
} from "../src/animation/salience-plan.ts";
import { createKpSemanticEntity, createKpSemanticEntityRegistry } from "../src/semantic/semantic-entity-provenance.ts";
import { createKpSemanticScene } from "../src/semantic/semantic-scene-protocol.ts";

const scene = createKpSemanticScene({
  id: "scene.distribution",
  surfaceKind: "equation",
  title: "Distribution",
  registry: createKpSemanticEntityRegistry({
    entities: ["factor", "left-addend", "right-addend", "left-copy", "right-copy", "result"].map(
      (id) => createKpSemanticEntity({
        id,
        semanticKind: "term",
        label: id,
        provenance: { kind: "authored", sourceId: "draft.distribution" }
      })
    )
  })
});

test("salience plans express the complete semantic attention vocabulary", () => {
  const plan = createKpAnimationSaliencePlan({
    id: "salience.distribution",
    scenes: [scene],
    intents: [
      { id: "notice-factor", kind: "notice", targetEntityIds: ["factor"], summary: "Notice the shared factor." },
      { id: "compare-addends", kind: "compare", leftEntityIds: ["left-addend"], rightEntityIds: ["right-addend"], summary: "Compare both destinations." },
      { id: "transmit-factor", kind: "transmit", sourceEntityIds: ["factor"], targetEntityIds: ["left-copy", "right-copy"], summary: "Transmit the factor to both addends." },
      { id: "predict-result", kind: "predict", targetEntityIds: ["result"], prompt: "What expression will result?", summary: "Invite a prediction." },
      { id: "question-copy", kind: "question", targetEntityIds: ["left-copy", "right-copy"], prompt: "Where did each factor come from?", summary: "Question copy origin." },
      { id: "reveal-result", kind: "reveal", targetEntityIds: ["result"], disclosureId: "disclosure.result", summary: "Reveal the derived result." },
      { id: "context-addends", kind: "supporting-context", contextEntityIds: ["left-addend", "right-addend"], supportsIntentIds: ["transmit-factor"], summary: "Keep both addends legible." }
    ]
  });
  assert.deepEqual(plan.intents.map((intent) => intent.kind), [
    "notice", "compare", "transmit", "predict", "question", "reveal", "supporting-context"
  ]);
});

test("salience validation rejects missing scene entities and broken context intent refs", () => {
  const plan: KpAnimationSaliencePlan = {
    id: "salience.invalid",
    kind: "animation-salience-plan",
    intents: [
      { id: "notice", kind: "notice", targetEntityIds: ["missing"], summary: "Missing." },
      { id: "context", kind: "supporting-context", contextEntityIds: ["factor"], supportsIntentIds: ["missing-intent"], summary: "Broken context." }
    ]
  };
  const issues = validateKpAnimationSaliencePlan(plan, [scene]);
  assert.ok(issues.some((issue) => /missing entity missing/.test(issue.message)));
  assert.ok(issues.some((issue) => /invalid intent missing-intent/.test(issue.message)));
});

test("LLM salience intent cannot contain timing, coordinates, paths, or keyframes", () => {
  const invalid = {
    id: "salience.renderer-authored",
    kind: "animation-salience-plan",
    intents: [{
      id: "transmit",
      kind: "transmit",
      sourceEntityIds: ["factor"],
      targetEntityIds: ["left-copy"],
      summary: "Transmit the factor.",
      keyframes: [{ x: 10, y: 20 }],
      durationMs: 500,
      path: "arc"
    }]
  } as unknown as KpAnimationSaliencePlan;
  const messages = validateKpAnimationSaliencePlan(invalid, [scene]).map((issue) => issue.message);
  assert.ok(messages.includes("Low-level salience instruction keyframes is not allowed."));
  assert.ok(messages.includes("Low-level salience instruction durationMs is not allowed."));
  assert.ok(messages.includes("Low-level salience instruction path is not allowed."));
});
