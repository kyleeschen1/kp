import assert from "node:assert/strict";
import test from "node:test";
import { repeatabilityCases, readFrozenInput, verifyFrozenInput } from "../scripts/authoring-repeatability-cases.ts";
import { supportedAuthorTasks } from "../src/authoring/supported-author-tasks.ts";
import { reportAuthorCheck } from "../src/authoring/author-check-report.ts";
import { createTrialRecord, createFailedTrialRecord, type TrialWork } from "../scripts/authoring-repeatability-records.ts";
import { runRepeatabilityCase, parseTrialArguments } from "../scripts/authoring-repeatability.ts";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";

const work: TrialWork = { sourceEditsAfterFreeze: 0, adapterEdits: 0, engineEdits: 0,
  editorialCorrections: [], engineeringMinutes: null, notes: "Synthetic record test; no trial case executed." };

test("unchanged-input rerun preserves every owner outcome and only repairs fraction preview preservation", () => {
  const directory = new URL("../docs/project/reviews/authoring-repeatability/", import.meta.url);
  assert.deepEqual(readdirSync(new URL("rerun/", directory)).sort(), repeatabilityCases.map(item => `${item.id}.json`).sort());
  for (const item of repeatabilityCases) {
    const baseline = JSON.parse(readFileSync(new URL(`baseline/${item.id}.json`, directory), "utf8"));
    const rerun = JSON.parse(readFileSync(new URL(`rerun/${item.id}.json`, directory), "utf8"));
    assert.equal(rerun.inputSha256, item.sha256);
    assert.deepEqual(rerun.report, baseline.report);
    assert.deepEqual(rerun.preview, baseline.preview);
    assert.equal(rerun.actual, baseline.actual);
    assert.equal(rerun.work.sourceEditsAfterFreeze, 0);
    if (item.id !== "fraction-add-reduce" && item.id !== "fraction-subtract") continue;
    const before = JSON.parse(readFileSync(new URL(`preview-baseline/${item.id}.json`, directory), "utf8"));
    const after = JSON.parse(readFileSync(new URL(`preview-rerun/${item.id}.json`, directory), "utf8"));
    assert.equal(before.preview.status, "failed"); assert.equal(after.preview.status, "applied");
    assert.equal(after.preview.sourceSha256, before.preview.sourceSha256);
    assert.equal(after.preview.revision, before.preview.revision);
    assert.equal(after.preview.mode, "existing-host-fixture");
    assert.deepEqual(after.browsers, ["chromium", "firefox", "webkit"]);
    assert.deepEqual(createTrialRecord(item, after.report, after.checkElapsedMs, after.work, after.preview).preview, after.preview);
  }
});

test("all first outcomes remain pinned and algebra status matching cannot conceal the missed boundary", () => {
  const directory = new URL("../docs/project/reviews/authoring-repeatability/baseline/", import.meta.url);
  assert.deepEqual(readdirSync(directory).sort(), repeatabilityCases.map(item => `${item.id}.json`).sort());
  let checked = 0, matched = 0, references = 0;
  for (const item of repeatabilityCases) {
    const record = JSON.parse(readFileSync(new URL(`${item.id}.json`, directory), "utf8"));
    assert.equal(record.caseId, item.id); assert.equal(record.task, item.task); assert.equal(record.inputSha256, item.sha256);
    assert.equal(record.report.authority, "report-only"); assert.equal(record.report.handoff.execution, "not-performed");
    assert.equal(record.expectationMatched, record.actual === item.expected);
    assert.equal(record.work.sourceEditsAfterFreeze, 0);
    if (record.actual === "checked") checked++;
    if (record.expectationMatched) matched++;
    if (record.preview.status === "reference-only") references++;
    if (item.task === "equation.common-factor") {
      assert.equal(record.report.result.diagnostic.code, "source");
      assert.equal(record.report.result.diagnostic.path, "$.states[0].id");
    }
  }
  assert.deepEqual({ checked, matched, references }, { checked: 5, matched: 9, references: 3 });
  for (const item of repeatabilityCases.filter(item => item.id === "fraction-add-reduce" || item.id === "fraction-subtract")) {
    const record = JSON.parse(readFileSync(new URL(`../docs/project/reviews/authoring-repeatability/preview-baseline/${item.id}.json`, import.meta.url), "utf8"));
    assert.equal(record.inputSha256, item.sha256);
    assert.equal(record.preview.status, "failed"); assert.equal(record.preview.sourceApplied, true);
    assert.ok(record.preview.failures.some((failure: string) => failure.includes("MathML")));
  }
});

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

test("runner delegates exact frozen bytes and preserves failures without selecting another task", async () => {
  const item = repeatabilityCases[0];
  let calls = 0;
  const check = async (task: typeof item.task, input: string) => {
    calls++;
    assert.equal(task, item.task); assert.equal(input, readFrozenInput(item));
    return reportAuthorCheck(task, { status: "compiled", revisionId: "synthetic" });
  };
  const ticks = [10, 12];
  const result = await runRepeatabilityCase(item, { read: readFrozenInput,
    check: async (task, input) => { assert.equal(task, item.task); return check(item.task, input); }, clock: () => ticks.shift()! });
  assert.equal(result.actual, "checked");
  assert.equal(result.checkElapsedMs, 2);
  const changed = await runRepeatabilityCase(item, { read: value => readFrozenInput(value) + " ",
    check: async () => { throw new Error("Must not check changed input"); }, clock: () => 0 });
  assert.equal(changed.actual, "failed");
  assert.equal(calls, 1);
  const missing = await runRepeatabilityCase(item, { read: () => { throw new Error("missing input"); }, check: async () => { throw new Error("unreachable"); }, clock: () => 0 });
  assert.equal(missing.actual, "failed");
  const ownerFailure = await runRepeatabilityCase(item, { read: readFrozenInput,
    check: async () => { throw new Error("owner failed"); }, clock: () => 0 });
  assert.equal(ownerFailure.actual, "failed");
});

test("trial CLI requires explicit bounded selection and uses nonzero failure exit without owner execution", () => {
  assert.equal(parseTrialArguments(["--phase", "baseline", "--all"]).cases.length, 10);
  for (const args of [[], ["--phase", "other", "--all"], ["--phase", "baseline", "--case", "missing"],
    ["--phase", "baseline", "--all", "--case", "code-purpose"], ["--task", "arbitrary"]]) assert.throws(() => parseTrialArguments(args));
  const result = spawnSync(process.execPath, ["--disable-warning=ExperimentalWarning", "scripts/authoring-repeatability.ts", "--case", "missing"], { encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unique frozen/);
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
  const failedPreview = { ...evidence, status: "failed" as const, sourceApplied: true as const, failures: ["native accessible math missing"] };
  assert.equal(createTrialRecord(algebra, report, 1, work, failedPreview).preview.status, "failed");
  assert.throws(() => createTrialRecord(algebra, report, 1, work, { ...failedPreview, failures: [] }), /preservation gap/);
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
