import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  compileKpPlaceValuePersistentWorkspacePlan
} from "../src/animation/place-value-addition-persistent-workspace.ts";
import {
  compileKpPlaceValueAdditionPositionPrograms,
  isKpPlaceValuePositionProgram
} from "../src/reader/compiler/place-value-addition-position-program.ts";
import {
  createKpPlaceValueAdditionRuntimeSession
} from "../src/rendering/place-value-addition-runtime.ts";
import {
  isKpPlaceValueWrittenOwnershipPlan
} from "../src/rendering/place-value-addition-written-ownership.ts";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

test("ordered radix positions govern every evaluation and exchange", () => {
  const programs = compileKpPlaceValueAdditionPositionPrograms();
  const session = createKpPlaceValueAdditionRuntimeSession();
  const plan = compileKpPlaceValuePersistentWorkspacePlan();

  assert.ok(programs.every(isKpPlaceValuePositionProgram));
  assert.deepEqual(
    programs.map(({ position }) => position.sequenceIndex),
    [0, 1, 2]
  );
  assert.equal(session.columnEvaluations.length, programs.length);
  assert.equal(
    session.columnExchanges.length,
    programs.filter(({ exchange }) => exchange !== undefined).length
  );
  assert.equal(plan.operations.length, programs.length);
  assert.deepEqual(
    programs.map(({ terminalOutput }) => terminalOutput?.mode ?? null),
    [null, null, "settle-in-terminal-position"]
  );
  assert.equal(programs[2]!.terminalOutput!.outputs[0].digitValue, 4n);
  assert.ok(session.columnEvaluations.every(({ writtenOwnership }) =>
    isKpPlaceValueWrittenOwnershipPlan(writtenOwnership)
  ));
  assert.ok(session.columnExchanges.every(({ writtenOwnership }) =>
    isKpPlaceValueWrittenOwnershipPlan(writtenOwnership)
  ));
});

test("reusable position pipeline cannot branch on familiar place names", () => {
  const reusableSources = [
    "src/animation/place-value-addition-persistent-workspace.ts",
    "src/animation/place-value-addition-presentation-plan.ts",
    "src/reader/compiler/place-value-addition-position-types.ts",
    "src/reader/compiler/place-value-addition-terminal-output.ts",
    "src/rendering/place-value-addition-column-evaluation.ts",
    "src/rendering/place-value-addition-column-exchange.ts",
    "src/rendering/place-value-addition-runtime.ts",
    "src/rendering/place-value-addition-shared-dom.ts",
    "src/rendering/place-value-addition-written-ownership.ts"
  ];
  for (const sourcePath of reusableSources) {
    const source = readFileSync(join(projectRoot, sourcePath), "utf8");
    assert.doesNotMatch(
      source,
      /\b(?:ones|tens|hundreds)\b/u,
      `${sourcePath} must consume ordered position metadata`
    );
  }
});
