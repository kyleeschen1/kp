import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpLispApplicationMotionProgram,
  sampleKpLispApplicationMotion,
  type KpLispApplicationMotionFrame,
  type KpLispApplicationMotionProgram
} from "../src/animation/lisp-application-motion.ts";
import { projectKpLispLambdaSourceMaterial } from
  "../src/animation/lisp-s-expression-material-projection.ts";
import {
  kpLispApplicationMotionCss,
  renderKpLispApplicationMotionHtml
} from "../src/rendering/lisp-application-motion-html.ts";
import { createKpLispLambdaApplicationFixture } from
  "../src/semantic/lisp-lambda-application-fixture.ts";

const fixture = createKpLispLambdaApplicationFixture();
const material = projectKpLispLambdaSourceMaterial(fixture);

function compile(width = 800): KpLispApplicationMotionProgram {
  return compileKpLispApplicationMotionProgram({
    fixture,
    material,
    availableWidthPx: width
  });
}

test("composes open bind propagate and reconstruct into authored checkpoints", () => {
  const frames = denseFrames(compile(), 700);
  assert.deepEqual([...new Set(frames.map(({ checkpointId }) => checkpointId))], [
    "binding-ready",
    "parameter-bound",
    "body-propagated",
    "body-reconstructed"
  ]);
  for (const phase of [
    "open",
    "transfer",
    "absorb",
    "bind",
    "propagate",
    "fold-shells",
    "hold-provenance",
    "reconstruct",
    "recenter",
    "settled"
  ] as const) {
    assert.ok(frames.some((frame) => frame.phase === phase), `contains ${phase}`);
  }
});

test("moves the one certified source 4 along the transient arch", () => {
  const frames = denseFrames(compile(), 600);
  const transfer = frames.find((frame) => frame.phase === "transfer" &&
    source(frame, "occurrence.argument.four").transported &&
    frame.transientGuide?.wakeOpacity !== 0)!;
  const sourceFour = source(transfer, "occurrence.argument.four");
  const base = transfer.geometry.tokens.find(({ materialId }) =>
    materialId === "occurrence.argument.four")!.rect;

  assert.notEqual(sourceFour.yEm, base.yEm);
  assert.equal(sourceFour.opacity, 1);
  assert.ok(transfer.transientGuide?.d.startsWith("M "));
  assert.equal(transfer.bindingBoxes.find(({ role }) =>
    role === "parameter")?.opacity, 1);
  assert.equal(transfer.bindingBoxes.find(({ role }) =>
    role === "occurrence")?.opacity, 0);
  const html = renderKpLispApplicationMotionHtml(transfer);
  assert.equal(count(html, "data-kp-lisp-material-id=\"occurrence.argument.four\""), 1);
  assert.match(html, /data-kp-lisp-transported="true"/u);
  assert.match(html, /data-kp-lisp-guide-lifetime="transient"/u);
});

test("absorbs the source before reappearing at the certified body occurrence", () => {
  const frames = denseFrames(compile(), 800);
  const absorbed = frames.find((frame) => frame.phase === "bind")!;
  const emerging = frames.find((frame) => frame.phase === "propagate" &&
    frame.derivedValues[0]!.opacity > 0 && frame.derivedValues[0]!.opacity < 1)!;
  const propagated = frames.find((frame) => frame.checkpointId === "body-propagated" &&
    frame.phase === "propagate" && frame.derivedValues[0]!.opacity === 1)!;

  assert.equal(source(absorbed, "occurrence.argument.four").opacity, 0);
  assert.equal(absorbed.derivedValues[0]?.opacity, 0);
  assert.equal(source(emerging, "occurrence.x.reference").opacity < 1, true);
  assert.deepEqual(propagated.derivedValues[0]?.originIds, [
    "occurrence.argument.four",
    "occurrence.x.reference"
  ]);
  assert.equal(propagated.derivedValues[0]?.nativeCode, "4");
  assert.equal(propagated.transientGuide, null);
  assert.equal(propagated.bindingBoxes.find(({ role }) =>
    role === "parameter")?.opacity, 0);
});

test("folds only consumed shells into an explicit temporary provenance bead", () => {
  const frames = denseFrames(compile(), 900);
  const hold = frames.find((frame) => frame.phase === "hold-provenance")!;
  const reconstructed = frames.find((frame) => frame.phase === "reconstruct" &&
    frame.reconstructedTokens[0]!.opacity > 0)!;

  assert.equal(hold.provenanceBead.opacity, 1);
  assert.equal(hold.provenanceBead.nativeCode, "((lambda(x)))");
  assert.equal(hold.provenanceBead.consumedMaterialIds.length, 8);
  assert.equal(hold.reconstructedTokens[0]?.opacity, 0);
  assert.ok(reconstructed.reconstructedTokens.every(({ token }) =>
    token.originIds.length > 0));
  assert.ok(reconstructed.sourceTokens.filter(({ token }) =>
    token.ownerExpressionId === "expr.parameters").every(({ opacity }) =>
      opacity === 0));
});

test("atomically settles to one ordinary selectable reconstructed code tree", () => {
  const program = compile();
  const start = sampleKpLispApplicationMotion(program, 0);
  const end = sampleKpLispApplicationMotion(program, 1);
  const startHtml = renderKpLispApplicationMotionHtml(start);
  const endHtml = renderKpLispApplicationMotionHtml(end);

  assert.equal(start.canonicalEndpoint, "application");
  assert.equal(end.canonicalEndpoint, "reconstructed");
  assert.equal(codeText(startHtml), "((lambda (x) (+ x 1)) 4)");
  assert.equal(codeText(endHtml), "(+ 4 1)");
  assert.equal(count(endHtml, "data-kp-lisp-native-code="), 1);
  assert.equal(count(endHtml, "data-kp-lisp-material-id="), 5);
  assert.doesNotMatch(endHtml, /<svg|data-kp-lisp-derived-material|data-kp-lisp-provenance-bead/u);
  assert.ok(end.sourceTokens.every(({ opacity }) => opacity === 0));
  assert.equal(end.provenanceBead.opacity, 0);
  assert.ok(end.reconstructedTokens.every(({ opacity, scale }) =>
    opacity === 1 && scale === 1));
});

test("uses the phone clearance route without changing type or stage height", () => {
  const phone = compile(360);
  const wide = compile(800);
  assert.equal(phone.binding.transfer.route, "phone-clearance-arch");
  assert.equal(wide.binding.transfer.route, "wide-arch");
  assert.equal(phone.geometry.fontSizePx, 20);
  assert.equal(wide.geometry.fontSizePx, 20);
  assert.equal(phone.geometry.stage.heightEm, 12);
  assert.equal(wide.geometry.stage.heightEm, 12);
  const phoneTransfer = denseFrames(phone, 300).find(({ phase }) =>
    phase === "transfer")!;
  assert.equal((phoneTransfer.transientGuide?.d.match(/ C /gu) ?? []).length, 2);
});

test("keeps one paint owner and transient SVG outside semantic code", () => {
  const transfer = denseFrames(compile(), 400).find((frame) =>
    frame.phase === "transfer" && frame.transientGuide !== null)!;
  const html = renderKpLispApplicationMotionHtml(transfer);

  assert.equal(count(html, "data-kp-lisp-paint-owner="), 1);
  assert.equal(count(html, "data-kp-lisp-native-code="), 1);
  assert.equal(codeText(html), "((lambda (x) (+ x 1)) 4)");
  const svg = html.match(/<svg[\s\S]*<\/svg>/u)?.[0] ?? "";
  assert.match(svg, /aria-hidden="true"/u);
  assert.doesNotMatch(svg, /<text|<foreignObject|data-kp-lisp-native-code/u);
  assert.match(kpLispApplicationMotionCss, /pointer-events: none/u);
  assert.match(kpLispApplicationMotionCss, /font: 400 20px/u);
});

test("reconstructs every direct seek exactly in either traversal order", () => {
  for (const width of [360, 800]) {
    const program = compile(width);
    const ascending = denseFrames(program, 220);
    const unrelated = [0.91, 0.17, 0.63, 0.02].map((progress) =>
      sampleKpLispApplicationMotion(program, progress));
    const descending = Array.from({ length: 221 }, (_, index) =>
      sampleKpLispApplicationMotion(program, (220 - index) / 220));
    assert.equal(unrelated.length, 4);
    assert.deepEqual(descending, [...ascending].reverse());
  }
});

function denseFrames(
  program: KpLispApplicationMotionProgram,
  steps: number
): KpLispApplicationMotionFrame[] {
  return Array.from({ length: steps + 1 }, (_, index) =>
    sampleKpLispApplicationMotion(program, index / steps));
}

function source(frame: KpLispApplicationMotionFrame, id: string) {
  const token = frame.sourceTokens.find(({ token }) => token.id === id);
  if (token === undefined) throw new Error(`Missing source token ${id}.`);
  return token;
}

function count(value: string, needle: string): number {
  return value.split(needle).length - 1;
}

function codeText(html: string): string {
  const contents = html.match(/<code[^>]*data-kp-lisp-native-code[^>]*>([\s\S]*?)<\/code>/u)?.[1];
  if (contents === undefined) throw new Error("Rendered application code is absent.");
  return contents.replaceAll(/<[^>]+>/gu, "")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}
