import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { prepareKpComposedAlgebraDraft } from "../src/authoring/composed-algebra-session.ts";
import { buildComposedAlgebraEdition } from "../scripts/build-composed-algebra-edition.ts";

test("composed editions preserve selected bytes and reject altered output without overwriting", () => {
  const scratch = fileURLToPath(new URL("../tmp/codex/", import.meta.url)); mkdirSync(scratch, { recursive: true });
  const fixture = mkdtempSync(join(scratch, "composed-publication-test-")), editions: string[] = [];
  try {
    const base = prepareKpComposedAlgebraDraft().checked.source;
    const source = { ...base, editorial: { ...base.editorial, title: fixture.split("/").at(-1)! } };
    const path = join(fixture, "source.json"), bytes = JSON.stringify(source, null, 2) + "\n"; writeFileSync(path, bytes);
    const first = buildComposedAlgebraEdition(path); editions.push(first.directory);
    assert.equal(buildComposedAlgebraEdition(path, true).checked, true);
    assert.equal(readFileSync(join(first.directory, "source.json"), "utf8"), bytes);
    assert.equal(readFileSync(join(first.directory, "styles/tutorial/focus-deck-scaffold.css"), "utf8"), readFileSync(new URL("../src/tutorial/focus-deck-scaffold.css", import.meta.url), "utf8"));
    source.editorial.title += " edited"; writeFileSync(path, JSON.stringify(source));
    const second = buildComposedAlgebraEdition(path); editions.push(second.directory);
    assert.notEqual(first.directory, second.directory); assert.notEqual(first.revisionId, second.revisionId);
    assert.equal(readFileSync(join(first.directory, "source.json"), "utf8"), bytes);
    writeFileSync(join(second.directory, "index.html"), "altered");
    assert.throws(() => buildComposedAlgebraEdition(path, true), /stale or altered/);
    assert.throws(() => buildComposedAlgebraEdition(path), /stale or altered/);
  } finally {
    for (const directory of editions) rmSync(directory, { recursive: true, force: true });
    rmSync(fixture, { recursive: true, force: true });
  }
});
