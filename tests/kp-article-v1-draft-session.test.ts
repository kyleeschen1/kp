import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  KpArticleDraftSession,
  type KpArticleDraftSaveRequest
} from "../src/article/kp-article-draft-session.ts";

test("invalid v1 drafts remain editable while preview retains last valid source", () => {
  const source = goldenText();
  const session = createSession(source);
  const validEdit = source.replace("When demand changes", "When demand rises");
  assert.equal(session.update(validEdit).previewText, validEdit);

  const invalidEdit = validEdit.replace("stage=market", "stage=missing");
  const invalid = session.update(invalidEdit);
  assert.equal(invalid.validity, "invalid");
  assert.equal(invalid.draftText, invalidEdit);
  assert.equal(invalid.previewText, validEdit);
  assert.match(invalid.message, /unknown stage missing/u);

  const repaired = session.update(invalidEdit.replace("stage=missing", "stage=market"));
  assert.equal(repaired.validity, "valid");
  assert.equal(repaired.previewText, repaired.draftText);
});

test(":w persists only valid source and leaves newer edits dirty", async () => {
  const source = goldenText();
  const requests: KpArticleDraftSaveRequest[] = [];
  let releaseSave: (() => void) | undefined;
  const session = new KpArticleDraftSession({
    sourceId: "economics-demand-shift.kp.md",
    persistedText: source,
    save: async (request) => {
      requests.push(request);
      await new Promise<void>((resolve) => releaseSave = resolve);
      return { sourcePath: request.sourceId, changed: true };
    }
  });
  session.update(source.replace("When demand changes", "When demand rises"));
  const writing = session.execute(":w");
  session.update(session.snapshot.draftText.replace("weekly", "daily"));
  releaseSave!();
  const written = await writing;

  assert.equal(written.saved, true);
  assert.equal(written.closed, false);
  assert.equal(session.snapshot.dirty, true);
  assert.equal(requests.length, 1);
  assert.match(requests[0]!.text, /When demand rises/u);
  assert.doesNotMatch(requests[0]!.text, /daily/u);

  session.update(session.snapshot.draftText.replace("stage=market", "stage=missing"));
  const invalidWrite = await session.execute(":w");
  assert.equal(invalidWrite.accepted, false);
  assert.equal(requests.length, 1);
});

test(":q refuses dirty buffers, :q! discards, and :wq closes after success", async () => {
  const source = goldenText();
  const session = createSession(source);
  session.update(source.replace("weekly", "daily"));

  const refused = await session.execute(":q");
  assert.equal(refused.accepted, false);
  assert.equal(refused.closed, false);
  assert.equal(session.snapshot.open, true);
  assert.match(session.snapshot.message, /No write since last change/u);

  const forced = await session.execute(":q!");
  assert.equal(forced.closed, true);
  assert.equal(session.snapshot.draftText, source);
  assert.equal(session.snapshot.previewText, source);
  assert.equal(session.snapshot.dirty, false);

  const writeQuit = createSession(source);
  writeQuit.update(source.replace("weekly", "daily"));
  const saved = await writeQuit.execute(":wq");
  assert.equal(saved.saved, true);
  assert.equal(saved.closed, true);
  assert.equal(saved.snapshot.open, false);
  assert.equal(saved.snapshot.dirty, false);
});

test(":wq keeps the editor open when persistence fails", async () => {
  const source = goldenText();
  const session = new KpArticleDraftSession({
    sourceId: "economics-demand-shift.kp.md",
    persistedText: source,
    save: async () => {
      throw new Error("Disk unavailable.");
    }
  });
  session.update(source.replace("weekly", "daily"));
  const outcome = await session.execute(":wq");
  assert.equal(outcome.saved, false);
  assert.equal(outcome.closed, false);
  assert.equal(session.snapshot.open, true);
  assert.equal(session.snapshot.dirty, true);
  assert.equal(session.snapshot.message, "Disk unavailable.");
});

function createSession(source: string): KpArticleDraftSession {
  return new KpArticleDraftSession({
    sourceId: "economics-demand-shift.kp.md",
    persistedText: source,
    save: async ({ sourceId }) => ({ sourcePath: sourceId, changed: true })
  });
}

function goldenText(): string {
  return readFileSync(
    new URL("./fixtures/kp-article-v1/economics-demand-shift.md", import.meta.url),
    "utf8"
  );
}
