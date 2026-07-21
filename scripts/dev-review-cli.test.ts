import assert from "node:assert/strict";
import { readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import type { KpDevReviewEventV2 } from "../protocols/dev-review-v2.ts";
import { KP_DEV_REVIEW_EVENTS_FILENAME, KpDevReviewEventStore } from "../server/dev-review-store.ts";
import { KpDevReviewRoundInboxService } from "../server/dev-review-round-inbox.ts";
import { runKpDevReviewCli } from "./dev-review-cli.ts";

test("query CLI defaults to bounded current state and never mutates source history", async (context) => {
  const root = join(tmpdir(), `kp-review-cli-${process.pid}-${Date.now()}`);
  context.after(() => rm(root, { recursive: true, force: true }));
  const store = await KpDevReviewEventStore.open(root);
  for (const event of fixtureEvents()) await store.append(event);
  const sourceFile = join(root, KP_DEV_REVIEW_EVENTS_FILENAME);
  const before = await readFile(sourceFile, "utf8");
  let output = "";

  await runKpDevReviewCli(["query", "--root", root, "--limit", "1"], {}, {
    write: (value) => { output += value; }
  });
  const parsed = JSON.parse(output) as {
    query: { scope: string; limit: number };
    counts: { lifetime: number; current: number; historical: number };
    page: { notes: Array<{ sequence: number }>; hasMore: boolean };
  };
  assert.deepEqual(parsed.query, { scope: "current", limit: 1, detail: "summary" });
  assert.deepEqual(parsed.counts, {
    lifetime: 2,
    current: 1,
    currentNew: 1,
    historical: 1,
    matching: 1,
    byStatus: {
      new: 2,
      discussed: 0,
      grouped: 0,
      accepted: 0,
      fixed: 0,
      verified: 0,
      dismissed: 0
    }
  });
  assert.deepEqual(parsed.page.notes.map((note) => note.sequence), [2]);
  assert.equal(parsed.page.hasMore, false);
  assert.equal(await readFile(sourceFile, "utf8"), before);
});

test("history, filters, full detail, and pagination require explicit CLI options", async (context) => {
  const root = join(tmpdir(), `kp-review-cli-history-${process.pid}-${Date.now()}`);
  context.after(() => rm(root, { recursive: true, force: true }));
  const store = await KpDevReviewEventStore.open(root);
  for (const event of fixtureEvents()) await store.append(event);
  let output = "";

  await runKpDevReviewCli([
    "query",
    "--root", root,
    "--history",
    "--status", "new",
    "--route", "http://localhost/reader/legacy",
    "--after", "0",
    "--detail", "full"
  ], {}, { write: (value) => { output += value; } });
  const parsed = JSON.parse(output) as {
    query: { scope: string; detail: string };
    page: { notes: Array<{ sequence: number; capture?: unknown }> };
  };
  assert.equal(parsed.query.scope, "historical");
  assert.equal(parsed.query.detail, "full");
  assert.deepEqual(parsed.page.notes.map((note) => note.sequence), [1]);
  assert.ok(parsed.page.notes[0]?.capture);
});

test("query CLI rejects ambiguous scope and invalid bounds before reading", async () => {
  await assert.rejects(
    () => runKpDevReviewCli(["--root", "/tmp/reviews", "--history", "--all"], {}, { write() {} }),
    /Choose only one/
  );
  await assert.rejects(
    () => runKpDevReviewCli(["--root", "/tmp/reviews", "--limit", "101"], {}, { write() {} }),
    /expected value <= 100/
  );
  await assert.rejects(
    () => runKpDevReviewCli(["--root", "relative/reviews"], {}, { write() {} }),
    /must be absolute/
  );
});

test("triage CLI validates dry runs without append and records explicit mutations", async (context) => {
  const root = join(tmpdir(), `kp-review-cli-triage-${process.pid}-${Date.now()}`);
  context.after(() => rm(root, { recursive: true, force: true }));
  const store = await KpDevReviewEventStore.open(root);
  for (const event of fixtureEvents()) await store.append(event);
  const sourceFile = join(root, KP_DEV_REVIEW_EVENTS_FILENAME);
  const before = await readFile(sourceFile, "utf8");
  let output = "";

  await runKpDevReviewCli([
    "status", "--root", root, "--note", "note.2", "--to", "discussed", "--dry-run"
  ], {}, { write: (value) => { output = value; } });
  assert.equal((JSON.parse(output) as { dryRun: boolean }).dryRun, true);
  await runKpDevReviewCli([
    "cursor", "--root", root, "--consumer", "codex.main",
    "--round", "round.current", "--through", "2", "--dry-run"
  ], {}, { write: (value) => { output = value; } });
  assert.equal((JSON.parse(output) as { from: number; through: number }).through, 2);
  assert.equal(await readFile(sourceFile, "utf8"), before);

  await runKpDevReviewCli([
    "status", "--root", root, "--note", "note.2", "--to", "discussed"
  ], {}, { write: (value) => { output = value; } });
  assert.equal((JSON.parse(output) as { dryRun: boolean }).dryRun, false);
  await runKpDevReviewCli([
    "cursor", "--root", root, "--consumer", "codex.main",
    "--round", "round.current", "--through", "2"
  ], {}, { write: (value) => { output = value; } });

  const reopened = new KpDevReviewRoundInboxService(await KpDevReviewEventStore.open(root));
  assert.equal(reopened.read().notes.find((note) => note.id === "note.2")?.status, "discussed");
  assert.equal(reopened.read().cursors["codex.main"]?.["round.current"], 2);
});

test("audit proves replay-only compatibility and exact note identity ordering", async (context) => {
  const root = join(tmpdir(), `kp-review-cli-audit-${process.pid}-${Date.now()}`);
  context.after(() => rm(root, { recursive: true, force: true }));
  const store = await KpDevReviewEventStore.open(root);
  for (const event of fixtureEvents()) await store.append(event);
  let output = "";

  await runKpDevReviewCli(["audit", "--root", root], {}, {
    write: (value) => { output = value; }
  });
  const result = JSON.parse(output) as {
    source: { byteStable: boolean; eventCount: number; v2Events: number };
    projection: { roundCount: number; noteCount: number; identityAndOrderStable: boolean };
  };
  assert.deepEqual(result.source, {
    bytes: Buffer.byteLength(await readFile(join(root, KP_DEV_REVIEW_EVENTS_FILENAME), "utf8")),
    digest: (JSON.parse(output) as { source: { digest: string } }).source.digest,
    eventCount: 5,
    v1Events: 0,
    v2Events: 5,
    byteStable: true
  });
  assert.deepEqual(result.projection, {
    roundCount: 2,
    syntheticRounds: 0,
    currentRoundId: "round.current",
    noteCount: 2,
    identityAndOrderStable: true
  });
});

function fixtureEvents(): readonly KpDevReviewEventV2[] {
  return [
    round("round.old", 1),
    note("note.1", 1, "round.old", "http://localhost/reader/legacy"),
    {
      schemaVersion: "kp.dev-review.v2",
      kind: "round-closed",
      occurredAt: "2026-07-20T01:00:00.000Z",
      roundId: "round.old"
    },
    round("round.current", 2),
    note("note.2", 2, "round.current", "http://localhost/reader/current")
  ];
}

function round(
  id: string,
  sequence: number
): KpDevReviewEventV2 {
  const openedAt = `2026-07-2${sequence - 1}T00:00:00.000Z`;
  return {
    schemaVersion: "kp.dev-review.v2",
    kind: "round-opened",
    occurredAt: openedAt,
    round: {
      id,
      sequence,
      label: id,
      status: "open",
      openedAt,
      baseline: { commit: id, fingerprint: id, dirty: false },
      synthetic: false
    }
  };
}

function note(id: string, sequence: number, roundId: string, route: string): KpDevReviewEventV2 {
  return {
    schemaVersion: "kp.dev-review.v2",
    kind: "note-created",
    occurredAt: "2026-07-21T00:00:00.000Z",
    note: {
      schemaVersion: "kp.dev-review.v2",
      id,
      sequence,
      roundId,
      sessionId: "session.cli",
      comment: id,
      status: "new",
      capture: {
        route,
        capturedAt: "2026-07-21T00:00:00.000Z",
        environment: {
          browserName: "Chromium",
          language: "en-US",
          viewport: { width: 800, height: 600, devicePixelRatio: 1, scrollX: 0, scrollY: 0 },
          reducedMotion: false,
          forcedColors: false,
          colorScheme: "light",
          build: { commit: "abc", fingerprint: "abc", dirty: false }
        },
        semantic: { activeTransformationIds: [], focusRefs: [] },
        render: { ownerIds: [] },
        temporalTrace: []
      }
    }
  };
}
