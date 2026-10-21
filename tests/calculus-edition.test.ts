import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { buildCalculusEdition, calculusEditionStyles } from "../scripts/build-calculus-edition.ts";
import { verifyCalculusPublication } from "../scripts/calculus-publication.ts";

test("calculus styles preserve shared scaffold and every referenced KaTeX font", () => {
  const files = calculusEditionStyles();
  for (const name of ["reader.css", "../focus-deck-scaffold.css", "../focus-deck-typography.css"]) {
    const local = join("tutorial/change-propagation", name);
    assert.deepEqual(files.get(`styles/${local}`), readFileSync(join("src", local)));
  }
  const css = files.get("katex.min.css")!.toString();
  const paths = [...css.matchAll(/url\(([^)]+)\)/g)].map(m => m[1]!);
  assert.ok(paths.length > 20);
  for (const path of paths) assert.deepEqual(files.get(path), readFileSync(join("node_modules/katex/dist", path)));
});

for (const name of ["stationary-change", "two-reversals"]) test(`${name}: static edition includes exact source, math and styles`, () => {
  mkdirSync("tmp/codex", { recursive: true });
  const scratch = mkdtempSync("tmp/codex/calculus-edition-test-"), outputs: string[] = [];
  try {
    const original = readFileSync(`content/authoring/transfer/${name}.json`, "utf8");
    const source = { ...JSON.parse(original), title: scratch };
    const path = join(scratch, "source.json"), bytes = JSON.stringify(source); writeFileSync(path, bytes);
    const edition = buildCalculusEdition(path); outputs.push(edition.directory);
    assert.equal(buildCalculusEdition(path, true).checked, true);
    assert.equal(readFileSync(join(edition.directory, "source.json"), "utf8"), bytes);
    const artifact = JSON.parse(readFileSync(join(edition.directory, "publication.json"), "utf8"));
    verifyCalculusPublication(artifact, bytes, path);
    const html = readFileSync(join(edition.directory, "index.html"), "utf8");
    assert.match(html, /<math/); assert.doesNotMatch(html, /<script[^>]+(?:src=|type="module")/);
    for (const step of source.steps) assert.ok(html.includes(step.text));
    assert.match(readFileSync(join(edition.directory, "katex.min.css"), "utf8"), /fonts\//);
    writeFileSync(join(edition.directory, "source.json"), "altered");
    assert.throws(() => buildCalculusEdition(path, true), /stale or altered/);
  } finally {
    for (const output of outputs) rmSync(output, { recursive: true, force: true });
    rmSync(scratch, { recursive: true, force: true });
  }
});
