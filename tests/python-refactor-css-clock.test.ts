import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { kpPythonRefactorDarkOpticalEndpoint } from
  "../src/rendering/python-refactor-optical-theme.ts";

test("Python refactor CSS paints sampled values without owning time", () => {
  const css = readFileSync(
    new URL("../src/editor/programming-surface.css", import.meta.url),
    "utf8"
  );
  const block = css.slice(css.indexOf(".kp-python-refactor"));

  assert.match(block, /--kp-python-revision-opacity/);
  assert.match(block, /--kp-python-revision-scale/);
  assert.match(
    block,
    /--kp-code-highlight-background:\s*var\(--kp-python-paint-focus-wash\)/
  );
  assert.equal(
    kpPythonRefactorDarkOpticalEndpoint.properties[
      "--kp-python-paint-focus-wash"
    ],
    "rgb(92 173 255 / 10%)"
  );
  const focusBlock = block.match(
    /\.kp-python-refactor \[data-kp-python-focus="true"\] \{([^}]*)\}/
  )?.[1];
  assert.ok(focusBlock);
  assert.doesNotMatch(focusBlock, /background(?:-color)?\s*:/);
  assert.doesNotMatch(block, /@keyframes/);
  assert.match(block, /animation:\s*none/);
  assert.match(block, /transition:\s*none/);
});
