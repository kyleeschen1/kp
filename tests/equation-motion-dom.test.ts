import { strict as assert } from "node:assert";
import test from "node:test";

import { measureAnnotatedEquationMotionTokens } from "../src/rendering/equation-motion-dom.ts";

const rect = (
  left: number,
  top: number,
  width: number,
  height: number
): DOMRect =>
  ({
    left,
    top,
    width,
    height
  }) as DOMRect;

const fakeElement = ({
  motionId,
  text,
  bounds
}: {
  motionId?: string | undefined;
  text: string;
  bounds: DOMRect;
}): HTMLElement =>
  ({
    dataset: motionId === undefined ? {} : { kpMotionId: motionId },
    textContent: text,
    getBoundingClientRect: () => bounds
  }) as HTMLElement;

const fakeRoot = (bounds: DOMRect, elements: readonly HTMLElement[]): HTMLElement =>
  ({
    querySelectorAll: () => elements,
    getBoundingClientRect: () => bounds
  }) as unknown as HTMLElement;

test("measureAnnotatedEquationMotionTokens reads data-kp-motion-id boxes", () => {
  const xElement = fakeElement({
    motionId: "lhs.x",
    text: "x",
    bounds: rect(120, 80, 10, 18)
  });
  const equalsElement = fakeElement({
    motionId: "equals",
    text: "=",
    bounds: rect(140, 80, 12, 18)
  });
  const root = fakeRoot(rect(100, 60, 100, 80), [xElement, equalsElement]);

  assert.deepEqual(measureAnnotatedEquationMotionTokens(root), [
    {
      motionId: "lhs.x",
      text: "x",
      rect: { left: 120, top: 80, width: 10, height: 18 },
      localRect: { left: 20, top: 20, width: 10, height: 18 },
      element: xElement
    },
    {
      motionId: "equals",
      text: "=",
      rect: { left: 140, top: 80, width: 12, height: 18 },
      localRect: { left: 40, top: 20, width: 12, height: 18 },
      element: equalsElement
    }
  ]);
});

test("measureAnnotatedEquationMotionTokens rejects duplicate motion ids", () => {
  const root = fakeRoot(rect(0, 0, 100, 80), [
    fakeElement({
      motionId: "lhs.x",
      text: "x",
      bounds: rect(10, 20, 10, 18)
    }),
    fakeElement({
      motionId: "lhs.x",
      text: "x",
      bounds: rect(30, 20, 10, 18)
    })
  ]);

  assert.throws(
    () => measureAnnotatedEquationMotionTokens(root),
    /Duplicate equation motion id lhs.x/
  );
});

test("measureAnnotatedEquationMotionTokens ignores blank ids and normalizes whitespace", () => {
  const keptElement = fakeElement({
    motionId: " rhs.sum ",
    text: "  7\n   +\t3  ",
    bounds: rect(25, 30, 20, 18)
  });
  const root = fakeRoot(rect(10, 20, 100, 80), [
    fakeElement({
      text: "missing",
      bounds: rect(15, 30, 20, 18)
    }),
    fakeElement({
      motionId: "   ",
      text: "blank",
      bounds: rect(20, 30, 20, 18)
    }),
    keptElement
  ]);

  assert.deepEqual(measureAnnotatedEquationMotionTokens(root), [
    {
      motionId: "rhs.sum",
      text: "7 + 3",
      rect: { left: 25, top: 30, width: 20, height: 18 },
      localRect: { left: 15, top: 10, width: 20, height: 18 },
      element: keptElement
    }
  ]);
});
