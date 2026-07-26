import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sessionSource = readFileSync(
  "src/reader/app/reader-canonical-equation-session.ts",
  "utf8"
);
const entrySource = readFileSync("src/reader/app/exemplar-entry.ts", "utf8");
const observationSource = readFileSync(
  "src/rendering/native-katex-rendered-scene.ts",
  "utf8"
);

test("canonical session invalidates native measurements by font and surface revision", () => {
  assert.match(sessionSource, /frame\.fontReadiness\.revision/);
  assert.match(sessionSource, /frame\.fitSurface\.offsetWidth/);
  assert.match(sessionSource, /frame\.fitSurface\.offsetHeight/);
  assert.match(observationSource, /fontRevision: input\.fontReadiness\.revision/);
  assert.match(observationSource, /devicePixelRatio/);
  assert.match(observationSource, /styleFingerprint/);
});

test("reader schedules fresh layout after fonts and resize without notation exceptions", () => {
  assert.match(entrySource, /renderer\.refresh\("fonts"\)/);
  assert.match(entrySource, /renderer\.refresh\("resize"\)/);
  assert.match(entrySource, /createKpReaderFontReviewLifecycle/);
  assert.match(entrySource, /scheduleScrollSample\(\)/);
  for (const forbidden of [
    "fraction.numerator",
    "frac-line",
    "KaTeX_Math",
    "numerator-split-merge"
  ]) {
    assert.equal(sessionSource.includes(forbidden), false);
  }
});
