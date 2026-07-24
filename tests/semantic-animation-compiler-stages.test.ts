import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  assertKpSemanticAnimationCompilerStages,
  kpSemanticAnimationCompilerStages
} from "../src/architecture/semantic-animation-compiler-stages.ts";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

test("semantic-animation compiler inventory has one executable direction", () => {
  assert.doesNotThrow(() =>
    assertKpSemanticAnimationCompilerStages(
      kpSemanticAnimationCompilerStages
    )
  );
  assert.deepEqual(
    kpSemanticAnimationCompilerStages.map(({ id }) => id),
    [
      "domain-state",
      "transformation-instance",
      "operation-resolution",
      "correspondence-lineage",
      "presentation-profile",
      "choreography",
      "domain-ir",
      "motion-plan",
      "sampled-frame",
      "domain-payload",
      "renderer-adapter"
    ]
  );
});

test("every compiler representation has one named authority and existing source", () => {
  const representations = new Map<string, string>();
  for (const stage of kpSemanticAnimationCompilerStages) {
    for (const representation of stage.representations) {
      assert.equal(
        representations.has(representation),
        false,
        `${representation} is owned by both ${representations.get(representation)} and ${stage.id}`
      );
      representations.set(representation, stage.id);
    }
    for (const sourcePath of stage.sourcePaths) {
      assert.equal(
        existsSync(join(projectRoot, sourcePath)),
        true,
        `missing compiler source ${sourcePath}`
      );
    }
  }
});

test("migration targets expose current package debt without hiding authority", () => {
  const targets = kpSemanticAnimationCompilerStages
    .filter(({ migrationStatus }) => migrationStatus === "target-owner")
    .map(({ id }) => id);

  assert.deepEqual(targets, [
    "presentation-profile",
    "sampled-frame",
    "domain-payload"
  ]);
  assert.equal(
    kpSemanticAnimationCompilerStages.some(
      ({ authority }) => authority === "renderer-output"
    ),
    true
  );
});

test("compiler inventory rejects out-of-order and empty stages", () => {
  const [domainState, transformation] = kpSemanticAnimationCompilerStages;
  assert.throws(
    () =>
      assertKpSemanticAnimationCompilerStages([
        transformation!,
        domainState!
      ]),
    /requires earlier stage/
  );
  assert.throws(
    () =>
      assertKpSemanticAnimationCompilerStages([
        {
          ...domainState!,
          representations: []
        }
      ]),
    /requires representations and sources/
  );
});
