import assert from "node:assert/strict";
import test from "node:test";
import { assertArchitectureLoadingAcceptance } from "./architecture-loading-acceptance.ts";

test("loading acceptance covers initial and activated cost without hiding missing or erroneous requests", () => {
  const assets = [
    { path: "index.html", kind: ".html", gzip: 3000 },
    { path: "entry.js", kind: ".js", gzip: 510000 },
    { path: "style.css", kind: ".css", gzip: 22500 },
    { path: "font.woff2", kind: ".woff2", gzip: 43000 }
  ];
  const initial = { scenario: "canonical-tax", phase: "initial", assets, errors: [] } as const;
  assert.doesNotThrow(() => assertArchitectureLoadingAcceptance(initial));
  const activated = { ...initial, phase: "activated", assets: [...assets, { path: "deferred.js", kind: ".js", gzip: 140000 }] } as const;
  assert.doesNotThrow(() => assertArchitectureLoadingAcceptance(activated));
  assert.throws(() => assertArchitectureLoadingAcceptance({ ...activated, phase: "initial" }), /initial js/);
  assert.throws(() => assertArchitectureLoadingAcceptance({ ...initial, assets: assets.slice(0, 3) }), /Incomplete/);
  assert.throws(() => assertArchitectureLoadingAcceptance({ ...initial, errors: ["missing module"] }), /missing module/);
  assert.throws(() => assertArchitectureLoadingAcceptance({ ...initial, assets: [...assets, assets[0]!] }), /deduplicate/);
  assert.throws(() => assertArchitectureLoadingAcceptance({ ...initial, assets: [...assets, { path: "future.png", kind: ".png", gzip: 100000 }] }), /total/);
});
