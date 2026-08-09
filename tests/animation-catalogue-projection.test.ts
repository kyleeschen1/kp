import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";
import {
  createKpAnimationLibraryDisplayCatalog
} from "../src/editor/animation-library-display-catalog.ts";
import { createKpEditorAnimationLibrary } from "../src/editor/animation-library.ts";

test("asset-first projection keeps one lightweight entry with subordinate contexts", () => {
  const projection = createKpAnimationCatalogueProjection();
  const solveX = projection.entries.find(
    ({ animationId }) => animationId === "animation.linear-solve.solve-x"
  );
  const economics = projection.entries.find(
    ({ animationId }) =>
      animationId ===
        "animation.economics.supply-demand-equilibrium-shift"
  );
  assert.ok(solveX);
  assert.ok(economics);

  assert.equal(projection.entries.length, 37);
  assert.equal(solveX.primaryDescriptorId,
    "editor-animation.animation.linear-solve.solve-x");
  assert.equal(solveX.packId, "algebra");
  assert.equal(solveX.title, "Solve x + 3 = 7");
  assert.equal(solveX.humanDisposition, "unreviewed");
  assert.equal(
    projection.entries.filter(
      ({ humanDisposition }) => humanDisposition === "unreviewed"
    ).length,
    36
  );
  assert.equal(
    projection.entries.find(
      ({ animationId }) => animationId === "animation.dot-projection.basic"
    )?.humanDisposition,
    "keep"
  );
  assert.deepEqual(solveX.domains, ["algebra"]);
  assert.deepEqual(solveX.familyIds, [
    "family.algebra.both-sides",
    "family.algebra.cancel-combine"
  ]);
  assert.deepEqual(solveX.sampleIds, [
    "sample.animation.solve-x.both-sides",
    "sample.animation.solve-x.cancel-additive-inverses"
  ]);
  assert.equal(solveX.relatedContexts.length, 7);
  assert.equal(solveX.tags.includes("sample.animation.solve-x.both-sides"), false);
  assert.equal(solveX.searchTerms.includes(
    "sample.animation.solve-x.both-sides"
  ), true);
  assert.equal(solveX.searchTerms.includes("unreviewed"), true);
  assert.deepEqual(
    [...new Set(solveX.relatedContexts.map(({ kind }) => kind))].sort(),
    ["card", "diagnostic", "editor", "reader"]
  );
  assert.ok(solveX.relatedContexts
    .filter(({ kind }) => kind === "editor" || kind === "card")
    .every(({ href }) => href.includes("view=editor")));
  assert.equal(
    Object.keys(solveX).includes("representations"),
    false
  );
  assert.equal(economics.packId, "economics");
  assert.equal(economics.title, "Supply and demand equilibrium shift");
  assert.equal(
    economics.summary,
    "Shifts demand on an exact supply-demand graph and follows the resulting market equilibrium."
  );
  assert.deepEqual(economics.renderTargetKinds, ["graph"]);
  assert.deepEqual(economics.controlKinds, [
    "playback",
    "step",
    "scrubber",
    "rewind"
  ]);
  assert.equal(economics.durationMs, 2400);
  assert.equal(economics.beatCount, 48);
  assert.ok(economics.searchTerms.includes("economics"));
  assert.equal(economics.relatedContexts.length, 2);
});

test("display-only playability and planned identities cannot enter projection", () => {
  const projection = createKpAnimationCatalogueProjection();
  const ids = new Set(projection.entries.map(({ animationId }) => animationId));

  assert.equal(ids.has("animation.numerator-split-merge.round-trip"), false);
  assert.equal(
    ids.has("animation.algebra.quadratic.solution-branching"),
    false
  );
  assert.equal(
    createKpAnimationLibraryDisplayCatalog().some(
      ({ animationId }) =>
        animationId === "animation.numerator-split-merge.round-trip"
    ),
    true
  );
});

test("projection fails closed on primary and related-context identity drift", () => {
  const descriptors = createKpEditorAnimationLibrary();
  const projection = createKpAnimationCatalogueProjection({ descriptors });
  const first = projection.entries[0];
  assert.ok(first);

  assert.throws(
    () => createKpAnimationCatalogueProjection({
      descriptors: descriptors.filter(
        ({ id }) => id !== first.primaryDescriptorId
      ),
      loadable: [{
        schemaVersion:
          "kp.animation-catalogue-loadable-registry-entry.v1",
        kind: "loadable-animation-asset",
        animationId: first.animationId,
        primaryDescriptorId: first.primaryDescriptorId,
        packId: first.packId
      }]
    }),
    /requires primary descriptor/
  );

  const display = createKpAnimationLibraryDisplayCatalog();
  assert.throws(
    () => createKpAnimationCatalogueProjection({
      descriptors,
      display: [...display, display[0]!]
    }),
    /Duplicate animation catalogue display entry animation id/
  );
});

test("runtime projection avoids source-rich Workbench and renderer graphs", async () => {
  const source = await readFile(
    new URL("../src/editor/animation-catalogue-projection.ts", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /semantic-animation-workbench/);
  assert.doesNotMatch(source, /animation\/catalog\.ts/);
  assert.doesNotMatch(source, /surface-adapter/);
  assert.doesNotMatch(source, /rendering\//);
  assert.doesNotMatch(source, /docs\/theseus/);
});
