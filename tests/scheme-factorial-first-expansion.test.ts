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

test("compiles one trace-certified procedure expansion", () => {
  assert.equal(expansion.source.nativeCode, "(factorial 3)");
  assert.equal(expansion.target.nativeCode, "(* 3 (factorial 2))");
  assert.deepEqual(expansion.actions.map(({ kind }) => kind), [
    "ExpandProcedure",
    "BindArgument",
    "ProjectBinding",
    "ChooseBranch",
    "SuspendExpression",
    "ReducePrimitive"
  ]);
  assert.deepEqual(expansion.states.map(({ id }) => id), [
    "call",
    "expanded-application",
    "bound-body",
    "selected-branch",
    "suspended-product"
  ]);
  assert.match(expansion.states[1]!.nativeCode, /lambda \(n\)/u);
  assert.match(expansion.states[2]!.nativeCode, /\(if \(= 3 0\)/u);
  assert.equal(expansion.sourceDispositions.length, expansion.source.tokens.length);
  assert.equal(Object.isFrozen(expansion), true);
});

test("separates source glyphs, activation syntax, bindings, and results", () => {
  const sources = expansion.sourceDispositions.map(({ sourceMaterialId }) =>
    sourceMaterialId);
  assert.deepEqual(new Set(sources), new Set(expansion.source.tokens.map(({ id }) => id)));
  const outerOperator = expansion.source.tokens.find(({ lexeme }) =>
    lexeme === "factorial")!;
  const recursiveOperator = expansion.target.tokens.find(({ lexeme }) =>
    lexeme === "factorial")!;
  assert.notEqual(outerOperator.id, recursiveOperator.id);
  assert.equal(outerOperator.provenance.kind, "source");
  assert.equal(recursiveOperator.provenance.kind, "activation");
  assert.notEqual(outerOperator.provenance.sourceOccurrenceId,
    recursiveOperator.provenance.sourceOccurrenceId);

  const sourceArgument = expansion.source.tokens.find(({ lexeme }) =>
    lexeme === "3")!;
  const targetFactor = expansion.target.tokens.find(({ lexeme }) =>
    lexeme === "3")!;
  assert.notEqual(sourceArgument.id, targetFactor.id);
  assert.equal(sourceArgument.provenance.kind, "source");
  assert.equal(targetFactor.provenance.kind, "binding-projection");
  const argumentDisposition = expansion.sourceDispositions.find(
    ({ sourceMaterialId }) => sourceMaterialId === sourceArgument.id)!;
  assert.equal(argumentDisposition.kind, "bind");

  const invalid = {
    ...structuredClone(expansion),
    sourceDispositions: expansion.sourceDispositions.slice(1)
  };
  assert.throws(() => defineKpSchemeFactorialFirstExpansion(invalid),
    /exactly one terminal disposition/u);
});

test("rejects glyph-equality continuity for operator and argument", () => {
  const invalidOperator = structuredClone(expansion);
  const outerOperator = invalidOperator.source.tokens.find(({ lexeme }) =>
    lexeme === "factorial")!;
  const recursiveOperator = invalidOperator.target.tokens.find(({ lexeme }) =>
    lexeme === "factorial")!;
  Object.assign(recursiveOperator, {
    id: outerOperator.id,
    provenance: outerOperator.provenance
  });
  assert.throws(() => defineKpSchemeFactorialFirstExpansion(invalidOperator),
    /changes identity|recursive operator|cannot also terminate/u);

  const invalidArgument = structuredClone(expansion);
  const sourceArgument = invalidArgument.source.tokens.find(({ lexeme }) =>
    lexeme === "3")!;
  const targetFactor = invalidArgument.target.tokens.find(({ lexeme }) =>
    lexeme === "3")!;
  Object.assign(targetFactor, {
    id: sourceArgument.id,
    provenance: sourceArgument.provenance
  });
  assert.throws(() => defineKpSchemeFactorialFirstExpansion(invalidArgument),
    /changes identity|Body values|cannot also terminate/u);
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
  assert.match(html, /data-kp-scheme-provenance-kind=/u);
  assert.match(html, /binding-projection/u);
  assert.doesNotMatch(html, /<svg|<circle|particle|parameter-cell/u);
});
