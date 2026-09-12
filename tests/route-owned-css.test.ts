import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("semantic workbench CSS follows only its lazy route capability", async () => {
  const [shared, workbench, view, main, catalogue, lisp] = await Promise.all([
    source("src/styles.css"),
    source("src/editor/semantic-animation-workbench.css"),
    source("src/editor/semantic-animation-workbench-view.ts"),
    source("src/main.ts"),
    source("src/editor/svelte-catalogue/svelte-catalogue-exemplar-entry.ts"),
    source(
      "src/tutorial/lisp-function-application/" +
      "lisp-function-application-tutorial-entry.ts"
    )
  ]);

  assert.equal(shared.includes(".kp-animation-workbench"), false);
  assert.equal(workbench.includes(".kp-animation-workbench"), true);
  assert.match(view, /^import "\.\/semantic-animation-workbench\.css";/);
  for (const eagerEntry of [main, catalogue, lisp]) {
    assert.equal(
      eagerEntry.includes("semantic-animation-workbench.css"),
      false
    );
  }
});

async function source(path: string): Promise<string> {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("focused reader CSS retains native ownership without application chrome", async () => {
  const app = await source("src/styles.css");
  const runtime = await source("src/rendering/focus-card-runtime.css");
  const base = await source("src/document-base.css");
  assert.match(app.trimStart(), /^@import "\.\/document-base\.css";\s*@import "\.\/rendering\/focus-card-runtime\.css";/);
  assert.match(base, /--kp-katex-operator-scale/);
  assert.match(runtime, /katex-transition-source-hidden/);
  assert.match(runtime, /editor-equation-stage__material-owner/);
  assert.doesNotMatch(runtime, /\.project-dashboard|\.editor-shell|\.project-agenda/);
  assert.doesNotMatch(app, /katex-transition-source-hidden|editor-equation-stage__material-owner/);
  for (const host of ["kinetic-figure-supply-tax/kinetic-figure-supply-tax-entry", "kinetic-figure-surface-contour/kinetic-figure-surface-contour-entry"]) {
    const entry = await source(`src/tutorial/${host}.ts`);
    assert.doesNotMatch(entry, /import "\.\.\/\.\.\/styles\.css"/);
    assert.match(entry, /import "\.\.\/\.\.\/rendering\/focus-card-runtime\.css"/);
  }
});
