import assert from "node:assert/strict";
import test from "node:test";

import { measureKpEquationTransitionGeometry } from "../src/rendering/equation-motion-dom.ts";
import { createKpEquationTransitionIr } from "../src/domain-ir/public-api.ts";
import { createKpSelectorAnnotatedLatex } from "../src/rendering/selector-annotated-latex.ts";

const rect = (left: number, top: number, width: number, height: number) =>
  ({ left, top, width, height }) as DOMRect;
const element = (motionId: string, bounds: DOMRect) => ({
  dataset: { kpMotionId: motionId },
  textContent: motionId,
  getBoundingClientRect: () => bounds
}) as unknown as HTMLElement;
const root = (bounds: DOMRect, elements: readonly HTMLElement[]) => ({
  getBoundingClientRect: () => bounds,
  querySelectorAll: () => elements
}) as unknown as HTMLElement;

test("measureKpEquationTransitionGeometry measures identity and fan-in groups", () => {
  const sourceAnnotated = createKpSelectorAnnotatedLatex({
    id: "before",
    expectedSelectorIds: ["x", "seven", "minus-three"],
    segments: [
      { kind: "selector", selectorId: "x", latex: "x" },
      { kind: "selector", selectorId: "seven", latex: "7" },
      { kind: "selector", selectorId: "minus-three", latex: "-3" }
    ]
  });
  const targetAnnotated = createKpSelectorAnnotatedLatex({
    id: "after",
    expectedSelectorIds: ["x", "four"],
    segments: [
      { kind: "selector", selectorId: "x", latex: "x" },
      { kind: "selector", selectorId: "four", latex: "4" }
    ]
  });
  const ir = createKpEquationTransitionIr({
    id: "transition.combine",
    transformationId: "transform.combine",
    transformType: "simplify",
    title: "Combine constants",
    source: [{ objectId: "before", latex: "x=7-3", selectors: [
      { id: "x", kind: "semantic" },
      { id: "seven", kind: "semantic" },
      { id: "minus-three", kind: "semantic" }
    ] }],
    target: [{ objectId: "after", latex: "x=4", selectors: [
      { id: "x", kind: "semantic" },
      { id: "four", kind: "semantic" }
    ] }],
    correspondenceMap: { id: "combine", records: [
      { id: "x", relation: "identity", sourceSelectorIds: ["x"], targetSelectorIds: ["x"], summary: "x persists" },
      { id: "constants", relation: "fan-in", sourceSelectorIds: ["seven", "minus-three"], targetSelectorIds: ["four"], summary: "constants merge" }
    ] }
  });
  const geometry = measureKpEquationTransitionGeometry({
    ir,
    sourceAnnotated: [sourceAnnotated],
    targetAnnotated: [targetAnnotated],
    sourceRoot: root(rect(100, 50, 200, 40), [
      element("before.x", rect(110, 60, 10, 20)),
      element("before.seven", rect(180, 60, 10, 20)),
      element("before.minus-three", rect(200, 60, 20, 20))
    ]),
    targetRoot: root(rect(100, 50, 200, 40), [
      element("after.x", rect(130, 60, 10, 20)),
      element("after.four", rect(190, 60, 10, 20))
    ])
  });

  assert.deepEqual(geometry.relations[0]?.delta, { x: 20, y: 0, scaleX: 1, scaleY: 1 });
  assert.deepEqual(geometry.relations[1]?.source?.bounds, { left: 80, top: 10, width: 40, height: 20 });
  assert.deepEqual(geometry.relations[1]?.target?.bounds, { left: 90, top: 10, width: 10, height: 20 });
});

test("measureKpEquationTransitionGeometry rejects unmeasured semantic selectors", () => {
  const annotated = createKpSelectorAnnotatedLatex({
    id: "single",
    expectedSelectorIds: ["x"],
    segments: [{ kind: "selector", selectorId: "x", latex: "x" }]
  });
  const ir = createKpEquationTransitionIr({
    id: "transition.missing-measurement",
    transformationId: "transform.missing-measurement",
    transformType: "identity",
    title: "Identity",
    source: [{ objectId: "source", latex: "x", selectors: [{ id: "x", kind: "semantic" }] }],
    target: [{ objectId: "target", latex: "x", selectors: [{ id: "x", kind: "semantic" }] }],
    correspondenceMap: { id: "identity", records: [{
      id: "x", relation: "identity", sourceSelectorIds: ["x"], targetSelectorIds: ["x"], summary: "x persists"
    }] }
  });

  assert.throws(() => measureKpEquationTransitionGeometry({
    ir,
    sourceAnnotated: [annotated],
    targetAnnotated: [annotated],
    sourceRoot: root(rect(0, 0, 20, 20), []),
    targetRoot: root(rect(0, 0, 20, 20), [])
  }), /source motion id single.x was not measured/);
});
