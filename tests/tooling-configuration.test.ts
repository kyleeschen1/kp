import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve(import.meta.dirname, "..");

test("specialized Playwright configurations have one owner below config", () => {
  const rootConfigs = readdirSync(root).filter(name => /^playwright.*\.config\.ts$/.test(name));
  assert.deepEqual(rootConfigs, ["playwright.config.ts"]);
  const baseline: Record<string, unknown> = JSON.parse(readFileSync(
    resolve(root, "tests/fixtures/playwright-config-baseline.json"), "utf8"));
  const actual = ["playwright.config.ts", ...readdirSync(resolve(root, "config/playwright"))
    .filter(name => /^playwright.*\.config\.ts$/.test(name))].sort();
  assert.deepEqual(actual, Object.keys(baseline).sort(), "Preserve every named suite during relocation");
});

test("npm config references resolve after tooling relocation", () => {
  const pkg: { scripts: Record<string, string> } = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
  for (const [name, command] of Object.entries(pkg.scripts)) {
    for (const match of command.matchAll(/(?:config\/(?:playwright|vite)\/)?(?:playwright|vite)(?:\.[\w.-]+)?\.config\.ts/g)) {
      assert.ok(existsSync(resolve(root, match[0])), `${name}: missing ${match[0]}`);
    }
  }
});

test("specialized Vite configs have one owner and retain every build entry", () => {
  assert.deepEqual(readdirSync(root).filter(name => /^vite.*\.config\.ts$/.test(name)), ["vite.config.ts"]);
  const baseline: Record<string, unknown> = JSON.parse(readFileSync(resolve(root, "tests/fixtures/vite-config-baseline.json"), "utf8"));
  const configs = ["vite.config.ts", ...readdirSync(resolve(root, "config/vite"))
    .filter(name => /^vite.*\.config\.ts$/.test(name))].sort();
  assert.deepEqual(configs, Object.keys(baseline).sort());
});
