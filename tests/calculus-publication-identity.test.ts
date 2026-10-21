import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { compileChangeSource } from "../src/tutorial/change-propagation/model.ts";
import { digestEditionBytes, writeKpImmutableLocalEditionReceipt, type KpByteEditionId } from "../scripts/immutable-local-edition.ts";

const bytes = readFileSync("content/authoring/transfer/stationary-change.json", "utf8");
function revision(text: string) {
  const result = compileChangeSource(text);
  if (result.status !== "checked") throw new Error(result.message);
  return result.model.revision;
}

test("source bytes, normalized explanation and edition closure have distinct identities", () => {
  const compact = JSON.stringify(JSON.parse(bytes));
  assert.notEqual(digestEditionBytes(bytes), digestEditionBytes(compact));
  assert.equal(revision(bytes), revision(compact));
  for (const change of [{ title: "A different question" }, { inner: "x^3" }, { h: -.4 }])
    assert.notEqual(revision(JSON.stringify({ ...JSON.parse(bytes), ...change })), revision(bytes));

  mkdirSync("tmp/codex", { recursive: true });
  const root = resolve(mkdtempSync("tmp/codex/calculus-identity-"));
  try {
    const create = (css: string) => writeKpImmutableLocalEditionReceipt({ repo: process.cwd(), editionRoot: root,
      schemaVersion: "kp.calculus-edition-files.v1", revisionId: revision(bytes), check: false,
      files: new Map([["source.json", bytes], ["style.css", css]]) });
    const first = create("body{}"), second = create("body { margin: 0; }");
    assert.equal(first.explanationRevisionId, second.explanationRevisionId);
    assert.notEqual(first.byteEditionId, second.byteEditionId);
    assert.deepEqual(create("body{}"), first);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

// A source digest has no authority to identify a complete output closure.
if (false) {
  // @ts-expect-error Byte-edition identity is issued only by the writer.
  const forged: KpByteEditionId = digestEditionBytes(bytes);
  void forged;
}
