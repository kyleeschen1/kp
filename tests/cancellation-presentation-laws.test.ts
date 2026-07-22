import assert from "node:assert/strict";
import test from "node:test";
import { checkKpCancellationPresentationLaws } from "../src/animation/cancellation-presentation-laws.ts";

test("cancellation laws report contact, readability, retirement, and rewind failures", () => {
  const sources = (opacity: number, x2: number) => ({ sources: [
    { id: "left", x: 0, y: 0, opacity },
    { id: "right", x: x2, y: 0, opacity }
  ] });
  assert.deepEqual(checkKpCancellationPresentationLaws({
    beforeContact: sources(0.4, 0),
    contact: sources(0, 2),
    retired: sources(1, 0),
    rewindContact: sources(1, 3)
  }), [
    "unreadable-before-contact",
    "premature-contact",
    "incomplete-shared-contact",
    "unreadable-at-contact",
    "incomplete-retirement",
    "rewind-mismatch"
  ]);
});
