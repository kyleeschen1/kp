import assert from "node:assert/strict";
import test from "node:test";

import { kpLispLessonMotionBlocks } from "../src/tutorial/lisp-function-application/lisp-function-application-motion-blocks.ts";
import {
  projectKpTutorialCumulativeMotion,
  projectKpTutorialMotionCorridor,
  projectKpTutorialRebasedCorridor,
  projectKpTutorialScrollFrame
} from "../src/tutorial/kp-tutorial-motion.ts";

const [structure, application, evaluation] = kpLispLessonMotionBlocks;

function anchorTop(
  block: (typeof kpLispLessonMotionBlocks)[number],
  travel: number,
  viewportHeight = 1000
): number {
  const start = block.corridor.startViewportRatio * viewportHeight;
  const end = block.corridor.endViewportRatio * viewportHeight;
  return start - travel * (start - end);
}

test("all three authored corridors preserve entry, semantic, and endpoint holds", () => {
  for (const block of kpLispLessonMotionBlocks) {
    const project = (travel: number) => projectKpTutorialMotionCorridor({
      corridor: block.corridor,
      anchorTop: anchorTop(block, travel),
      viewportHeight: 1000,
      snapTolerance: 0.002
    }).progress;
    assert.ok(Math.abs(project(0)) < 1e-12);
    assert.ok(Math.abs(project(block.corridor.keyframes[1]!.travel)) < 1e-12);
    for (const checkpoint of block.checkpoints.slice(1, -1)) {
      const held = block.corridor.keyframes.filter(({ progress }) =>
        Math.abs(progress - checkpoint.progress) < 1e-12
      );
      assert.equal(held.length, 2, `${block.id} holds ${checkpoint.id}`);
      assert.ok(held.every(({ travel }) =>
        Math.abs(project(travel) - checkpoint.progress) < 1e-12
      ));
    }
    assert.ok(Math.abs(project(1) - 1) < 1e-12);
  }
});

test("one and only one Lisp motion block owns a scroll frame", () => {
  const projection = projectKpTutorialScrollFrame({
    viewportHeight: 1000,
    blocks: [
      {
        id: structure!.id,
        corridor: structure!.corridor,
        anchorTop: anchorTop(structure!, 0.5),
        snapTolerance: 0.002
      },
      {
        id: application!.id,
        corridor: application!.corridor,
        anchorTop: 950,
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
  assert.equal(projection.activeBlockId, "structure");
  assert.equal(projection.blocks.filter(({ ownsScroll }) => ownsScroll).length, 1);
});

test("later blocks settle every earlier scrubber without sharing ownership", () => {
  assert.deepEqual(projectKpTutorialCumulativeMotion({
    blocks: kpLispLessonMotionBlocks,
    activeBlockId: "evaluation",
    localProgress: 0.4
  }), [
    { id: "structure", status: "settled", progress: 1 },
    { id: "application", status: "settled", progress: 1 },
    { id: "evaluation", status: "active", progress: 0.4 }
  ]);
});

test("manual-to-scroll rebase is continuous and reverses deterministically", () => {
  const atTakeover = projectKpTutorialRebasedCorridor({
    corridor: structure!.corridor,
    rawTravelAtTakeover: 0.45,
    manualProgress: 0.8,
    rawTravel: 0.45
  });
  assert.ok(Math.abs(atTakeover.progress - 0.8) < 1e-12);
  const forward = projectKpTutorialRebasedCorridor({
    corridor: structure!.corridor,
    rawTravelAtTakeover: 0.45,
    manualProgress: 0.8,
    rawTravel: 0.49
  });
  const reverse = projectKpTutorialRebasedCorridor({
    corridor: structure!.corridor,
    rawTravelAtTakeover: 0.45,
    manualProgress: 0.8,
    rawTravel: 0.41
  });
  assert.ok(forward.progress > 0.8);
  assert.ok(reverse.progress < 0.8);
});
