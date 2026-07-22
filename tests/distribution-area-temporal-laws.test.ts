import assert from "node:assert/strict";
import test from "node:test";

import { createKpIndexedProgressSchedule, kpParallel, kpSequence } from "../src/animation/indexed-progress-schedule.ts";
import { checkKpTemporalContinuity, checkKpTemporalReverseEquivalence } from "../src/animation/temporal-continuity-laws.ts";
import { createKpDistributionAreaLayoutSnapshot, createKpDistributionAreaWidthLayoutSnapshot, type KpDistributionAreaAnchorMeasurement, type KpDistributionAreaStateId } from "../src/reader/renderers/distribution-area-layout.ts";
import { createKpDistributionAreaMotionPlan } from "../src/reader/renderers/distribution-area-motion-plan.ts";
import { createKpDistributionAreaWidthMotionPlan } from "../src/reader/renderers/distribution-area-width-motion-plan.ts";

const suffixes: Readonly<Record<KpDistributionAreaStateId, readonly string[]>> = {
  factored: ["factor.3", "left-paren", "term.x", "plus", "term.2", "right-paren"],
  distributed: ["left.factor.3", "left.term.x", "plus", "right.factor.3", "right.times", "right.term.2"],
  expanded: ["left.factor.3", "left.term.x", "plus", "right.product.6"]
};

function layout() {
  let index = 0;
  const measurements = (Object.entries(suffixes) as Array<[KpDistributionAreaStateId, readonly string[]]>).flatMap(
    ([stateId, stateSuffixes]) => stateSuffixes.map((suffix): KpDistributionAreaAnchorMeasurement => ({
      stateId,
      selectorId: `exemplar.state.${stateId}.${suffix}`,
      lineage: suffix,
      rect: { left: 60 + index++ * 16, top: 50, width: 12, height: 22 }
    }))
  );
  return createKpDistributionAreaLayoutSnapshot({ revision: 1, rootRect: { left: 0, top: 0, width: 500, height: 160 }, measurements });
}

function widthLayout() {
  const ids = ["source.x", "source.plus", "source.two", "target.x", "target.two"] as const;
  return createKpDistributionAreaWidthLayoutSnapshot({
    revision: 1,
    rootRect: { left: 0, top: 0, width: 500, height: 240 },
    measurements: ids.map((selectorId, index) => ({
      stateId: "factored" as const,
      selectorId,
      lineage: selectorId,
      rect: { left: selectorId === "target.x" ? 130 : selectorId === "target.two" ? 360 : 230 + index * 14, top: 30, width: 12, height: 20 }
    }))
  });
}

test("one topology-level law covers parallel, sequential, and inverse distribution timelines", () => {
  for (const [id, strategy] of [["parallel", kpParallel()], ["sequence", kpSequence()]] as const) {
    const schedule = createKpIndexedProgressSchedule({ id: `schedule.${id}`, ids: ["left", "right"], strategy });
    const plan = createKpDistributionAreaMotionPlan(layout(), schedule);
    const widthPlan = createKpDistributionAreaWidthMotionPlan(widthLayout(), schedule);
    const sample = (progress: number) => {
      const frame = plan.sample(progress);
      const width = widthPlan.sample(frame.phase === "distribution" ? frame.phaseProgress : 1);
      return Object.fromEntries([
        ...Object.entries(frame.tokens).map(([tokenId, pose]) => [`algebra.${tokenId}`, pose]),
        ...Object.entries(width).map(([tokenId, pose]) => [`geometry.${tokenId}`, pose])
      ]);
    };
    const continuity = checkKpTemporalContinuity({ sample });
    const reverse = checkKpTemporalReverseEquivalence({
      forward: sample,
      inverse: (progress) => sample(1 - progress)
    });
    assert.equal(continuity.passed, true, continuity.failures.map((failure) => `${failure.path}: ${failure.message}`).join("\n"));
    assert.equal(continuity.topologySize, 13);
    assert.equal(reverse.passed, true, reverse.failures.map((failure) => `${failure.path}: ${failure.message}`).join("\n"));
  }
});

test("the temporal law rejects topology changes and teleporting tokens", () => {
  const report = checkKpTemporalContinuity({
    steps: 20,
    sample: (progress) => ({
      token: { x: progress < 0.5 ? 0 : 100, y: 0, opacity: 1, scale: 1 },
      ...(progress < 0.75 ? {} : { surprise: { x: 0, y: 0, opacity: 1, scale: 1 } })
    })
  });
  assert.equal(report.passed, false);
  assert.ok(report.failures.some((failure) => failure.path.endsWith("topology")));
  assert.ok(report.failures.some((failure) => failure.path.endsWith("token.x")));
});
