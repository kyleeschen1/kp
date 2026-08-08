import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpEconomicsLessonBuffer,
  type KpEconomicsLessonBuffer
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-lesson-buffer.ts";
import {
  createKpEconomicsLessonSemanticIndex
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-semantic-index.ts";
import {
  kpEconomicsMotionBlocks
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-motion-blocks.ts";
import {
  kpEconomicsTwoColumnParagraphs
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-two-column-scroll.ts";
import {
  kpEconomicsTwoColumnSourceSchema
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-two-column-source.ts";

function currentBuffer(): KpEconomicsLessonBuffer {
  return createKpEconomicsLessonBuffer({
    schemaVersion: kpEconomicsTwoColumnSourceSchema,
    passages: kpEconomicsTwoColumnParagraphs.map((passage) => ({
      id: passage.id,
      role: passage.role,
      ...(passage.motionBlockId === undefined
        ? {}
        : { motionBlockId: passage.motionBlockId }),
      sourceText: passage.paragraphs[0]!.sourceText
    }))
  });
}

test("semantic index is fresh against economics repository registries", () => {
  const index = createKpEconomicsLessonSemanticIndex(currentBuffer());
  const ids = (kind: string) => index.entries
    .filter((entry) => entry.kind === kind)
    .map(({ id }) => id);

  assert.deepEqual(ids("motion-block"), kpEconomicsMotionBlocks.map(({ id }) => id));
  assert.deepEqual(ids("semantic-reference"), ["price-axis-inline"]);
  assert.deepEqual(ids("stage-object"), ["axis-price"]);
  assert.deepEqual(ids("semantic-transit"), ["price-axis-correspondence"]);
  assert.deepEqual(ids("animation"), [
    "animation.economics.supply-demand-equilibrium-shift"
  ]);
  assert.ok(ids("checkpoint").includes("shift-ready"));
  assert.ok(ids("checkpoint").includes("ready-to-shift"));
  assert.deepEqual(index.vignetteIds, []);
});

test("completion entries are contextual and insert typed forms", () => {
  const index = createKpEconomicsLessonSemanticIndex(currentBuffer());
  const forContext = (context: "kp-ref" | "kp-directive" | "semantic-id") =>
    index.completions.filter((completion) =>
      completion.contexts?.includes(context)
    );

  assert.deepEqual(forContext("kp-ref").map(({ label }) => label), [
    "price-axis-inline"
  ]);
  assert.match(forContext("kp-ref")[0]!.detail, /axis-price/);
  assert.ok(forContext("kp-directive").some(({ label, apply }) =>
    label === "passage" && apply?.includes("<!-- kp:source -->")
  ));
  assert.ok(forContext("semantic-id").some(({ label }) =>
    label === "demand-shift"
  ));
  assert.equal(forContext("semantic-id").some(({ label }) =>
    label === "stale-reference"), false);
});

test("foreign references produce exact diagnostics", () => {
  const index = createKpEconomicsLessonSemanticIndex(currentBuffer());
  const source = [
    "Known [$P$](kp-ref:price-axis-inline).",
    "Unknown [$X$](kp-ref:stale-reference)."
  ].join("\n");
  const diagnostics = index.diagnose(source);

  assert.deepEqual(diagnostics.map(({ code, id, from, to }) => ({
    code,
    id,
    value: source.slice(from, to)
  })), [{
    code: "KP_UNKNOWN_REFERENCE",
    id: "stale-reference",
    value: "stale-reference"
  }]);
});

test("stale buffer ownership is rejected before completion", () => {
  const buffer = currentBuffer();
  const stale: KpEconomicsLessonBuffer = {
    ...buffer,
    motionBlocks: buffer.motionBlocks.map((block, index) => index === 0
      ? { ...block, passageId: "shift-versus-movement" }
      : block)
  };
  assert.throws(
    () => createKpEconomicsLessonSemanticIndex(stale),
    /stale or foreign/
  );
});
