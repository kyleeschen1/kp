import assert from "node:assert/strict";
import test from "node:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { writeKpImmutableLocalEditionReceipt } from "../scripts/immutable-local-edition.ts";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

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

test("partial writes and failed publication leave no staging and preserve existing editions", t => {
  const f = fixture(), originalWrite = fs.writeFileSync;
  try {
    const old = writeKpImmutableLocalEditionReceipt(f.input);
    let calls = 0;
    t.mock.method(fs, "writeFileSync", (...args: Parameters<typeof fs.writeFileSync>) => {
      if (++calls === 2) throw new Error("injected write failure");
      return originalWrite(...args);
    }); syncBuiltinESMExports();
    assert.throws(() => writeKpImmutableLocalEditionReceipt({ ...f.input, revisionId: "next" }), /injected write failure/);
    t.mock.restoreAll(); syncBuiltinESMExports();
    assert.deepEqual(fs.readdirSync(f.input.editionRoot), [old.byteEditionId.slice(7)]);
    assert.deepEqual(writeKpImmutableLocalEditionReceipt(f.input), old);
    t.mock.method(fs, "renameSync", () => { throw Object.assign(new Error("denied"), { code: "EACCES" }); }); syncBuiltinESMExports();
    assert.throws(() => writeKpImmutableLocalEditionReceipt({ ...f.input, revisionId: "next" }), /denied/);
    assert.deepEqual(fs.readdirSync(f.input.editionRoot), [old.byteEditionId.slice(7)]);
  } finally { t.mock.restoreAll(); syncBuiltinESMExports(); f.dispose(); }
});

test("rename collisions accept only an exact winning edition and always clean staging", t => {
  const f = fixture(), rename = fs.renameSync;
  try {
    let corrupt = false;
    t.mock.method(fs, "renameSync", (from: fs.PathLike, to: fs.PathLike) => {
      rename(from, to);
      if (corrupt) writeFileSync(join(String(to), "index.html"), "corrupt winner");
      throw Object.assign(new Error("winner exists"), { code: "ENOTEMPTY" });
    }); syncBuiltinESMExports();
    const first = writeKpImmutableLocalEditionReceipt(f.input);
    assert.equal(readFileSync(join(first.directory, "index.html"), "utf8"), "exact");
    corrupt = true;
    assert.throws(() => writeKpImmutableLocalEditionReceipt({ ...f.input, revisionId: "other" }), /stale or altered/);
    assert.ok(fs.readdirSync(f.input.editionRoot).every(name => !name.startsWith(".building-")));
  } finally { t.mock.restoreAll(); syncBuiltinESMExports(); f.dispose(); }
});

test("independent processes converge on one identical immutable edition", async () => {
  const f = fixture();
  try {
    const run = promisify(execFile);
    const code = `import {writeKpImmutableLocalEditionReceipt as write} from './scripts/immutable-local-edition.ts';
      const root=process.argv[1]; console.log(JSON.stringify(write({repo:root,editionRoot:root+'/editions',schemaVersion:'test.v1',revisionId:'source.v1',files:new Map([['index.html','exact'],['assets/style.css','body{}']]),check:false})));`;
    const results = await Promise.all(Array.from({ length: 6 }, () => run(process.execPath,
      ["--disable-warning=ExperimentalWarning", "--input-type=module", "-e", code, f.root], { timeout: 30000 })));
    assert.equal(new Set(results.map(r => r.stdout)).size, 1);
    assert.equal(fs.readdirSync(f.input.editionRoot).length, 1);
    assert.equal(writeKpImmutableLocalEditionReceipt({ ...f.input, check: true }).directory, JSON.parse(results[0]!.stdout).directory);
  } finally { f.dispose(); }
});
