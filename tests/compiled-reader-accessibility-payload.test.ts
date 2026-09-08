import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { compileKpFoldableDistributionEquationLesson } from "../src/reader/compiler/foldable-distribution-equation-lesson.ts";
import { buildBayesNativeProbe } from "../src/experiments/bayesian-reasoning/native-probe-page.ts";
import { compileKpRadicalSuccessionEquationLesson } from "../src/reader/compiler/radical-succession-equation-lesson.ts";

test("canonical standalone templates require accessible endpoints while page readers retain their existing owner", () => {
  const withControls = compileKpFoldableDistributionEquationLesson(readFileSync(new URL("../content/lessons/foldable-distribution.md", import.meta.url), "utf8")).html;
  const cases: ReadonlyArray<{ html: string; count: number }> = [
    { html: withControls, count: 6 }, { html: buildBayesNativeProbe(), count: 2 }
  ];
  for (const { html, count } of cases) {
    const states = [...html.matchAll(/<div data-kp-reader-accessible-equation-state="[^"]+"[^>]*>([\s\S]*?)<\/div>/g)];
    assert.equal(states.length, count);
    for (const state of states) {
      assert.match(state[1]!, /<math\b/);
      assert.match(state[1]!, /<(?:mrow|mfrac|mn|mi)\b/);
    }
    // Real native measurement/paint still uses its full visual glyph tree.
    assert.match(html, /data-kp-reader-equation-measurement="true" aria-hidden="true"[\s\S]*katex-html/);
  }
  const page = compileKpRadicalSuccessionEquationLesson(readFileSync(new URL("../content/lessons/radical-succession.md", import.meta.url), "utf8")).html;
  assert.equal((page.match(/<math\b/g) ?? []).length, 3);
  assert.doesNotMatch(page, /data-kp-reader-accessible-equation-state=/);
});
