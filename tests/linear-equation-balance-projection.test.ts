import assert from "node:assert/strict";
import test from "node:test";

import {
  projectLinearEquationBalanceExemplar,
  projectLinearEquationTrace
} from "../src/projections/public-api.ts";
import { createCanonicalConceptRoomTrace } from "./fixtures/canonical-concept-room-trace.ts";

test("symbolic and balance projections share one semantic clock", () => {
  const trace = createCanonicalConceptRoomTrace();
  for (const progress of [0, 400, 500, 750, 1000]) {
    const symbolic = projectLinearEquationTrace(trace, progress);
    const balance = projectLinearEquationBalanceExemplar(trace, progress, {
      diagramSemanticId: "diagram.balance"
    });
    assert.equal(balance.frameId, symbolic.frameId);
    assert.equal(balance.equationSemanticId, symbolic.equationSemanticId);
    assert.equal(balance.progressPermille, symbolic.progressPermille);
  }
});

test("balance terms preserve symbolic semantic identity and exact fractions", () => {
  const trace = createCanonicalConceptRoomTrace();
  const symbolic = projectLinearEquationTrace(trace, 1000);
  const balance = projectLinearEquationBalanceExemplar(trace, 1000, {
    diagramSemanticId: "diagram.balance"
  });
  const symbolicTerms = symbolic.tokens
    .filter((token) => token.kind === "term")
    .map((token) => token.semanticId)
    .sort();
  const balanceTerms = balance.sides.flatMap((side) => side.terms)
    .map((term) => term.semanticId)
    .sort();
  assert.deepEqual(balanceTerms, symbolicTerms);
  assert.equal(balance.sides[1].terms[0]?.latex, "\\frac{5}{2}");
  assert.match(balance.accessibleText, /x equals 5 over 2/);
  assert.equal(Object.isFrozen(balance.sides), true);
});

test("each entering operation is represented on both sides", () => {
  const trace = createCanonicalConceptRoomTrace();
  const subtract = projectLinearEquationBalanceExemplar(trace, 500, {
    diagramSemanticId: "diagram.balance"
  });
  assert.deepEqual(subtract.operationApplications.map((application) => application.side), [
    "left", "right"
  ]);
  assert.deepEqual(new Set(subtract.operationApplications.map((application) =>
    application.operationSemanticId
  )), new Set(["operation.subtract-three"]));
  assert.deepEqual(new Set(subtract.operationApplications.map((application) => application.kind)),
    new Set(["subtract-both-sides"]));
  assert.match(subtract.accessibleText, /subtraction on both sides/);
  const start = projectLinearEquationBalanceExemplar(trace, 0, {
    diagramSemanticId: "diagram.balance"
  });
  assert.deepEqual(start.operationApplications, []);
});

test("canonical start, middle, and end scenes preserve exact physical counts and equality", () => {
  const trace = createCanonicalConceptRoomTrace();
  const scenes = [0, 500, 1000].map((progress) => projectLinearEquationBalanceExemplar(
    trace,
    progress,
    { diagramSemanticId: "diagram.balance" }
  ));
  assert.deepEqual(scenes.map((scene) => scene.stage), [
    "initial", "after-subtraction", "solved-partition"
  ]);
  assert.deepEqual(scenes.map((scene) => scene.equality), [
    { left: { numerator: "8", denominator: "1" }, right: { numerator: "8", denominator: "1" }, isEqual: true },
    { left: { numerator: "5", denominator: "1" }, right: { numerator: "5", denominator: "1" }, isEqual: true },
    { left: { numerator: "5", denominator: "2" }, right: { numerator: "5", denominator: "2" }, isEqual: true }
  ]);
  assert.deepEqual(scenes.map((scene) => scene.physicalUnits.length), [13, 13, 13]);
  assert.deepEqual(scenes.map((scene) => scene.physicalUnits.filter((unit) =>
    unit.placement.kind === "pan"
  ).length), [13, 7, 0]);
  assert.deepEqual(scenes.map((scene) => scene.physicalUnits.map((unit) => unit.id)), [
    scenes[0]!.physicalUnits.map((unit) => unit.id),
    scenes[0]!.physicalUnits.map((unit) => unit.id),
    scenes[0]!.physicalUnits.map((unit) => unit.id)
  ]);
  assert.equal(scenes.every((scene) => scene.schemaVersion === "kp.balance-exemplar-ir.v2"), true);
  assert.equal(scenes.every((scene) => scene.exemplarKind === "canonical-two-x-plus-three"), true);
});

test("subtraction records three matched two-sided removal paths without negative weights", () => {
  const scene = projectLinearEquationBalanceExemplar(createCanonicalConceptRoomTrace(), 500, {
    diagramSemanticId: "diagram.balance"
  });
  const removals = scene.operationPaths.filter((path) => path.kind === "matched-removal");
  assert.equal(removals.length, 3);
  assert.deepEqual(removals.map((path) => path.sourceUnitIds), [
    ["balance.left.unit.0", "balance.right.unit.5"],
    ["balance.left.unit.1", "balance.right.unit.6"],
    ["balance.left.unit.2", "balance.right.unit.7"]
  ]);
  assert.equal(scene.physicalUnits.filter((unit) => unit.placement.kind === "removed").length, 6);
  assert.equal(scene.physicalUnits.some((unit) => unit.exactLoadAtVerifiedSolution.numerator.startsWith("-")), false);
  assert.equal(removals.every((path) => path.operationSemanticId === "operation.subtract-three"), true);
});

test("division partitions five whole units into two exact quotient groups through one unsplit remainder", () => {
  const scene = projectLinearEquationBalanceExemplar(createCanonicalConceptRoomTrace(), 1000, {
    diagramSemanticId: "diagram.balance"
  });
  assert.equal(scene.partitionGroups.length, 2);
  assert.deepEqual(scene.partitionGroups.map((group) => ({
    groupIndex: group.groupIndex,
    variableUnitId: group.variableUnitId,
    wholeCount: group.wholeRightUnitIds.length,
    remainder: group.sharedRemainder,
    exactRightValue: group.exactRightValue,
    selected: group.selectedAsRepresentative
  })), [
    {
      groupIndex: 0,
      variableUnitId: "balance.left.variable.0",
      wholeCount: 2,
      remainder: {
        unitId: "balance.right.unit.4",
        exactShare: { numerator: "1", denominator: "2" },
        representation: "symbolic-share-of-unsplit-unit"
      },
      exactRightValue: { numerator: "5", denominator: "2" },
      selected: true
    },
    {
      groupIndex: 1,
      variableUnitId: "balance.left.variable.1",
      wholeCount: 2,
      remainder: {
        unitId: "balance.right.unit.4",
        exactShare: { numerator: "1", denominator: "2" },
        representation: "symbolic-share-of-unsplit-unit"
      },
      exactRightValue: { numerator: "5", denominator: "2" },
      selected: false
    }
  ]);
  const remainder = scene.physicalUnits.find((unit) => unit.id === "balance.right.unit.4")!;
  assert.deepEqual(remainder.placement, {
    kind: "shared-remainder",
    groupIds: ["balance.partition.0", "balance.partition.1"],
    representation: "symbolic-halves-of-one-unsplit-unit"
  });
  assert.equal(scene.operationPaths.filter((path) => path.kind === "partition-assignment").length, 6);
  assert.equal(scene.operationPaths.filter((path) => path.kind === "shared-remainder").length, 1);
});

test("every physical object and operation path has an explicit symbolic correspondence", () => {
  const scene = projectLinearEquationBalanceExemplar(createCanonicalConceptRoomTrace(), 1000, {
    diagramSemanticId: "diagram.balance"
  });
  const correspondenceTargets = new Set(scene.symbolicCorrespondences.map((entry) => entry.geometricId));
  for (const unit of scene.physicalUnits) assert.equal(correspondenceTargets.has(unit.id), true);
  for (const path of scene.operationPaths) assert.equal(correspondenceTargets.has(path.id), true);
  for (const group of scene.partitionGroups) {
    assert.equal(scene.symbolicCorrespondences.filter((entry) => entry.geometricId === group.id).length, 2);
  }
  assert.equal(scene.symbolicCorrespondences.some((entry) => entry.symbolicSemanticId === "operation.divide-two"), true);
  assert.equal(Object.isFrozen(scene.physicalUnits[0]?.placement), true);
  assert.equal(Object.isFrozen(scene.partitionGroups[0]?.sharedRemainder), true);
});

test("the exemplar projection rejects traces outside its fixed physical interpretation", () => {
  const trace = createCanonicalConceptRoomTrace();
  const nonCanonical = {
    ...trace,
    solution: { numerator: "7", denominator: "2" }
  };
  assert.throws(() => projectLinearEquationBalanceExemplar(nonCanonical, 0, {
    diagramSemanticId: "diagram.balance"
  }), /canonical 2x \+ 3 = 8 trace/);
});
