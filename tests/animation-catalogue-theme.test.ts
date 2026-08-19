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

test("development dock and review surfaces inherit the active theme palette", async () => {
  const [toolbarCss, reviewShell] = await Promise.all([
    readFile("src/dev-toolbar/dev-toolbar.css", "utf8"),
    readFile("src/dev-review/review-shell.ts", "utf8")
  ]);

  assert.match(
    toolbarCss,
    /\[data-kp-development-theme="light"\][\s\S]*?--kp-development-dock-reserved-surface:[\s\S]*?#fbfaf7\);/
  );
  assert.match(
    toolbarCss,
    /\[data-kp-development-theme="dark"\][\s\S]*?--kp-development-dock-reserved-surface:[\s\S]*?#0d0e1c\);/
  );
  assert.match(
    toolbarCss,
    /\[data-kp-development-theme="dark"\][\s\S]*?--kp-development-dock-surface:\s*#111424;/
  );
  assert.match(
    toolbarCss,
    /html\[data-kp-dev-toolbar-active\][\s\S]*?background:\s*var\(--kp-development-dock-reserved-surface,\s*#0d0e1c\);/
  );
  assert.match(
    toolbarCss,
    /\[data-kp-dev-toolbar\][\s\S]*?background:\s*var\(--kp-development-dock-surface,\s*#171a24\);/
  );
  assert.match(
    reviewShell,
    /--surface:\s*var\(--kp-development-dock-panel,\s*#fffaf0\);/
  );
  assert.match(
    reviewShell,
    /background:\s*var\(--input-surface\);/
  );
});
