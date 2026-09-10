import assert from "node:assert/strict";
import { test } from "node:test";
import { validateTrialInventory } from "../scripts/check-unfamiliar-authoring-trial.ts";

const first = ["case-01.attempt-1.json", "case-01.attempt-1.report.json", "case-01.notes.md"];
test("trial inventory permits pending work but does not report it complete", () => {
  assert.deepEqual(validateTrialInventory([]), []);
  assert.deepEqual(validateTrialInventory(first), [first[0]]);
  assert.throws(() => validateTrialInventory(first, true), /Missing predeclared case/);
});
test("trial inventory retains failed attempts, reports and author provenance", () => {
  assert.throws(() => validateTrialInventory(first.filter(n => !n.endsWith("report.json"))), /Missing original checker/);
  assert.throws(() => validateTrialInventory(first.filter(n => !n.endsWith("notes.md"))), /Missing author provenance/);
  assert.throws(() => validateTrialInventory([...first.slice(1), "case-01.attempt-2.json", "case-01.attempt-2.report.json"]), /Missing earlier failed attempt/);
  assert.throws(() => validateTrialInventory(["case-01.attempt-1.report.json"]), /Orphan report/);
});
test("trial inventory cannot quietly add replacement cases or exceed repair cap", () => {
  assert.throws(() => validateTrialInventory(["case-06.attempt-1.json"]), /Unexpected case/);
  assert.throws(() => validateTrialInventory(["case-01.attempt-5.json"]), /attempt cap/);
});
