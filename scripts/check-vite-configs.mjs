import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { loadConfigFromFile } from "vite";

const root = process.cwd();
const configs = [root, resolve(root, "config/vite")].filter(existsSync)
  .flatMap(directory => readdirSync(directory).filter(name => /^vite(?:\..+)?\.config\.ts$/.test(name))
    .map(name => resolve(directory, name))).sort((a, b) => basename(a).localeCompare(basename(b)));
assert.equal(new Set(configs.map(filename => basename(filename))).size, configs.length);
const normalize = value => JSON.parse(JSON.stringify(value, (key, item) => {
  if (key === "__KP_DEV_REVIEW_BUILD__") {
    const identity = JSON.parse(item);
    assert.notEqual(identity.commit, "unknown", "Config must resolve the actual Git project root");
    return "<current-git-identity>";
  }
  if (typeof item === "function") return "<hook>";
  if (item instanceof RegExp) item = { pattern: item.source, flags: item.flags };
  if (typeof item === "string") return item.replaceAll(root, "<repo>");
  return item && typeof item === "object" && !Array.isArray(item)
    ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item;
}));
const snapshots = {};
for (const filename of configs) {
  snapshots[basename(filename)] = {};
  for (const command of ["serve", "build"]) {
    const loaded = await loadConfigFromFile({ command, mode: command === "serve" ? "development" : "production" }, filename);
    assert.ok(loaded, filename);
    const config = loaded.config;
    const entries = config.build?.rollupOptions?.input ?? {};
    for (const entry of typeof entries === "string" ? [entries] : Object.values(entries)) {
      assert.ok(existsSync(resolve(root, entry)), `${filename}: missing input ${entry}`);
    }
    // Plugin hooks still require real build/browser checks. Preserve their
    // declaration shape here, together with all configured routing/build values.
    snapshots[basename(filename)][command] = normalize(config);
  }
}
const args = process.argv.slice(2);
if (args[0] === "--capture" && args[1]) {
  mkdirSync(dirname(args[1]), { recursive: true });
  writeFileSync(args[1], JSON.stringify(snapshots, null, 2) + "\n");
} else {
  assert.equal(args.length, 0, "Use --capture <file> only for a reviewed baseline change");
  const expected = JSON.parse(readFileSync("tests/fixtures/vite-config-baseline.json", "utf8"));
  const changed = [...new Set([...Object.keys(expected), ...Object.keys(snapshots)])]
    .filter(name => JSON.stringify(expected[name]) !== JSON.stringify(snapshots[name]));
  if (changed.length) {
    mkdirSync("tmp/codex", { recursive: true });
    writeFileSync("tmp/codex/vite-config-difference.json", JSON.stringify(snapshots, null, 2) + "\n");
    assert.fail(`Vite configuration changed: ${changed.join(", ")}; see tmp/codex/vite-config-difference.json`);
  }
}
console.log(`Vite declarations and input paths: ${configs.length} configurations checked in serve and build modes.`);
