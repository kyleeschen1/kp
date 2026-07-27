import assert from "node:assert/strict";
import test from "node:test";

import {
  certifyKpTwoRowEquationStageLayout,
  compileKpMeasuredEquationStageInput,
  createKpEquationStageMeasurementIdentity,
  type KpEquationStageEnvelopeDefinition,
  type KpEquationStageEnvelopeObservation,
  type KpEquationStageRect
} from "../src/reader/runtime/equation-stage-layout.ts";

const identity = createKpEquationStageMeasurementIdentity({
  revision: 8,
  coordinateSpaceId: "fixture.two-row"
});

function certify(input: {
  readonly first: readonly KpEquationStageRect[];
  readonly second: readonly KpEquationStageRect[];
  readonly emSizePx: number;
  readonly reverseRows?: boolean;
}) {
  const rowIds = input.reverseRows
    ? ["second", "first"] as const
    : ["first", "second"] as const;
  const rectsByRow = { first: input.first, second: input.second };
  const intent = {
    nodeId: "transition.two-row",
    policy: "semantic-two-row-stage" as const,
    rows: rowIds.map((rowId) => ({
      id: `row.${rowId}`,
      role: `${rowId}-branch`,
      envelopeIds: rectsByRow[rowId].map(
        (_, index) => `envelope.${rowId}.${index}`
      )
    }))
  };
  const definitions: KpEquationStageEnvelopeDefinition[] = [];
  const observations: KpEquationStageEnvelopeObservation[] = [];
  for (const rowId of ["first", "second"] as const) {
    rectsByRow[rowId].forEach((rect, index) => {
      const definition = {
        id: `envelope.${rowId}.${index}`,
        transitionId: intent.nodeId,
        endpointObjectId: `endpoint.${rowId}.${index}`,
        memberOwnerIds: [`owner.${rowId}.${index}`]
      };
      definitions.push(definition);
      observations.push({
        ...definition,
        rect,
        baselineY: rect.top + rect.height * 0.75,
        emSizePx: input.emSizePx,
        measurementIdentity: identity
      });
    });
  }
  return certifyKpTwoRowEquationStageLayout(
    compileKpMeasuredEquationStageInput({
      intent,
      definitions,
      observations,
      measurementIdentity: identity
    })
  );
}

for (const fixture of [
  {
    name: "wide",
    first: [{ left: 10, top: 10, width: 240, height: 36 }],
    second: [{ left: 80, top: 14, width: 120, height: 34 }],
    emSizePx: 20
  },
  {
    name: "phone",
    first: [{ left: 8, top: 20, width: 150, height: 42 }],
    second: [{ left: 24, top: 18, width: 118, height: 54 }],
    emSizePx: 18
  }
] as const) {
  test(`${fixture.name} two-row plan centers rows with measured gutter`, () => {
    const certificate = certify(fixture);
    const [first, second] = certificate.rows;
    assert.equal(certificate.policy, "semantic-two-row-stage");
    assertClose(centerX(first!.rect), centerX(second!.rect));
    assertClose(
      centerY(certificate.stageBounds),
      centerY(union([...fixture.first, ...fixture.second]))
    );
    assertClose(
      second!.rect.top - (first!.rect.top + first!.rect.height),
      certificate.minimumGutterPx
    );
    assert.ok(certificate.minimumGutterPx >= fixture.emSizePx * 0.75);
    assert.equal(first!.baselinePolicy, "preserve-native");
    assert.equal(second!.baselinePolicy, "preserve-native");
  });
}

test("two-row order follows semantic intent deterministically", () => {
  const fixture = {
    first: [{ left: 0, top: 0, width: 100, height: 30 }],
    second: [{ left: 0, top: 0, width: 80, height: 20 }],
    emSizePx: 16
  };
  assert.deepEqual(
    certify(fixture).rows.map(({ id }) => id),
    ["row.first", "row.second"]
  );
  assert.deepEqual(
    certify({ ...fixture, reverseRows: true }).rows.map(({ id }) => id),
    ["row.second", "row.first"]
  );
});

test("random two-row fixtures remain centered and non-overlapping", () => {
  let state = 0x7a35c119;
  const random = () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
  for (let index = 0; index < 100; index += 1) {
    const rectangles = () => Array.from({ length: 1 + index % 3 }, () => ({
      left: random() * 200 - 50,
      top: random() * 100 - 20,
      width: 20 + random() * 160,
      height: 12 + random() * 60
    }));
    const certificate = certify({
      first: rectangles(),
      second: rectangles(),
      emSizePx: 12 + random() * 18
    });
    const [first, second] = certificate.rows;
    assertClose(centerX(first!.rect), centerX(second!.rect));
    assert.ok(
      second!.rect.top >=
      first!.rect.top + first!.rect.height + certificate.minimumGutterPx - 1e-9
    );
    assert.ok(contains(certificate.stageBounds, first!.rect));
    assert.ok(contains(certificate.stageBounds, second!.rect));
  }
});

function centerX(rect: KpEquationStageRect): number {
  return rect.left + rect.width / 2;
}

function centerY(rect: KpEquationStageRect): number {
  return rect.top + rect.height / 2;
}

function union(rects: readonly KpEquationStageRect[]): KpEquationStageRect {
  const left = Math.min(...rects.map(({ left }) => left));
  const top = Math.min(...rects.map(({ top }) => top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
}

function contains(outer: KpEquationStageRect, inner: KpEquationStageRect) {
  return inner.left >= outer.left &&
    inner.top >= outer.top &&
    inner.left + inner.width <= outer.left + outer.width &&
    inner.top + inner.height <= outer.top + outer.height;
}

function assertClose(actual: number, expected: number): void {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
}
