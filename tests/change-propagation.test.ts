import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { compileChangeSource, formatChangeNumber, projectChange } from "../src/tutorial/change-propagation/model.ts";
import { renderChangePublication } from "../src/tutorial/change-propagation/view.ts";

const bytes = readFileSync("examples/calculus/change-propagation.json", "utf8");
function model(overrides: Record<string, unknown> = {}) {
  const result = compileChangeSource(JSON.stringify({ ...JSON.parse(bytes), ...overrides }));
  if (result.status !== "checked") throw new Error(result.message);
  return result.model;
}
function near(actual: number, expected: number, tolerance = 1e-12) { assert.ok(Math.abs(actual - expected) < tolerance, `${actual} ≠ ${expected}`); }

test("finite changes and the two local scales come from the authored expressions", () => {
  const m = model(), s = m.sample(.75, .4);
  near(s.u, .75 ** 2); near(s.y, Math.sin(.75 ** 2));
  near(s.deltaU, 2 * .75 * .4 + .4 ** 2);
  near(s.deltaY, Math.sin(1.15 ** 2) - Math.sin(.75 ** 2));
  near(s.firstScale, 1.5); near(s.secondScale, Math.cos(.75 ** 2));
  near(s.derivative, 1.5 * Math.cos(.75 ** 2));
  near(s.dy, s.firstScale * s.secondScale * s.h);
  near(s.error, s.deltaY - s.dy);
  assert.notEqual(s.deltaU, s.du); assert.notEqual(s.deltaY, s.dy);
});

test("zero derivative does not imply zero finite change; zero h has no error ratio", () => {
  const m = model(), zeroSlope = m.sample(0, .4), noChange = m.sample(.75, 0);
  assert.equal(zeroSlope.du, 0); assert.equal(zeroSlope.dy, 0);
  near(zeroSlope.deltaU, .16); near(zeroSlope.deltaY, Math.sin(.16));
  assert.equal(noChange.deltaY, 0); assert.equal(noChange.errorPerH, null);
  assert.equal(formatChangeNumber(noChange.errorPerH), "—");
  assert.equal(formatChangeNumber(-.0000001), "+0.00000");
});

test("negative h, reversed sensitivity and source-only mathematical variation", () => {
  const m = model(), s = m.sample(1.5, -.1);
  assert.ok(s.derivative < 0); assert.ok(s.dy > 0); assert.ok(s.deltaY > 0);
  const changed = model({ inner: "x^3", outer: "u^2" });
  near(changed.sample(.75, .1).derivative, 6 * .75 ** 5);
  near(changed.sample(.75, .1).deltaY, .85 ** 6 - .75 ** 6);
  assert.notEqual(changed.latex.innerDerivative, m.latex.innerDerivative);
  const linear = model({ inner: "2*x+1", outer: "3*u-2" });
  for (const h of [-.5, -.1, 0, .1, .5]) near(linear.sample(.5, h).error, 0);
});

test("residual over h tends to zero on both sides, including at stationary points", () => {
  const m = model();
  for (const x of [-1.5, 0, .75, 1.5]) for (const sign of [-1, 1]) {
    const large = m.sample(x, sign * .01), small = m.sample(x, sign * .0001);
    assert.ok(Math.abs(small.errorPerH!) < Math.abs(large.errorPerH!) / 50);
  }
});

test("fixed scales contain all allowed increments, including zero, negative and cancellation", () => {
  for (const m of [model(), model({ inner: "x^3", outer: "u^2" }), model({ inner: "\\sin(x)", outer: "\\cos(u)" }), model({ inner: "x-x", outer: "u^2" })]) {
    for (const x of [-2, -.75, 0, .75, 2]) {
      const [, u, y] = m.scales(x);
      for (let i = -50; i <= 50; i++) {
        const s = m.sample(x, i / 100);
        assert.ok(Math.abs(s.deltaU) <= u + 1e-12 && Math.abs(s.du) <= u + 1e-12);
        assert.ok(Math.abs(s.deltaY) <= y + 1e-12 && Math.abs(s.dy) <= y + 1e-12);
        for (const v of Object.values(s)) assert.ok(v === null || Number.isFinite(v));
      }
    }
  }
});

test("seek, reverse and limit shrinking are pure projections of one state", () => {
  const m = model();
  const a = projectChange(m, .75, .4, 3.5);
  projectChange(m, .75, .4, 4); projectChange(m, .75, .4, 0);
  assert.deepEqual(projectChange(m, .75, .4, 3.5), a);
  near(projectChange(m, .75, .4, 4).h, .04);
  assert.throws(() => projectChange(m, .75, .4, NaN));
  assert.throws(() => m.sample(3, 0)); assert.throws(() => m.sample(0, Infinity));
});

test("unsupported meanings are rejected before simplification, never replaced by a fallback", () => {
  for (const inner of ["0*z", "0/x", "x^0.5", "x^5", "\\ln(x)", "\\sqrt(x)", "x^y", "11x", "0.0000001*x", "\\href{bad}{x}", "x/0", "("]) {
    const result = compileChangeSource(JSON.stringify({ ...JSON.parse(bytes), inner }));
    assert.equal(result.status, "repair-gap", inner);
    if (result.status === "repair-gap") assert.equal(result.path, "inner");
  }
  for (const overrides of [{ x: 3 }, { h: 1 }, { outer: "x" }, { steps: [] }, { motion: "fade" }, { inner: "x^4", outer: "u^4" }]) {
    assert.equal(compileChangeSource(JSON.stringify({ ...JSON.parse(bytes), ...overrides })).status, "repair-gap");
  }
  assert.equal(compileChangeSource("{" ).status, "repair-gap");
  assert.equal(compileChangeSource(" ".repeat(16001)).status, "repair-gap");
});

test("publication escapes authored prose and preserves readable math without script", () => {
  const m = model({ title: "<script>alert(1)</script>" });
  const html = renderChangePublication(m, bytes);
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"));
  assert.ok(html.includes('data-kp-focus-deck-static="true"'));
  assert.ok(html.includes("katex-mathml")); assert.ok(!html.includes("katex-error"));
  assert.ok(html.includes("not a proof"));
  assert.ok(html.includes("including when"));
});
