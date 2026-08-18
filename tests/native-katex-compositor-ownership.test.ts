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

test("pure planning authority lives only in the scene-plan facade", async () => {
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
    assert.doesNotMatch(compositor, new RegExp(`export \\{[^}]*${authority}`));
  }
  assert.match(compositor, /from "\.\/native-katex-base-scene-plan\.ts"/);
});

test("one canonical compiler facade feeds one renderer facade", async () => {
  const [basePlan, compositor] = await Promise.all([
    readFile("src/rendering/native-katex-base-scene-plan.ts", "utf8"),
    readFile("src/rendering/native-katex-scene-compositor.ts", "utf8")
  ]);
  const renderer = compositor.slice(
    compositor.indexOf("export function createKpCanonicalNativeKatexSceneSession"),
    compositor.indexOf("function compileKpCanonicalNativeKatexProtectedPlan")
  );

  assert.equal(
    (compositor.match(/export function compileKpCanonicalNativeKatexScenePlan\b/g) ?? []).length,
    1
  );
  assert.equal(
    (compositor.match(/export function createKpCanonicalNativeKatexSceneSession\b/g) ?? []).length,
    1
  );
  assert.match(renderer, /isKpNativeKatexRendererReadyScenePlan/);
  assert.match(
    renderer,
    /plan: KpNativeKatexRendererReadyScenePlan/
  );
  assert.doesNotMatch(
    renderer,
    /compileKpCanonicalNativeKatexScenePlan\(/
  );
  assert.doesNotMatch(renderer, /prepareKpCanonicalNativeKatexScene/);
  assert.match(basePlan, /interface KpNativeKatexRendererReadyScenePlan/);
  assert.match(basePlan, /const liveRendererReadyPlans = new WeakSet/);
});

test("semantic motion and track projection enter through the base-plan port", async () => {
  const paths = [
    "src/rendering/native-katex-scene-compositor.ts",
    "src/rendering/native-katex-symbol-motion.ts",
    "src/rendering/native-katex-track-projection.ts",
    "src/rendering/native-katex-operation-choreography.ts"
  ] as const;
  const sources = await Promise.all(
    paths.map((path) => readFile(path, "utf8"))
  );
  const compositor = sources[0]!;
  const planners = sources.slice(1);

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

test("successor planning is upstream while measured paint realization stays local", async () => {
  const [basePlan, compositor, successor] = await Promise.all([
    readFile("src/rendering/native-katex-base-scene-plan.ts", "utf8"),
    readFile("src/rendering/native-katex-scene-compositor.ts", "utf8"),
    readFile("src/rendering/native-katex-successor-synthesis.ts", "utf8")
  ]);
  const directImport = compositor.slice(
    compositor.indexOf("from \"./native-katex-successor-synthesis.ts\"") - 220,
    compositor.indexOf("from \"./native-katex-successor-synthesis.ts\"") + 52
  );

  assert.doesNotMatch(directImport, /compileKpNativeKatexSuccessor/);
  assert.doesNotMatch(directImport, /partitionKpNativeKatexSuccessor/);
  assert.match(directImport, /composeKpNativeKatexSceneMaterialOwners/);
  assert.match(directImport, /sampleKpNativeKatexSuccessorSynthesisScenePlans/);
  assert.match(basePlan, /compileKpNativeKatexSuccessorSynthesisScenePlans/);
  assert.match(basePlan, /partitionKpNativeKatexSuccessorOwnedTracks/);
  assert.match(successor, /export function composeKpNativeKatexSceneMaterialOwners/);
});

test("collision, reorder, and fan-in planning enter through the base-plan port", async () => {
  const [basePlan, compositor] = await Promise.all([
    readFile("src/rendering/native-katex-base-scene-plan.ts", "utf8"),
    readFile("src/rendering/native-katex-scene-compositor.ts", "utf8")
  ]);

  assert.doesNotMatch(compositor, /from "\.\/equation-motion-path-planner\.ts"/);
  assert.doesNotMatch(compositor, /from "\.\/native-katex-fan-in-motion\.ts"/);
  assert.match(basePlan, /compileKpCollisionSafeTransitTracks/);
  assert.match(basePlan, /compileKpCollisionSafeReorderTracks/);
  assert.match(basePlan, /compileKpQualityBoundedFanInTracks/);
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
