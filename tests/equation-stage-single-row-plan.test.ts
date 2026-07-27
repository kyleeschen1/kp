import assert from "node:assert/strict";
import test from "node:test";

import {
  certifyKpSingleRowEquationStageLayout,
  compileKpMeasuredEquationStageInput,
  createKpEquationStageMeasurementIdentity,
  type KpEquationStageEnvelopeDefinition,
  type KpEquationStageEnvelopeObservation,
  type KpEquationStagePhaseIntent,
  type KpEquationStageRect
} from "../src/reader/runtime/equation-stage-layout.ts";

const identity = createKpEquationStageMeasurementIdentity({
  revision: 7,
  coordinateSpaceId: "fixture.single-row"
});

function certify(rects: readonly KpEquationStageRect[]) {
  const intent: KpEquationStagePhaseIntent = {
    nodeId: "transition.single-row",
    policy: "single-row",
    rows: [{
      id: "row.equation",
      role: "equation",
      envelopeIds: rects.map((_, index) => `envelope.${index}`)
    }]
  };
  const definitions: KpEquationStageEnvelopeDefinition[] = rects.map(
    (_, index) => ({
      id: `envelope.${index}`,
      transitionId: intent.nodeId,
      endpointObjectId: `endpoint.${index}`,
      memberOwnerIds: [`owner.${index}`]
    })
  );
  const observations: KpEquationStageEnvelopeObservation[] = rects.map(
    (rect, index) => ({
      ...definitions[index]!,
      rect,
      baselineY: rect.top + rect.height * 0.75,
      measurementIdentity: identity
    })
  );
  return certifyKpSingleRowEquationStageLayout(
    compileKpMeasuredEquationStageInput({
      intent,
      definitions,
      observations,
      measurementIdentity: identity
    })
  );
}

test("single-row certification preserves native geometry and baselines", () => {
  const certificate = certify([
    { left: 20, top: 12, width: 80, height: 30 },
    { left: 30, top: 8, width: 120, height: 38 }
  ]);
  const row = certificate.rows[0]!;

  assert.equal(certificate.policy, "single-row");
  assert.deepEqual(row.rect, { left: 20, top: 8, width: 130, height: 38 });
  assert.deepEqual(certificate.stageBounds, row.rect);
  assert.equal(row.translateX, 0);
  assert.equal(row.translateY, 0);
  assert.equal(row.baselinePolicy, "preserve-native");
  for (const envelope of certificate.measuredInput.envelopes) {
    assert.equal(contains(row.rect, envelope.rect), true);
  }
});

test("single-row planning is translation invariant for randomized rectangles", () => {
  let state = 0x2f6e2b1;
  const random = () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
  for (let index = 0; index < 100; index += 1) {
    const rects = Array.from({ length: 2 + index % 4 }, () => ({
      left: random() * 180 - 40,
      top: random() * 80 - 20,
      width: 10 + random() * 100,
      height: 8 + random() * 40
    }));
    const dx = random() * 200 - 100;
    const dy = random() * 100 - 50;
    const original = certify(rects);
    const translated = certify(rects.map((rect) => ({
      ...rect,
      left: rect.left + dx,
      top: rect.top + dy
    })));
    assertClose(translated.stageBounds.left, original.stageBounds.left + dx);
    assertClose(translated.stageBounds.top, original.stageBounds.top + dy);
    assertClose(translated.stageBounds.width, original.stageBounds.width);
    assertClose(translated.stageBounds.height, original.stageBounds.height);
    assertClose(
      centerX(translated.rows[0]!.rect),
      centerX(translated.stageBounds)
    );
  }
});

test("single-row certifier rejects multi-row and staged intent", () => {
  const measured = certify([
    { left: 0, top: 0, width: 40, height: 20 }
  ]).measuredInput;
  for (const intent of [
    { ...measured.intent, policy: "semantic-two-row-stage" as const },
    {
      ...measured.intent,
      rows: [...measured.intent.rows, {
        id: "row.second",
        role: "equation",
        envelopeIds: ["envelope.0"]
      }]
    }
  ]) {
    assert.throws(
      () => certifyKpSingleRowEquationStageLayout({
        ...measured,
        intent
      }),
      /requires exactly one declared row/
    );
  }
});

function contains(outer: KpEquationStageRect, inner: KpEquationStageRect) {
  return inner.left >= outer.left &&
    inner.top >= outer.top &&
    inner.left + inner.width <= outer.left + outer.width &&
    inner.top + inner.height <= outer.top + outer.height;
}

function centerX(rect: KpEquationStageRect): number {
  return rect.left + rect.width / 2;
}

function assertClose(actual: number, expected: number): void {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
}
