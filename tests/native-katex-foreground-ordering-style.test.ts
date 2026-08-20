import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const globalStyles = readFileSync(
  new URL("../src/styles.css", import.meta.url),
  "utf8"
);
const logExponentStyles = readFileSync(
  new URL("../src/editor/log-exponent-surface.css", import.meta.url),
  "utf8"
);
const occluderSelector = String.raw`
  \.editor-equation-stage__material-owner\[
  \s*data-kp-equation-material-foreground-occlusion-role="occluder"\s*
  \]
`.replaceAll(/\s+/g, "");

test("Native KaTeX foreground ordering never synthesizes a backing plate", () => {
  assert.match(
    globalStyles,
    new RegExp(`${occluderSelector}\\s*\\{[^}]*z-index:\\s*2;`, "s")
  );
  assert.doesNotMatch(
    globalStyles,
    new RegExp(`${occluderSelector}::before`)
  );
  assert.doesNotMatch(
    globalStyles,
    /--kp-equation-foreground-occlusion-surface/
  );
  assert.doesNotMatch(
    logExponentStyles,
    /--kp-equation-foreground-occlusion-surface/
  );
});
