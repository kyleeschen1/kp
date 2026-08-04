import assert from "node:assert/strict";
import test from "node:test";

import { compileKpLispApplicationMotionProgram } from
  "../src/animation/lisp-application-motion.ts";
import {
  compileKpLispEvaluationMotionProgram,
  sampleKpLispEvaluationMotion,
  type KpLispEvaluationMotionFrame,
  type KpLispEvaluationMotionProgram
} from "../src/animation/lisp-evaluation-motion.ts";
import { projectKpLispLambdaSourceMaterial } from
  "../src/animation/lisp-s-expression-material-projection.ts";
import {
  kpLispEvaluationMotionCss,
  renderKpLispEvaluationMotionHtml
} from "../src/rendering/lisp-evaluation-motion-html.ts";
import { createKpLispLambdaApplicationFixture } from
  "../src/semantic/lisp-lambda-application-fixture.ts";

const fixture = createKpLispLambdaApplicationFixture();
const material = projectKpLispLambdaSourceMaterial(fixture);

function compile(width = 800): KpLispEvaluationMotionProgram {
  const application = compileKpLispApplicationMotionProgram({
    fixture,
    material,
    availableWidthPx: width
  });
  return compileKpLispEvaluationMotionProgram({
    fixture,
    material,
    reconstruction: application.reconstruction,
    availableWidthPx: width
  });
}

test("composes the three authored evaluation checkpoints into a complete sequence", () => {
  const frames = denseFrames(compile(), 600);
  assert.deepEqual([...new Set(frames.map(({ checkpointId }) => checkpointId))], [
    "reduction-ready",
    "inputs-gathered",
    "result-settled"
  ]);
  for (const phase of [
    "structural-hold",
    "gather",
    "inputs-gathered",
    "operate",
    "emit",
    "settle",
    "settled"
  ] as const) {
    assert.ok(frames.some((frame) => frame.phase === phase), `contains ${phase}`);
  }
});

test("forms a structural plus bead before any computation occurs", () => {
  const program = compile();
  const start = sampleKpLispEvaluationMotion(program, 0);
  const held = denseFrames(program, 500).find((frame) =>
    frame.phase === "structural-hold" && frame.operatorBead.opacity === 1)!;

  assert.equal(start.canonicalEndpoint, "reconstructed");
  assert.equal(start.operatorBead.opacity, 0);
  assert.equal(source(start, "derived.plus").opacity, 1);
  assert.equal(held.operatorBead.nativeCode, "+");
  assert.equal(held.operatorBead.causalPulse, 0);
  assert.equal(source(held, "derived.plus").opacity, 0);
  assert.equal(held.result.opacity, 0);
  assert.ok(held.sourceTokens.filter(({ disposition }) =>
    disposition === "input-consumed").every(({ opacity, scale }) =>
      opacity === 1 && scale === 1));
});

test("gathers and absorbs exact operands without pretending that fold computes", () => {
  const frames = denseFrames(compile(), 800);
  const gathering = frames.find((frame) => frame.phase === "gather" &&
    source(frame, "derived.argument.four").scale < 1 &&
    source(frame, "derived.argument.four").scale > 0.1)!;
  const gathered = frames.find((frame) => frame.phase === "inputs-gathered")!;
  const operator = gathering.operatorBead;
  const operand = source(gathering, "derived.argument.four");

  assert.equal(gathering.result.opacity, 0);
  assert.ok(operand.xEm < source(heldSource(), "derived.argument.four").xEm);
  assert.ok(operand.xEm > operator.xEm - operand.scale);
  assert.ok(gathered.sourceTokens.filter(({ disposition }) =>
    disposition === "input-consumed").every(({ opacity, scale }) =>
      opacity === 0 && scale === 0.001));
  assert.equal(gathered.operatorBead.causalPulse, 0);
  assert.equal(gathered.result.opacity, 0);
  assert.equal(compile().reduction.operation, "reduce");
  assert.equal(compile().reduction.preservesStructure, false);
});

test("makes the plus bead visibly causal before exact result emergence", () => {
  const frames = denseFrames(compile(), 900);
  const operating = frames.find((frame) => frame.phase === "operate" &&
    frame.operatorBead.causalPulse > 0.8)!;
  const emitting = frames.find((frame) => frame.phase === "emit" &&
    frame.result.opacity > 0 && frame.result.opacity < 1)!;

  assert.equal(operating.result.opacity, 0);
  assert.ok(operating.operatorBead.scale > compile().tuning.values.compression);
  assert.equal(emitting.result.emittedFromOperatorId, "derived.plus");
  assert.deepEqual(emitting.result.originIds, [
    "occurrence.argument.four",
    "occurrence.body.one"
  ]);
  assert.ok(emitting.result.xEm > operating.operatorBead.xEm - 1);
});

test("atomically settles as one ordinary selectable exact result", () => {
  const end = sampleKpLispEvaluationMotion(compile(), 1);
  const html = renderKpLispEvaluationMotionHtml(end);

  assert.equal(end.phase, "settled");
  assert.equal(end.canonicalEndpoint, "result");
  assert.equal(end.result.nativeCode, "5");
  assert.equal(end.result.opacity, 1);
  assert.equal(end.result.scale, 1);
  assert.ok(end.sourceTokens.every(({ opacity }) => opacity === 0));
  assert.equal(end.operatorBead.opacity, 0);
  assert.equal(count(html, "data-kp-lisp-native-code="), 1);
  assert.equal(count(html, "data-kp-lisp-material-id="), 1);
  assert.equal(codeText(html), "5");
  assert.doesNotMatch(html, /data-kp-lisp-reduction-operator|data-kp-lisp-result-material/u);
});

test("keeps a fixed 20px semantic DOM stage with no evaluation SVG", () => {
  for (const width of [320, 800]) {
    const program = compile(width);
    assert.equal(program.geometry.fontSizePx, 20);
    assert.equal(program.geometry.stage.heightEm, 12);
    const frame = denseFrames(program, 300).find(({ phase }) => phase === "operate")!;
    const html = renderKpLispEvaluationMotionHtml(frame);
    assert.equal(count(html, "data-kp-lisp-paint-owner="), 1);
    assert.equal(codeText(html), "(+ 4 1)");
    assert.doesNotMatch(html, /<svg|<canvas/u);
  }
  assert.match(kpLispEvaluationMotionCss, /font: 400 20px/u);
  assert.match(kpLispEvaluationMotionCss, /min-block-size: 12em/u);
});

test("exposes every reduction disposition on its source-derived DOM material", () => {
  const held = heldSource();
  const html = renderKpLispEvaluationMotionHtml(held);
  assert.equal(count(html, "data-kp-lisp-reduction-disposition="), 5);
  assert.match(html, /data-kp-lisp-reduction-disposition="operator-root"/u);
  assert.equal(count(html, "data-kp-lisp-reduction-disposition=\"input-consumed\""), 2);
  assert.equal(count(html, "data-kp-lisp-reduction-disposition=\"reduction-shell-consumed\""), 2);
});

test("reconstructs every direct seek exactly in either traversal order", () => {
  for (const width of [320, 800]) {
    const program = compile(width);
    const ascending = denseFrames(program, 240);
    const unrelated = [0.88, 0.12, 0.67, 0.01].map((progress) =>
      sampleKpLispEvaluationMotion(program, progress));
    const descending = Array.from({ length: 241 }, (_, index) =>
      sampleKpLispEvaluationMotion(program, (240 - index) / 240));
    assert.equal(unrelated.length, 4);
    assert.deepEqual(descending, [...ascending].reverse());
  }
});

function heldSource(): KpLispEvaluationMotionFrame {
  return denseFrames(compile(), 500).find((frame) =>
    frame.phase === "structural-hold" && frame.operatorBead.opacity === 1)!;
}

function denseFrames(
  program: KpLispEvaluationMotionProgram,
  steps: number
): KpLispEvaluationMotionFrame[] {
  return Array.from({ length: steps + 1 }, (_, index) =>
    sampleKpLispEvaluationMotion(program, index / steps));
}

function source(frame: KpLispEvaluationMotionFrame, id: string) {
  const token = frame.sourceTokens.find(({ token }) => token.id === id);
  if (token === undefined) throw new Error(`Missing evaluation source ${id}.`);
  return token;
}

function count(value: string, needle: string): number {
  return value.split(needle).length - 1;
}

function codeText(html: string): string {
  const contents = html.match(/<code[^>]*data-kp-lisp-native-code[^>]*>([\s\S]*?)<\/code>/u)?.[1];
  if (contents === undefined) throw new Error("Rendered evaluation code is absent.");
  return contents.replaceAll(/<[^>]+>/gu, "")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}
