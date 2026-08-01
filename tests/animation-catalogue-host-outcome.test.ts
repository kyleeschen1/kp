import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createKpAnimationCatalogueHostOutcomeFixture
} from "./fixtures/animation-catalogue-host-outcome-fixture.ts";
import {
  createKpAnimationCatalogueLoadFailure,
  deriveKpAnimationCatalogueHostOutcome
} from "../src/editor/animation-catalogue-host-outcome.ts";

test("observed paint records exact surface and adapter evidence", () => {
  const { entry, hostability } =
    createKpAnimationCatalogueHostOutcomeFixture();

  assert.deepEqual(
    deriveKpAnimationCatalogueHostOutcome({
      entry,
      hostability,
      hostObservation: { status: "painted" }
    }),
    {
      schemaVersion: "kp.animation-catalogue-host-outcome.v1",
      kind: "animation-catalogue-host-outcome",
      animationId: entry.animationId,
      descriptorId: entry.primaryDescriptorId,
      packId: entry.packId,
      status: "painted",
      surfaceKind: "equation",
      adapterIds: ["editor-animation-surface.equation.katex"]
    }
  );
});

test("hostability without observed paint remains nonterminal", () => {
  const { entry, hostability } =
    createKpAnimationCatalogueHostOutcomeFixture();

  assert.equal(
    deriveKpAnimationCatalogueHostOutcome({
      entry,
      hostability,
      hostObservation: { status: "not-observed" }
    }),
    undefined
  );
});

test("loaded assets expose adapter, surface, and paint capability gaps", () => {
  const { entry, hostability } =
    createKpAnimationCatalogueHostOutcomeFixture();
  const cases = [
    deriveKpAnimationCatalogueHostOutcome({
      entry,
      hostability: {
        ...hostability,
        status: "missing-adapter",
        slots: [{ slotKind: "equation", status: "missing-adapter" }]
      },
      hostObservation: { status: "not-observed" }
    }),
    deriveKpAnimationCatalogueHostOutcome({
      entry,
      hostability: {
        ...hostability,
        status: "unsupported-surface",
        surfaceKind: "unsupported",
        slots: [],
        unsupportedTargetKinds: ["custom"]
      },
      hostObservation: { status: "not-observed" }
    }),
    deriveKpAnimationCatalogueHostOutcome({
      entry,
      hostability,
      hostObservation: { status: "failed", message: "Paint threw." }
    })
  ];

  assert.deepEqual(
    cases.map((outcome) => outcome?.status),
    ["capability-gap", "capability-gap", "capability-gap"]
  );
  assert.deepEqual(
    cases.map((outcome) =>
      outcome?.status === "capability-gap" ? outcome.gapKind : undefined
    ),
    ["missing-adapter", "unsupported-surface", "paint-failed"]
  );
});

test("load failures preserve catalogue identity without host claims", () => {
  const { entry } = createKpAnimationCatalogueHostOutcomeFixture();
  const outcome = createKpAnimationCatalogueLoadFailure({
    entry,
    error: new Error("Pack unavailable.")
  });

  assert.equal(outcome.status, "load-failure");
  assert.equal(outcome.animationId, entry.animationId);
  assert.equal(outcome.packId, entry.packId);
  assert.equal(
    outcome.status === "load-failure" ? outcome.message : undefined,
    "Pack unavailable."
  );
  assert.equal("surfaceKind" in outcome, false);
});

test("outcomes reject cross-asset evidence and exclude roadmap authority", async () => {
  const { entry, hostability } =
    createKpAnimationCatalogueHostOutcomeFixture();

  assert.throws(() => deriveKpAnimationCatalogueHostOutcome({
    entry,
    hostability: { ...hostability, animationId: "animation.other" },
    hostObservation: { status: "painted" }
  }), /identity mismatch/);

  const source = await readFile(
    new URL(
      "../src/editor/animation-catalogue-host-outcome.ts",
      import.meta.url
    ),
    "utf8"
  );
  assert.doesNotMatch(source, /promotion|disposition|theseus|workbench/i);
});
