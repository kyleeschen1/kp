import assert from "node:assert/strict";
import test from "node:test";

import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import {
  createNumeratorSplitMergeEquationAnimationAsset
} from "../src/animation/numerator-split-merge-equation-adapter.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import {
  createKpNativeKatexRenderedSceneObservation,
  type KpNativeKatexPaintAtomObservation
} from "../src/rendering/native-katex-rendered-scene.ts";
import {
  compileKpReaderEquationMaterialPlan,
  projectKpReaderEquationRenderPlan
} from "../src/reader/renderers/public-api.ts";
import {
  createKpReaderEquationSceneCompositorSession
} from "../src/reader/renderers/equation-scene-compositor-adapter.ts";

const sourceRect = { left: 10, top: 20, width: 12, height: 24 };
const targetRect = { left: 90, top: 20, width: 12, height: 24 };
const stageRect = { left: 0, top: 0, width: 200, height: 100 };
const measurementIdentity = {
  revision: 1,
  coordinateSpaceId: "fixture.compositor-stage"
} as const;
type FakeStyle = {
  [key: string]: unknown;
  getPropertyValue(): string;
  removeProperty(): string;
  setProperty(): undefined;
};
const fakeStyle = (): FakeStyle => ({
  getPropertyValue: () => "",
  removeProperty: () => "",
  setProperty: () => undefined
});
const computedProperties: Readonly<Record<string, string>> = {
  "font-family": "KaTeX_Math",
  "font-size": "16px",
  "font-style": "normal",
  "font-weight": "400",
  color: "rgb(0, 0, 0)",
  "letter-spacing": "0px",
  "line-height": "20px",
  "vertical-align": "baseline",
  "background-color": "transparent",
  "box-sizing": "border-box",
  overflow: "visible",
  "clip-path": "none"
};
const fakeComputedStyle = {
  length: 0,
  item: () => "",
  getPropertyPriority: () => "",
  getPropertyValue: (property: string) =>
    computedProperties[property] ?? "0px",
  fontFamily: "KaTeX_Math",
  fontSize: "16px",
  fontStyle: "normal",
  fontWeight: "400",
  lineHeight: "20px",
  verticalAlign: "baseline",
  transform: "none",
  translate: "none",
  scale: "none",
  display: "inline-block",
  position: "relative",
  clipPath: "none",
  opacity: "1",
  borderTopWidth: "0px",
  borderTopStyle: "none",
  borderRightWidth: "0px",
  borderRightStyle: "none",
  borderBottomWidth: "0px",
  borderBottomStyle: "none",
  borderLeftWidth: "0px",
  borderLeftStyle: "none"
};
const wrapper = {
  parentElement: undefined as unknown,
  style: fakeStyle()
};
const ownerDocument = {
  createElement: (tagName: string) => tagName === "canvas"
    ? {
        getContext: () => ({
          font: "",
          measureText: () => ({
            width: 0,
            actualBoundingBoxLeft: 0,
            actualBoundingBoxRight: 0,
            actualBoundingBoxAscent: 0,
            actualBoundingBoxDescent: 0
          })
        })
      }
    : {
        getBoundingClientRect: () => sourceRect,
        remove: () => undefined,
        setAttribute: () => undefined,
        style: fakeStyle()
      },
  createRange: () => {
    let selected: { getBoundingClientRect(): typeof sourceRect } | undefined;
    return {
      selectNodeContents: (
        element: { getBoundingClientRect(): typeof sourceRect }
      ) => {
        selected = element;
      },
      getBoundingClientRect: () =>
        selected?.getBoundingClientRect() ?? sourceRect
    };
  }
};
let ownerRectProvider = () => sourceRect;
const visual = {
  append: () => undefined,
  classList: { toggle: () => undefined },
  childNodes: [{ nodeType: 3, textContent: "x" }],
  children: [],
  closest: () => null,
  ownerDocument,
  parentElement: undefined as unknown,
  querySelectorAll: () => [],
  style: fakeStyle(),
  textContent: "x",
  getBoundingClientRect: () => ownerRectProvider()
};
const ownerStyle = fakeStyle();
const owner = {
  dataset: {} as Record<string, string>,
  firstElementChild: visual,
  ownerDocument,
  parentElement: undefined as unknown,
  style: ownerStyle,
  getBoundingClientRect: () => ({
    left: Number.parseFloat(
      String(ownerStyle["left"] ?? "10")
    ),
    top: Number.parseFloat(
      String(ownerStyle["top"] ?? "20")
    ),
    width: Number.parseFloat(
      String(ownerStyle["width"] ?? "12")
    ),
    height: Number.parseFloat(
      String(ownerStyle["height"] ?? "24")
    )
  }),
  setAttribute: () => undefined
};
ownerRectProvider = owner.getBoundingClientRect;
const materialLayer = {
  querySelectorAll: () => [],
  querySelector: (selector: string) => {
    const ownerId = selector.match(/="([^"]+)"\]/)?.[1] ?? "";
    // The unit fixture starts with an existing inert owner so it exercises
    // session ownership without recreating a browser DOM implementation.
    owner.dataset["kpEquationMaterialVisualRevision"] = `source:${ownerId}`;
    return owner;
  }
};
const stage = {
  ownerDocument,
  dataset: {},
  offsetHeight: stageRect.height,
  offsetWidth: stageRect.width,
  parentElement: null,
  getBoundingClientRect: () => stageRect,
  querySelector: (selector: string) =>
    selector === "[data-kp-editor-equation-material-layer]"
      ? materialLayer
      : materialLayer.querySelector(selector),
  querySelectorAll: () => []
} as unknown as HTMLElement;
const sourceRoot = { ownerDocument, style: fakeStyle() } as unknown as HTMLElement;
const targetRoot = { ownerDocument, style: fakeStyle() } as unknown as HTMLElement;
const sourceElement = {
  ownerDocument,
  classList: { contains: () => false },
  childNodes: [],
  children: [],
  dataset: {},
  getBoundingClientRect: () => sourceRect,
  parentElement: wrapper,
  style: fakeStyle(),
  textContent: "x"
} as unknown as HTMLElement;
const targetElement = {
  ownerDocument,
  classList: { contains: () => false },
  childNodes: [],
  children: [],
  dataset: {},
  getBoundingClientRect: () => targetRect,
  parentElement: wrapper,
  style: fakeStyle(),
  textContent: "x"
} as unknown as HTMLElement;

wrapper.parentElement = stage;
owner.parentElement = stage;
visual.parentElement = owner;
Object.defineProperty(globalThis, "CSS", {
  configurable: true,
  value: { escape: (value: string) => value }
});
Object.defineProperty(globalThis, "HTMLElement", {
  configurable: true,
  value: Object
});
Object.defineProperty(globalThis, "SVGElement", {
  configurable: true,
  value: class {}
});
Object.defineProperty(globalThis, "SVGSVGElement", {
  configurable: true,
  value: class {}
});
Object.defineProperty(globalThis, "Node", {
  configurable: true,
  value: { TEXT_NODE: 3 }
});
Object.defineProperty(globalThis, "getComputedStyle", {
  configurable: true,
  value: () => fakeComputedStyle
});

function plans() {
  const animation = createLinearSolveAnimationAsset();
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: "runtime.reader.compositor",
    animation,
    direction: "forward",
    progress: 0.5
  });
  const renderPlan = projectKpReaderEquationRenderPlan({
    animation,
    runtimeFrame
  });
  return {
    renderPlan,
    materialPlan: compileKpReaderEquationMaterialPlan(renderPlan)
  };
}

function scene(
  endpoint: "source" | "target",
  semanticEntityId: string
) {
  const groupId = `group.${endpoint}.x`;
  const atom: KpNativeKatexPaintAtomObservation = {
    kind: "native-katex-paint-atom-observation",
    lifecycle: "renderer-session",
    id: `atom.${endpoint}.x`,
    endpoint,
    semanticEntityId,
    presentationGroupId: groupId,
    paintKind: "glyph",
    visualKey: "glyph:x",
    sourceElement: endpoint === "source" ? sourceElement : targetElement,
    rect: {
      left: endpoint === "source" ? 10 : 90,
      top: 20,
      width: 12,
      height: 24
    },
    styleFingerprint: "font:KaTeX_Math",
    zOrder: 0,
    fontRevision: 1
  };
  return createKpNativeKatexRenderedSceneObservation({
    endpoint,
    stage,
    root: endpoint === "source" ? sourceRoot : targetRoot,
    atoms: [atom],
    groups: [{
      id: groupId,
      semanticEntityId,
      atomIds: [atom.id],
      rect: atom.rect
    }],
    fontRevision: 1,
    viewportKey: "reader-wide"
  });
}

function fractionScene(
  endpoint: "source" | "target",
  semanticEntityIds: readonly string[]
) {
  const atoms = semanticEntityIds.map((semanticEntityId, index) => {
    const groupId = `group.${endpoint}.fraction.${index}`;
    const rect = {
      left: (endpoint === "source" ? 10 : 90) + index * 24,
      top: 20,
      width: 12,
      height: 24
    };
    return {
      atom: {
        kind: "native-katex-paint-atom-observation" as const,
        lifecycle: "renderer-session" as const,
        id: `atom.${endpoint}.fraction.${index}`,
        endpoint,
        semanticEntityId,
        presentationGroupId: groupId,
        paintKind: "glyph" as const,
        visualKey: "glyph:2",
        sourceElement: endpoint === "source" ? sourceElement : targetElement,
        rect,
        styleFingerprint: "font:KaTeX_Math",
        zOrder: index,
        fontRevision: 1
      },
      group: {
        id: groupId,
        semanticEntityId,
        atomIds: [`atom.${endpoint}.fraction.${index}`],
        rect
      }
    };
  });
  return createKpNativeKatexRenderedSceneObservation({
    endpoint,
    stage,
    root: endpoint === "source" ? sourceRoot : targetRoot,
    atoms: atoms.map(({ atom }) => atom),
    groups: atoms.map(({ group }) => group),
    fontRevision: 1,
    viewportKey: "reader-wide"
  });
}

function fractionPlans(progress: number) {
  const animation = createNumeratorSplitMergeEquationAnimationAsset();
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    animation,
    direction: "forward",
    progress
  });
  const renderPlan = projectKpReaderEquationRenderPlan({
    animation,
    runtimeFrame
  });
  return {
    renderPlan,
    materialPlan: compileKpReaderEquationMaterialPlan(renderPlan)
  };
}

test("reader correspondence creates only a transient compositor session", () => {
  const { renderPlan, materialPlan } = plans();
  const transition = renderPlan.transitions[0]!;
  const xRelation = transition.relations.find(
    ({ recordId }) => recordId === "x-persists"
  )!;
  assert.equal(
    transition.operationChoreography?.kind,
    "counter-orbit-cancellation"
  );
  const cancelledEntityIds =
    transition.operationChoreography?.kind === "counter-orbit-cancellation"
      ? transition.operationChoreography.semanticEntityIds
      : [];
  const session = createKpReaderEquationSceneCompositorSession({
    renderPlan,
    materialPlan,
    transitionId: transition.id,
    measurementIdentity,
    source: fractionScene("source", [
      xRelation.sourceSelectorIds[0]!,
      ...cancelledEntityIds
    ]),
    target: fractionScene("target", [xRelation.targetSelectorIds[0]!])
  });

  assert.equal(session.kind, "native-katex-renderer-session");
  assert.equal(session.lifecycle, "renderer-session");
  assert.deepEqual(session.measurementIdentity, measurementIdentity);
  assert.equal(session.mode, "atom-transit");
  assert.equal(session.tracks.length, 3);
  const persistent = session.tracks.find(
    ({ lifecycle }) => lifecycle === "persist"
  )!;
  assert.equal(persistent.sourceAtomId, "atom.source.fraction.0");
  assert.equal(persistent.targetAtomId, "atom.target.fraction.0");
  assert.equal(
    session.sample(0.5).find(({ trackId }) => trackId === persistent.id)
      ?.rect.left,
    50
  );
});

test("durable reader plans and static projections contain no compositor state", () => {
  const { renderPlan, materialPlan } = plans();
  const serialized = JSON.stringify({ renderPlan, materialPlan });

  for (const forbidden of [
    "renderer-session",
    "scene-compositor",
    "\"tracks\"",
    "\"rect\"",
    "sourceElement",
    "fontRevision",
    "viewportKey"
  ]) {
    assert.equal(serialized.includes(forbidden), false);
  }
  assert.equal("compositorSession" in renderPlan, false);
  assert.equal("compositorSession" in materialPlan, false);
});

test("adapter rejects material plans that are detached from canonical lineage", () => {
  const { renderPlan, materialPlan } = plans();
  const transition = renderPlan.transitions[0]!;
  const xRelation = transition.relations.find(
    ({ recordId }) => recordId === "x-persists"
  )!;
  assert.throws(
    () => createKpReaderEquationSceneCompositorSession({
      renderPlan,
      materialPlan: { ...materialPlan, renderPlanId: "equation-plan.forged" },
      transitionId: transition.id,
      measurementIdentity,
      source: scene("source", xRelation.sourceSelectorIds[0]!),
      target: scene("target", xRelation.targetSelectorIds[0]!)
    }),
    /does not belong/
  );
});

test("the same reader session adapter accepts both fraction fission and fusion plans", () => {
  for (const progress of [0.25, 0.75]) {
    const { renderPlan, materialPlan } = fractionPlans(progress);
    const transition = renderPlan.transitions[0]!;
    const structural = transition.relations.find(({ relation }) =>
      relation === (progress < 0.5 ? "fan-out" : "fan-in")
    )!;
    const session = createKpReaderEquationSceneCompositorSession({
      renderPlan,
      materialPlan,
      transitionId: transition.id,
      measurementIdentity,
      source: fractionScene("source", structural.sourceSelectorIds),
      target: fractionScene("target", structural.targetSelectorIds)
    });

    assert.equal(session.kind, "native-katex-renderer-session");
    assert.equal(session.lifecycle, "renderer-session");
    assert.ok(session.tracks.length >= 1);
    assert.ok(session.tracks.some(({ lifecycle }) =>
      lifecycle === (progress < 0.5 ? "split" : "merge")
    ));
  }
});
