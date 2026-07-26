import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  kpCanonicalEquationRendererConvergence,
  validateKpCanonicalEquationRendererConvergence
} from "../src/architecture/canonical-equation-renderer-convergence.ts";
import {
  kpSemanticReaderRouteBudget
} from "../src/architecture/semantic-reader-route-budget.ts";
import {
  kpGlyphReconciliationExperimentLedger
} from "../src/animation/semantic-glyph-reconciliation-experiment.ts";

test("canonical equation rendering has one default and no permanent query target", () => {
  const policy = kpCanonicalEquationRendererConvergence;

  assert.deepEqual(validateKpCanonicalEquationRendererConvergence(policy), []);
  assert.deepEqual(policy.currentDefaultReaderRendererIds, [
    "renderer.equation-dom"
  ]);
  assert.deepEqual(policy.temporaryQueryRendererIds, []);
  assert.equal(policy.maximumDefaultReaderRenderers, 1);
  assert.equal(policy.maximumTemporaryQueryRenderers, 0);
  assert.equal(policy.targetTemporaryQueryRenderers, 0);
});

test("canonical scene vocabulary stays at five paint kinds and six lifecycles", () => {
  const policy = kpCanonicalEquationRendererConvergence;

  assert.deepEqual(policy.paintKinds, [
    "glyph",
    "rule",
    "path",
    "delimiter",
    "accent"
  ]);
  assert.deepEqual(policy.atomLifecycles, [
    "persist",
    "merge",
    "split",
    "introduce",
    "eliminate",
    "unsupported"
  ]);
  assert.equal(policy.paintKinds.length, policy.maximumPaintKinds);
  assert.equal(policy.atomLifecycles.length, policy.maximumAtomLifecycles);
});

test("canonical scene core stays within source and vocabulary ceilings", async () => {
  const policy = kpCanonicalEquationRendererConvergence;
  const sources = await Promise.all(policy.productionSourceFiles.map(async (path) => ({
    path,
    source: await readFile(path, "utf8")
  })));
  const productionSourceBytes = sources.reduce(
    (total, { source }) => total + Buffer.byteLength(source),
    0
  );

  assert.equal(sources.length, policy.maximumProductionModules);
  assert.ok(
    productionSourceBytes <= policy.maximumProductionSourceBytes,
    `Native scene core uses ${productionSourceBytes} source bytes; ` +
      `ceiling is ${policy.maximumProductionSourceBytes}.`
  );
  for (const { path, source } of sources) {
    for (const term of policy.forbiddenProductionVocabulary) {
      assert.equal(
        new RegExp(`\\b${term}\\b`, "i").test(source),
        false,
        `${path} contains forbidden special-case vocabulary ${term}.`
      );
    }
  }
});

test("canonical scene core exposes one ephemeral renderer session contract", async () => {
  const source = await readFile(
    "src/rendering/native-katex-scene-compositor.ts",
    "utf8"
  );

  assert.equal(
    (source.match(/export interface KpNativeKatexRendererSession/g) ?? []).length,
    1
  );
  assert.equal(
    (source.match(/export function createKpNativeKatexRendererSession/g) ?? [])
      .length,
    1
  );
  assert.equal(source.includes("KpNativeKatexScenePlayback"), false);
  const sessionSource = source.slice(
    source.indexOf("export function createKpNativeKatexRendererSession"),
    source.indexOf("function assertLifecycleArity")
  );
  assert.doesNotMatch(
    sessionSource,
    /\b(fraction|radical|quadratic|viewport|card|operation|route)\b/i
  );
});

test("reader keeps no compositor query switch and one adapter loader", async () => {
  const [entry, sessionBridge, adapter, experiment, publicApi] = await Promise.all([
    readFile("src/reader/app/exemplar-entry.ts", "utf8"),
    readFile("src/reader/app/reader-canonical-equation-session.ts", "utf8"),
    readFile(
      "src/reader/renderers/equation-scene-compositor-adapter.ts",
      "utf8"
    ),
    readFile(
      "src/experiments/glyph-reconciliation-radical-inventory.ts",
      "utf8"
    ),
    readFile("src/reader/renderers/public-api.ts", "utf8")
  ]);

  assert.equal((entry.match(/kpGlyphCompositor/g) ?? []).length, 0);
  assert.doesNotMatch(entry, /lessonVariant === "(streamlined|numerator-split-merge)"/);
  assert.match(entry, /compileKpReaderCanonicalTransitionPolicy/);
  assert.match(
    entry,
    /if \(canonicalEquationSessionApplied\) \{\s*materialLayer\.sync\(\[\]\)/
  );
  assert.doesNotMatch(
    entry,
    /if \(!canonicalEquationSessionApplied\) materialLayer\.sync\(frames\)/
  );
  assert.equal(
    (publicApi.match(/loadKpReaderEquationSceneCompositorAdapter/g) ?? []).length,
    1
  );
  assert.equal(
    adapter.includes("interface KpReaderEquationSceneCompositorSession"),
    false
  );
  assert.equal(
    adapter.includes("createKpCanonicalNativeKatexSceneSession"),
    true
  );
  assert.equal(
    experiment.includes("createKpCanonicalNativeKatexSceneSession"),
    true
  );
  assert.equal(sessionBridge.includes(".playback"), false);
});

test("canonical hosts cannot reinterpret renderer-owned atom paint", async () => {
  const [entry, sessionBridge] = await Promise.all([
    readFile("src/reader/app/exemplar-entry.ts", "utf8"),
    readFile("src/reader/app/reader-canonical-equation-session.ts", "utf8")
  ]);

  assert.doesNotMatch(sessionBridge, /applyReaderMotionTrace/);
  assert.doesNotMatch(sessionBridge, /KpReaderEquationSymbolMotionFrame/);
  assert.doesNotMatch(
    sessionBridge,
    /\.style\.(?:left|top|width|height|opacity|transform)\s*=/
  );
  assert.doesNotMatch(
    sessionBridge,
    /data-kp-equation-material-owner-id/
  );
  assert.doesNotMatch(
    entry.slice(
      entry.indexOf("readerCanonicalEquationSession?.apply"),
      entry.indexOf("if (canonicalEquationSessionApplied)")
    ),
    /\bmotion\b/
  );
});

test("accepted experiment and reader payload budgets remain frozen", () => {
  const policy = kpCanonicalEquationRendererConvergence;

  assert.equal(
    kpGlyphReconciliationExperimentLedger.budget.maxRouteGzipGrowthBytes,
    policy.maximumExperimentRouteGzipGrowthBytes
  );
  assert.equal(kpSemanticReaderRouteBudget.fullEquationGzipBytes, 126_571);
  assert.equal(policy.maximumReaderRouteRegressionRatio, 0.05);
});
