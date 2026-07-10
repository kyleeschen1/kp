import { strict as assert } from "node:assert";
import test from "node:test";

import { equationAnimationCatalogEntries } from "../src/editor/equation-animation-catalog.ts";
import {
  createKpEquationAnimationSession,
  createKpEquationAnimationSessionFromEntry,
  findKpEquationAnimationSelection,
  findKpEquationMotionTokenMetadata,
  listKpEquationAnimationSelections
} from "../src/public/kp-animation-sdk.ts";

test("public animation selections expose lightweight picker metadata", () => {
  const selections = listKpEquationAnimationSelections();
  const ids = selections.map((selection) => selection.id);

  assert.ok(ids.includes("linear-equation-solve-x"));
  assert.ok(ids.includes("fixture-fraction-make-inline-to-stacked"));
  assert.equal(findKpEquationAnimationSelection("linear-equation-solve-x")?.label, "x + 3 = 7");
  assert.equal(
    findKpEquationAnimationSelection("fixture-fraction-make-inline-to-stacked")?.fixtureId,
    "fraction.make.inline-to-stacked"
  );
});

test("public animation manifest ids match the full animation catalog", () => {
  const selectionIds = listKpEquationAnimationSelections().map(
    (selection) => selection.id
  );
  const catalogIds = equationAnimationCatalogEntries.map((entry) => entry.id);

  assert.deepEqual([...selectionIds].sort(), [...catalogIds].sort());
});

test("createKpEquationAnimationSession lazy-loads an animation and samples time", async () => {
  const renderedProgress: number[] = [];
  const session = await createKpEquationAnimationSession("linear-equation-solve-x", {
    render: (frame) => renderedProgress.push(frame.progress)
  });
  const frame = session.setProgress(0.5);

  assert.equal(session.animation.id, "linear-equation-solve-x");
  assert.equal(session.getProgress(), 0.5);
  assert.equal(frame.progress, 0.5);
  assert.deepEqual(renderedProgress, [0.5]);
  assert.ok(frame.tokens.some((token) => token.tokenId === "lhs.x"));
});

test("animation sessions expose token metadata for hover affordances", () => {
  const animation = equationAnimationCatalogEntries.find(
    (entry) => entry.id === "linear-equation-solve-x"
  );

  assert.ok(animation);
  const session = createKpEquationAnimationSessionFromEntry(animation);
  const metadata = session.getTokenMetadata("lhs.x");

  assert.deepEqual(metadata, {
    tokenId: "lhs.x",
    label: "x",
    lifecycle: "persist",
    visualLifecycle: "persist",
    correspondenceRelation: "identity",
    sourceMotionId: "lhs.x",
    targetMotionId: "lhs.x",
    sourceLatex: "x",
    targetLatex: "x"
  });
});

test("findKpEquationMotionTokenMetadata resolves source and target motion ids", () => {
  const animation = equationAnimationCatalogEntries.find(
    (entry) => entry.id === "fixture-fraction-make-inline-to-stacked"
  );

  assert.ok(animation);
  const session = createKpEquationAnimationSessionFromEntry(animation);
  const sourceMetadata = findKpEquationMotionTokenMetadata(
    session.plan,
    "fraction.make.inline-to-stacked.source.slash"
  );
  const targetMetadata = findKpEquationMotionTokenMetadata(
    session.plan,
    "fraction.make.inline-to-stacked.target.frac-line"
  );

  assert.equal(sourceMetadata?.tokenId, "fraction.make.inline-to-stacked.slash");
  assert.equal(targetMetadata?.tokenId, "fraction.make.inline-to-stacked.frac-line");
  assert.equal(sourceMetadata?.sourceLatex, "/");
  assert.equal(targetMetadata?.targetLatex, "structural:frac-line");
});
