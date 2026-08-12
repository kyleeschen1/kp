import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpSchemeFactorialFirstExpansion,
  defineKpSchemeFactorialFirstExpansion,
  sampleKpSchemeFactorialFirstExpansion
} from "../src/animation/scheme-factorial-first-expansion.ts";
import { renderKpSchemeFirstExpansionHtml } from
  "../src/rendering/scheme-factorial-first-expansion-html.ts";
import { parseKpSchemeFactorialSource } from
  "../src/semantic/scheme-factorial-parser.ts";
import { readKpSchemeFactorialTraceArtifact } from
  "../src/semantic/scheme-factorial-trace-artifact.ts";

const expansion = compileKpSchemeFactorialFirstExpansion({
  document: parseKpSchemeFactorialSource(),
  trace: readKpSchemeFactorialTraceArtifact().trace
});

test("compiles one trace-certified call opening", () => {
  assert.equal(expansion.source.nativeCode, "(factorial 3)");
  assert.equal(expansion.target.nativeCode, "(* 3 (factorial 2))");
  assert.deepEqual(expansion.actions.map(({ kind }) => kind), [
    "OpenCall",
    "BindValue",
    "ChooseBranch",
    "SuspendExpression",
    "ResolveExpression"
  ]);
  assert.equal(expansion.dispositions.length, expansion.source.tokens.length);
  assert.equal(Object.isFrozen(expansion), true);
});

test("accounts for each source and target material exactly once", () => {
  const sources = expansion.dispositions.map(({ sourceMaterialId }) =>
    sourceMaterialId);
  const continuedTargets = expansion.dispositions.map(({ targetMaterialId }) =>
    targetMaterialId);
  const introducedTargets = expansion.target.tokens
    .filter(({ introducedByActionId }) => introducedByActionId !== null)
    .map(({ id }) => id);
  assert.deepEqual(new Set(sources), new Set(expansion.source.tokens.map(({ id }) => id)));
  assert.deepEqual(
    new Set([...continuedTargets, ...introducedTargets]),
    new Set(expansion.target.tokens.map(({ id }) => id))
  );

  const invalid = {
    ...structuredClone(expansion),
    dispositions: expansion.dispositions.slice(1)
  };
  assert.throws(() => defineKpSchemeFactorialFirstExpansion(invalid),
    /exactly one disposition/u);
});

test("direct and reverse sampling are history independent with exact endpoints", () => {
  const forward = Array.from({ length: 101 }, (_, index) =>
    sampleKpSchemeFactorialFirstExpansion(expansion, index / 100));
  const reverse = Array.from({ length: 101 }, (_, index) =>
    sampleKpSchemeFactorialFirstExpansion(expansion, (100 - index) / 100))
    .reverse();
  assert.deepEqual(reverse, forward);
  assert.equal(forward[0]?.nativeCode, "(factorial 3)");
  assert.equal(forward.at(-1)?.nativeCode, "(* 3 (factorial 2))");
  assert.throws(() => sampleKpSchemeFactorialFirstExpansion(expansion, Number.NaN),
    /finite/u);
});

test("renders code glyphs as the only visual material owner", () => {
  const html = renderKpSchemeFirstExpansionHtml({
    expansion,
    sample: sampleKpSchemeFactorialFirstExpansion(expansion, 0.5)
  });
  assert.match(html, /data-kp-scheme-paint-owner="code-material"/u);
  assert.match(html, /data-kp-scheme-motion-id=/u);
  assert.match(html, /retained-three/u);
  assert.doesNotMatch(html, /<svg|<circle|particle|parameter-cell/u);
});
