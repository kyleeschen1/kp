import assert from "node:assert/strict";
import test from "node:test";

import { kpLispLessonMotionBlocks } from "../src/tutorial/lisp-function-application/lisp-function-application-motion-blocks.ts";
import {
  projectKpTutorialMotionCorridor,
  projectKpTutorialRebasedCorridor,
  projectKpTutorialScrollFrame
} from "../src/tutorial/kp-tutorial-motion.ts";

const [binding, evaluation] = kpLispLessonMotionBlocks;

function anchorTop(travel: number, viewportHeight = 1000): number {
  const start = binding!.corridor.startViewportRatio * viewportHeight;
  const end = binding!.corridor.endViewportRatio * viewportHeight;
  return start - travel * (start - end);
}

test("authored Lisp scroll corridors preserve entry, semantic, and endpoint holds", () => {
  for (const [block, heldProgress] of [[binding!, 0.46], [evaluation!, 0.58]] as const) {
    const project = (travel: number) => projectKpTutorialMotionCorridor({
      corridor: block.corridor,
      anchorTop: anchorTop(travel),
      viewportHeight: 1000,
      snapTolerance: 0.002
    }).progress;
    assert.ok(Math.abs(project(0)) < 1e-12);
    assert.ok(Math.abs(project(block.corridor.keyframes[1]!.travel)) < 1e-12);
    assert.ok(Math.abs(project(block.corridor.keyframes[2]!.travel) - heldProgress) < 1e-12);
    assert.ok(Math.abs(project(block.corridor.keyframes[3]!.travel) - heldProgress) < 1e-12);
    assert.ok(Math.abs(project(1) - 1) < 1e-12);
  }
});

test("one and only one Lisp motion block owns a scroll frame", () => {
  const projection = projectKpTutorialScrollFrame({
    viewportHeight: 1000,
    blocks: [
      {
        id: binding!.id,
        corridor: binding!.corridor,
        anchorTop: anchorTop(0.5),
        snapTolerance: 0.002
      },
      {
        id: evaluation!.id,
        corridor: evaluation!.corridor,
        anchorTop: 950,
        snapTolerance: 0.002
      }
    ]
  });
  assert.equal(projection.activeBlockId, "bind-and-reconstruct");
  assert.equal(projection.blocks.filter(({ ownsScroll }) => ownsScroll).length, 1);
});

test("manual-to-scroll rebase is continuous and reverses deterministically", () => {
  const atTakeover = projectKpTutorialRebasedCorridor({
    corridor: binding!.corridor,
    rawTravelAtTakeover: 0.45,
    manualProgress: 0.8,
    rawTravel: 0.45
  });
  assert.ok(Math.abs(atTakeover.progress - 0.8) < 1e-12);
  const forward = projectKpTutorialRebasedCorridor({
    corridor: binding!.corridor,
    rawTravelAtTakeover: 0.45,
    manualProgress: 0.8,
    rawTravel: 0.49
  });
  const reverse = projectKpTutorialRebasedCorridor({
    corridor: binding!.corridor,
    rawTravelAtTakeover: 0.45,
    manualProgress: 0.8,
    rawTravel: 0.41
  });
  assert.ok(forward.progress > 0.8);
  assert.ok(reverse.progress < 0.8);
});
