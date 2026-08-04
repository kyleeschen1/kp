import assert from "node:assert/strict";
import test from "node:test";

import {
  planKpLispLambdaBindingGeometry,
  type KpLispBindingCubicSegment
} from "../src/animation/lisp-lambda-binding-geometry.ts";
import { projectKpLispLambdaSourceMaterial } from
  "../src/animation/lisp-s-expression-material-projection.ts";
import { projectKpLispResponsiveGeometry } from
  "../src/animation/lisp-s-expression-responsive-geometry.ts";
import { defineKpLispInternalTuning } from
  "../src/animation/lisp-s-expression-timing.ts";
import { createKpLispLambdaApplicationFixture } from
  "../src/semantic/lisp-lambda-application-fixture.ts";

const fixture = createKpLispLambdaApplicationFixture();
const application = projectKpLispLambdaSourceMaterial(fixture).canonicalStates[0]!;

test("derives parameter, occurrence, argument, and destination identities", () => {
  const plan = bindingPlan(720);

  assert.equal(plan.bindingId, "binding.x");
  assert.equal(plan.environmentId, "environment.application");
  assert.equal(plan.argumentMaterialId, "occurrence.argument.four");
  assert.deepEqual(plan.destinationIds, ["destination.body.x"]);
  assert.deepEqual(plan.boxes.map(({ materialId, role, strength }) => ({
    materialId,
    role,
    strength
  })), [
    { materialId: "occurrence.x.binder", role: "parameter", strength: "strong" },
    { materialId: "occurrence.x.reference", role: "occurrence", strength: "light" }
  ]);
  assert.ok(plan.boxes.every(({ colorToken }) =>
    colorToken === "--kp-lisp-binding-color"));
});

test("uses one clear over-code arch on wide stages", () => {
  const geometry = responsive(720);
  const plan = planKpLispLambdaBindingGeometry(fixture.semantic, geometry);
  const [segment] = plan.transfer.segments;
  const argument = geometry.tokens.find(({ materialId }) =>
    materialId === "occurrence.argument.four")!;
  const parameter = geometry.tokens.find(({ materialId }) =>
    materialId === "occurrence.x.binder")!;

  assert.equal(plan.transfer.route, "wide-arch");
  assert.equal(plan.transfer.segments.length, 1);
  assert.equal(segment!.start.xEm,
    argument.rect.xEm + argument.rect.widthEm / 2);
  assert.equal(segment!.end.xEm,
    parameter.rect.xEm + parameter.rect.widthEm / 2);
  assert.ok(segment!.control1.yEm < segment!.start.yEm);
  assert.ok(segment!.control2.yEm < segment!.end.yEm);
});

test("routes phone transfer through a clear left arch without crossing code", () => {
  const geometry = responsive(320);
  const plan = planKpLispLambdaBindingGeometry(fixture.semantic, geometry);
  const participants = new Set([
    plan.transfer.startMaterialId,
    plan.transfer.endMaterialId
  ]);

  assert.equal(plan.transfer.route, "phone-clearance-arch");
  assert.equal(plan.transfer.segments.length, 2);
  for (const segment of plan.transfer.segments) {
    for (const point of [segment.start, segment.control1, segment.control2, segment.end]) {
      assert.ok(point.xEm >= geometry.stage.xEm);
      assert.ok(point.xEm <= geometry.stage.xEm + geometry.stage.widthEm);
      assert.ok(point.yEm >= geometry.stage.yEm);
      assert.ok(point.yEm <= geometry.stage.yEm + geometry.stage.heightEm);
    }
    for (let step = 0; step <= 100; step += 1) {
      const point = cubicPoint(segment, step / 100);
      for (const token of geometry.tokens.filter(({ materialId }) =>
        !participants.has(materialId))) {
        assert.equal(inside(point, token.rect, 0.04), false,
          `${token.materialId} intersects phone binding route`);
      }
    }
  }
});

test("changes only arch shape when internal height tuning changes", () => {
  const geometry = responsive(720);
  const low = planKpLispLambdaBindingGeometry(
    fixture.semantic,
    geometry,
    defineKpLispInternalTuning({ archHeight: 0.2 })
  );
  const high = planKpLispLambdaBindingGeometry(
    fixture.semantic,
    geometry,
    defineKpLispInternalTuning({ archHeight: 0.7 })
  );

  assert.deepEqual(low.boxes, high.boxes);
  assert.deepEqual(low.destinationIds, high.destinationIds);
  assert.ok(high.transfer.segments[0]!.control1.yEm <
    low.transfer.segments[0]!.control1.yEm);
  assert.equal(Object.isFrozen(high.transfer.segments), true);
});

test("rejects an incomplete certified environment route", () => {
  assert.throws(
    () => planKpLispLambdaBindingGeometry(
      { ...fixture.semantic, environments: [] },
      responsive(720)
    ),
    /binding route is incomplete/
  );
});

function responsive(width: number) {
  return projectKpLispResponsiveGeometry(
    fixture.semantic,
    application,
    width,
    "expr.application"
  );
}

function bindingPlan(width: number) {
  return planKpLispLambdaBindingGeometry(fixture.semantic, responsive(width));
}

function cubicPoint(segment: KpLispBindingCubicSegment, progress: number) {
  const inverse = 1 - progress;
  const project = (axis: "xEm" | "yEm") =>
    inverse ** 3 * segment.start[axis] +
    3 * inverse ** 2 * progress * segment.control1[axis] +
    3 * inverse * progress ** 2 * segment.control2[axis] +
    progress ** 3 * segment.end[axis];
  return { xEm: project("xEm"), yEm: project("yEm") };
}

function inside(
  point: { xEm: number; yEm: number },
  rect: { xEm: number; yEm: number; widthEm: number; heightEm: number },
  clearance: number
) {
  return point.xEm > rect.xEm - clearance &&
    point.xEm < rect.xEm + rect.widthEm + clearance &&
    point.yEm > rect.yEm - clearance &&
    point.yEm < rect.yEm + rect.heightEm + clearance;
}
