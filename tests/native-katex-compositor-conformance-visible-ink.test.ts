import assert from "node:assert/strict";
import test from "node:test";

import { createKpNativeKatexConformanceShapeDescriptor } from
  "./support/native-katex-compositor-conformance-schema.ts";
import {
  observeKpNativeKatexConformanceVisibleInk,
  type KpNativeKatexConformancePaintMeasurementPort
} from "./support/native-katex-compositor-visible-ink-observer.ts";

const atomic = createKpNativeKatexConformanceShapeDescriptor({
  id: "shape.italic-x",
  label: "Italic x",
  representativeLatex: "x",
  shapeClass: "atomic-glyph",
  paintClass: "atomic-text",
  ownershipGrain: "leaf",
  baseline: "required",
  riskTags: ["glyph", "font-style"]
});

const rule = createKpNativeKatexConformanceShapeDescriptor({
  id: "shape.fraction-rule",
  label: "Fraction rule",
  representativeLatex: "\\frac{1}{2}",
  shapeClass: "rule",
  paintClass: "rule",
  ownershipGrain: "leaf",
  baseline: "not-applicable",
  riskTags: ["rule"]
});

const stage = {} as HTMLElement;
const element = {} as HTMLElement;

function measurementPort(log: string[]): KpNativeKatexConformancePaintMeasurementPort {
  return {
    measureTextInkRect(observedStage, observedElement) {
      assert.equal(observedStage, stage);
      assert.equal(observedElement, element);
      log.push("text-ink");
      return { left: 11, top: 12, width: 13, height: 14 };
    },
    measureSubtreePaintRect() {
      log.push("subtree-paint");
      return { left: 21, top: 22, width: 23, height: 1 };
    },
    measureBaselineY() {
      log.push("baseline");
      return 25;
    },
    measureEffectiveOpacity() {
      log.push("opacity");
      return 0.75;
    }
  };
}

test("observes atomic glyph ink and baseline rather than an owner layout box", () => {
  const log: string[] = [];
  const observation = observeKpNativeKatexConformanceVisibleInk({
    stage,
    element,
    descriptor: atomic,
    semanticEntityId: "carrier.x",
    measurementPort: measurementPort(log)
  });

  assert.deepEqual(log, ["text-ink", "baseline", "opacity"]);
  assert.equal(observation.measurementAuthority, "realized-paint");
  assert.equal(observation.coordinateSpace, "stage-layout-px");
  assert.deepEqual(observation.rect, {
    left: 11,
    top: 12,
    width: 13,
    height: 14
  });
  assert.equal(observation.baselineY, 25);
  assert.equal(observation.effectiveOpacity, 0.75);
});

test("observes structural paint without inventing a text baseline", () => {
  const log: string[] = [];
  const observation = observeKpNativeKatexConformanceVisibleInk({
    stage,
    element,
    descriptor: rule,
    semanticEntityId: "fraction.rule",
    measurementPort: measurementPort(log)
  });

  assert.deepEqual(log, ["subtree-paint", "opacity"]);
  assert.deepEqual(observation.rect, {
    left: 21,
    top: 22,
    width: 23,
    height: 1
  });
  assert.equal(observation.baselineY, null);
});

test("fails closed for missing paint and invalid realized metrics", () => {
  const missing = {
    ...measurementPort([]),
    measureSubtreePaintRect: () => undefined
  };
  assert.throws(() => observeKpNativeKatexConformanceVisibleInk({
    stage,
    element,
    descriptor: rule,
    semanticEntityId: "fraction.rule",
    measurementPort: missing
  }), /no realized subtree paint/u);

  const invalid = {
    ...measurementPort([]),
    measureTextInkRect: () => ({
      left: Number.NaN,
      top: 0,
      width: 1,
      height: 1
    })
  };
  assert.throws(() => observeKpNativeKatexConformanceVisibleInk({
    stage,
    element,
    descriptor: atomic,
    semanticEntityId: "carrier.x",
    measurementPort: invalid
  }), /rectangle must be finite/u);
});
