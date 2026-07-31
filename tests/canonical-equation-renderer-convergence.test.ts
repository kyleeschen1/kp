import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import test from "node:test";

import {
  kpCanonicalEquationRendererConvergence,
  validateKpCanonicalEquationRendererConvergence
} from "../src/architecture/canonical-equation-renderer-convergence.ts";
import {
  kpSemanticReaderAcceptedClosureGzipBytes,
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

test("canonical scene source audit seals its direct local dependency closure", async () => {
  const policy = kpCanonicalEquationRendererConvergence;
  const discoveredDependencies = new Set<string>();

  for (const path of policy.productionSourceFiles) {
    const source = await readFile(path, "utf8");
    for (const match of source.matchAll(
      /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["'](\.[^"']+)["']/g
    )) {
      const dependency = relative(
        process.cwd(),
        resolve(dirname(path), match[1])
      ).replaceAll("\\", "/");
      if (
        dependency.startsWith("src/") &&
        dependency.endsWith(".ts") &&
        !policy.productionSourceFiles.includes(
          dependency as (typeof policy.productionSourceFiles)[number]
        )
      ) {
        discoveredDependencies.add(dependency);
      }
    }
  }

  const expectedDependencies = [...policy.productionDirectDependencySourceFiles];
  assert.deepEqual([...discoveredDependencies].sort(), expectedDependencies);
  assert.equal(
    expectedDependencies.length,
    policy.maximumProductionDirectDependencyModules
  );

  const dependencySources = await Promise.all(
    expectedDependencies.map(async (path) => readFile(path, "utf8"))
  );
  const dependencySourceBytes = dependencySources.reduce(
    (total, source) => total + Buffer.byteLength(source),
    0
  );
  assert.ok(
    dependencySourceBytes <=
      policy.maximumProductionDirectDependencySourceBytes,
    `Native scene direct dependencies use ${dependencySourceBytes} source bytes; ` +
      `ceiling is ${policy.maximumProductionDirectDependencySourceBytes}.`
  );
});

test("canonical scene core exposes one ephemeral renderer session contract", async () => {
  const [source, contract, exactSurface] = await Promise.all([
    readFile("src/rendering/native-katex-scene-compositor.ts", "utf8"),
    readFile("src/rendering/native-katex-scene-track-contract.ts", "utf8"),
    readFile(
      "src/editor/exact-fraction-quantity-surface-adapter.ts",
      "utf8"
    )
  ]);

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
  assert.match(contract, /readonly retire:/);
  assert.doesNotMatch(contract, /readonly dispose:/);
  const primitiveRetirement = sessionSource.slice(
    sessionSource.indexOf(
      "retire(retirement: KpNativeKatexPaintPreservingRetirement)"
    ),
    sessionSource.indexOf(
      "export function compileKpCanonicalNativeKatexPureScenePlan"
    )
  );
  assert.doesNotMatch(
    primitiveRetirement,
    /syncKpEquationMaterialLayer|(?:sourceRoot|targetRoot)\.style/
  );
  assert.doesNotMatch(exactSurface, /symbolicPlayback\.dispose/);
  assert.doesNotMatch(
    exactSurface,
    /reason: "scene-replaced"/
  );
  assert.match(
    exactSurface,
    /kind: "exact-symbolic-sequence-playable"/
  );
  assert.match(
    exactSurface,
    /previous\.targetRoot !== next\.sourceRoot/
  );
  assert.doesNotMatch(source, /dual-endpoint-interpolation/);
  assert.doesNotMatch(source, /compareKpNativeKatexTypographyHandoffModels/);
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

test("accepted experiment and reader payload budgets retain their audited guard", () => {
  const policy = kpCanonicalEquationRendererConvergence;

  assert.equal(
    kpGlyphReconciliationExperimentLedger.budget.maxRouteGzipGrowthBytes,
    policy.maximumExperimentRouteGzipGrowthBytes
  );
  assert.equal(policy.maximumReaderRouteRegressionRatio, 0.05);
  assert.equal(
    kpSemanticReaderRouteBudget.fullEquationGzipBytes,
    Math.ceil(
      kpSemanticReaderAcceptedClosureGzipBytes *
        (1 + policy.maximumReaderRouteRegressionRatio)
    )
  );
});
