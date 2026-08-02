import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createLinearSolveProgrammingComparisonAnimationAsset
} from "../src/animation/comparison-layout-adapter.ts";
import {
  createProgramTraceAnimationAsset
} from "../src/animation/programming-adapter.ts";
import {
  sampleKpProgrammingAdditionRuntimeFrame
} from "../src/animation/programming-addition-runtime-frame.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  createKpEditorAnimationDescriptor
} from "../src/editor/animation-descriptor.ts";
import {
  createKpEditorAnimationPlayerState
} from "../src/editor/animation-player-state.ts";
import {
  kpEditorProgrammingSurfaceAdapter
} from "../src/editor/programming-surface-adapter.ts";
import {
  renderKpProgrammingAdditionTraceHtml
} from "../src/rendering/programming-addition-trace-html.ts";

const addition = createProgramTraceAnimationAsset();
const comparison = createLinearSolveProgrammingComparisonAnimationAsset();

test("programming adapter supports only the two exact contracted callers", () => {
  assert.equal(kpEditorProgrammingSurfaceAdapter.supports(stateFor(addition)), true);
  assert.equal(
    kpEditorProgrammingSurfaceAdapter.supports(
      stateFor(comparison, [addition, comparison])
    ),
    true
  );
  assert.equal(kpEditorProgrammingSurfaceAdapter.priority, 100);
  assert.equal(
    kpEditorProgrammingSurfaceAdapter.id,
    "editor-animation-surface.programming.trace"
  );
});

test("native programming HTML visibly closes every verified frame channel", () => {
  const evaluate = renderAt(0.5);
  const returned = renderAt(0.75);
  const output = renderAt(1);

  assert.match(evaluate, /src\/add\.ts/);
  assert.match(evaluate, /data-kp-editor-programming-source-focus="selector\.programming\.add\.return"/);
  assert.match(evaluate, /return a \+ b;/);
  assert.match(evaluate, /add\(\)/);
  assert.match(evaluate, /a = 2/);
  assert.match(evaluate, /b = 2/);
  assert.doesNotMatch(evaluate, /return = 4/);
  assert.match(returned, /return = 4/);
  assert.match(output, /data-kp-editor-programming-channel="output"/);
  assert.match(output, />4<\/li>/);
  assert.match(output, /aria-live="polite"/);
  assert.doesNotMatch(output, /<iframe/i);
});

test("programming paint and style stay behind one dependency-light capability", async () => {
  const [adapter, capability, css, renderer] = await Promise.all([
    readFile("src/editor/programming-surface-adapter.ts", "utf8"),
    readFile("src/editor/programming-surface-capability.ts", "utf8"),
    readFile("src/editor/programming-surface.css", "utf8"),
    readFile("src/rendering/programming-addition-trace-html.ts", "utf8")
  ]);
  const closure = `${adapter}\n${capability}\n${css}\n${renderer}`;

  assert.match(capability, /import "\.\/programming-surface\.css"/);
  assert.match(adapter, /getKpEditorAnimationPlaybackSession/);
  assert.match(adapter, /runtimeFrame\.childFrames/);
  assert.doesNotMatch(closure, /from "three"|katex|shiki|highlight\.js|prismjs/i);
  assert.doesNotMatch(closure, /iframe|eval\(|new Function|setInterval/);
});

function renderAt(progress: number): string {
  const frame = sampleKpProgrammingAdditionRuntimeFrame({
    animation: addition,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation: addition,
      progress
    })
  });
  return renderKpProgrammingAdditionTraceHtml(frame);
}

function stateFor(
  animation: typeof addition,
  catalog: readonly typeof addition[] = [animation]
) {
  return createKpEditorAnimationPlayerState({
    animation,
    catalog,
    descriptor: createKpEditorAnimationDescriptor({
      animationId: animation.id,
      title: animation.title,
      summary: animation.title,
      renderTargetKinds: animation.renderTargets.map(({ kind }) => kind)
    })
  });
}
