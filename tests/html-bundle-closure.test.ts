import test from "node:test";
import assert from "node:assert/strict";
import { collectKpHtmlBundleFiles } from "../scripts/bundle-closure-attribution.ts";

test("coalesced HTML roots retain shared, direct CSS and lazy dependencies without a manifest entry", () => {
  const manifest = { shared: { file: "assets/shared.js", imports: ["dependency"], dynamicImports: ["lazy"] },
    dependency: { file: "assets/dependency.js", css: ["assets/dependency.css"] }, lazy: { file: "assets/lazy.js" } };
  const html = '<script type="module" src="/assets/shared.js"></script><link href="/assets/direct.css"><link href="/assets/font.woff2">';
  assert.deepEqual(collectKpHtmlBundleFiles(html, manifest), ["assets/dependency.css", "assets/dependency.js", "assets/direct.css", "assets/shared.js"]);
  assert.deepEqual(collectKpHtmlBundleFiles(html, manifest, true), ["assets/dependency.css", "assets/dependency.js", "assets/direct.css", "assets/lazy.js", "assets/shared.js"]);
  assert.throws(() => collectKpHtmlBundleFiles('<script src="/assets/missing.js"></script>', manifest), /lacks HTML script/);
});
