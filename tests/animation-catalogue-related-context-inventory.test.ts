import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAnimationCatalogueLoadableRegistry
} from "../src/editor/animation-catalogue-loadable-registry.ts";
import {
  createKpAnimationLibraryDisplayCatalog
} from "../src/editor/animation-library-display-catalog.ts";
import { createKpEditorAnimationLibrary } from "../src/editor/animation-library.ts";
import {
  createKpSemanticAnimationWorkbenchIndex
} from "../src/editor/semantic-animation-workbench-data.ts";

test("concrete assets keep related contexts subordinate to one loadable id", () => {
  const loadable = createKpAnimationCatalogueLoadableRegistry();
  const concreteIds = new Set(loadable.map(({ animationId }) => animationId));
  const descriptors = createKpEditorAnimationLibrary().filter(
    ({ animationId }) => concreteIds.has(animationId)
  );
  const workbenchEntries = createKpSemanticAnimationWorkbenchIndex().entries
    .filter(({ identity }) => concreteIds.has(identity.animationId));
  const displayEntries = createKpAnimationLibraryDisplayCatalog().filter(
    ({ animationId }) => concreteIds.has(animationId)
  );
  const representations = displayEntries.flatMap(
    ({ representations }) => representations
  );

  assert.equal(loadable.length, 38);
  assert.equal(descriptors.length, 55);
  assert.equal(
    workbenchEntries.reduce(
      (sum, entry) => sum + entry.representations.length,
      0
    ),
    74
  );
  assert.equal(displayEntries.length, 38);
  assert.equal(representations.length, 81);
  assert.deepEqual(
    Object.fromEntries(
      [
        "reader",
        "editor",
        "card",
        "concept-room",
        "diagnostic",
        "static",
        "export"
      ].map((kind) => [
        kind,
        representations.filter(
          (representation) => representation.kind === kind
        ).length
      ])
    ),
    {
      reader: 5,
      editor: 57,
      card: 17,
      "concept-room": 0,
      diagnostic: 2,
      static: 0,
      export: 0
    }
  );
});

test("solve-x remains one asset despite the widest related-context fan-out", () => {
  const animationId = "animation.linear-solve.solve-x";
  const descriptors = createKpEditorAnimationLibrary().filter(
    (descriptor) => descriptor.animationId === animationId
  );
  const workbench = createKpSemanticAnimationWorkbenchIndex().entries.find(
    (entry) => entry.identity.animationId === animationId
  );
  const display = createKpAnimationLibraryDisplayCatalog().find(
    (entry) => entry.animationId === animationId
  );
  assert.ok(workbench);
  assert.ok(display);

  assert.equal(descriptors.length, 3);
  assert.equal(workbench.representations.length, 6);
  assert.equal(display.representations.length, 7);
  assert.deepEqual(
    Object.fromEntries(
      ["editor", "card", "reader", "diagnostic"].map((kind) => [
        kind,
        display.representations.filter(
          (representation) => representation.kind === kind
        ).length
      ])
    ),
    { editor: 3, card: 2, reader: 1, diagnostic: 1 }
  );
});

test("display-only playability cannot expand concrete catalogue membership", () => {
  const concreteIds = new Set(
    createKpAnimationCatalogueLoadableRegistry().map(
      ({ animationId }) => animationId
    )
  );
  const displayOnlyPlayableIds = createKpAnimationLibraryDisplayCatalog()
    .filter(
      ({ animationId, availability }) =>
        availability === "playable" && !concreteIds.has(animationId)
    )
    .map(({ animationId }) => animationId)
    .sort();

  assert.deepEqual(displayOnlyPlayableIds, [
    "animation.divide-both-sides.solve-3x-equals-12",
    "animation.foldable-distribution.collect-like-terms",
    "animation.fraction-composition.two-thirds-solve",
    "animation.fractional-linear.solve-x-over-2",
    "animation.fractional-linear.x-over-2.balanced-proof",
    "animation.fractional-linear.x-over-2.fluent-projection",
    "animation.numerator-split-merge.round-trip"
  ]);
});
