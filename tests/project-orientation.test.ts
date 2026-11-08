import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import test from "node:test";
import { projectVision } from "../src/project-dashboard/vision-data.ts";
import { validateProjectVision } from "../src/project-dashboard/vision-model.ts";
import { readVisionExecution, describeVisionExecution } from "../src/project-dashboard/vision-execution.ts";
import { activeOrientationThread, checkOrientationDocuments, inspectProjectOrientation, orientationPaths } from "../scripts/project-orientation.ts";

const docs = {
  roadmap: readFileSync(orientationPaths.roadmap, "utf8"),
  strategy: readFileSync(orientationPaths.strategy, "utf8"),
  thread: readFileSync(activeOrientationThread(readFileSync(orientationPaths.roadmap, "utf8")), "utf8")
};

test("short entrypoints, dashboard and selected execution retain one approval boundary", () => {
  const report = inspectProjectOrientation();
  assert.deepEqual(report.issues, []);
  assert.equal(report.execution?.id, projectVision.commitment.contractId);
  assert.ok(report.documents.reduce((sum, doc) => sum + doc.words, 0) <= 2000);
});

test("a stale proposal, competing metadata or implicit approval cannot redirect the next session", () => {
  for (const roadmap of [
    docs.roadmap.replace("Milestone Authority: proposed", "Milestone Authority: approved"),
    docs.roadmap.replace("authoring-revision", "physics-reader-convergence"),
    docs.roadmap + "\nCurrent Commitment: another-run\n",
    docs.roadmap.replace(projectVision.commitment.contractId, "run-contract.unrelated")
  ]) assert.ok(checkOrientationDocuments(projectVision, { ...docs, roadmap }).length > 0);
  assert.ok(checkOrientationDocuments(projectVision, {
    ...docs, strategy: docs.strategy.replace(projectVision.directionId, "older-direction")
  }).length > 0);
});

test("startup history cannot silently grow beyond a short reading budget", () => {
  assert.match(checkOrientationDocuments(projectVision, {
    ...docs, roadmap: docs.roadmap + "Historical work. ".repeat(650)
  }).join("\n"), /startup budget/);
});

test("a future pivot can select another thread without a code edit or reading outside the project", () => {
  assert.equal(activeOrientationThread("Active Thread: `threads/another-direction.md`"), "docs/project/threads/another-direction.md");
  for (const text of ["Active Thread: `../secret.md`",
    "Active Thread: threads/one.md\nActive Thread: threads/two.md", "No selection"]) {
    assert.throws(() => activeOrientationThread(text));
  }
});

test("execution selection requires an approval source and a safe contract identity", () => {
  const badId = { ...projectVision, commitment: { ...projectVision.commitment, contractId: "run-contract.../foreign" as const } };
  assert.match(validateProjectVision(badId).join("\n"), /Invalid execution/);
  const badApproval = { ...projectVision, commitment: { ...projectVision.commitment, source: { label: "", href: "docs/project/../../other.md" as const } } };
  assert.ok(validateProjectVision(badApproval).length > 0);
  assert.ok(validateProjectVision({ ...projectVision, nextJudgment: "" }).length > 0);
});

const id = "run-contract.orientation-test";
const record = {
  id, kind: "run-contract", title: "A bounded proof", status: "ready",
  slices: [
    { id: "first", title: "First result", status: "complete" },
    { id: "second", title: "Second result", status: "in-progress" },
    { id: "third", title: "Later result", status: "planned" }
  ]
};

test("progress derives only from the selected contract and follows its unfinished work", () => {
  const execution = readVisionExecution(record, id);
  assert.equal(execution.complete, 1);
  assert.equal(execution.total, 3);
  assert.equal(execution.next, "Second result");
  assert.match(describeVisionExecution(execution), /contract ready/);
  const finished = readVisionExecution({ ...record, slices: record.slices.map(slice => ({ ...slice, status: "complete" })) }, id);
  assert.equal(finished.next, null);
  assert.match(describeVisionExecution(finished), /consult the review evidence/);
});

test("missing, foreign, duplicate or unknown execution cannot masquerade as success", () => {
  for (const candidate of [
    null, {}, { ...record, id: "run-contract.foreign" }, { ...record, slices: [] },
    { ...record, slices: [record.slices[0], record.slices[0]] },
    { ...record, slices: [{ id: "one", title: "Unknown", status: "probably-done" }] }
  ]) assert.throws(() => readVisionExecution(candidate, id));
});
