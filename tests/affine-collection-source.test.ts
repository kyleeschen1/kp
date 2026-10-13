import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import test from "node:test";
import { AffineCollectionRepair, deriveAffineCollection, defaultAffineCollection, affineCollectionEnvelope, readAffineCollectionEnvelope } from "../src/semantic/affine-collection-source.ts";
import { createKpFoldableDistributionExpressionChain, verifyKpFoldableDistributionExpressionChain } from "../src/semantic/foldable-distribution-expression-chain.ts";
import { createKpFoldableDistributionEquationAnimationAsset as animation } from "../src/animation/foldable-distribution-equation-adapter.ts";
import { compileKpFoldableDistributionLessonModel as model } from "../src/reader/compiler/foldable-distribution-lesson-model.ts";
import { compileKpFoldableDistributionEquationLesson as compile } from "../src/reader/compiler/foldable-distribution-equation-lesson.ts";
import { createFoldableDistributionDescriptor } from "../src/reader/app/equation-lesson-descriptors/foldable-distribution.ts";
import { readAffineCollectionLesson } from "../src/reader/compiler/affine-collection-source.ts";
import { createKpFoldableDistributionAnnotatedEndpoints } from "../src/rendering/foldable-distribution-selector-annotated-latex.ts";
import { createKpFoldableFinalCollectionCertificate } from "../src/semantic/foldable-distribution-operation-certificates.ts";

const source = { symbol: "y", left: { coefficient: 4, constant: 1 }, right: { coefficient: 3, constant: -2 } };
const markdown = readFileSync(new URL("../content/lessons/foldable-distribution-transfer.md", import.meta.url), "utf8");

test("source-authored derivation agrees across checked trees, static readings and browser asset", () => {
  const d = deriveAffineCollection(source), lesson = model(markdown);
  const verification = verifyKpFoldableDistributionExpressionChain(createKpFoldableDistributionExpressionChain(d), d);
  assert.equal(verification.ok, true, verification.diagnostics.join("\n"));
  assert.deepEqual(verification.expected, { coefficients: { y: 7 }, constant: -2 });
  assert.deepEqual(lesson.staticMath[0]!.states.map(state => state.latex), d.latex);
  assert.deepEqual(lesson.animation, animation(d));
  assert.deepEqual(createFoldableDistributionDescriptor(readAffineCollectionEnvelope(affineCollectionEnvelope(d))).createAnimation(), lesson.animation);
  assert.equal(lesson.transcript.flatMap(beat => beat.operationIds).length, 7);
  assert.match(compile(markdown).html, /data-kp-reader-equation-source/);
  assert.match(lesson.transcript.at(-1)!.narration, /signed constants total -2/);
});

test("default asset is byte-identical after binding another source", () => {
  animation(deriveAffineCollection(source));
  assert.equal(createHash("sha256").update(JSON.stringify(animation())).digest("hex"), "db41fb0722d81c762f0b769d1b086189bb7e4efc7080fc5fac9bf78c1b469b3f");
  assert.equal(defaultAffineCollection.constant, 4);
});

test("a negative result owns its sign and retires the old inter-group addition", () => {
  const d = deriveAffineCollection(source);
  const final = createKpFoldableDistributionAnnotatedEndpoints(d).at(-1)!;
  assert.equal(final.annotated.rawLatex, "7 y -2");
  assert.ok(!final.annotated.annotations.some(annotation => annotation.selectorId === "collected.plus"));
  const records = createKpFoldableFinalCollectionCertificate(d).transformation.correspondenceMap!.records;
  const addition = records.find(record => record.sourceSelectorIds.includes("coefficient-factored.outer-plus"))!;
  assert.deepEqual(addition.targetSelectorIds, []);
  assert.equal(addition.relation, "removal");
});

test("malformed, unsupported and stale source returns a located repair", () => {
  for (const input of [{ ...source, symbol: "sin(x)" }, { ...source, left: { coefficient: 4, constant: 0 } },
    { ...source, right: { coefficient: 2, constant: -2 } }, { ...source, extra: true },
    { ...source, get symbol() { throw new Error("must not invoke accessor"); } }]) {
    assert.throws(() => deriveAffineCollection(input), (error: unknown) => error instanceof AffineCollectionRepair && error.path.startsWith("$"));
  }
  const envelope = affineCollectionEnvelope(deriveAffineCollection(source));
  assert.throws(() => readAffineCollectionEnvelope({ ...envelope, revision: "stale" }), AffineCollectionRepair);
  assert.throws(() => animation({ ...deriveAffineCollection(source) }), AffineCollectionRepair);
  assert.throws(() => readAffineCollectionLesson("```kp-affine-collection\n{}"), AffineCollectionRepair);
  assert.throws(() => readAffineCollectionLesson(markdown + markdown), AffineCollectionRepair);
  const differentClock = readAffineCollectionLesson(markdown).markdown.replace('"progressPermille": 230', '"progressPermille": 231');
  assert.throws(() => model(markdown + differentClock), AffineCollectionRepair);
});

test("bounded source pressures positive and negative constant results", () => {
  for (const symbol of ["a", "y"]) for (const a of [2, 4, 9]) for (const b of [1, 9]) for (const c of [2, 3, 9]) for (const signed of [-1, -2, -9]) {
    if (a * b + c * signed === 0) continue;
    const d = deriveAffineCollection({ symbol, left: { coefficient: a, constant: b }, right: { coefficient: c, constant: signed } });
    const verification = verifyKpFoldableDistributionExpressionChain(createKpFoldableDistributionExpressionChain(d), d);
    assert.equal(verification.ok, true, verification.diagnostics.join("\n"));
    assert.doesNotThrow(() => animation(d));
  }
});
