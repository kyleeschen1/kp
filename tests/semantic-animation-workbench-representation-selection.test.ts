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
const distributionId =
  "animation.generated.distribution.expand-a-sum";

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
    entry.identity.provenance.kind === "catalog"
      ? entry.identity.provenance.descriptorId
      : undefined
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

test("lesson authority resolves a compact canonical card projection", () => {
  const entry = createKpSemanticAnimationWorkbenchIndex().entries.find(
    (candidate) => candidate.identity.animationId === distributionId
  )!;
  const selection = resolveKpAnimationWorkbenchRepresentation({
    entry,
    descriptors: createKpEditorAnimationLibrary()
  });

  assert.equal(selection.relationship?.kind, "lesson");
  assert.equal(selection.relationship?.presentationRole, "canonical");
  assert.equal(
    selection.relationship?.choreographySource.choreographyId,
    "choreography.lesson.distribution-area.algebra-and-area"
  );
  assert.equal(
    selection.descriptor?.id,
    "editor-animation.sample.animation.distribution.expand-a-sum"
  );
});

test("superseded descriptor routes remain exactly resolvable fixtures", () => {
  const entry = createKpSemanticAnimationWorkbenchIndex().entries.find(
    (candidate) => candidate.identity.animationId === distributionId
  )!;
  const fixtureId =
    "editor-animation.animation.generated.distribution.expand-a-sum";
  const selection = resolveKpAnimationWorkbenchRepresentation({
    entry,
    requestedRepresentationId: fixtureId,
    descriptors: createKpEditorAnimationLibrary()
  });

  assert.equal(selection.relationship?.presentationRole, "superseded-fixture");
  assert.equal(selection.descriptor?.id, fixtureId);
});

function radicalEntry() {
  return createKpSemanticAnimationWorkbenchIndex().entries.find(
    (candidate) => candidate.identity.animationId === radicalId
  )!;
}
