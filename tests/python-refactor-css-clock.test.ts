import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Python refactor CSS paints sampled values without owning time", () => {
  const css = readFileSync(
    new URL("../src/editor/programming-surface.css", import.meta.url),
    "utf8"
  );
  const block = css.slice(css.indexOf(".kp-python-refactor"));

  assert.match(block, /--kp-python-revision-opacity/);
  assert.match(block, /--kp-python-revision-scale/);
  assert.match(block, /--kp-code-highlight-background:\s*rgb\(92 173 255 \/ 10%\)/);
  const focusBlock = block.match(
    /\.kp-python-refactor \[data-kp-python-focus="true"\] \{([^}]*)\}/
  )?.[1];
  assert.ok(focusBlock);
  assert.doesNotMatch(focusBlock, /background(?:-color)?\s*:/);
  assert.doesNotMatch(block, /@keyframes/);
  assert.match(block, /animation:\s*none/);
  assert.match(block, /transition:\s*none/);
});
