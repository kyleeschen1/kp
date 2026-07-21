import assert from "node:assert/strict";
import test from "node:test";

import { createKpEquationCrossSurfaceFrame } from "../src/rendering/equation-cross-surface-frame.ts";

const presentation = {
  recipe: "continuity-v1",
  cancellation: "native-handoff-v1",
  zeroWitness: "none",
  successor: "native-handoff-v1",
  depth: "flat-v1",
  continuants: "concurrent-v1"
} as const;

test("editor and reader frames normalize into one translation-independent contract", () => {
  const editor = createKpEquationCrossSurfaceFrame({
    surface: "editor",
    animationId: "animation.linear-solve.solve-x",
    transitionId: "transform.linear-solve.subtract-both-sides-3",
    presentation,
    progress: 0.5,
    viewportBounds: { left: 100, top: 40, width: 400, height: 200 },
    fragments: [{
      fragmentId: "editor.x.material",
      semanticId: "equation.linear-solve.initial.lhs.x",
      representation: "material",
      ownerId: "material-owner.x-persists",
      bounds: { left: 200, top: 90, width: 40, height: 60 },
      opacity: 1,
      fontFamily: "KaTeX_Main",
      fontSizePx: 32
    }]
  });
  const reader = createKpEquationCrossSurfaceFrame({
    surface: "reader",
    animationId: editor.animationId,
    transitionId: editor.transitionId,
    presentation,
    progress: editor.progress,
    viewportBounds: { left: 20, top: 10, width: 400, height: 200 },
    fragments: [{
      fragmentId: "reader.x.material",
      semanticId: editor.fragments[0]!.semanticId,
      representation: "material",
      ownerId: "material-owner.x-persists",
      bounds: { left: 120, top: 60, width: 40, height: 60 },
      opacity: 1,
      fontFamily: "KaTeX_Main",
      fontSizePx: 32
    }]
  });

  assert.deepEqual(reader.fragments[0]!.normalizedBounds,
    editor.fragments[0]!.normalizedBounds);
  assert.deepEqual(editor.fragments[0]!.normalizedBounds, {
    left: 0.25,
    top: 0.25,
    width: 0.1,
    height: 0.3
  });
  assert.equal(Object.isFrozen(editor), true);
  assert.equal(Object.isFrozen(editor.fragments), true);
});

test("cross-surface frames reject ambiguous or invalid visual evidence", () => {
  const base = {
    surface: "reader" as const,
    animationId: "animation.linear-solve.solve-x",
    transitionId: "transform.linear-solve.subtract-both-sides-3",
    presentation,
    progress: 0.5,
    viewportBounds: { left: 0, top: 0, width: 400, height: 200 }
  };
  const fragment = {
    fragmentId: "reader.x.material",
    semanticId: "equation.linear-solve.initial.lhs.x",
    representation: "material" as const,
    bounds: { left: 100, top: 50, width: 40, height: 60 },
    opacity: 1
  };

  assert.throws(() => createKpEquationCrossSurfaceFrame({
    ...base,
    fragments: [fragment, fragment]
  }), /repeats fragment/);
  assert.throws(() => createKpEquationCrossSurfaceFrame({
    ...base,
    progress: 1.2,
    fragments: [fragment]
  }), /progress must be within/);
  assert.throws(() => createKpEquationCrossSurfaceFrame({
    ...base,
    fragments: [{ ...fragment, fontSizePx: 0 }]
  }), /invalid type/);
});
