import test from "node:test";
import assert from "node:assert/strict";
import { collectKpHtmlBundleFiles, collectKpBundleManifestFiles, resolveKpBundleActivationRoots } from "../scripts/bundle-closure-attribution.ts";

test('activation sources retain complete ownership when moved into shared chunks', () => {
  const manifest = { direct: { file: 'assets/direct.js' }, shared: { file: 'assets/shared.js', imports: ['direct'], css: ['assets/shared.css'] } };
  const inventory = [{ file: 'assets/shared.js', modules: ['system.ts', 'other.ts'] }];
  const roots = resolveKpBundleActivationRoots(manifest, inventory, ['system.ts', 'direct', 'other.ts']);
  assert.deepEqual(roots, ['shared', 'direct']);
  assert.deepEqual(collectKpBundleManifestFiles(manifest, roots), ['assets/direct.js', 'assets/shared.css', 'assets/shared.js']);
  assert.throws(() => resolveKpBundleActivationRoots(manifest, inventory, ['missing.ts']), /lacks activation module/);
  assert.throws(() => resolveKpBundleActivationRoots({}, inventory, ['system.ts']), /lacks activation owner/);
});

test("coalesced HTML roots retain shared, direct CSS and lazy dependencies without a manifest entry", () => {
  const manifest = { shared: { file: "assets/shared.js", imports: ["dependency"], dynamicImports: ["lazy"] },
    dependency: { file: "assets/dependency.js", css: ["assets/dependency.css"] }, lazy: { file: "assets/lazy.js" } };
  const html = '<script type="module" src="/assets/shared.js"></script><link href="/assets/direct.css"><link href="/assets/font.woff2">';
  assert.deepEqual(collectKpHtmlBundleFiles(html, manifest), ["assets/dependency.css", "assets/dependency.js", "assets/direct.css", "assets/shared.js"]);
  assert.deepEqual(collectKpHtmlBundleFiles(html, manifest, true), ["assets/dependency.css", "assets/dependency.js", "assets/direct.css", "assets/lazy.js", "assets/shared.js"]);
  assert.throws(() => collectKpHtmlBundleFiles('<script src="/assets/missing.js"></script>', manifest), /lacks HTML script/);
});
