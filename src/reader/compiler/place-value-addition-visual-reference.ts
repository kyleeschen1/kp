import {
  kpPlaceValueAdditionPreservationManifest as preservation
} from "./place-value-addition-preservation-manifest.ts";

/**
 * The written algorithm owns a fixed semantic cell topology before any paint
 * is measured. This prevents the compositor from inventing rows to solve local
 * overlap: it may route paint inside these slots, but it cannot move a digit to
 * a pedagogically different line.
 */
export const kpPlaceValueAdditionVisualReference = Object.freeze({
  schemaVersion: "kp.place-value-addition-visual-reference.v1",
  animationId: preservation.animationId,
  defaultDurationMs: 12_000,
  primaryStage: Object.freeze({
    kind: preservation.primaryProjection.kind,
    rows: Object.freeze([
      "carry",
      "first-addend",
      "second-addend",
      "underline",
      "result"
    ]),
    columns: Object.freeze(["operator", "hundreds", "tens", "ones"]),
    initialCells: Object.freeze([
      Object.freeze({
        id: "digit.first.hundreds",
        row: "first-addend",
        column: "hundreds",
        latex: "2"
      }),
      Object.freeze({
        id: "digit.first.tens",
        row: "first-addend",
        column: "tens",
        latex: "7"
      }),
      Object.freeze({
        id: "digit.first.ones",
        row: "first-addend",
        column: "ones",
        latex: "8"
      }),
      Object.freeze({
        id: "operator.add",
        row: "second-addend",
        column: "operator",
        latex: "+"
      }),
      Object.freeze({
        id: "digit.second.hundreds",
        row: "second-addend",
        column: "hundreds",
        latex: "1"
      }),
      Object.freeze({
        id: "digit.second.tens",
        row: "second-addend",
        column: "tens",
        latex: "5"
      }),
      Object.freeze({
        id: "digit.second.ones",
        row: "second-addend",
        column: "ones",
        latex: "6"
      })
    ]),
    underline: Object.freeze({
      id: "rule.addition.underline",
      row: "underline",
      fromColumn: "operator",
      throughColumn: "ones",
      placement: "beneath-second-addend"
    }),
    resultSlots: Object.freeze([
      Object.freeze({
        id: "result.hundreds",
        row: "result",
        column: "hundreds",
        latex: "4"
      }),
      Object.freeze({
        id: "result.tens",
        row: "result",
        column: "tens",
        latex: "3"
      }),
      Object.freeze({
        id: "result.ones",
        row: "result",
        column: "ones",
        latex: "4"
      })
    ]),
    carrySlots: Object.freeze([
      Object.freeze({
        id: "carry.tens",
        row: "carry",
        column: "tens",
        latex: "1",
        sourceBeatId: "beat.place-value.exchange-ones"
      }),
      Object.freeze({
        id: "carry.hundreds",
        row: "carry",
        column: "hundreds",
        latex: "1",
        sourceBeatId: "beat.place-value.exchange-tens"
      })
    ]),
    typography: Object.freeze({
      settledOwner: "native-katex",
      digitSpacing: "place-columns-no-interdigit-space",
      carryScale: "secondary-script-size",
      baselinePolicy: "row-baseline-fixed-before-motion",
      minimumMathFontPx: 28
    })
  }),
  beats: Object.freeze([
    Object.freeze({
      id: "beat.place-value.establish",
      startPermille: 0,
      endPermille: 100,
      requiredPresentation: "persistent-native-establish",
      primaryAction: "Show the aligned addends, plus sign, underline, and empty result row.",
      secondaryAction: "Show both addends as base-ten quantities.",
      opacityPolicy: "opaque"
    }),
    Object.freeze({
      id: "beat.place-value.evaluate-ones",
      startPermille: 100,
      endPermille: 250,
      requiredPresentation: "operation-evaluation",
      primaryAction: "Evaluate 8 + 6 as 14 in the ones column.",
      secondaryAction: "Gather eight and six unit blocks as fourteen ones.",
      opacityPolicy: "opaque"
    }),
    Object.freeze({
      id: "beat.place-value.exchange-ones",
      startPermille: 250,
      endPermille: 400,
      requiredPresentation: "adjacent-place-exchange",
      primaryAction: "Settle 4 below the ones column and carry 1 visibly above the tens column.",
      secondaryAction: "Exchange ten ones for one ten and preserve four ones.",
      opacityPolicy: "opaque"
    }),
    Object.freeze({
      id: "beat.place-value.evaluate-tens",
      startPermille: 400,
      endPermille: 560,
      requiredPresentation: "operation-evaluation",
      primaryAction: "Evaluate the carried 1 + 7 + 5 as 13 in the tens column.",
      secondaryAction: "Gather the carried ten with seven and five tens.",
      opacityPolicy: "opaque"
    }),
    Object.freeze({
      id: "beat.place-value.exchange-tens",
      startPermille: 560,
      endPermille: 710,
      requiredPresentation: "adjacent-place-exchange",
      primaryAction: "Settle 3 below the tens column and carry 1 visibly above the hundreds column.",
      secondaryAction: "Exchange ten tens for one hundred and preserve three tens.",
      opacityPolicy: "opaque"
    }),
    Object.freeze({
      id: "beat.place-value.evaluate-hundreds",
      startPermille: 710,
      endPermille: 870,
      requiredPresentation: "operation-evaluation",
      primaryAction: "Evaluate the carried 1 + 2 + 1 as 4 in the hundreds column.",
      secondaryAction: "Gather the carried hundred with two and one hundreds.",
      opacityPolicy: "opaque"
    }),
    Object.freeze({
      id: "beat.place-value.settle",
      startPermille: 870,
      endPermille: 1_000,
      requiredPresentation: "native-settlement",
      primaryAction: "Settle the completed native result 434 without a handoff flash.",
      secondaryAction: "Settle four hundreds, three tens, and four ones.",
      opacityPolicy: "opaque"
    })
  ]),
  carryChoreography: Object.freeze([
    Object.freeze({
      sourceResult: "14",
      overflowDigit: "1",
      remainderDigit: "4",
      fromColumn: "ones",
      toCarrySlot: "carry.tens",
      motion: "continuous-up-and-left",
      consumedByBeatId: "beat.place-value.evaluate-tens"
    }),
    Object.freeze({
      sourceResult: "13",
      overflowDigit: "1",
      remainderDigit: "3",
      fromColumn: "tens",
      toCarrySlot: "carry.hundreds",
      motion: "continuous-up-and-left",
      consumedByBeatId: "beat.place-value.evaluate-hundreds"
    })
  ]),
  persistentWorkspace: Object.freeze({
    lifetime: Object.freeze({
      startPermille: 0,
      endPermille: 1_000,
      nodePolicy: "same-connected-node",
      documentaryCellIds: Object.freeze([
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
      ]),
      consumedSourcePolicy: "monotone-dim-never-hide",
      stationaryMarkPolicy: "opaque-and-stationary",
      rewindPolicy: "restore-original-opacity-on-same-node"
    }),
    operationDestinations: Object.freeze([
      Object.freeze({
        beatId: "beat.place-value.evaluate-ones",
        semanticTotal: "14",
        destination: "measured-evaluated-total-native-paint",
        region: "result-band",
        anchorColumn: "ones"
      }),
      Object.freeze({
        beatId: "beat.place-value.evaluate-tens",
        semanticTotal: "13",
        destination: "measured-evaluated-total-native-paint",
        region: "result-band",
        anchorColumn: "tens"
      }),
      Object.freeze({
        beatId: "beat.place-value.evaluate-hundreds",
        semanticTotal: "4",
        destination: "measured-evaluated-total-native-paint",
        region: "result-band",
        anchorColumn: "hundreds"
      })
    ]),
    carryTransit: Object.freeze({
      routePolicy: "measured-curved-route",
      sourcePolicy: "evaluated-total-native-paint",
      destinationPolicy: "adjacent-native-carry-slot",
      ownershipPolicy: "moving-paint-until-native-endpoint",
      handoffPolicy: "exclusive-opaque-endpoint",
      teleportAllowed: false,
      fadeAllowed: false
    }),
    sampling: Object.freeze({
      directSeek: "history-independent",
      rewind: "exact",
      endpointSettlement: "native-katex",
      responsiveGeometry: "measure-current-connected-surface"
    })
  }),
  secondaryViewBoundary: Object.freeze({
    mathematicalAuthority: false,
    sharesTrace: true,
    sharesClock: true,
    wideMayShowBesidePrimary: true,
    phoneSeparatelySelectable: true,
    primaryAlwaysAvailable: true,
    mayReducePrimaryReadability: false
  }),
  review: Object.freeze({
    fullMotionSamplesPermille: Object.freeze([
      0, 50, 100, 175, 250, 325, 400, 480, 560, 635, 710, 790, 870, 935,
      1_000
    ]),
    denseBoundariesPermille: Object.freeze([
      0, 99, 100, 101, 249, 250, 251, 399, 400, 401, 559, 560, 561, 709,
      710, 711, 869, 870, 871, 999, 1_000
    ]),
    requiredProfiles: Object.freeze(["wide", "phone"]),
    requiredDirections: Object.freeze(["forward", "rewind"])
  }),
  forbiddenBehavior: Object.freeze([
    "whole-expression-fade-replacement",
    "input-out-result-in-crossfade",
    "carry-fade-or-teleport",
    "operator-left-behind-during-evaluation",
    "digit-font-substitution",
    "baseline-sag",
    "row-invention-by-compositor",
    "interdigit-space",
    "overlap",
    "clipping",
    "endpoint-jerk",
    "terminal-first-frame-flash",
    "secondary-view-crowds-primary"
  ])
} as const);
