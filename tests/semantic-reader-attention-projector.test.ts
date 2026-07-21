import assert from "node:assert/strict";
import test from "node:test";

import type { KpLessonAttentionPlan } from "../src/reader/document/public-api.ts";
import { projectKpReaderAttention } from "../src/reader/runtime/public-api.ts";

const attention: KpLessonAttentionPlan = {
  kind: "phased-attention-v1",
  phases: [
    phase("one", "orient", 0, 50),
    phase("one", "act", 50, 300),
    phase("one", "settle", 300, 400),
    phase("one", "inspect", 400, 500),
    phase("two", "orient", 500, 550),
    phase("two", "act", 550, 800),
    phase("two", "settle", 800, 900),
    phase("two", "inspect", 900, 1_000)
  ]
};

test("attention projection assigns one gaze target and motion gate per phase", () => {
  assert.deepEqual(
    [25, 175, 350, 450].map((progressPermille) => {
      const projection = projectKpReaderAttention({ attention, progressPermille })!;
      return [projection.phaseKind, projection.primaryTarget, projection.motionGate];
    }),
    [
      ["orient", "prose", "hold"],
      ["act", "visual", "play"],
      ["settle", "prose", "hold"],
      ["inspect", "correspondence", "hold"]
    ]
  );
});

test("orient and settled phases hold while act remaps the whole visual cycle", () => {
  assert.equal(projectKpReaderAttention({ attention, progressPermille: 49 })!.visualProgressPermille, 0);
  assert.equal(projectKpReaderAttention({ attention, progressPermille: 50 })!.visualProgressPermille, 0);
  assert.equal(projectKpReaderAttention({ attention, progressPermille: 175 })!.visualProgressPermille, 250);
  assert.equal(projectKpReaderAttention({ attention, progressPermille: 300 })!.visualProgressPermille, 500);
  assert.equal(projectKpReaderAttention({ attention, progressPermille: 499 })!.visualProgressPermille, 500);
  assert.equal(projectKpReaderAttention({ attention, progressPermille: 500 })!.visualProgressPermille, 500);
  assert.equal(projectKpReaderAttention({ attention, progressPermille: 1_000 })!.visualProgressPermille, 1_000);
});

test("semantic progress and projection are exact under direct seek and rewind", () => {
  const forward = [0, 175, 500, 675, 1_000].map((progressPermille) =>
    projectKpReaderAttention({ attention, progressPermille })
  );
  const rewind = [1_000, 675, 500, 175, 0].map((progressPermille) =>
    projectKpReaderAttention({ attention, progressPermille })
  ).reverse();
  assert.deepEqual(rewind, forward);
  assert.deepEqual(
    forward.map((projection) => projection?.semanticProgressPermille),
    [0, 175, 500, 675, 1_000]
  );
});

test("lessons without attention preserve the existing projection path", () => {
  assert.equal(projectKpReaderAttention({ progressPermille: 500 }), undefined);
  assert.throws(
    () => projectKpReaderAttention({ attention, progressPermille: 1_001 }),
    /within 0 through 1000/
  );
});

function phase(
  cycle: string,
  kind: "orient" | "act" | "settle" | "inspect",
  startProgressPermille: number,
  endProgressPermille: number
) {
  return {
    id: `attention.${cycle}.${kind}`,
    kind,
    beatId: `beat.${cycle}`,
    checkpointId: `checkpoint.${cycle}`,
    startProgressPermille,
    endProgressPermille,
    cue: `${kind} cue`,
    focusRefs: [`equation.${cycle}`]
  };
}
