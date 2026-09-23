import assert from "node:assert/strict";
import test from "node:test";
import { repeatabilityCases, readFrozenInput, verifyFrozenInput } from "../scripts/authoring-repeatability-cases.ts";
import { supportedAuthorTasks } from "../src/authoring/supported-author-tasks.ts";
import { reportAuthorCheck } from "../src/authoring/author-check-report.ts";
import { createTrialRecord, createFailedTrialRecord, type TrialWork } from "../scripts/authoring-repeatability-records.ts";

const work: TrialWork = { sourceEditsAfterFreeze: 0, adapterEdits: 0, engineEdits: 0,
  editorialCorrections: [], engineeringMinutes: null, notes: "Synthetic record test; no trial case executed." };

test("the ten frozen inputs retain exact bytes, unique identity and approved task proportions", () => {
  assert.equal(repeatabilityCases.length, 10);
  assert.equal(new Set(repeatabilityCases.map(item => item.id)).size, 10);
  const counts: Record<string, number> = {};
  for (const item of repeatabilityCases) counts[item.task] = (counts[item.task] ?? 0) + 1;
  assert.deepEqual(counts, {
    "equation.fraction-chain": 3, "equation.common-factor": 2, "mechanics.momentum-energy": 2, "reasoning.code": 3
  });
  for (const item of repeatabilityCases) {
    assert.ok(item.intent && supportedAuthorTasks[item.task]);
    assert.ok(JSON.parse(readFrozenInput(item)));
    assert.throws(() => verifyFrozenInput(item, readFrozenInput(item) + " "), /Frozen input changed/);
  }
  assert.equal(repeatabilityCases.filter(item => item.expected === "checked").length, 6);
});

test("record types distinguish checked reports, reference-only hosts, repairs and execution failures", () => {
  const code = repeatabilityCases.find(item => item.id === "code-purpose")!;
  const report = reportAuthorCheck(code.task, { status: "compiled" });
  const result = createTrialRecord(code, report, 1.5, work);
  assert.equal(result.actual, "checked");
  assert.equal(result.preview.status, "reference-only");
  assert.equal(result.editorialJudgment, "not-certified");
  const negative = repeatabilityCases.find(item => item.id === "code-changed-source")!;
  assert.equal(createTrialRecord(negative, report, 1, work).expectationMatched, false);
  const repair = reportAuthorCheck(negative.task, { status: "repair-gap", diagnostic: { path: "$.sourceRevisionId", code: "fixture", expected: "Restore source pin" } });
  const rejected = createTrialRecord(negative, repair, 1, work);
  assert.equal(rejected.expectationMatched, true);
  assert.equal(rejected.preview.status, "unsupported");
  assert.equal(rejected.report, repair);
  assert.equal(createFailedTrialRecord(negative, new Error("owner unavailable")).actual, "failed");
});

test("applied records require matching source, owner revision, eligible host and actual evidence", () => {
  const algebra = repeatabilityCases.find(item => item.id === "algebra-single-digit")!;
  const report = reportAuthorCheck(algebra.task, { status: "compiled", revisionId: "fixture-revision" });
  const evidence = { status: "applied" as const, sourceSha256: algebra.sha256, revision: "fixture-revision",
    host: "/experiments/reusable-reasoning/?example=common-factor", mode: "existing-host-editor" as const,
    command: "synthetic-test", checks: ["source pin", "native endpoints"] };
  assert.equal(createTrialRecord(algebra, report, 1, work, evidence).preview.status, "applied");
  for (const broken of [{ ...evidence, sourceSha256: "stale" }, { ...evidence, revision: "stale" },
    { ...evidence, checks: [] }, { ...evidence, command: "" }, { ...evidence, host: "" }])
    assert.throws(() => createTrialRecord(algebra, report, 1, work, broken), /Applied/);
  const code = repeatabilityCases.find(item => item.id === "code-purpose")!;
  assert.throws(() => createTrialRecord(code, reportAuthorCheck(code.task, { status: "compiled" }), 1, work, evidence), /reference-only/);
  assert.throws(() => createTrialRecord(algebra, reportAuthorCheck(algebra.task, { status: "repair-gap" }), 1, work, evidence), /Rejected/);
  for (const elapsed of [-1, NaN, Infinity]) assert.throws(() => createTrialRecord(algebra, report, elapsed, work), /duration/);
  assert.throws(() => createTrialRecord(algebra, report, 1, { ...work, sourceEditsAfterFreeze: 1 }), /Frozen/);
  assert.throws(() => createTrialRecord(algebra, report, 1, { ...work, engineEdits: .5 }), /counts/);
  assert.throws(() => createTrialRecord(algebra, report, 1, { ...work, engineeringMinutes: Infinity }), /time/);
});
