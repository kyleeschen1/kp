import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { centroid as beforeCentroid } from "../examples/programming/centroid-before.ts";
import { centroid as afterCentroid, mean } from "../examples/programming/centroid-after.ts";
import { centroidPaths, compileCentroidPublication } from "../scripts/centroid-publication.ts";
import { renderCentroidNativeCode } from "../src/rendering/centroid-native-code-html.ts";
import { tokenizeKpTypeScriptSource } from "../src/semantic/typescript-source-tokens.ts";
import { centroidReading } from "../src/tutorial/code-reasoning/centroid-reading.ts";
import { createCentroidMotion } from "../src/animation/centroid-extraction-motion.ts";
import { centroidBeatReading } from "../src/tutorial/code-reasoning/centroid-beats.ts";
import { centroidClaims } from "../src/tutorial/code-reasoning/centroid-attention.ts";
import { projectCentroidTextPosition } from "../src/tutorial/code-reasoning/centroid-text-rail.ts";

const read = (path: string) => readFileSync(path, "utf8");
const markdown = read(centroidPaths.article), before = read(centroidPaths.before), after = read(centroidPaths.after);

test("text rail holds native states between thoughts and samples only declared transformations", () => {
  for (const p of [0, .5, 1, 1.5, 2, 2.5, 3]) assert.equal(projectCentroidTextPosition(p).codeProgress, 0);
  for (const p of [4, 4.5, 5]) assert.equal(projectCentroidTextPosition(p).codeProgress, .5);
  for (const p of [6, 6.5, 7]) assert.equal(projectCentroidTextPosition(p).codeProgress, 1);
  assert.equal(projectCentroidTextPosition(3.5).codeProgress, .25);
  assert.equal(projectCentroidTextPosition(5.5).codeProgress, .75);
  assert.deepEqual(projectCentroidTextPosition(-1), projectCentroidTextPosition(0));
  assert.deepEqual(projectCentroidTextPosition(10), projectCentroidTextPosition(7));
  assert.throws(() => projectCentroidTextPosition(NaN), /finite/);
});

test("reading beats retain unique addresses and existing semantic authority", () => {
  const { html } = compileCentroidPublication(markdown, before, after);
  assert.equal(new Set(centroidBeatReading.map(beat => beat.id)).size, centroidBeatReading.length);
  for (const beat of centroidBeatReading) {
    assert.ok(centroidReading.some(reason => reason.id === beat.checkpoint));
    assert.ok(beat.claims.length > 0);
    for (const id of beat.claims) assert.ok(centroidClaims.some(claim => claim.id === id));
    assert.ok(html.includes(`id="centroid-${beat.id}"`));
  }
  assert.equal(centroidBeatReading.filter(beat => beat.because).length, 1);
  assert.match(html, /Extracting only the division would leave the repeated accumulation/);
});

test("centroid extraction preserves declared cases and independent accumulators", () => {
  for (const [xs, ys] of [
    [[0, 6, 0], [0, 0, 3]], [[-4], [7]], [[-2, 0, 2], [10, 20, 30]],
    [[.1, .2, .3], [.4, .5, .6]], [[1e16, 1, -1e16], [1, 2, 3]]
  ]) {
    const x = [...xs!], y = [...ys!];
    assert.deepEqual(afterCentroid(x, y), beforeCentroid(x, y));
    assert.deepEqual(x, xs); assert.deepEqual(y, ys);
  }
  assert.deepEqual(afterCentroid([0, 6, 0], [0, 0, 3]), [2, 1]);
  assert.equal(mean([100, 200]), 150);
  assert.equal(mean([1, 2, 3]), 2);
});

test("publication excerpts preserve source, while complete files remain available", () => {
  const { html, excerpts } = compileCentroidPublication(markdown, before, after);
  assert.equal(excerpts.x, "let sx = 0;\nfor (const x of xs) {\n  sx += x;\n}\nconst cx = sx / xs.length;");
  assert.equal(excerpts.y, excerpts.x.replaceAll("x", "y"));
  assert.ok(after.includes(excerpts.helper));
  for (const source of [before, after, ...Object.values(excerpts)]) {
    assert.ok(html.includes(renderCentroidNativeCode({ source, tokens: tokenizeKpTypeScriptSource(source) })));
  }
  assert.equal([...html.matchAll(/data-centroid-excerpt=/g)].length, 4);
  assert.doesNotMatch(html, /<script/);
  assert.match(html, /data-centroid-open hidden/);
  assert.deepEqual(centroidReading.map(reason => reason.id), createCentroidMotion().artifact.states.map(state => state.id));
  for (const reason of centroidReading) assert.ok(html.includes(`data-centroid-reason="${reason.id}"`));
  const changed = compileCentroidPublication(markdown, before.replace("sx += x", "sx += 2 * x"), after);
  assert.match(changed.excerpts.x, /sx \+= 2 \* x/);
  // Source fidelity is intentionally not an equivalence certificate.
});

test("changed clipping structure and missing passage fail closed", () => {
  assert.throws(() => compileCentroidPublication(markdown, before.replace("return [cx, cy];", "const extra = 1;\nreturn [cx, cy];"), after), /structure changed/);
  assert.throws(() => compileCentroidPublication(markdown, before.replace("for (const x of xs)", "while (true)"), after), /roles changed/);
  assert.throws(() => compileCentroidPublication(markdown.replace("#pattern}", "#other}"), before, after), /ordered/);
});
