import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  kpPythonFreeShippingRefactorContract
} from "../src/semantic/python-free-shipping-refactor-contract.ts";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const fixtureRoot = join(projectRoot, "fixtures/python/free-shipping-threshold");

test("Python freezes a novice-readable duplicate-to-helper refactor", () => {
  const contract = kpPythonFreeShippingRefactorContract;

  assert.equal(contract.schemaVersion, "kp.python-free-shipping-refactor.v1");
  assert.equal(contract.language, "python");
  assert.match(contract.learningClaim, /one business rule appears twice/);
  assert.equal(contract.before.source.match(/total >= 50/g)?.length, 2);
  assert.equal(contract.after.source.match(/total >= 50/g)?.length, 1);
  assert.equal(
    contract.after.source.match(/qualifies_for_free_shipping\(total\)/g)?.length,
    2
  );
  assert.doesNotMatch(contract.before.source, /[{};]/);
  assert.match(contract.after.source, /^def qualifies_for_free_shipping/m);
});

test("Python fixture bytes and behavior cases match the authored contract", () => {
  const before = readSource(join(fixtureRoot, "shipping-before.py"));
  const after = readSource(join(fixtureRoot, "shipping-after.py"));
  const cases = JSON.parse(readFileSync(
    join(fixtureRoot, "behavior-cases.json"),
    "utf8"
  ));

  assert.equal(before, kpPythonFreeShippingRefactorContract.before.source);
  assert.equal(after, kpPythonFreeShippingRefactorContract.after.source);
  assert.deepEqual(cases, kpPythonFreeShippingRefactorContract.behaviorCases);
  assert.deepEqual(cases.map(({ total }: { total: number }) => total), [49, 50, 75]);
  assert.deepEqual({
    before: sha256(before),
    after: sha256(after)
  }, {
    before: "76f90bb642f45f1e586bf07a784e8cde63f1ecee0061c8ffe70f1e7f176a5d6a",
    after: "adff8cec71981dc9e433df9ebb7300ea1ededa8c67f4e69bde771b1a0414113f"
  });
});

test("Python stage order and entity references are closed before parsing", () => {
  const contract = kpPythonFreeShippingRefactorContract;
  const entityIds = contract.entities.map(({ id }) => id);

  assert.equal(new Set(entityIds).size, entityIds.length);
  assert.deepEqual(contract.stages.map(({ operation }) => operation), [
    "orient",
    "compare-duplicates",
    "introduce-helper",
    "move-shared-rule",
    "replace-call-site",
    "replace-call-site",
    "verify-parity"
  ]);
  for (const stage of contract.stages) {
    for (const entityId of stage.focusEntityIds) {
      assert.ok(entityIds.includes(entityId), `${stage.id}: ${entityId}`);
    }
  }
});

test("Python keeps compilation build-only and indentation out of semantic motion", () => {
  const contract = kpPythonFreeShippingRefactorContract;

  assert.equal(contract.authority.syntax, "build-time-python-stdlib-ast");
  assert.ok(contract.authority.prohibited.includes("browser-python-parser"));
  assert.ok(contract.authority.prohibited.includes("second-clock-or-scheduler"));
  assert.ok(contract.visualAcceptance.some((criterion) =>
    criterion.includes("indentation remains stable")
  ));
  assert.ok(contract.visualAcceptance.some((criterion) =>
    criterion.includes("exact destination")
  ));
});

function readSource(path: string): string {
  return readFileSync(path, "utf8").replace(/\n$/, "");
}

function sha256(source: string): string {
  return createHash("sha256").update(source).digest("hex");
}
