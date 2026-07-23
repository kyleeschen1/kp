import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpEditorAnimationLibrary
} from "../src/editor/animation-library.ts";
import {
  createKpSemanticAnimationWorkbenchIndex
} from "../src/editor/semantic-animation-workbench-data.ts";
import {
  resolveKpAnimationWorkbenchRepresentation
} from "../src/editor/semantic-animation-workbench-representation-selection.ts";

const radicalId = "animation.generated.radical.square-root-as-power";

test("card selection resolves beneath the same canonical animation", () => {
  const entry = radicalEntry();
  const selection = resolveKpAnimationWorkbenchRepresentation({
    entry,
    requestedRepresentationId:
      "sample.animation.radical-rewrite.square-root-as-power",
    descriptors: createKpEditorAnimationLibrary()
  });

  assert.equal(selection.relationship?.kind, "card");
  assert.equal(selection.descriptor?.animationId, radicalId);
  assert.equal(
    selection.descriptor?.sampleId,
    selection.relationship?.representationId
  );
});

test("unknown representation falls back without changing identity", () => {
  const entry = radicalEntry();
  const selection = resolveKpAnimationWorkbenchRepresentation({
    entry,
    requestedRepresentationId: "representation.unknown",
    descriptors: createKpEditorAnimationLibrary()
  });

  assert.equal(selection.relationship?.animationId, radicalId);
  assert.equal(selection.descriptor?.animationId, radicalId);
  assert.equal(
    selection.relationship?.representationId,
    entry.representations[0]?.representationId
  );
});

test("planned animation has no fabricated selection", () => {
  const entry = createKpSemanticAnimationWorkbenchIndex().entries.find(
    (candidate) =>
      candidate.identity.animationId ===
      "animation.algebra.quadratic.solution-branching"
  )!;

  assert.deepEqual(
    resolveKpAnimationWorkbenchRepresentation({
      entry,
      descriptors: createKpEditorAnimationLibrary()
    }),
    {}
  );
});

function radicalEntry() {
  return createKpSemanticAnimationWorkbenchIndex().entries.find(
    (candidate) => candidate.identity.animationId === radicalId
  )!;
}
