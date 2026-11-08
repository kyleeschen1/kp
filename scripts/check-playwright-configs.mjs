import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { configLoader } from "playwright/lib/common";
import { projectUtils } from "playwright/lib/runner";

// Use the installed runner's resolver and discovery, without starting a server
// or importing/executing tests. A Playwright upgrade must keep this adapter valid.
assert.equal(typeof configLoader.loadConfigFromFile, "function");
assert.equal(typeof projectUtils.collectFilesForProject, "function");
const root = process.cwd();
const directories = [root, resolve(root, "config/playwright")].filter(existsSync);
const configs = directories.flatMap(directory => readdirSync(directory)
  .filter(name => /^playwright(?:\..+)?\.config\.ts$/.test(name))
  .map(name => resolve(directory, name))).sort((a, b) => basename(a).localeCompare(basename(b)));
assert.equal(new Set(configs.map(filename => basename(filename))).size, configs.length, "Duplicate configuration owners");
const normalize = value => JSON.parse(JSON.stringify(value, (_key, item) => {
  if (item instanceof RegExp) item = { pattern: item.source, flags: item.flags };
  if (typeof item === "string") return item.replaceAll(root, "<repo>")
    .replaceAll("config/playwright/", "").replaceAll("config/vite/", "");
  // Property insertion order is not configuration behavior.
  return item && typeof item === "object" && !Array.isArray(item)
    ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item;
}));
const snapshots = {};
const cache = new Map();
for (const filename of configs) {
  const full = await configLoader.loadConfigFromFile(filename);
  const projects = [];
  for (const project of full.projects) {
    projects.push({ ...project.project, expect: project.expect,
      files: (await projectUtils.collectFilesForProject(project, cache)).sort() });
  }
  const servers = full.webServers.map(({ cwd, ...server }) => ({ ...server,
    cwd: resolve(full.configDir, cwd ?? ".") }));
  const behavior = normalize({ projects, servers, globalTimeout: full.config.globalTimeout,
    forbidOnly: full.config.forbidOnly, fullyParallel: full.config.fullyParallel,
    globalSetups: full.globalSetups, globalTeardowns: full.globalTeardowns });
  snapshots[basename(filename)] = { behavior,
    sha256: createHash("sha256").update(JSON.stringify(behavior)).digest("hex") };
}
const summary = Object.fromEntries(Object.entries(snapshots).map(([name, entry]) =>
  [name, { sha256: entry.sha256, projects: entry.behavior.projects.length,
    files: entry.behavior.projects.map(project => project.files.length) }]));
const args = process.argv.slice(2);
if (args[0] === "--capture" && args[1]) {
  mkdirSync(dirname(args[1]), { recursive: true });
  writeFileSync(args[1], JSON.stringify(summary, null, 2) + "\n");
} else {
  assert.equal(args.length, 0, "Use --capture <file> only for an explicitly reviewed baseline change.");
  const expected = JSON.parse(readFileSync("tests/fixtures/playwright-config-baseline.json", "utf8"));
  const differences = [...new Set([...Object.keys(expected), ...Object.keys(summary)])]
    .filter(name => JSON.stringify(expected[name]) !== JSON.stringify(summary[name]));
  if (differences.length) {
    mkdirSync("tmp/codex", { recursive: true });
    writeFileSync("tmp/codex/playwright-config-difference.json", JSON.stringify(snapshots, null, 2) + "\n");
    assert.fail(`Resolved behavior/discovery changed: ${differences.join(", ")}. See tmp/codex/playwright-config-difference.json.`);
  }
}
console.log(`Playwright configuration/discovery: ${configs.length} configs, ${Object.values(summary).reduce((n, item) => n + item.projects, 0)} projects checked.`);
