import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("TypeScript refactor CSS consumes sampled values without owning time", () => {
  const css = readFileSync(
    new URL("../src/rendering/typescript-refactor.css", import.meta.url),
    "utf8"
  );
  const block = css.slice(css.indexOf(".kp-typescript-refactor"));

  assert.match(block, /--kp-typescript-revision-opacity/);
  assert.match(block, /--kp-typescript-revision-scale/);
  assert.match(
    block,
    /--kp-code-highlight-background:\s*var\(--kp-typescript-paint-focus-wash\)/
  );
  const focusBlock = block.match(
    /\.kp-typescript-refactor \[data-kp-typescript-focus="true"\] \{([^}]*)\}/
  )?.[1];
  assert.ok(focusBlock);
  assert.doesNotMatch(focusBlock, /background(?:-color)?\s*:/);
  assert.doesNotMatch(block, /@keyframes/);
  assert.match(block, /animation:\s*none/);
  assert.match(block, /transition:\s*none/);
});
