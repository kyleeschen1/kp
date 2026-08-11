import assert from "node:assert/strict";
import test from "node:test";

import type {
  KpAnimationTransformationPhaseCohort
} from "../src/animation/transformation-phase-cohorts.ts";
import {
  certifyKpCanonicalEquationTransitionContinuity,
  planKpCanonicalEquationTransitionCorrections
} from "../src/reader/app/canonical-equation-transition-continuity.ts";
import type {
  KpReaderEquationLayoutSnapshot
} from "../src/reader/renderers/equation-layout-snapshot.ts";
import type {
  KpReaderEquationResponsiveFitPlan
} from "../src/reader/renderers/equation-responsive-fit.ts";
import {
  createKpEquationStageMeasurementIdentity
} from "../src/reader/runtime/equation-stage-layout.ts";

const cohorts: readonly KpAnimationTransformationPhaseCohort[] = [
  {
    id: "first",
    transformationIds: ["first"],
    sourceObjectIds: ["equation.start"],
    targetObjectIds: ["equation.shared"]
  },
  {
    id: "second",
    transformationIds: ["second"],
    sourceObjectIds: ["equation.shared"],
    targetObjectIds: ["equation.end"]
  }
];

test("adjacent canonical transitions certify one fitted shared endpoint", () => {
  const certificate = certifyKpCanonicalEquationTransitionContinuity({
    cohorts,
    contexts: contexts(0)
  });

  assert.equal(certificate.seams.length, 1);
  assert.equal(certificate.seams[0]!.selectorCount, 1);
  assert.equal(certificate.maximumResidualPx, 0);
});

test("adjacent canonical transitions reject visible endpoint jumps", () => {
  assert.throws(() => certifyKpCanonicalEquationTransitionContinuity({
    cohorts,
    contexts: contexts(1)
  }), /1\.000px residual/);
});

test("adjacent rigid offsets compile to one phase correction", () => {
  const corrections = planKpCanonicalEquationTransitionCorrections({
    cohorts,
    contexts: contexts(2)
  });
  assert.deepEqual(corrections.get("first")?.get("canonical-phase"), {
    x: 0,
    y: 0
  });
  assert.deepEqual(corrections.get("second")?.get("canonical-phase"), {
    x: 0,
    y: -2
  });
});

test("per-glyph seam distortion cannot masquerade as phase alignment", () => {
  const base = contexts(0);
  const first = base.get("first")!;
  const second = base.get("second")!;
  const additional = (context: typeof first, top: number) => ({
    ...context,
    layout: {
      ...context.layout,
      anchors: [...context.layout.anchors, {
        ...context.layout.anchors[0]!,
        id: `${context.id}.additional`,
        selectorId: "selector.additional",
        rect: { left: 160, top, width: 20, height: 20 },
        center: { x: 170, y: top + 10 }
      }]
    }
  });
  assert.throws(() => planKpCanonicalEquationTransitionCorrections({
    cohorts,
    contexts: new Map([
      ["first", additional(first, 20)],
      ["second", additional(second, 22)]
    ])
  }), /non-rigid/);
});

function contexts(nextTopDelta: number) {
  const fit = responsiveFit();
  return new Map([
    ["first", {
      id: "first",
      layout: layout("first", "target", 20),
      fit
    }],
    ["second", {
      id: "second",
      layout: layout("second", "source", 20 + nextTopDelta),
      fit
    }]
  ]);
}

function layout(
  transitionId: string,
  side: "source" | "target",
  top: number
): KpReaderEquationLayoutSnapshot {
  const measurementIdentity = createKpEquationStageMeasurementIdentity({
    revision: 0,
    coordinateSpaceId: "fixture.canonical-stage"
  });
  return {
    id: `layout.${transitionId}`,
    kind: "reader-equation-layout-snapshot",
    materialPlanId: `material.${transitionId}`,
    transitionId,
    revision: 0,
    measurementIdentity,
    viewport: { width: 300, height: 120 },
    anchors: [{
      id: `${transitionId}.${side}.shared`,
      side,
      selectorId: "selector.shared",
      objectId: "equation.shared",
      selectorIndex: 0,
      anchorKind: "ink-center",
      focused: false,
      rect: { left: 100, top, width: 40, height: 20 },
      center: { x: 120, y: top + 10 }
    }],
    owners: []
  };
}

function responsiveFit(): KpReaderEquationResponsiveFitPlan {
  return {
    id: "fit.sequence",
    kind: "reader-equation-responsive-fit-plan",
    alignmentPlanId: "sequence.fixture",
    measurementIdentity: createKpEquationStageMeasurementIdentity({
      revision: 0,
      coordinateSpaceId: "fixture.canonical-stage"
    }),
    geometrySource: "alignment-envelope",
    viewportWidth: 300,
    viewportHeight: 120,
    horizontalPadding: 0,
    verticalPadding: 0,
    contentBounds: { left: 0, top: 0, width: 300, height: 120 },
    centeringBounds: { left: 0, top: 0, width: 300, height: 120 },
    requiredScale: 1,
    scale: 1,
    translateX: 0,
    translateY: 0,
    status: "native",
    wrapAllowed: false
  };
}
