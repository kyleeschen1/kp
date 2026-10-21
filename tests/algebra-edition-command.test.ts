import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import source from "../content/authoring/algebra/whole-and-parts.json" with { type: "json" };

test("actual interactive CLI finishes, reproduces and detects damaged complete output", () => {
  mkdirSync("tmp/codex", { recursive: true });
  const scratch = mkdtempSync("tmp/codex/algebra-cli-"), outputs = new Set<string>();
  const selected = join(scratch, "source.json"), candidate = structuredClone(source);
  candidate.editorial.title = scratch;
  const bytes = JSON.stringify(candidate, null, 2) + "\n";
  writeFileSync(selected, bytes);
  const cli = (args: string[]) => spawnSync(process.execPath, ["--disable-warning=ExperimentalWarning", "scripts/build-composed-algebra-edition.ts", "--source", selected, ...args], { encoding: "utf8" });
  try {
    const first = cli(["--interactive"]);
    assert.equal(first.status, 0, first.stderr);
    const built = JSON.parse(first.stdout); outputs.add(built.directory);
    assert.equal(built.mode, "interactive");
    const checked = cli(["--interactive", "--check"]); assert.equal(checked.status, 0, checked.stderr);
    assert.equal(JSON.parse(checked.stdout).byteEditionId, built.byteEditionId);
    assert.equal(readFileSync(join(built.directory, "source.json"), "utf8"), bytes);
    const manifest = JSON.parse(readFileSync(join(built.directory, "edition.json"), "utf8"));
    for (const name of Object.keys(manifest.files).filter(name => name.endsWith(".js")))
      assert.doesNotMatch(readFileSync(join(built.directory, name), "utf8"), /__VITE_PRELOAD__/);
    const injected = join(built.directory, "injected.js"); writeFileSync(injected, "unexpected");
    const invalid = cli(["--interactive", "--check"]); assert.notEqual(invalid.status, 0); assert.match(invalid.stderr, /unexpected output/);
    unlinkSync(injected);
    writeFileSync(join(built.directory, "reader.js"), "altered");
    const altered = cli(["--interactive"]); assert.notEqual(altered.status, 0); assert.match(altered.stderr, /stale or altered/);
    const staticResult = cli([]); assert.equal(staticResult.status, 0, staticResult.stderr);
    const staticEdition = JSON.parse(staticResult.stdout); outputs.add(staticEdition.directory);
    assert.notEqual(staticEdition.byteEditionId, built.byteEditionId);
    assert.doesNotMatch(readFileSync(join(staticEdition.directory, "index.html"), "utf8"), /<script/);
  } finally {
    for (const path of outputs) rmSync(path, { recursive: true, force: true });
    rmSync(scratch, { recursive: true, force: true });
  }
});
