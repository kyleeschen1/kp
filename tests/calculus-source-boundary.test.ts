import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { compileChangeSource } from "../src/tutorial/change-propagation/model.ts";
import { buildBayesEdition } from "../scripts/build-bayesian-edition.ts";

const source = JSON.parse(readFileSync("content/authoring/transfer/stationary-change.json", "utf8"));
test("calculus enforces actual UTF-8 bytes, including multibyte editorial text", () => {
  const text = JSON.stringify(source);
  const atLimit = text + " ".repeat(16000 - Buffer.byteLength(text));
  assert.equal(compileChangeSource(atLimit).status, "checked");
  assert.deepEqual(compileChangeSource(atLimit + " "), {
    status: "repair-gap", path: "source", message: "Source exceeds the 16,000 UTF-8 byte authoring limit."
  });
  const unicode = JSON.stringify({ ...source, steps: source.steps.map((s: object) => ({ ...s, title: "語".repeat(100), text: "語".repeat(1000) })) });
  assert.ok(unicode.length < 16000 && Buffer.byteLength(unicode) > 16000);
  const result = compileChangeSource(unicode);
  assert.equal(result.status, "repair-gap");
  if (result.status === "repair-gap") assert.equal(result.path, "source");
});

test("Bayes editions reject invalid UTF-8, oversized inputs and directories before compilation", () => {
  mkdirSync("tmp/codex", { recursive: true });
  const dir = mkdtempSync("tmp/codex/edition-input-");
  try {
    const path = join(dir, "source.json");
    writeFileSync(path, Buffer.from([0xff]));
    assert.throws(() => buildBayesEdition(path), /encoded data|encoding/i);
    writeFileSync(path, " ".repeat(100001));
    assert.throws(() => buildBayesEdition(path), /100,000 UTF-8 bytes/);
    assert.throws(() => buildBayesEdition(dir), /regular source file/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
