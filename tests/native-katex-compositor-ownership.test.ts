import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  kpNativeKatexCompositorOwnership,
  validateKpNativeKatexCompositorOwnership
} from "../src/architecture/native-katex-compositor-ownership.ts";

test("every compositor responsibility has one legal target owner", () => {
  assert.deepEqual(validateKpNativeKatexCompositorOwnership(), []);
  assert.equal(kpNativeKatexCompositorOwnership.length, 12);
});

test("ownership evidence names live source authority", async () => {
  for (const responsibility of kpNativeKatexCompositorOwnership) {
    for (const evidence of responsibility.evidence) {
      const source = await readFile(evidence.path, "utf8");
      assert.ok(
        source.includes(evidence.needle),
        `${responsibility.id} lacks ${evidence.needle} in ${evidence.path}.`
      );
    }
  }
});

test("pure base planning is extracted behind the compositor compatibility facade", async () => {
  const [basePlan, compositor] = await Promise.all([
    readFile("src/rendering/native-katex-base-scene-plan.ts", "utf8"),
    readFile("src/rendering/native-katex-scene-compositor.ts", "utf8")
  ]);
  const authorities = [
    "reconcileKpNativeKatexScenes",
    "createKpNativeKatexSceneReconciliation",
    "compileKpNativeKatexHierarchicalScenePlan",
    "compileKpNativeKatexSceneTracks"
  ];

  for (const authority of authorities) {
    assert.match(basePlan, new RegExp(`export function ${authority}\\b`));
    assert.doesNotMatch(compositor, new RegExp(`function ${authority}\\b`));
  }
  assert.match(compositor, /from "\.\/native-katex-base-scene-plan\.ts"/);
});

test("semantic motion and track projection enter through the base-plan port", async () => {
  const paths = [
    "src/rendering/native-katex-scene-compositor.ts",
    "src/rendering/native-katex-symbol-motion.ts",
    "src/rendering/native-katex-track-projection.ts",
    "src/rendering/native-katex-operation-choreography.ts"
  ];
  const [compositor, ...planners] = await Promise.all(
    paths.map((path) => readFile(path, "utf8"))
  );

  assert.doesNotMatch(compositor, /from "\.\/native-katex-symbol-motion\.ts"/);
  assert.doesNotMatch(compositor, /from "\.\/native-katex-track-projection\.ts"/);
  assert.doesNotMatch(
    compositor,
    /from "\.\/native-katex-operation-choreography\.ts"/
  );
  assert.match(compositor, /compileKpNativeKatexSemanticMotionTracks/);
  assert.match(compositor, /compileKpNativeKatexProjectedTracks/);
  assert.match(compositor, /compileKpNativeKatexOperationTracks/);
  for (const planner of planners) {
    assert.doesNotMatch(planner, /from "\.\/native-katex-scene-compositor\.ts"/);
    assert.match(planner, /from "\.\/native-katex-base-scene-plan\.ts"/);
  }
});

test("pure planning and sampling cannot acquire runtime effects", () => {
  for (const responsibility of kpNativeKatexCompositorOwnership) {
    if (
      responsibility.targetLayer === "semantic-input" ||
      responsibility.targetLayer === "scene-plan-compilation" ||
      responsibility.targetLayer === "sampling"
    ) {
      assert.equal(responsibility.targetEffect, "none");
    }
  }
});

test("final paint and settlement owners cannot infer semantic truth", () => {
  for (const responsibility of kpNativeKatexCompositorOwnership) {
    if (
      responsibility.targetLayer === "paint-ownership" ||
      responsibility.targetLayer === "settlement"
    ) {
      assert.ok(
        responsibility.forbiddenAuthority.includes(
          "semantic identity inferred from glyph or LaTeX equality"
        )
      );
      assert.ok(
        responsibility.forbiddenAuthority.includes(
          "route, collision, or successor synthesis"
        )
      );
    }
  }
});
