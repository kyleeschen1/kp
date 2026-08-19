import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("catalogue prose and neutral equation paint share one foreground token", async () => {
  const [catalogueCss, logExponentCss] = await Promise.all([
    readFile("src/editor/animation-catalogue-shell.css", "utf8"),
    readFile("src/editor/log-exponent-surface.css", "utf8")
  ]);

  assert.match(
    catalogueCss,
    /--kp-catalogue-ink:\s*#25231f;[\s\S]*?--kp-equation-foreground:\s*var\(--kp-catalogue-ink\);/
  );
  assert.match(
    catalogueCss,
    /\.kp-animation-catalogue-shell__stage-host\s*\{[\s\S]*?color:\s*var\(--kp-equation-foreground\);/
  );
  assert.match(
    logExponentCss,
    /color:\s*var\(--kp-equation-foreground,\s*currentColor\);/
  );
  assert.doesNotMatch(
    catalogueCss,
    /--kp-equation-foreground:\s*#[0-9a-f]{3,8}/i
  );
});
