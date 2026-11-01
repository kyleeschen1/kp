import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import test from "node:test";
import { assertDocumentTheaterProjection } from "../src/reader/compiler/document-theater-projection.ts";
import { compileKpFractionalLinearEquationLessonModel } from "../src/reader/compiler/fractional-linear-equation-lesson-model.ts";
import { fractionalPassageOperations } from "../src/reader/compiler/fractional-passage-operations.ts";

import {
  compileKpFractionalLinearEquationLesson
} from "../src/reader/compiler/public-api.ts";

const markdown = readFileSync(
  new URL("../content/lessons/solve-fractional-linear.md", import.meta.url),
  "utf8"
);

test("explicit document projection rejects missing stories and unowned mathematical progress", () => {
  const model = compileKpFractionalLinearEquationLessonModel(markdown);
  const operations = fractionalPassageOperations(model.hydration.blocks[0]!.checkpoints, model.animation.transformations);
  assert.doesNotThrow(() => assertDocumentTheaterProjection(model.document, { operations }));
  assert.throws(() => assertDocumentTheaterProjection({ ...model.document, blocks: [] }, { operations }), /complete flat beat sequence/);
  const story = model.document.blocks.find(block => block.kind === "animation-story")!;
  assert.throws(() => assertDocumentTheaterProjection({ ...model.document, blocks: [
    { ...story, attention: { kind: "phased-attention-v1", phases: [] } }
  ] }, { operations }), /complete flat beat sequence/);
  assert.throws(() => assertDocumentTheaterProjection({ ...model.document, blocks: [story, story] }, { operations }), /complete flat beat sequence/);
  assert.throws(() => assertDocumentTheaterProjection(model.document, { operations: new Map() }), /cannot advance/);
  const invalid = new Map(operations);
  invalid.set("absent", { transformationId: "missing", start: 0, end: 1 });
  assert.throws(() => assertDocumentTheaterProjection(model.document, { operations: invalid }), /missing passage/);
  invalid.delete("absent"); invalid.set("beat.subtract", { transformationId: "wrong", start: 10, end: 167 });
  assert.throws(() => assertDocumentTheaterProjection(model.document, { operations: invalid }), /source and result/);
  assert.equal(existsSync(new URL("../src/reader/compiler/fractional-caption-shell.ts", import.meta.url)), false);
});

test("fractional lesson compiles into the shared searchable equation card", () => {
  const artifact = compileKpFractionalLinearEquationLesson(markdown);

  assert.equal(artifact.kind, "compiled-lesson");
  assert.equal(artifact.document.id, "lesson.solve-x.fractional-linear");
  assert.match(artifact.html, /^<!doctype html>/);
  assert.match(artifact.html, /href="\/src\/reader\/app\/document-reader\.css"/);
  assert.match(artifact.html, /data-kp-reader-lesson-variant="fractional-linear"/);
  assert.match(artifact.html, /data-kp-reader-palette="nocturne"/);
  assert.match(artifact.html, /data-kp-reader-layout="rising-passages"/);
  assert.match(artifact.html, /class="kp-caption-frame"/);
  assert.doesNotMatch(artifact.html, /<h1 hidden/);
  assert.match(artifact.html, /class="kp-document-byline">By Codex<\/p>/);
  assert.match(artifact.html, /class="kp-rising-navigation"><summary>Options<\/summary>/);
  assert.match(artifact.html, /data-kp-reader-options-development/);
  assert.match(artifact.html, /<noscript><style data-kp-static-document>/);
  assert.equal((artifact.html.match(/data-kp-rising-beat=/g) ?? []).length, 7);
  assert.equal((artifact.html.match(/data-kp-operation-id=/g) ?? []).length, 6);
  assert.match(artifact.html, /data-kp-operation-start="500" data-kp-operation-end="667"/);
  assert.doesNotMatch(artifact.html, /<li[^>]*data-kp-beat="beat.read"[^>]*data-kp-operation-id/);
  assert.equal((artifact.html.match(/class="kp-caption-copy"/g) ?? []).length, 7);
  assert.doesNotMatch(artifact.html, /data-kp-caption-slot=|hidden="until-found"|kp-caption-preview/);
  assert.equal((artifact.html.match(/<h2 hidden/g) ?? []).length, 7);
  assert.match(artifact.html, /class="kp-caption-document-after">\s*<p[^>]*>We can check/);
  assert.match(artifact.html, /Start with <button[^>]*class="kp-semantic-link"/);
  assert.doesNotMatch(artifact.html, /Start with \[x\]/);
  assert.match(artifact.html, /data-kp-reader-equation-profile-default="standard"/);
  assert.match(artifact.html, /data-kp-reader-equation-profiles="explain,standard,fluent"/);
  assert.match(artifact.html, /data-kp-reader-exemplar-template/);
  assert.match(artifact.html, /The fraction is not a detour/);
  assert.match(artifact.html, /<math xmlns="http:\/\/www\.w3\.org\/1998\/Math\/MathML"/);
  assert.match(artifact.html, /application\/x-tex">\\frac\{x\}\{2\} \+ 3 = 7/);
  assert.match(artifact.html, /application\/x-tex">x = 8/);
  assert.match(
    artifact.html,
    /anchor\.equation\.fractional-linear\.initial\.fraction\.numerator\.x/
  );
  assert.equal(artifact.hydration.blocks[0]?.checkpoints.length, 7);
  assert.equal(
    artifact.hydration.blocks[0]?.asset.id,
    "animation.fractional-linear.solve-x-over-2"
  );
  assert.deepEqual(artifact.hydration.blocks[0]?.equationPresentation, {
    defaultProfileId: "standard",
    profileIds: ["explain", "standard", "fluent"]
  });
});

test("shared page extraction preserves the canonical solve-x compiler", async () => {
  const { compileKpXPlusThreeLesson } = await import(
    "../src/reader/compiler/public-api.ts"
  );
  const solveX = readFileSync(
    new URL("../content/lessons/solve-x.md", import.meta.url),
    "utf8"
  );
  const artifact = compileKpXPlusThreeLesson(solveX);
  assert.match(artifact.html, /data-kp-reader-lesson-variant="streamlined"/);
  assert.match(artifact.html, /href="\/src\/reader\/app\/exemplar\.css"/);
  assert.doesNotMatch(artifact.html, /fractional-exemplar\.css/);
  assert.doesNotMatch(artifact.html, /data-kp-reader-palette=/);
  assert.match(artifact.html, /anchor\.equation\.linear-solve\.initial\.lhs\.x/);
});
