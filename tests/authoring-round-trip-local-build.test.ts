import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { buildKpAuthoringMarketPreview } from "../src/experiments/authoring-market/authoring-market-preview-build.ts";
import { createKpAuthoringMarketSourceBranch } from "../src/experiments/authoring-market/authoring-market-source-branch.ts";
import { buildKpAuthoringMarketEdition, kpAuthoringMarketEditionRoot } from "../scripts/build-authoring-market-edition.ts";

test("selected source builds reproducibly and actual output freshness rejects tampering", () => {
  mkdirSync(kpAuthoringMarketEditionRoot, { recursive: true });
  const scratch = mkdtempSync(join(kpAuthoringMarketEditionRoot, "source-test-"));
  const name = `test-${randomUUID()}`;
  const directory = join(kpAuthoringMarketEditionRoot, name);
  mkdirSync(directory);
  try {
    const branch = createKpAuthoringMarketSourceBranch({ schemaVersion: "kp.authoring-market-build.v1",
      sourceRevision: "source.local-build", sequence: 1, sourcePaths: ["model.ts", "article.ts"],
      status: "valid", preview: buildKpAuthoringMarketPreview("reference") }, name);
    const sourcePath = join(scratch, `${name}.market.json`);
    const text = JSON.stringify(branch, null, 2);
    writeFileSync(sourcePath, text);
    const first = buildKpAuthoringMarketEdition({ sourcePath });
    const html = readFileSync(join(directory, "index.html"), "utf8");
    const payload = readFileSync(join(directory, "publication.json"), "utf8");
    assert.deepEqual(buildKpAuthoringMarketEdition({ sourcePath }), first);
    assert.equal(readFileSync(join(directory, "index.html"), "utf8"), html);
    assert.equal(readFileSync(join(directory, "publication.json"), "utf8"), payload);
    assert.equal(buildKpAuthoringMarketEdition({ sourcePath, check: true }).checked, true);
    assert.match(html, /Reading-only edition/);
    assert.doesNotMatch(html, /<script|(?:src|href)="https?:/);
    assert.ok(first.fileCount > 3);
    writeFileSync(join(directory, "publication.json"), payload.replace("source.local-build", "source.tampered"));
    assert.throws(() => buildKpAuthoringMarketEdition({ sourcePath, check: true }), /payload digest/);
    buildKpAuthoringMarketEdition({ sourcePath });
    writeFileSync(sourcePath, `${text}\n`);
    assert.throws(() => buildKpAuthoringMarketEdition({ sourcePath, check: true }), /source identity/);
    assert.throws(() => buildKpAuthoringMarketEdition({ sourcePath, name: "../outside" }), /edition name/);
    const outside = join(scratch, "must-not-be-written.html");
    unlinkSync(join(directory, "index.html"));
    symlinkSync(outside, join(directory, "index.html"));
    assert.throws(() => buildKpAuthoringMarketEdition({ sourcePath }), /symlinks/);
    assert.equal(existsSync(outside), false);
  } finally {
    // Both paths are test-owned children of the fixed generated-edition root.
    rmSync(scratch, { recursive: true, force: true });
    rmSync(directory, { recursive: true, force: true });
  }
});
