import assert from "node:assert/strict";
import test from "node:test";

import roadmapV6 from "../docs/theseus/nodes/plan-revisions/plan-revision.kp.v6.json" with {
  type: "json"
};
import {
  createKpSemanticAnimationWorkbenchIndex
} from "../src/editor/semantic-animation-workbench-data.ts";
import {
  projectKpWorkbenchRoadmapAnimationLinks
} from "../src/editor/semantic-animation-workbench-roadmap-links.ts";
import {
  projectKpWorkbenchRoadmap
} from "../src/editor/semantic-animation-workbench-roadmap.ts";
import type {
  KpWorkbenchPlanRevisionNode
} from "../src/editor/semantic-animation-workbench-roadmap-authority.ts";

test("roadmap links only exact existing playable representations", () => {
  const roadmap = projectKpWorkbenchRoadmap(
    roadmapV6 as KpWorkbenchPlanRevisionNode
  );
  const index = createKpSemanticAnimationWorkbenchIndex();
  const links = projectKpWorkbenchRoadmapAnimationLinks({ roadmap, index });

  assert.deepEqual(
    links.map(({ phaseId }) => phaseId),
    [
      "gold-equation-reader",
      "distribution-factoring-grammar",
      "generated-symbolic-transform-library",
      "derivative-secant-to-tangent",
      "radical-native-settlement"
    ]
  );
  for (const link of links) {
    const entry = index.entries.find(
      ({ identity }) => identity.animationId === link.animationId
    );
    assert.equal(entry?.lifecycle.playability, "playable");
    assert.ok(
      entry?.representations.some(
        ({ representationId, playable }) =>
          representationId === link.representationId && playable
      )
    );
  }
});

test("planned and platform-only roadmap rows remain text-only", () => {
  const roadmap = projectKpWorkbenchRoadmap(
    roadmapV6 as KpWorkbenchPlanRevisionNode
  );
  const links = projectKpWorkbenchRoadmapAnimationLinks({
    roadmap,
    index: createKpSemanticAnimationWorkbenchIndex()
  });
  const linked = new Set(links.map(({ phaseId }) => phaseId));

  for (const phaseId of [
    "semantic-animation-workbench",
    "authoritative-roadmap-workbench",
    "quadratic-semantic-branching",
    "integral-accumulation",
    "exact-fraction-quantity-models",
    "programming-algorithms"
  ]) {
    assert.equal(linked.has(phaseId), false);
  }
});

test("projection rejects a missing concrete representation", () => {
  const roadmap = projectKpWorkbenchRoadmap(
    roadmapV6 as KpWorkbenchPlanRevisionNode
  );
  const index = createKpSemanticAnimationWorkbenchIndex();

  assert.throws(
    () =>
      projectKpWorkbenchRoadmapAnimationLinks({
        roadmap,
        index: {
          ...index,
          entries: index.entries.filter(
            ({ identity }) =>
              identity.animationId !== "animation.linear-solve.solve-x"
          )
        }
      }),
    /cannot link unavailable animation/
  );
});
