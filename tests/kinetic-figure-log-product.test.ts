import assert from "node:assert/strict";
import test from "node:test";

import {
  adjacentKpLogProductFocusDeckBeat,
  kpLogProductFocusDeckBeatIds,
  kpLogProductFocusDeckBeats,
  kpLogProductFocusDeckHash,
  readKpLogProductFocusDeckBeatFromHash
} from "../src/experiments/kinetic-figure-log-product/kinetic-figure-log-product-focus-deck.ts";
import {
  kpLogProductGlanceScrollytellingReadingLineViewportRatio,
  kpLogProductGlanceScrollytellingUrlIds,
  projectKpLogProductGlanceScrollytellingEdge,
  projectKpLogProductGlanceScrollytellingNode,
  projectKpLogProductGlanceScrollytellingScroll,
  readKpLogProductGlanceScrollytellingUrlState
} from "../src/experiments/kinetic-figure-log-product/kinetic-figure-log-product-glance-scrollytelling.ts";
import {
  kpLogProductMicroStationCanonicalTravel,
  projectKpLogProductMicroStation
} from "../src/experiments/kinetic-figure-log-product/kinetic-figure-log-product-micro-station.ts";
import {
  kpLogProductKineticFigureStateIds,
  kpLogProductKineticFigureStates,
  readKpLogProductKineticFigureState
} from "../src/experiments/kinetic-figure-log-product/kinetic-figure-log-product-model.ts";
import {
  kpLogProductStackedStationReadingLineViewportRatio,
  kpLogProductStackedStationUrlIds,
  projectKpLogProductStackedStationDock,
  projectKpLogProductStackedStationNode,
  projectKpLogProductStackedStationScroll,
  readKpLogProductStackedStationUrlState
} from "../src/experiments/kinetic-figure-log-product/kinetic-figure-log-product-stacked-station.ts";
import {
  isKpLogProductKineticFigureRoute,
  KP_LOG_PRODUCT_KINETIC_FIGURE_PATH
} from "../src/experiments/kinetic-figure-log-product/kinetic-figure-log-product-route.ts";

test("log-product Kinetic Figure exposes four ordered conceptual states", () => {
  assert.deepEqual(kpLogProductKineticFigureStateIds, [
    "whole",
    "product",
    "transform",
    "result"
  ]);
  assert.deepEqual(
    kpLogProductKineticFigureStates.map(({ ordinal, pose }) => ({ ordinal, pose })),
    [
      { ordinal: 1, pose: "source" },
      { ordinal: 2, pose: "source" },
      { ordinal: 3, pose: "target" },
      { ordinal: 4, pose: "target" }
    ]
  );
  assert.equal(
    readKpLogProductKineticFigureState("transform").entryTransitionId,
    "transition.log-product.split"
  );
  assert.equal(
    readKpLogProductKineticFigureState("transform").attentionTargetId,
    "semantic.log-product.introduced-structure"
  );
  assert.equal(new Set(
    kpLogProductKineticFigureStates.map(({ proseTargetId }) => proseTargetId)
  ).size, 4);
});

test("unknown state references repair to the whole-expression state", () => {
  assert.equal(readKpLogProductKineticFigureState("result").id, "result");
  assert.equal(readKpLogProductKineticFigureState("missing").id, "whole");
  assert.equal(readKpLogProductKineticFigureState(undefined).id, "whole");
});

test("Focus Deck keeps the rule still and gives only the final edge motion", () => {
  assert.deepEqual(kpLogProductFocusDeckBeatIds, [
    "orient",
    "locate-product",
    "product-law",
    "apply-product-law"
  ]);
  assert.deepEqual(
    kpLogProductFocusDeckBeats.map((beat) => ({
      id: beat.id,
      figureStateId: beat.figureStateId,
      attentionStateId: beat.attentionStateId,
      ownsMotion: beat.ownsMotion
    })),
    [
      { id: "orient", figureStateId: "whole", attentionStateId: "whole",
        ownsMotion: false },
      { id: "locate-product", figureStateId: "product",
        attentionStateId: "product", ownsMotion: false },
      { id: "product-law", figureStateId: "whole",
        attentionStateId: "product", ownsMotion: false },
      { id: "apply-product-law", figureStateId: "transform",
        attentionStateId: "result", ownsMotion: true }
    ]
  );
});

test("Focus Deck addresses semantic beats and clamps adjacent navigation", () => {
  assert.equal(
    readKpLogProductFocusDeckBeatFromHash("#beat.product-law").id,
    "product-law"
  );
  assert.equal(
    readKpLogProductFocusDeckBeatFromHash("#unknown").id,
    "orient"
  );
  assert.equal(kpLogProductFocusDeckHash("apply-product-law"),
    "#beat.apply-product-law");
  assert.equal(adjacentKpLogProductFocusDeckBeat({
    beatId: "orient",
    direction: -1
  }).id, "orient");
  assert.equal(adjacentKpLogProductFocusDeckBeat({
    beatId: "product-law",
    direction: 1
  }).id, "apply-product-law");
});

test("Micro Station travel holds reading beats around one reversible rewrite", () => {
  assert.deepEqual(
    [0, 0.08, 0.16, 0.25, 0.34, 0.53, 0.72, 0.78, 0.84, 0.92, 1]
      .map((travel) => {
        const frame = projectKpLogProductMicroStation(travel);
        return {
          travel: frame.travel,
          progress: Number(frame.animationProgress.toFixed(2)),
          state: frame.stateId,
          phase: frame.phase
        };
      }),
    [
      { travel: 0, progress: 0, state: "whole", phase: "read" },
      { travel: 0.08, progress: 0, state: "whole", phase: "read" },
      { travel: 0.16, progress: 0, state: "product", phase: "locate" },
      { travel: 0.25, progress: 0, state: "product", phase: "locate" },
      { travel: 0.34, progress: 0, state: "transform", phase: "rewrite" },
      { travel: 0.53, progress: 0.5, state: "transform", phase: "rewrite" },
      { travel: 0.72, progress: 1, state: "transform", phase: "inspect" },
      { travel: 0.78, progress: 1, state: "transform", phase: "inspect" },
      { travel: 0.84, progress: 1, state: "result", phase: "settle" },
      { travel: 0.92, progress: 1, state: "result", phase: "settle" },
      { travel: 1, progress: 1, state: "result", phase: "settle" }
    ]
  );
});

test("Micro Station conceptual jumps resolve inside their own travel regions", () => {
  for (const stateId of kpLogProductKineticFigureStateIds) {
    assert.equal(
      projectKpLogProductMicroStation(
        kpLogProductMicroStationCanonicalTravel[stateId]
      ).stateId,
      stateId
    );
  }
  const forward = Array.from({ length: 101 }, (_, index) =>
    projectKpLogProductMicroStation(index / 100).animationProgress
  );
  const reverse = Array.from({ length: 101 }, (_, index) =>
    projectKpLogProductMicroStation((100 - index) / 100).animationProgress
  );
  assert.deepEqual(reverse, [...forward].reverse());
  assert.ok(forward.every((progress, index) =>
    index === 0 || progress >= forward[index - 1]!
  ));
});

test("Glance Scrollytelling has four nodes on one reading line", () => {
  assert.equal(kpLogProductGlanceScrollytellingReadingLineViewportRatio, 0.36);
  assert.deepEqual(
    kpLogProductKineticFigureStateIds.map((stateId) => {
      const frame = projectKpLogProductGlanceScrollytellingNode(stateId);
      return {
        state: frame.stateId,
        progress: frame.animationProgress,
        phase: frame.phase,
        rail: frame.passageSalience[stateId],
        productMark: frame.productMarkSalience
      };
    }),
    [
      { state: "whole", progress: 0, phase: "orient", rail: 1,
        productMark: 0 },
      { state: "product", progress: 0, phase: "locate", rail: 1,
        productMark: 1 },
      { state: "transform", progress: 0, phase: "rule", rail: 1,
        productMark: 0 },
      { state: "result", progress: 1, phase: "inspect", rail: 1,
        productMark: 0 }
    ]
  );
});

test("Glance focus edges release before the next paragraph receives focus", () => {
  for (const [sourceStateId, targetStateId] of [
    ["whole", "product"],
    ["product", "transform"]
  ] as const) {
    assert.deepEqual(
      [0.2, 0.325, 0.5, 0.675, 0.8].map((progress) => {
        const frame = projectKpLogProductGlanceScrollytellingEdge({
          sourceStateId,
          targetStateId,
          progress
        });
        return {
          progress,
          phase: frame.phase,
          source: Number(frame.passageSalience[sourceStateId].toFixed(2)),
          target: Number(frame.passageSalience[targetStateId].toFixed(2)),
          productMark: Number(frame.productMarkSalience.toFixed(2))
        };
      }),
      [
        { progress: 0.2, phase: "focus-release", source: 1, target: 0,
          productMark: sourceStateId === "product" ? 1 : 0 },
        { progress: 0.325, phase: "focus-release", source: 0.5, target: 0,
          productMark: sourceStateId === "product" ? 0.5 : 0 },
        { progress: 0.5, phase: "focus-between", source: 0, target: 0,
          productMark: 0 },
        { progress: 0.675, phase: "focus-reception", source: 0, target: 0.5,
          productMark: targetStateId === "product" ? 0.5 : 0 },
        { progress: 0.8, phase: targetStateId === "product" ? "locate" : "rule",
          source: 0, target: 1,
          productMark: targetStateId === "product" ? 1 : 0 }
      ]
    );
  }
});

test("Glance rule-to-result edge owns the reversible equation rewrite", () => {
  assert.deepEqual(
    [0, 0.2, 0.3, 0.5, 0.7, 0.8, 0.9, 1].map((travel) => {
      const frame = projectKpLogProductGlanceScrollytellingEdge({
        sourceStateId: "transform",
        targetStateId: "result",
        progress: travel
      });
      return {
        travel,
        phase: frame.phase,
        progress: Number(frame.animationProgress.toFixed(2)),
        source: Number(frame.passageSalience.transform.toFixed(2)),
        stage: Number(frame.stageSalience.toFixed(2)),
        target: Number(frame.passageSalience.result.toFixed(2)),
        urlState: frame.urlStateId
      };
    }),
    [
      { travel: 0, phase: "rule", progress: 0,
        source: 1, stage: 0, target: 0, urlState: "transform" },
      { travel: 0.2, phase: "armed", progress: 0,
        source: 0, stage: 1, target: 0, urlState: "transform" },
      { travel: 0.3, phase: "rewrite", progress: 0,
        source: 0, stage: 1, target: 0, urlState: "transform" },
      { travel: 0.5, phase: "rewrite", progress: 0.5,
        source: 0, stage: 1, target: 0, urlState: "transform" },
      { travel: 0.7, phase: "settled", progress: 1,
        source: 0, stage: 1, target: 0, urlState: "transform" },
      { travel: 0.8, phase: "result-reception", progress: 1,
        source: 0, stage: 1, target: 0, urlState: "transform" },
      { travel: 0.9, phase: "result-reception", progress: 1,
        source: 0, stage: 0.5, target: 0.5, urlState: "transform" },
      { travel: 1, phase: "inspect", progress: 1,
        source: 0, stage: 0, target: 1, urlState: "result" }
    ]
  );
});

test("Glance scroll projects measured paragraph landings onto adjacent edges", () => {
  const landingScrollY = {
    whole: 100,
    product: 400,
    transform: 700,
    result: 1200
  } as const;
  assert.deepEqual(
    [100, 250, 400, 550, 700, 950, 1200].map((scrollY) => {
      const frame = projectKpLogProductGlanceScrollytellingScroll({
        scrollY,
        landingScrollY
      });
      return {
        scrollY,
        state: frame.stateId,
        edge: frame.edgeId ?? null,
        travel: frame.travel,
        animationProgress: Number(frame.animationProgress.toFixed(2))
      };
    }),
    [
      { scrollY: 100, state: "whole", edge: null, travel: 0,
        animationProgress: 0 },
      { scrollY: 250, state: "whole",
        edge: "edge.log-product.whole-to-product", travel: 0.5,
        animationProgress: 0 },
      { scrollY: 400, state: "product", edge: null, travel: 1,
        animationProgress: 0 },
      { scrollY: 550, state: "product",
        edge: "edge.log-product.product-to-rule", travel: 0.5,
        animationProgress: 0 },
      { scrollY: 700, state: "transform", edge: null, travel: 1,
        animationProgress: 0 },
      { scrollY: 950, state: "transform",
        edge: "edge.log-product.rule-to-result", travel: 0.5,
        animationProgress: 0.5 },
      { scrollY: 1200, state: "result", edge: null, travel: 1,
        animationProgress: 1 }
    ]
  );
});

test("Glance Scrollytelling publishes semantic paragraph URLs", () => {
  assert.deepEqual(kpLogProductGlanceScrollytellingUrlIds, {
    whole: "passage.log-product.whole",
    product: "passage.log-product.product",
    transform: "passage.log-product.rule",
    result: "passage.log-product.result"
  });
  assert.equal(
    readKpLogProductGlanceScrollytellingUrlState(
      "#passage.log-product.rule"
    ),
    "transform"
  );
  assert.equal(
    readKpLogProductGlanceScrollytellingUrlState("#transform"),
    undefined
  );
});

test("Stacked Station changes geometry without forking semantic frames", () => {
  assert.equal(kpLogProductStackedStationReadingLineViewportRatio, 0.58);
  assert.strictEqual(
    kpLogProductStackedStationUrlIds,
    kpLogProductGlanceScrollytellingUrlIds
  );
  assert.deepEqual(
    kpLogProductKineticFigureStateIds.map((stateId) =>
      projectKpLogProductStackedStationNode(stateId)
    ),
    kpLogProductKineticFigureStateIds.map((stateId) =>
      projectKpLogProductGlanceScrollytellingNode(stateId)
    )
  );
  const landingScrollY = {
    whole: 100,
    product: 400,
    transform: 700,
    result: 1400
  } as const;
  const transitionStartScrollY = 850;
  const transitionEndScrollY = 1250;
  for (const scrollY of [100, 250, 400, 550, 700, 1400]) {
    assert.deepEqual(
      projectKpLogProductStackedStationScroll({
        scrollY,
        landingScrollY,
        transitionStartScrollY,
        transitionEndScrollY
      }),
      projectKpLogProductGlanceScrollytellingScroll({
        scrollY,
        landingScrollY
      })
    );
  }
  assert.deepEqual(
    [850, 1050, 1250].map((scrollY) => {
      const frame = projectKpLogProductStackedStationScroll({
        scrollY,
        landingScrollY,
        transitionStartScrollY,
        transitionEndScrollY
      });
      return {
        phase: frame.phase,
        travel: Number(frame.travel.toFixed(2)),
        animation: Number(frame.animationProgress.toFixed(2)),
        owner: frame.attentionOwner
      };
    }),
    [
      { phase: "armed", travel: 0.2, animation: 0, owner: "stage" },
      { phase: "rewrite", travel: 0.5, animation: 0.5, owner: "stage" },
      { phase: "result-reception", travel: 0.8, animation: 1,
        owner: "handoff" }
    ]
  );
  assert.equal(
    readKpLogProductStackedStationUrlState("#passage.log-product.result"),
    "result"
  );
});

test("Stacked Station docks the measured stage instead of sizing it to the viewport", () => {
  assert.deepEqual(
    projectKpLogProductStackedStationDock({
      stageViewportTop: 256,
      stageBlockSize: 144,
      viewportHeight: 800
    }),
    {
      phase: "docked",
      dockTopViewportY: 256,
      dockBottomViewportY: 400
    }
  );
  assert.deepEqual(
    projectKpLogProductStackedStationDock({
      stageViewportTop: 310,
      stageBlockSize: 144,
      viewportHeight: 800
    }),
    {
      phase: "approaching",
      dockTopViewportY: 256,
      dockBottomViewportY: 400
    }
  );
  const tallStage = projectKpLogProductStackedStationDock({
    stageViewportTop: 16,
    stageBlockSize: 460,
    viewportHeight: 600
  });
  assert.equal(tallStage.phase, "docked");
  assert.equal(tallStage.dockTopViewportY, 16);
  assert.equal(tallStage.dockBottomViewportY, 476);
});

test("the experiment owns one exact isolated route", () => {
  assert.equal(KP_LOG_PRODUCT_KINETIC_FIGURE_PATH,
    "/experiments/kinetic-figure/log-product/");
  assert.equal(isKpLogProductKineticFigureRoute(
    "/experiments/kinetic-figure/log-product"), true);
  assert.equal(isKpLogProductKineticFigureRoute(
    "/experiments/kinetic-figure/log-product/extra"), false);
});
