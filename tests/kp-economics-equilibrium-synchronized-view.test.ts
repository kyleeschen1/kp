import assert from "node:assert/strict";
import test from "node:test";

import {
  createEconomicsEquilibriumAnimationAsset
} from "../src/animation/economics-equilibrium-adapter.ts";
import {
  sampleKpEconomicsEquilibriumRuntimeFrame
} from "../src/animation/economics-equilibrium-runtime-frame.ts";
import {
  createKpEconomicsEquilibriumSynchronizedView
} from "../src/animation/economics-equilibrium-synchronized-view.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import {
  createKpEditorGraphSvgViewportModel
} from "../src/editor/graph-svg-viewport.ts";
import {
  createKpEconomicsEquilibriumParameterState,
  createParameterizedEconomicsEquilibriumAnimation
} from "../src/editor/economics-equilibrium-parameters.ts";
import {
  renderKpEconomicsEquilibriumRuntimeContent
} from "../src/rendering/economics-equilibrium-svg.ts";

test("economics synchronized view derives equations and claims from exact frame", () => {
  const animation = createEconomicsEquilibriumAnimationAsset();
  const runtimeFrame = sampleKpEconomicsEquilibriumRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, progress: 0.44 })
  });
  const view = createKpEconomicsEquilibriumSynchronizedView(runtimeFrame);

  assert.deepEqual(view.equations, {
    supplyLatex: "P = 2 + Q",
    demandLatex: "P \\approx 16.00 - Q",
    equilibriumLatex: "E = (Q, P) \\approx (7.00, 9.00)"
  });
  assert.equal(view.narrative.id, "narrative.economics.shift-demand");
  assert.deepEqual(view.narrative.claimIds, [
    "claim.economics.supply-fixed",
    "claim.economics.demand-intercept-shift",
    "claim.economics.market-clears"
  ]);
  assert.match(view.nonvisualSummary, /Quantity Q is horizontal and price P is vertical/);
  assert.match(view.nonvisualSummary, /current equilibrium is quantity 7 and price 9/);
});

test("economics narrative follows choreography while graph truth stays synchronized", () => {
  const animation = createEconomicsEquilibriumAnimationAsset();
  const samples = [0, 0.44, 0.8, 1].map((progress) => {
    const runtime = sampleKpEconomicsEquilibriumRuntimeFrame({
      animation,
      runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, progress })
    });
    return createKpEconomicsEquilibriumSynchronizedView(runtime);
  });

  assert.deepEqual(
    samples.map(({ narrative }) => narrative.id),
    [
      "narrative.economics.establish-equilibrium",
      "narrative.economics.shift-demand",
      "narrative.economics.handoff-equilibrium",
      "narrative.economics.settle-equilibrium"
    ]
  );
  assert.equal(
    samples[0]?.equations.equilibriumLatex,
    "E = (Q, P) = (6.00, 8.00)"
  );
  assert.equal(
    samples[3]?.equations.equilibriumLatex,
    "E = (Q, P) = (8.00, 10.00)"
  );
});

test("economics display rounds moving values while preserving exact nonvisual truth", () => {
  const animation = createEconomicsEquilibriumAnimationAsset();
  const runtime = sampleKpEconomicsEquilibriumRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, progress: 0.3 })
  });
  const view = createKpEconomicsEquilibriumSynchronizedView(runtime);

  assert.equal(view.equations.demandLatex, "P \\approx 14.63 - Q");
  assert.equal(
    view.equations.equilibriumLatex,
    "E = (Q, P) \\approx (6.31, 8.31)"
  );
  assert.doesNotMatch(view.equations.demandLatex, /\\frac/);
  assert.doesNotMatch(view.equations.equilibriumLatex, /\\frac/);
  assert.match(view.nonvisualSummary, /quantity 101 over 16 and price 133 over 16/);
});

test("runtime SVG paints inline KaTeX and matching narrative evidence", () => {
  const animation = createEconomicsEquilibriumAnimationAsset();
  const frame = sampleKpEconomicsEquilibriumRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, progress: 0.44 })
  });
  const html = renderKpEconomicsEquilibriumRuntimeContent({
    frame,
    viewport: createKpEditorGraphSvgViewportModel(animation)
  });

  assert.match(html, /data-kp-economics-synchronized-view/);
  assert.match(html, /data-kp-economics-equation-role="supply"/);
  assert.match(html, /data-kp-latex="P \\approx 16\.00 - Q"/);
  assert.match(html, /class="katex"/);
  assert.match(html, /data-kp-economics-narrative-id="narrative\.economics\.shift-demand"/);
  assert.match(html, /data-kp-economics-claim-ids="claim\.economics\.supply-fixed claim\.economics\.demand-intercept-shift claim\.economics\.market-clears"/);
  assert.match(html, /data-kp-economics-nonvisual-summary/);
});

test("parameterized narrative speaks the authored target rather than a default", () => {
  const animation = createParameterizedEconomicsEquilibriumAnimation(
    createKpEconomicsEquilibriumParameterState(20)
  ).animation;
  const runtime = sampleKpEconomicsEquilibriumRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      progress: 0.44
    })
  });
  const view = createKpEconomicsEquilibriumSynchronizedView(runtime);

  assert.match(view.narrative.text, /rises toward 20/);
  assert.doesNotMatch(view.narrative.text, /toward 18/);
  assert.match(view.nonvisualSummary, /Demand is P equals 17 minus Q/);
  assert.match(
    view.nonvisualSummary,
    /current equilibrium is quantity 15 over 2 and price 19 over 2/
  );
});
