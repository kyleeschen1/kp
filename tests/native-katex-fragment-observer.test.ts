import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpNativeKatexFragmentObservationBatch,
  normalizeKpStageRelativeRect
} from "../src/rendering/native-katex-fragment-observer.ts";

const ownerDocument = {};
const stage = { ownerDocument } as HTMLElement;
const sourceElement = { ownerDocument } as HTMLElement;

test("native fragment observations are explicit renderer-session state", () => {
  const batch = createKpNativeKatexFragmentObservationBatch({
    stage,
    fragments: [{
      id: "fragment.solve-x.x",
      semanticEntityId: "equation.solve-x.before.x",
      motionId: "motion.solve-x.x",
      glyphKey: "x",
      sourceElement,
      rect: { left: 12, top: 20, width: 14, height: 25 },
      styleFingerprint: "font:KaTeX_Math|size:24|weight:400",
      fontRevision: 2
    }]
  });

  assert.equal(batch.kind, "native-katex-fragment-observation-batch");
  assert.equal(batch.lifecycle, "renderer-session");
  assert.strictEqual(batch.stage, stage);
  assert.strictEqual(batch.fragments[0]?.sourceElement, sourceElement);
  assert.equal(Object.isFrozen(batch.fragments[0]?.rect), true);
});

test("native fragment observations reject ambiguous identity and geometry", () => {
  const fragment = {
    id: "fragment.x",
    semanticEntityId: "entity.x",
    motionId: "motion.x",
    glyphKey: "x",
    sourceElement,
    rect: { left: 0, top: 0, width: 12, height: 20 },
    styleFingerprint: "font:KaTeX_Math",
    fontRevision: 0
  };
  assert.throws(
    () => createKpNativeKatexFragmentObservationBatch({
      stage,
      fragments: [fragment, fragment]
    }),
    /duplicated/
  );
  assert.throws(
    () => createKpNativeKatexFragmentObservationBatch({
      stage,
      fragments: [{
        ...fragment,
        rect: { ...fragment.rect, width: 0 }
      }]
    }),
    /positive width and height/
  );
  assert.throws(
    () => createKpNativeKatexFragmentObservationBatch({
      stage,
      fragments: [{
        ...fragment,
        sourceElement: { ownerDocument: {} } as HTMLElement
      }]
    }),
    /share the stage document/
  );
});

test("client rectangles normalize into stable stage-local coordinates", () => {
  const normalized = normalizeKpStageRelativeRect({
    stageClientRect: { left: 100, top: 50, width: 960, height: 360 },
    stageLayoutWidth: 640,
    stageLayoutHeight: 240,
    fragmentClientRect: { left: 250, top: 125, width: 30, height: 37.5 }
  });

  assert.deepEqual(normalized, {
    left: 100,
    top: 50,
    width: 20,
    height: 25
  });
  assert.throws(
    () => normalizeKpStageRelativeRect({
      stageClientRect: { left: 0, top: 0, width: 0, height: 240 },
      stageLayoutWidth: 640,
      stageLayoutHeight: 240,
      fragmentClientRect: { left: 0, top: 0, width: 10, height: 20 }
    }),
    /positive settled geometry/
  );
});
