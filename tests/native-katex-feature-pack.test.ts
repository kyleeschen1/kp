import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createKpNativeKatexFeaturePackLoader,
  kpNativeKatexFeaturePackLoader
} from "../src/rendering/native-katex-feature-pack-loader.ts";
import {
  kpNativeKatexFeaturePack
} from "../src/rendering/native-katex-feature-pack-implementation.ts";
import {
  settleAndObserveKpNativeKatexRenderedScene
} from "../src/rendering/native-katex-rendered-scene.ts";
import {
  createKpCanonicalNativeKatexSceneSession,
  projectKpNativeKatexSemanticPaintRelations
} from "../src/rendering/native-katex-scene-compositor.ts";

test("native KaTeX pack is an immutable view of the canonical renderer", () => {
  assert.ok(Object.isFrozen(kpNativeKatexFeaturePack));
  assert.ok(Object.isFrozen(kpNativeKatexFeaturePack.observe));
  assert.ok(Object.isFrozen(kpNativeKatexFeaturePack.compose));
  assert.equal(
    kpNativeKatexFeaturePack.observe.settleAndObserve,
    settleAndObserveKpNativeKatexRenderedScene
  );
  assert.equal(
    kpNativeKatexFeaturePack.compose.createSession,
    createKpCanonicalNativeKatexSceneSession
  );
  assert.equal(
    kpNativeKatexFeaturePack.compose.projectRelations,
    projectKpNativeKatexSemanticPaintRelations
  );
});

test("feature-pack loader coalesces concurrent and completed requests", async () => {
  let imports = 0;
  const loader = createKpNativeKatexFeaturePackLoader(async () => {
    imports += 1;
    return { kpNativeKatexFeaturePack };
  });
  const [left, right] = await Promise.all([loader.load(), loader.load()]);

  assert.equal(left, kpNativeKatexFeaturePack);
  assert.equal(right, kpNativeKatexFeaturePack);
  assert.equal(await loader.load(), kpNativeKatexFeaturePack);
  assert.equal(imports, 1);
});

test("feature-pack loader permits retry after a transient import failure", async () => {
  let imports = 0;
  const loader = createKpNativeKatexFeaturePackLoader(async () => {
    imports += 1;
    if (imports === 1) throw new Error("offline");
    return { kpNativeKatexFeaturePack };
  });

  await assert.rejects(loader.load(), /offline/);
  assert.equal(await loader.load(), kpNativeKatexFeaturePack);
  assert.equal(imports, 2);
});

test("production loader owns one literal implementation import", async () => {
  const source = await readFile(
    "src/rendering/native-katex-feature-pack-loader.ts",
    "utf8"
  );
  assert.match(
    source,
    /import\("\.\/native-katex-feature-pack-implementation\.ts"\)/u
  );
  assert.equal(
    await kpNativeKatexFeaturePackLoader.load(),
    kpNativeKatexFeaturePack
  );
});

test("canonical operation evaluation consumes the pack at its async seam", async () => {
  const source = await readFile(
    "src/editor/operation-evaluation-surface-adapter.ts",
    "utf8"
  );
  assert.match(source, /kpNativeKatexFeaturePackLoader\.load\(\)/u);
  assert.match(source, /nativeKatex\.observe\.settleAndObserve/u);
  assert.match(source, /target: targetScene,\s+nativeKatex/u);
  assert.doesNotMatch(
    source,
    /from "\.\.\/rendering\/native-katex-rendered-scene\.ts"/u
  );
});
