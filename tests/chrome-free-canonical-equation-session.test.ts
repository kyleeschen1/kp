import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL(
  "../src/reader/app/chrome-free-canonical-equation-session.ts",
  import.meta.url
), "utf8");

test("chrome-free canonical session owns no autonomous clock or page chrome", () => {
  for (const forbidden of [
    "createKpReaderContinuousScrollClock",
    "requestAnimationFrame",
    "setInterval",
    "setTimeout",
    "iframe",
    "editor-player",
    "document.body"
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  assert.match(source, /readonly clock: KpReaderClockSample/);
  assert.match(source, /createKpReaderCanonicalEquationSession/);
  assert.match(source, /measureKpCanonicalEquationStageLayout/);
  assert.match(source, /syncKpCanonicalEquationNativeEndpointEvidence/);
});

test("chrome-free canonical session exposes bounded host lifecycle", () => {
  for (const operation of [
    "readonly sample:",
    "readonly seek:",
    "readonly subscribe:",
    "readonly invalidate:",
    "readonly dispose:"
  ]) {
    assert.match(source, new RegExp(operation));
  }
});
