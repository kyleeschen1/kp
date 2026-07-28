import assert from "node:assert/strict";
import test from "node:test";

import {
  decodeKpFractionCompositionUrl,
  encodeKpFractionCompositionUrl
} from "../src/reader/runtime/fraction-composition-url-codec.ts";

const route = {
  route: "/reader/fraction-composition/",
  documentId: "lesson.algebra.fraction-composition",
  documentVersion: "1"
} as const;

test("fraction composition URL round trips canonical fold state", () => {
  const nodeId =
    "evaluation.fraction-composition.subtract-and-simplify";
  const encoded = encodeKpFractionCompositionUrl(
    "https://kinetic.press/reader/fraction-composition/?utm_source=teacher",
    route,
    {
      checkpoint: "difference-simplified",
      progressPermille: 538,
      direction: "inverse",
      foldMode: "pinned",
      activeNodeId: nodeId,
      collapsedNodeIds: [
        "evaluation.fraction-composition.evaluate-constants",
        nodeId
      ],
      pinnedNodeIds: [nodeId]
    }
  );

  assert.equal(new URL(encoded).searchParams.get("utm_source"), "teacher");
  assert.deepEqual(decodeKpFractionCompositionUrl(encoded, route), {
    checkpoint: "difference-simplified",
    progressPermille: 538,
    direction: "inverse",
    foldMode: "pinned",
    activeNodeId: nodeId,
    collapsedNodeIds: [
      "evaluation.fraction-composition.evaluate-constants",
      nodeId
    ],
    pinnedNodeIds: [nodeId]
  });
});

test("fraction composition URL defaults and rejects incoherent state", () => {
  assert.deepEqual(
    decodeKpFractionCompositionUrl(
      "https://kinetic.press/reader/fraction-composition/"
    ),
    {
      checkpoint: "factored",
      direction: "forward",
      foldMode: "automatic",
      collapsedNodeIds: [],
      pinnedNodeIds: []
    }
  );
  assert.throws(
    () => decodeKpFractionCompositionUrl(
      "https://kinetic.press/reader/fraction-composition/?kpProgress=1.5"
    ),
    /must be an integer/
  );
  assert.throws(
    () => decodeKpFractionCompositionUrl(
      "https://kinetic.press/reader/fraction-composition/?kpFoldMode=expanded&kpPin=evaluation.fraction-composition.evaluate-constants"
    ),
    /expanded fraction composition intent cannot carry pins/
  );
});
