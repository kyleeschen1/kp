import assert from "node:assert/strict";
import test from "node:test";

import {
  sampleKpEconomicsEquilibriumRuntimeFrame
} from "../src/animation/economics-equilibrium-runtime-frame.ts";
import {
  createKpEconomicsEquilibriumSynchronizedView
} from "../src/animation/economics-equilibrium-synchronized-view.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";
import {
  renderKpAnimationCatalogueParameters
} from "../src/editor/animation-catalogue-shell.ts";
import {
  createKpEconomicsEquilibriumParameterState,
  createParameterizedEconomicsEquilibriumAnimation,
  readKpEconomicsEquilibriumParameters,
  writeKpEconomicsEquilibriumParameters
} from "../src/editor/economics-equilibrium-parameters.ts";

test("economics parameter route restores bounded values and omits the default", () => {
  assert.equal(
    readKpEconomicsEquilibriumParameters("?artifact=economics&demandIntercept=20")
      .demandInterceptAfter,
    20
  );
  assert.equal(
    readKpEconomicsEquilibriumParameters("?demandIntercept=22")
      .demandInterceptAfter,
    18
  );
  assert.equal(
    writeKpEconomicsEquilibriumParameters({
      search: "?artifact=animation.economics.supply-demand-equilibrium-shift",
      state: createKpEconomicsEquilibriumParameterState(20)
    }),
    "?artifact=animation.economics.supply-demand-equilibrium-shift&demandIntercept=20"
  );
  assert.equal(
    writeKpEconomicsEquilibriumParameters({
      search:
        "?artifact=animation.economics.supply-demand-equilibrium-shift&demandIntercept=20",
      state: createKpEconomicsEquilibriumParameterState(18)
    }),
    "?artifact=animation.economics.supply-demand-equilibrium-shift"
  );
});

test("parameterized asset carries exact model truth into runtime views", () => {
  const parameterized = createParameterizedEconomicsEquilibriumAnimation(
    createKpEconomicsEquilibriumParameterState(20)
  );
  const runtime = sampleKpEconomicsEquilibriumRuntimeFrame({
    animation: parameterized.animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation: parameterized.animation,
      progress: 1
    })
  });
  const view = createKpEconomicsEquilibriumSynchronizedView(runtime);

  assert.deepEqual(parameterized.model.states.after.equilibrium, {
    id: "equilibrium.economics.supply-demand",
    stateId: "equilibrium.economics.supply-demand.after",
    quantity: { numerator: "9", denominator: "1" },
    price: { numerator: "11", denominator: "1" }
  });
  assert.deepEqual(runtime.semanticFrame.equilibrium, {
    id: "equilibrium.economics.supply-demand",
    quantity: { numerator: "9", denominator: "1" },
    price: { numerator: "11", denominator: "1" }
  });
  assert.equal(view.equations.demandLatex, "P = 20.00 - Q");
  assert.equal(
    view.equations.equilibriumLatex,
    "E = (Q, P) = (9.00, 11.00)"
  );
});

test("catalogue exposes one compact economics control behind Parameters", () => {
  const base = createKpAnimationCatalogueProjection().entries[0]!;
  const entry = {
    ...base,
    animationId: "animation.economics.supply-demand-equilibrium-shift"
  };
  const html = renderKpAnimationCatalogueParameters({
    entry,
    economicsParameters: createKpEconomicsEquilibriumParameterState(20)
  });

  assert.match(html, /<h3>Parameters<\/h3>/);
  assert.match(html, /data-kp-economics-parameters/);
  assert.match(html, /data-action="set-economics-demand-intercept"/);
  assert.match(html, /min="15" max="20" step="1" value="20"/);
  assert.match(html, /data-kp-economics-demand-intercept-output>20<\/output>/);
  assert.equal([...html.matchAll(/<input/g)].length, 1);
  assert.doesNotMatch(html, /ontology|registry|advanced/i);
});
