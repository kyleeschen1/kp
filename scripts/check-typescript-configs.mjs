import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import ts from "typescript";

const root = process.cwd();
const files = [root, resolve(root, "config/typescript")].filter(existsSync)
  .flatMap(directory => readdirSync(directory).filter(name => /^tsconfig(?:\..+)?\.json$/.test(name))
    .map(name => resolve(directory, name))).sort((a, b) => basename(a).localeCompare(basename(b)));
const normalize = value => JSON.parse(JSON.stringify(value, (key, item) => {
  if (key === "configFilePath") return undefined;
  if (typeof item === "string") return item.replaceAll(root, "<repo>").replaceAll("config/typescript/", "");
  return item && typeof item === "object" && !Array.isArray(item)
    ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item;
}));
const snapshots = {};
for (const filename of files) {
  const parsed = ts.getParsedCommandLineOfConfigFile(filename, { noEmit: true }, {
    ...ts.sys, onUnRecoverableConfigFileDiagnostic: error => { throw Error(ts.flattenDiagnosticMessageText(error.messageText, "\n")); }
  });
  assert.ok(parsed, filename);
  assert.deepEqual(parsed.errors, [], `Invalid compiler config ${filename}`);
  for (const input of parsed.fileNames) assert.ok(existsSync(input), `${filename}: missing compiler input ${input}`);
  for (const reference of parsed.projectReferences ?? []) assert.ok(existsSync(reference.path), `${filename}: missing reference ${reference.path}`);
  // Base configuration is inherited policy, not a standalone compiler cohort.
  snapshots[basename(filename)] = normalize({ options: parsed.options,
    inputs: basename(filename) === "tsconfig.base.json" ? [] : parsed.fileNames.sort(),
    references: parsed.projectReferences });
}
const args = process.argv.slice(2);
if (args[0] === "--capture" && args[1]) {
  mkdirSync(dirname(args[1]), { recursive: true });
  writeFileSync(args[1], JSON.stringify(snapshots, null, 2) + "\n");
} else if (args[0] === "--compare" && args[1]) {
  const expected = JSON.parse(readFileSync(args[1], "utf8"));
  const changed = [...new Set([...Object.keys(expected), ...Object.keys(snapshots)])]
    .filter(name => JSON.stringify(expected[name]) !== JSON.stringify(snapshots[name]));
  assert.deepEqual(changed, [], "Compiler options, inputs or references changed during relocation");
} else assert.equal(args.length, 0, "Use --capture <file> or --compare <file> for a migration baseline");
console.log(`TypeScript configuration: ${files.length} projects parsed; all explicit inputs/references exist.`);
if (args[0] === "--compare") console.log("Complete compiler options, inputs and references match the pre-move baseline.");
