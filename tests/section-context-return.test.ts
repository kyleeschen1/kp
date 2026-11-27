import assert from "node:assert/strict";
import test from "node:test";
import { createSectionDetour, parseSectionContext, readSectionDetour, readSectionReturnPoint, sectionReturnHref } from "../src/experiments/saddle-section-reference/detour-state.ts";
import { initialOccurrences, readReferenceState } from "../src/experiments/saddle-section-reference/state.ts";
import { sectionHeight } from "../src/animation-player/section-model.ts";

const point = { slot: 1 as const, sourceId: initialOccurrences[1]!.source.id, object: "section-curve" as const, offset: -127.25, expanded: [false, true] as const };
test("a detached question pins both source copies and exact origin view independently of its answer/view", () => {
  const origin = initialOccurrences.map(item => ({ source: { ...item.source }, view: { ...item.view, inspection: .37125, azimuth: 423 } }));
  const context = createSectionDetour(origin, point);
  origin[1]!.source.y = 2; origin[1]!.view.inspection = 0;
  const revealed = readSectionDetour({ ...context, prediction: { status: "revealed", choice: "different" }, comparison: "opposite", view: { ...context.view, inspection: .8 } });
  assert.equal(revealed.status, "ready"); if (revealed.status !== "ready") return;
  assert.equal(revealed.value.origin[1]!.source.y, 1);
  assert.equal(revealed.value.origin[1]!.view.inspection, .37125);
  assert.ok(Object.isFrozen(revealed.value.origin[1]!.source));
  const restored = parseSectionContext(JSON.stringify(revealed.value)); assert.deepEqual(restored, revealed);
  const url = new URL(sectionReturnHref(revealed.value, "dark"), "https://example.test");
  assert.equal(url.pathname, "/experiments/saddle-section-reference/"); assert.equal(url.hash, "#section-2");
  const copies = readReferenceState(url.searchParams.get("sections")); assert.equal(copies.status, "ready");
  if (copies.status === "ready") assert.deepEqual(copies.occurrences, context.origin);
  assert.deepEqual(JSON.parse(url.searchParams.get("returnPoint")!), point);
});
test("malformed, mismatched and unsupported detours fail atomically rather than repairing by substitution", () => {
  const context = createSectionDetour(initialOccurrences, point);
  for (const input of [null, { ...context, question: "arbitrary" }, { ...context, extra: true }, { ...context, origin: [] },
    { ...context, returnTo: { ...point, sourceId: "foreign" } }, { ...context, returnTo: { ...point, offset: Infinity } },
    { ...context, returnTo: { ...point, slot: 3 } }, { ...context, returnTo: { ...point, object: "other" } },
    { ...context, returnTo: { ...point, expanded: [true] } },
    { ...context, prediction: { status: "graded", choice: "same" } }, { ...context, comparison: "opposite" },
    { ...context, view: { ...context.view, inspection: 2 } }]) assert.equal(readSectionDetour(input).status, "repair-required");
  for (const raw of [null, "{", " ".repeat(12001)]) assert.equal(parseSectionContext(raw).status, "repair-required");
  assert.equal(readSectionReturnPoint({ ...point, href: "https://external.test" }, initialOccurrences).status, "repair-required");
});
test("the authored reflection answer is true for the complete supported saddle family, including c=0", () => {
  for (const d of [4, 5.1234, 8]) for (const c of [-3, -1.123456789, 0, .25, 3]) for (let i = 0; i <= 24; i++) {
    const x = -3 + i / 4;
    assert.equal(sectionHeight(x, c, d), sectionHeight(x, -c, d));
    assert.equal(c === -c, c === 0, "Only the central plane coincides with its reflection");
  }
});
