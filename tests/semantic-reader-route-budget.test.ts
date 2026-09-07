import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpSemanticReaderRouteBudget,
  kpSemanticReaderAcceptedClosureGzipBytes,
  kpSemanticReaderRouteBudget,
  type KpSemanticReaderRouteAsset
} from "../src/architecture/semantic-reader-route-budget.ts";

const asset = (
  name: string,
  gzipBytes: number,
  kind: KpSemanticReaderRouteAsset["kind"] = "javascript"
): KpSemanticReaderRouteAsset => ({ name, gzipBytes, kind });

test("semantic reader route accepts its isolated equation closure", () => {
  assert.deepEqual(checkKpSemanticReaderRouteBudget([
    asset("reader-solve-x-current.js", 12_000),
    asset("semantic-equation-token-renderer-current.js", 18_000),
    asset("reader-solve-x-current.css", 11_000, "css"),
    asset("katex-current.css", 8_000, "css"),
    asset("assets/native-katex-paint-geometry-current.js", 2_000),
    asset("KaTeX_Main-Regular-current.woff2", 26_000, "font")
  ]), []);
});

test("semantic reader route rejects editor, WebGL, parser, and unrelated family assets", () => {
  const names = [
    "equation-surface-adapter-current.js",
    "graph-webgl-three-current.js",
    "katex-runtime-current.js",
    "assets/katex-current.js",
    "assets/katex.js",
    "assets/katex.min.js",
    "micromark-current.js",
    "linear-rearrangement-choreography-current.js",
    "ftc-surface-current.js",
    "programming-adapter-current.js",
    "concept-room-shell-current.js"
  ];
  const issues = checkKpSemanticReaderRouteBudget(names.map((name) => asset(name, 1)));
  assert.deepEqual(
    issues.map((issue) => issue.code),
    names.map(() => "semantic-reader-route.forbidden-asset")
  );
});

test("semantic reader route ignores forbidden-token collisions inside Vite hashes", () => {
  assert.deepEqual(checkKpSemanticReaderRouteBudget([
    asset("equation-material-plan-DAFTCHcA.js", 1)
  ]), []);
});

test("semantic reader route rejects full and entry budget regressions independently", () => {
  const issues = checkKpSemanticReaderRouteBudget([
    asset(
      "reader-solve-x-large.js",
      kpSemanticReaderRouteBudget.readerEntryGzipBytes + 1
    ),
    asset(
      "semantic-equation-token-renderer-large.js",
      kpSemanticReaderRouteBudget.fullEquationGzipBytes
    )
  ]);
  assert.deepEqual(issues.map((issue) => issue.code), [
    "semantic-reader-route.full-equation-budget",
    "semantic-reader-route.entry-budget"
  ]);
});

test("semantic reader route budget retains five-percent headroom over the accepted closure", () => {
  assert.equal(kpSemanticReaderAcceptedClosureGzipBytes, 138_095);
  assert.equal(
    kpSemanticReaderRouteBudget.fullEquationGzipBytes,
    Math.ceil(kpSemanticReaderAcceptedClosureGzipBytes * 1.05)
  );
});
