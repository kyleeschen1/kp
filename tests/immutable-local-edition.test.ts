import assert from "node:assert/strict";
import test from "node:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { writeKpImmutableLocalEditionReceipt } from "../scripts/immutable-local-edition.ts";

function fixture() {
  mkdirSync("tmp/codex", { recursive: true });
  const root = resolve(mkdtempSync("tmp/codex/immutable-edition-"));
  const input = { repo: root, editionRoot: join(root, "editions"), schemaVersion: "test.v1", revisionId: "source.v1",
    files: new Map([["index.html", "exact"], ["assets/style.css", "body{}"]]), check: false };
  return { root, input, dispose: () => rmSync(root, { recursive: true, force: true }) };
}
test("edition verification rejects undeclared files, directories and symlinks without overwriting", () => {
  const f = fixture();
  try {
    const first = writeKpImmutableLocalEditionReceipt(f.input);
    for (const name of ["extra.js", "assets/extra.js"]) {
      const path = join(first.directory, name); writeFileSync(path, "untrusted");
      for (const check of [false, true]) assert.throws(() => writeKpImmutableLocalEditionReceipt({ ...f.input, check }), /unexpected output/);
      assert.equal(readFileSync(path, "utf8"), "untrusted"); unlinkSync(path);
    }
    const empty = join(first.directory, "extra"); mkdirSync(empty);
    assert.throws(() => writeKpImmutableLocalEditionReceipt(f.input), /unexpected output/); rmSync(empty, { recursive: true });
    const link = join(first.directory, "link"); symlinkSync(f.root, link);
    assert.throws(() => writeKpImmutableLocalEditionReceipt(f.input), /symlinks/); unlinkSync(link);
    assert.deepEqual(writeKpImmutableLocalEditionReceipt(f.input), first);
    unlinkSync(join(first.directory, "assets/style.css"));
    assert.throws(() => writeKpImmutableLocalEditionReceipt(f.input), /ENOENT/);
  } finally { f.dispose(); }
});
test("edition paths cannot escape, alias files or replace the writer manifest", () => {
  const f = fixture();
  try {
    for (const name of ["../escape", "/absolute", "a/../b", "a//b", "a\\b", "edition.json"])
      assert.throws(() => writeKpImmutableLocalEditionReceipt({ ...f.input, files: new Map([[name, "bad"]]) }), /bounded relative|owns the edition/);
    assert.throws(() => writeKpImmutableLocalEditionReceipt({ ...f.input, editionRoot: f.root }), /strict repository descendant/);
  } finally { f.dispose(); }
});
