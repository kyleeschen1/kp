import assert from "node:assert/strict";
import test from "node:test";

import {
  KpEconomicsLessonBufferPreviewSession,
  type KpEconomicsLessonBufferPreviewScheduler
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-lesson-buffer-preview.ts";
import {
  createKpEconomicsLessonBuffer,
  parseKpEconomicsLessonBuffer,
  serializeKpEconomicsLessonBuffer
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-lesson-buffer.ts";
import {
  kpEconomicsTwoColumnParagraphs
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-two-column-scroll.ts";
import {
  kpEconomicsTwoColumnSourceSchema,
  type KpEconomicsTwoColumnSource
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-two-column-source.ts";

function sourceDocument(): string {
  const source: KpEconomicsTwoColumnSource = {
    schemaVersion: kpEconomicsTwoColumnSourceSchema,
    passages: kpEconomicsTwoColumnParagraphs.map((passage) => ({
      id: passage.id,
      role: passage.role,
      ...(passage.motionBlockId === undefined
        ? {}
        : { motionBlockId: passage.motionBlockId }),
      sourceText: passage.paragraphs[0]!.sourceText
    }))
  };
  return serializeKpEconomicsLessonBuffer(createKpEconomicsLessonBuffer(source));
}

function fakeScheduler(): KpEconomicsLessonBufferPreviewScheduler & {
  flush: () => void;
  pending: () => number;
} {
  const callbacks = new Map<number, () => void>();
  let nextId = 1;
  return {
    schedule(callback) {
      const id = nextId++;
      callbacks.set(id, callback);
      return id;
    },
    cancel(handle) {
      callbacks.delete(handle as number);
    },
    flush() {
      const pending = [...callbacks.values()];
      callbacks.clear();
      for (const callback of pending) callback();
    },
    pending: () => callbacks.size
  };
}

test("debounced edits coalesce and retain one stage session", () => {
  const scheduler = fakeScheduler();
  const snapshots: Array<ReturnType<
    KpEconomicsLessonBufferPreviewSession["flush"]
  >> = [];
  const source = sourceDocument();
  const session = new KpEconomicsLessonBufferPreviewSession({
    source,
    passageId: "graph-at-rest",
    scheduler,
    onSnapshot: (snapshot) => snapshots.push(snapshot)
  });
  const stageSessionToken = session.stageSessionToken;
  const retainedSecondPassage = session.snapshot.passages[1];

  session.update({
    source: source.replace("Begin with", "Start with"),
    passageId: "graph-at-rest"
  });
  session.update({
    source: source.replace("Begin with", "Look first at"),
    passageId: "graph-at-rest"
  });
  assert.equal(scheduler.pending(), 1);
  assert.equal(session.snapshot.status, "pending");
  scheduler.flush();

  assert.equal(session.snapshot.status, "valid");
  assert.equal(session.snapshot.sourceRevision, 2);
  assert.equal(session.snapshot.previewRevision, 2);
  assert.equal(
    session.snapshot.passages[0]!.paragraphs[0]!.sourceText.startsWith(
      "Look first at"
    ),
    true
  );
  assert.equal(session.snapshot.stageSessionToken, stageSessionToken);
  assert.deepEqual(session.snapshot.compiledPassageIds, ["graph-at-rest"]);
  assert.equal(session.snapshot.passages[1], retainedSecondPassage);
  assert.equal(snapshots.every((snapshot) =>
    snapshot.stageSessionToken === stageSessionToken), true);
});

test("invalid source preserves the last valid preview until repair", () => {
  const scheduler = fakeScheduler();
  const source = sourceDocument();
  const session = new KpEconomicsLessonBufferPreviewSession({
    source,
    passageId: "graph-at-rest",
    scheduler
  });
  const initialPassages = session.snapshot.passages;
  const stageSessionToken = session.stageSessionToken;
  const invalid = source.replace("[$P$]", "[$P]");

  session.update({ source: invalid, passageId: "graph-at-rest" });
  scheduler.flush();
  assert.equal(session.snapshot.status, "invalid");
  assert.equal(session.snapshot.previewRevision, 0);
  assert.equal(session.snapshot.passages, initialPassages);
  assert.equal(session.snapshot.diagnostics[0]!.code, "KP_BUFFER_COMPILE");
  assert.equal(session.snapshot.diagnostics[0]!.passageId, "graph-at-rest");
  assert.ok(session.snapshot.diagnostics[0]!.line > 1);

  session.update({
    source: source.replace("Begin with", "Begin again with"),
    passageId: "graph-at-rest"
  });
  scheduler.flush();
  assert.equal(session.snapshot.status, "valid");
  assert.equal(session.snapshot.previewRevision, 2);
  assert.equal(session.snapshot.diagnostics.length, 0);
  assert.equal(session.snapshot.stageSessionToken, stageSessionToken);
});

test("removing the selected passage restores the nearest stable identity", () => {
  const scheduler = fakeScheduler();
  const source = sourceDocument();
  const session = new KpEconomicsLessonBufferPreviewSession({
    source,
    passageId: "movement-along-supply",
    scheduler
  });
  const buffer = parseKpEconomicsLessonBuffer(source);
  const withoutLast = serializeKpEconomicsLessonBuffer({
    ...buffer,
    passages: buffer.passages.filter(
      ({ id }) => id !== "movement-along-supply"
    )
  });

  session.update({
    source: withoutLast,
    passageId: "movement-along-supply"
  });
  scheduler.flush();
  assert.equal(session.snapshot.status, "valid");
  assert.equal(session.snapshot.restoredPassageId, "shift-versus-movement");
});

test("parse diagnostics and disposed sessions fail deterministically", () => {
  const scheduler = fakeScheduler();
  const source = sourceDocument();
  const session = new KpEconomicsLessonBufferPreviewSession({
    source,
    passageId: "graph-at-rest",
    scheduler
  });
  session.update({
    source: source.replace(
      "kp.economics.lesson-buffer.v1",
      "kp.economics.lesson-buffer.v9"
    ),
    passageId: "graph-at-rest"
  });
  scheduler.flush();
  assert.deepEqual(session.snapshot.diagnostics.map((diagnostic) => ({
    code: diagnostic.code,
    line: diagnostic.line,
    column: diagnostic.column
  })), [{ code: "KP_BUFFER_PARSE", line: 1, column: 1 }]);

  session.dispose();
  assert.throws(
    () => session.update({ source, passageId: "graph-at-rest" }),
    /disposed/
  );
});
