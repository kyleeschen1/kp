import assert from "node:assert/strict";
import test from "node:test";

import {
  createCanonicalKpQuadraticParabolaGraphProjection,
  sampleKpQuadraticParabolaGraphFrame,
  validateKpQuadraticParabolaGraphProjection
} from "../src/projections/quadratic-parabola-graph.ts";
import {
  renderKpQuadraticParabolaSvg
} from "../src/rendering/quadratic-parabola-svg.ts";

test("canonical parabola cites exact equation and verified root authority", () => {
  const projection = createCanonicalKpQuadraticParabolaGraphProjection();
  assert.deepEqual(validateKpQuadraticParabolaGraphProjection(projection), []);
  assert.equal(projection.equation.latex, "y=x^2-5x+6");
  assert.deepEqual(
    projection.roots.map(({ solutionMemberId, x, y, branchSign }) => ({
      solutionMemberId,
      x,
      y,
      branchSign
    })),
    [
      {
        solutionMemberId: "root:2/1",
        x: { numerator: "2", denominator: "1" },
        y: { numerator: "0", denominator: "1" },
        branchSign: "minus"
      },
      {
        solutionMemberId: "root:3/1",
        x: { numerator: "3", denominator: "1" },
        y: { numerator: "0", denominator: "1" },
        branchSign: "plus"
      }
    ]
  );
  assert.equal(projection.authorityBoundary.rendererMaySolve, false);
});

test("every exact curve sample and vertex lies on the authored polynomial", () => {
  const projection = createCanonicalKpQuadraticParabolaGraphProjection();
  assert.equal(projection.curveSamples.length, 41);
  assert.deepEqual(projection.vertex.x, { numerator: "5", denominator: "2" });
  assert.deepEqual(projection.vertex.y, { numerator: "-1", denominator: "4" });
});

test("graph frames reveal axes, curve, and stable roots with mirrored rewind", () => {
  const projection = createCanonicalKpQuadraticParabolaGraphProjection();
  const start = sampleKpQuadraticParabolaGraphFrame({ projection, progress: 0 });
  const middle = sampleKpQuadraticParabolaGraphFrame({ projection, progress: 0.7 });
  const end = sampleKpQuadraticParabolaGraphFrame({ projection, progress: 1 });
  const rewind = sampleKpQuadraticParabolaGraphFrame({
    projection,
    progress: 0.3,
    direction: "rewind"
  });
  assert.equal(start.curveReveal, 0);
  assert.ok(middle.curveReveal > 0);
  assert.ok(middle.roots[0]!.opacity > middle.roots[1]!.opacity);
  assert.equal(end.curveReveal, 1);
  assert.deepEqual(rewind, middle);
});

test("SVG consumes explicit projection points and cannot solve", () => {
  const svg = renderKpQuadraticParabolaSvg(
    createCanonicalKpQuadraticParabolaGraphProjection()
  );
  assert.match(svg, /data-kp-renderer-may-solve="false"/);
  assert.match(svg, /data-kp-graph-root="root:2\/1"/);
  assert.match(svg, /data-kp-graph-root="root:3\/1"/);
  assert.match(svg, /selector\.quadratic\.graph\.root-two/);
  assert.match(svg, /selector\.quadratic\.graph\.root-three/);
  assert.doesNotMatch(svg, /quadraticFormula|discriminant|root-finder|sqrt/);
});
