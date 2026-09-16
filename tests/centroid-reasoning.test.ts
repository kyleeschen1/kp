import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { centroid as beforeCentroid } from "../examples/programming/centroid-before.ts";
import { centroid as afterCentroid, mean } from "../examples/programming/centroid-after.ts";
import { centroidPaths, compileCentroidPublication } from "../scripts/centroid-publication.ts";
import { renderCentroidNativeCode } from "../src/rendering/centroid-native-code-html.ts";
import { tokenizeKpTypeScriptSource } from "../src/semantic/typescript-source-tokens.ts";

const read = (path: string) => readFileSync(path, "utf8");
const markdown = read(centroidPaths.article), before = read(centroidPaths.before), after = read(centroidPaths.after);

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
  const changed = compileCentroidPublication(markdown, before.replace("sx += x", "sx += 2 * x"), after);
  assert.match(changed.excerpts.x, /sx \+= 2 \* x/);
  // Source fidelity is intentionally not an equivalence certificate.
});

test("changed clipping structure and missing passage fail closed", () => {
  assert.throws(() => compileCentroidPublication(markdown, before.replace("return [cx, cy];", "const extra = 1;\nreturn [cx, cy];"), after), /structure changed/);
  assert.throws(() => compileCentroidPublication(markdown, before.replace("for (const x of xs)", "while (true)"), after), /roles changed/);
  assert.throws(() => compileCentroidPublication(markdown.replace("#pattern}", "#other}"), before, after), /ordered/);
});
