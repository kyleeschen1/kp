import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAnimationLibraryDisplayCatalog
} from "../src/editor/animation-library-display-catalog.ts";
import {
  createKpSemanticAnimationWorkbenchIndex
} from "../src/editor/semantic-animation-workbench-data.ts";

test("display catalog exposes every Workbench identity plus reader-only animations", () => {
  const workbench = createKpSemanticAnimationWorkbenchIndex();
  const catalog = createKpAnimationLibraryDisplayCatalog();
  const ids = catalog.map(({ animationId }) => animationId);

  assert.equal(new Set(ids).size, ids.length);
  assert.ok(catalog.length > workbench.entries.length);
  assert.deepEqual(
    workbench.entries
      .map(({ identity }) => identity.animationId)
      .filter((animationId) => !ids.includes(animationId)),
    []
  );
  assert.ok(ids.includes("animation.numerator-split-merge.round-trip"));
  assert.ok(ids.includes("animation.divide-both-sides.solve-3x-equals-12"));
  assert.ok(
    ids.includes("animation.foldable-distribution.collect-like-terms")
  );
});

test("foldable distribution resolves one lazy canonical reader host", () => {
  const entry = createKpAnimationLibraryDisplayCatalog().find(
    ({ animationId }) =>
      animationId === "animation.foldable-distribution.collect-like-terms"
  );

  assert.equal(entry?.availability, "playable");
  assert.equal(entry?.featured, false);
  assert.equal(entry?.representations.length, 1);
  assert.deepEqual(entry?.representations[0], {
    id:
      "learner-experience.foldable-distribution-scroll-lesson." +
      "animation.foldable-distribution.collect-like-terms",
    label: "Distribute, evaluate, and collect",
    kind: "reader",
    href: "/reader/foldable-distribution/",
    role: "canonical-host"
  });
  assert.equal(
    entry?.primaryRepresentationId,
    entry?.representations[0]?.id
  );
});

test("featured exemplars resolve one primary host without duplicating runtimes", () => {
  const featured = createKpAnimationLibraryDisplayCatalog().filter(
    ({ featured }) => featured
  );

  assert.deepEqual(
    new Set(featured.map(({ animationId }) => animationId)),
    new Set([
      "animation.generated.radical.square-root-as-power",
      "animation.numerator-split-merge.round-trip",
      "animation.linear-solve.solve-x",
      "animation.generated.distribution.expand-a-sum",
      "animation.derivative-rules.tangent-graph"
    ])
  );
  for (const entry of featured) {
    assert.equal(entry.availability, "playable");
    assert.ok(entry.primaryRepresentationId);
    assert.equal(
      entry.representations.filter(
        ({ role }) => role === "canonical-host"
      ).length,
      1
    );
  }
});

test("radical and fraction review hosts point to approved canonical readers", () => {
  const catalog = createKpAnimationLibraryDisplayCatalog();
  const radical = catalog.find(
    ({ animationId }) =>
      animationId ===
      "animation.generated.radical.square-root-as-power"
  );
  const fraction = catalog.find(
    ({ animationId }) =>
      animationId === "animation.numerator-split-merge.round-trip"
  );

  assert.equal(
    radical?.representations.find(
      ({ id }) => id === radical.primaryRepresentationId
    )?.href,
    "/reader/radical-succession/"
  );
  assert.equal(
    fraction?.representations.find(
      ({ id }) => id === fraction.primaryRepresentationId
    )?.href,
    "/reader/split-merge-fractions/"
  );
  assert.ok(
    radical?.representations.some(({ role }) => role === "diagnostic")
  );
  assert.ok(
    fraction?.representations.some(({ role }) => role === "diagnostic")
  );
});
