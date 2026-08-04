import assert from "node:assert/strict";
import test from "node:test";

import { projectKpLispLambdaSourceMaterial } from
  "../src/animation/lisp-s-expression-material-projection.ts";
import {
  compileKpLispStructuralMotionProgram,
  sampleKpLispStructuralMotion,
  type KpLispStructuralMotionFrame,
  type KpLispStructuralMotionProgram
} from "../src/animation/lisp-structural-motion.ts";
import {
  kpLispStructuralMotionCss,
  renderKpLispStructuralMotionHtml
} from "../src/rendering/lisp-structural-motion-html.ts";
import { createKpLispLambdaApplicationFixture } from
  "../src/semantic/lisp-lambda-application-fixture.ts";

const fixture = createKpLispLambdaApplicationFixture();
const application = projectKpLispLambdaSourceMaterial(fixture).canonicalStates[0]!;

function compile(width = 800): KpLispStructuralMotionProgram {
  return compileKpLispStructuralMotionProgram({
    semantic: fixture.semantic,
    state: application,
    availableWidthPx: width
  });
}

test("composes the authored structural checkpoints into a complete pure frame sequence", () => {
  const program = compile();
  const frames = denseFrames(program, 400);

  assert.deepEqual([...new Set(frames.map(({ checkpointId }) => checkpointId))], [
    "source-readable",
    "leaf-forms-folded",
    "lambda-form-folded",
    "application-folded",
    "source-restored"
  ]);
  for (const phase of ["activate", "drift", "fold", "inspect", "unfold", "settled"] as const) {
    assert.ok(frames.some((frame) => frame.phase === phase), `contains ${phase}`);
  }
  assert.equal(Object.isFrozen(program), true);
  assert.equal(Object.isFrozen(frames[0]), true);
  assert.equal(Object.isFrozen(frames[0]?.tokens), true);
});

test("keeps exact native selectable endpoints inside one stable stage", () => {
  for (const width of [360, 800]) {
    const program = compile(width);
    const start = sampleKpLispStructuralMotion(program, 0);
    const end = sampleKpLispStructuralMotion(program, 1);

    assert.deepEqual(end.tokens, start.tokens);
    assert.ok(start.tokens.every(({ opacity, scale }) => opacity === 1 && scale === 1));
    assert.ok(start.beads.every(({ opacity }) => opacity === 0));
    assert.deepEqual(start.geometry.stage, end.geometry.stage);
    assert.equal(codeText(renderKpLispStructuralMotionHtml(start)), application.nativeCode);
    assert.equal(codeText(renderKpLispStructuralMotionHtml(end)), application.nativeCode);
  }
});

test("folds same-depth children before parents and lets contents lead membranes", () => {
  const frames = denseFrames(compile(), 500);
  for (const frame of frames.filter(({ phase }) => phase === "fold")) {
    for (const expressionId of ["expr.parameters", "expr.body", "expr.lambda", "expr.application"]) {
      const owned = frame.tokens.filter(({ token }) =>
        token.ownerExpressionId === expressionId);
      const atoms = owned.filter(({ token }) => token.kind === "atom");
      const parentheses = owned.filter(({ token }) => token.kind !== "atom");
      assert.ok(atoms.every(({ compression }) =>
        compression >= (parentheses[0]?.compression ?? 0)));
    }
    const lambdaStarted = frame.tokens.some(({ token, compression }) =>
      token.ownerExpressionId === "expr.lambda" && compression > 0);
    if (lambdaStarted) {
      assert.ok(frame.tokens.filter(({ token }) =>
        token.ownerExpressionId === "expr.body" ||
        token.ownerExpressionId === "expr.parameters"
      ).every(({ opacity }) => opacity === 0));
    }
    const applicationStarted = frame.tokens.some(({ token, compression }) =>
      token.ownerExpressionId === "expr.application" && compression > 0);
    if (applicationStarted) {
      assert.ok(frame.tokens.filter(({ token }) =>
        token.ownerExpressionId === "expr.lambda").every(({ opacity }) => opacity === 0));
    }
  }
});

test("keeps readable token rectangles disjoint through dense wide and phone seeks", () => {
  for (const width of [360, 800]) {
    for (const frame of denseFrames(compile(width), 300)) {
      const readable = frame.tokens.filter(({ opacity, scale }) =>
        opacity >= 0.5 && scale >= 0.5);
      for (let leftIndex = 0; leftIndex < readable.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < readable.length; rightIndex += 1) {
          assert.equal(
            overlap(readable[leftIndex]!, readable[rightIndex]!),
            false,
            `${width}px progress ${frame.progress}: ${readable[leftIndex]!.token.id} and ${readable[rightIndex]!.token.id}`
          );
        }
      }
    }
  }
});

test("reveals source-derived child interiors only at the active folded frontier", () => {
  const frames = denseFrames(compile(), 600);
  const leafHold = frames.find((frame) =>
    frame.phase === "inspect" && frame.checkpointId === "leaf-forms-folded")!;
  const applicationHold = frames.find((frame) =>
    frame.phase === "inspect" && frame.checkpointId === "application-folded")!;

  assert.deepEqual(leafHold.beads.filter(({ detailed }) => detailed)
    .map(({ bead }) => bead.expressionId), ["expr.body"]);
  assert.equal(leafHold.beads.find(({ bead }) =>
    bead.expressionId === "expr.parameters")?.opacity, 1);
  assert.deepEqual(applicationHold.beads.filter(({ detailed }) => detailed)
    .map(({ bead }) => bead.expressionId), ["expr.application"]);
  assert.ok(applicationHold.beads.find(({ bead }) =>
    bead.expressionId === "expr.application")!.bead.particles.every(({ originExpressionIds }) =>
      originExpressionIds.length > 0));
});

test("reconstructs every direct seek exactly in either traversal order", () => {
  const program = compile();
  const ascending = denseFrames(program, 160);
  const unrelated = [0.83, 0.04, 0.52, 0.99].map((progress) =>
    sampleKpLispStructuralMotion(program, progress));
  const descending = Array.from({ length: 161 }, (_, index) =>
    sampleKpLispStructuralMotion(program, (160 - index) / 160));

  assert.equal(unrelated.length, 4);
  assert.deepEqual(descending, [...ascending].reverse());
});

test("renders one semantic DOM paint owner with local beads and no structural SVG", () => {
  const program = compile();
  const frame = denseFrames(program, 300).find(({ checkpointId, phase }) =>
    checkpointId === "application-folded" && phase === "inspect")!;
  const html = renderKpLispStructuralMotionHtml(frame);

  assert.equal(count(html, "data-kp-lisp-paint-owner="), 1);
  assert.equal(count(html, "data-kp-lisp-native-code="), 1);
  assert.equal(count(html, "data-kp-lisp-material-id="), application.tokens.length);
  assert.equal(codeText(html), application.nativeCode);
  assert.match(html, /data-kp-lisp-structural-bead="expr\.application"/u);
  assert.match(html, /data-kp-lisp-bead-particles/u);
  assert.doesNotMatch(html, /<svg|<canvas/u);
  assert.match(kpLispStructuralMotionCss, /font: 400 20px/u);
  assert.match(kpLispStructuralMotionCss, /min-block-size: 12em/u);
});

function denseFrames(
  program: KpLispStructuralMotionProgram,
  steps: number
): KpLispStructuralMotionFrame[] {
  return Array.from({ length: steps + 1 }, (_, index) =>
    sampleKpLispStructuralMotion(program, index / steps));
}

function overlap(
  left: KpLispStructuralMotionFrame["tokens"][number],
  right: KpLispStructuralMotionFrame["tokens"][number]
): boolean {
  const leftWidth = left.rect.widthEm * left.scale;
  const leftHeight = left.rect.heightEm * left.scale;
  const rightWidth = right.rect.widthEm * right.scale;
  const rightHeight = right.rect.heightEm * right.scale;
  const leftX = left.xEm + (left.rect.widthEm - leftWidth) / 2;
  const leftY = left.yEm + (left.rect.heightEm - leftHeight) / 2;
  const rightX = right.xEm + (right.rect.widthEm - rightWidth) / 2;
  const rightY = right.yEm + (right.rect.heightEm - rightHeight) / 2;
  const epsilon = 1e-6;
  return leftX + leftWidth > rightX + epsilon &&
    rightX + rightWidth > leftX + epsilon &&
    leftY + leftHeight > rightY + epsilon &&
    rightY + rightHeight > leftY + epsilon;
}

function count(value: string, needle: string): number {
  return value.split(needle).length - 1;
}

function codeText(html: string): string {
  const contents = html.match(/<code[^>]*>([\s\S]*?)<\/code>/u)?.[1];
  if (contents === undefined) throw new Error("Rendered structural source is absent.");
  return contents.replaceAll(/<[^>]+>/gu, "")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}
