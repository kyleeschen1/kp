import assert from "node:assert/strict";
import test from "node:test";

import {
  kpPlaceValueAdditionVisualReference as reference
} from "../src/reader/compiler/place-value-addition-visual-reference.ts";

test("visual reference fixes the conventional five-row four-column algorithm", () => {
  assert.deepEqual(reference.primaryStage.rows, [
    "carry",
    "first-addend",
    "second-addend",
    "underline",
    "result"
  ]);
  assert.deepEqual(reference.primaryStage.columns, [
    "operator",
    "hundreds",
    "tens",
    "ones"
  ]);
  assert.deepEqual(
    reference.primaryStage.initialCells.map(({ latex, row, column }) => ({
      latex,
      row,
      column
    })),
    [
      { latex: "2", row: "first-addend", column: "hundreds" },
      { latex: "7", row: "first-addend", column: "tens" },
      { latex: "8", row: "first-addend", column: "ones" },
      { latex: "+", row: "second-addend", column: "operator" },
      { latex: "1", row: "second-addend", column: "hundreds" },
      { latex: "5", row: "second-addend", column: "tens" },
      { latex: "6", row: "second-addend", column: "ones" }
    ]
  );
  assert.deepEqual(reference.primaryStage.underline, {
    id: "rule.addition.underline",
    row: "underline",
    fromColumn: "operator",
    throughColumn: "ones",
    placement: "beneath-second-addend"
  });
});

test("visual reference freezes seven contiguous causal beats", () => {
  assert.equal(reference.beats.length, 7);
  assert.equal(reference.beats[0]?.startPermille, 0);
  assert.equal(reference.beats.at(-1)?.endPermille, 1_000);
  assert.ok(reference.beats.every((beat, index) =>
    index === 0 ||
    reference.beats[index - 1]?.endPermille === beat.startPermille
  ));
  assert.deepEqual(
    reference.beats.map(({ requiredPresentation }) => requiredPresentation),
    [
      "persistent-native-establish",
      "operation-evaluation",
      "adjacent-place-exchange",
      "operation-evaluation",
      "adjacent-place-exchange",
      "operation-evaluation",
      "native-settlement"
    ]
  );
  assert.ok(reference.beats.every(({ opacityPolicy }) =>
    opacityPolicy === "opaque"
  ));
});

test("visual reference carries overflow digits continuously into fixed slots", () => {
  assert.deepEqual(reference.carryChoreography, [
    {
      sourceResult: "14",
      overflowDigit: "1",
      remainderDigit: "4",
      fromColumn: "ones",
      toCarrySlot: "carry.tens",
      motion: "continuous-up-and-left",
      consumedByBeatId: "beat.place-value.evaluate-tens"
    },
    {
      sourceResult: "13",
      overflowDigit: "1",
      remainderDigit: "3",
      fromColumn: "tens",
      toCarrySlot: "carry.hundreds",
      motion: "continuous-up-and-left",
      consumedByBeatId: "beat.place-value.evaluate-hundreds"
    }
  ]);
  assert.deepEqual(
    reference.primaryStage.carrySlots.map(({ id, column }) => ({ id, column })),
    [
      { id: "carry.tens", column: "tens" },
      { id: "carry.hundreds", column: "hundreds" }
    ]
  );
});

test("visual reference freezes one full-timeline documentary workspace", () => {
  const workspace = reference.persistentWorkspace;
  assert.deepEqual(workspace.lifetime, {
    startPermille: 0,
    endPermille: 1_000,
    nodePolicy: "same-connected-node",
    documentaryCellIds: [
      "digit.first.hundreds",
      "digit.first.tens",
      "digit.first.ones",
      "operator.add",
      "digit.second.hundreds",
      "digit.second.tens",
      "digit.second.ones",
      "rule.addition.underline",
      "carry.tens",
      "carry.hundreds",
      "result.hundreds",
      "result.tens",
      "result.ones"
    ],
    consumedSourcePolicy: "monotone-dim-never-hide",
    stationaryMarkPolicy: "opaque-and-stationary",
    rewindPolicy: "restore-original-opacity-on-same-node"
  });
  assert.deepEqual(
    workspace.operationDestinations.map(
      ({ semanticTotal, region, anchorColumn }) => ({
        semanticTotal,
        region,
        anchorColumn
      })
    ),
    [
      { semanticTotal: "14", region: "result-band", anchorColumn: "ones" },
      { semanticTotal: "13", region: "result-band", anchorColumn: "tens" },
      {
        semanticTotal: "4",
        region: "result-band",
        anchorColumn: "hundreds"
      }
    ]
  );
});

test("visual reference forbids invisible carry ownership gaps", () => {
  assert.deepEqual(reference.persistentWorkspace.carryTransit, {
    routePolicy: "measured-curved-route",
    sourcePolicy: "evaluated-total-native-paint",
    destinationPolicy: "adjacent-native-carry-slot",
    ownershipPolicy: "moving-paint-until-native-endpoint",
    handoffPolicy: "exclusive-opaque-endpoint",
    teleportAllowed: false,
    fadeAllowed: false
  });
  assert.deepEqual(reference.persistentWorkspace.sampling, {
    directSeek: "history-independent",
    rewind: "exact",
    endpointSettlement: "native-katex",
    responsiveGeometry: "measure-current-connected-surface"
  });
});

test("secondary quantity evidence cannot replace or crowd the written algorithm", () => {
  assert.deepEqual(reference.secondaryViewBoundary, {
    mathematicalAuthority: false,
    sharesTrace: true,
    sharesClock: true,
    wideMayShowBesidePrimary: true,
    phoneSeparatelySelectable: true,
    primaryAlwaysAvailable: true,
    mayReducePrimaryReadability: false
  });
  assert.ok(reference.forbiddenBehavior.includes("carry-fade-or-teleport"));
  assert.ok(reference.forbiddenBehavior.includes("row-invention-by-compositor"));
  assert.ok(reference.forbiddenBehavior.includes("secondary-view-crowds-primary"));
});
