import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const shellUrl = new URL("../src/tutorial/KpTutorialLessonShell.svelte", import.meta.url);
const tokensUrl = new URL("../src/tutorial/kp-tutorial-lesson-shell.css", import.meta.url);
const economicsUrl = new URL(
  "../src/tutorial/economics-demand-shift/KpEconomicsDemandShiftTutorial.svelte",
  import.meta.url
);
const lispUrl = new URL(
  "../src/tutorial/lisp-function-application/KpLispFunctionApplicationTutorial.svelte",
  import.meta.url
);
const economicsCssUrl = new URL(
  "../src/tutorial/economics-demand-shift/economics-demand-shift-publication.css",
  import.meta.url
);
const lispCssUrl = new URL(
  "../src/tutorial/lisp-function-application/lisp-function-application-tutorial.css",
  import.meta.url
);
const viteConfigUrl = new URL("../vite.config.ts", import.meta.url);

test("both tutorial hosts compose the replaceable shared shell", async () => {
  const [economics, lisp] = await Promise.all([
    readFile(economicsUrl, "utf8"),
    readFile(lispUrl, "utf8")
  ]);
  for (const source of [economics, lisp]) {
    assert.match(source, /import KpTutorialLessonShell/);
    assert.match(source, /<KpTutorialLessonShell/);
    assert.match(source, /proseClass=/);
    assert.match(source, /stageClass=/);
    assert.match(source, /{#snippet prose\(\)}/);
    assert.match(source, /{#snippet stage\(\)}/);
  }
});

test("shared shell owns layout while callers own stage and salience content", async () => {
  const shell = await readFile(shellUrl, "utf8");
  assert.match(shell, /kp-tutorial-shell__layout/);
  assert.match(shell, /kp-tutorial-shell__toc/);
  assert.match(shell, /kp-tutorial-shell__prose/);
  assert.match(shell, /kp-tutorial-shell__stage/);
  assert.match(shell, /Snippet/);
  assert.doesNotMatch(shell, /economics|lisp|graph|botanical|katex/i);
});

test("shared tokens cover the approved reader geometry and fallbacks", async () => {
  const css = await readFile(tokensUrl, "utf8");
  for (const contract of [
    "--kp-lesson-ink",
    "--kp-lesson-reading-rail",
    "grid-template-columns",
    "position: sticky",
    "prefers-reduced-motion",
    "forced-colors: active",
    "max-width: 52rem"
  ]) assert.match(css, new RegExp(contract.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("domain themes adapt through shared lesson tokens", async () => {
  for (const css of await Promise.all([
    readFile(economicsCssUrl, "utf8"),
    readFile(lispCssUrl, "utf8")
  ])) {
    assert.match(css, /--kp-lesson-ink:/);
    assert.match(css, /--kp-lesson-muted:/);
    assert.match(css, /--kp-lesson-border:/);
    assert.match(css, /var\(--kp-lesson-ink\)/);
  }
});

test("production consolidates shared lesson seams into one lazy chunk", async () => {
  const config = await readFile(viteConfigUrl, "utf8");
  assert.match(config, /return "kp-tutorial-core"/);
  assert.match(config, /src\/tutorial\/kp-tutorial-/);
  assert.doesNotMatch(config, /return "kp-tutorial-core"[\s\S]{0,120}domain/);
});
