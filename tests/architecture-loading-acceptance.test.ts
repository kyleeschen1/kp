import assert from "node:assert/strict";
import test from "node:test";
import { assertArchitectureLoadingAcceptance as check } from "../scripts/architecture-loading-acceptance.ts";

const assets = [
  { path: "index.html", kind: ".html", gzip: 3000 },
  { path: "assets/prepared.js", kind: ".js", gzip: 393000 },
  { path: "assets/style.css", kind: ".css", gzip: 23000 },
  { path: "assets/math.woff2", kind: ".woff2", gzip: 43000 }
];
test("prepared card loading budgets reject family discovery even below byte ceilings", () => {
  for (const phase of ["initial", "activated"] as const) {
    check({ scenario: "canonical-tax", phase, assets, errors: [] });
    assert.throws(() => check({ scenario: "canonical-tax", phase, assets: [
      ...assets, { path: "assets/algebra-abc123.js", kind: ".js", gzip: 1 }
    ], errors: [] }), /catalogue pack/);
  }
});
test("loading acceptance retains byte, request completeness and failure checks", () => {
  const input = { scenario: "canonical-tax" as const, phase: "initial" as const, assets, errors: [] };
  assert.throws(() => check({ ...input, assets: assets.map(a => a.kind === ".js" ? { ...a, gzip: 426000 } : a) }), /exceeds/);
  assert.throws(() => check({ ...input, assets: assets.filter(a => a.kind !== ".woff2") }), /Incomplete/);
  assert.throws(() => check({ ...input, errors: ["load failed"] }), /load failed/);
  assert.throws(() => check({ ...input, assets: [...assets, assets[0]!] }), /deduplicate/);
});
