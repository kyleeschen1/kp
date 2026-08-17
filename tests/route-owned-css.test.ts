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

