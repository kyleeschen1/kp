import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createFractionSimplificationAnimationAsset } from "../src/animation/fraction-adapter.ts";

import {
  createLinearSolveTeacherZeroAnimationAsset
} from "../src/animation/linear-solve-adapter.ts";
import {
  createKpFractionCompositionEquationAnimationAsset
} from "../src/animation/fraction-composition-equation-adapter.ts";
import {
  createNumeratorSplitMergeEquationAnimationAsset
} from "../src/animation/numerator-split-merge-equation-adapter.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import {
  createKpNativeKatexRenderedSceneObservation,
  type KpNativeKatexPaintAtomObservation
} from "../src/rendering/native-katex-rendered-scene.ts";
import {
  kpNativeKatexFeaturePack
} from "../src/rendering/native-katex-feature-pack-implementation.ts";
import {
  compileKpReaderEquationMaterialPlan,
  projectKpReaderEquationRenderPlan,
  projectKpReaderEquationTransitionPresentation
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
const fakeClassList = () => {
  const values = new Set<string>();
  return {
    add: (value: string) => values.add(value),
    contains: (value: string) => values.has(value),
    remove: (value: string) => values.delete(value),
    toggle: (value: string, force?: boolean) => {
      if (force === true) values.add(value);
      else if (force === false) values.delete(value);
      else if (values.has(value)) values.delete(value);
      else values.add(value);
    },
    [Symbol.iterator]: () => values[Symbol.iterator]()
  };
};
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
    : owner,
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
  attributes: [],
  classList: fakeClassList(),
  childNodes: [{ nodeType: 3, textContent: "x" }],
  children: [],
  closest: () => null,
  dataset: {} as Record<string, string>,
  ownerDocument,
  parentElement: undefined as unknown,
  querySelectorAll: () => [],
  style: fakeStyle(),
  textContent: "x",
  getBoundingClientRect: () => ownerRectProvider()
};
const ownerStyle = fakeStyle();
const owner = {
  closest: () => null,
  dataset: {} as Record<string, string>,
  firstElementChild: visual,
  ownerDocument,
  parentElement: undefined as unknown,
  replaceChildren: (nextVisual: typeof visual) => {
    owner.firstElementChild = nextVisual;
  },
  remove: () => undefined,
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
  append: () => undefined,
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
  classList: fakeClassList(),
  cloneNode: () => visual,
  // Paint-fidelity checks walk the native subtree and its direct text ink.
  childNodes: [{ nodeType: 3, textContent: "x" }],
  children: [],
  closest: () => null,
  dataset: {},
  getBoundingClientRect: () => sourceRect,
  parentElement: wrapper,
  querySelectorAll: () => [],
  style: fakeStyle(),
  textContent: "x"
} as unknown as HTMLElement;
const targetElement = {
  ownerDocument,
  classList: fakeClassList(),
  cloneNode: () => visual,
  childNodes: [{ nodeType: 3, textContent: "x" }],
  children: [],
  closest: () => null,
  dataset: {},
  getBoundingClientRect: () => targetRect,
  parentElement: wrapper,
  querySelectorAll: () => [],
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
  const animation = createLinearSolveTeacherZeroAnimationAsset();
  const index = animation.transformations.findIndex(
    ({ id }) => id === "transform.linear-solve.expose-left-zero"
  );
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: "runtime.reader.compositor",
    animation,
    direction: "forward",
    progress: (index + 0.5) / animation.transformations.length
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
  semanticEntityIds: readonly string[],
  labels: readonly string[] = []
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
        visualKey: `glyph:${labels[index] ?? "2"}`,
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

function evaluationPlans() {
  const animation = createKpFractionCompositionEquationAnimationAsset();
  const index = animation.transformations.findIndex(
    ({ transformType }) => transformType === "simplifyConstantProduct"
  );
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    animation,
    direction: "forward",
    progress: (index + 0.5) / animation.transformations.length
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

test("explicit static plans clamp the canonical session to native checkpoints", () => {
  const { renderPlan, materialPlan } = plans();
  const transition = renderPlan.transitions[0]!;
  const presentation = projectKpReaderEquationTransitionPresentation(
    transition.presentationPlan
  );
  const xRelation = transition.relations.find(
    ({ recordId }) => recordId === "x-persists"
  )!;
  assert.equal(
    presentation.staticCheckpoint?.reason,
    "missing-verified-plan"
  );
  const cancelledEntityIds = [...new Set(transition.relations
    .filter(({ recordId }) => recordId !== xRelation.recordId)
    .flatMap(({ sourceSelectorIds }) => sourceSelectorIds))];
  const session = createKpReaderEquationSceneCompositorSession({
    renderPlan,
    materialPlan,
    transitionId: transition.id,
    nativeKatex: kpNativeKatexFeaturePack,
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
  assert.equal(session.mode, "checkpoint-settlement");
  assert.equal(session.presentationMode, "explicit-static-checkpoint");
  assert.ok(session.tracks.length >= 3);
  const persistent = session.tracks.find(
    ({ lifecycle }) => lifecycle === "persist"
  )!;
  assert.equal(persistent.sourceAtomId, "atom.source.fraction.0");
  assert.equal(persistent.targetAtomId, "atom.target.fraction.0");
  assert.equal(
    session.sample(0.5).find(({ trackId }) => trackId === persistent.id)
      ?.rect.left,
    10
  );
  assert.equal(session.apply(0.5).visualOwner, "source-native");
  assert.equal(session.apply(1).visualOwner, "target-native");
  assert.equal(
    stage.dataset["kpReaderEquationStaticCheckpointReason"],
    "missing-verified-plan"
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
      nativeKatex: kpNativeKatexFeaturePack,
      measurementIdentity,
      source: scene("source", xRelation.sourceSelectorIds[0]!),
      target: scene("target", xRelation.targetSelectorIds[0]!)
    }),
    /does not belong/
  );
});

test("numeric factor decomposition never loses its source before descendants own paint", () => {
  const animation = createFractionSimplificationAnimationAsset({ familyId: "generated.fraction-expression", id: "test.numeric-fission", title: "Reduce", numerator: 3, denominator: 6, simplifiedNumerator: 1, simplifiedDenominator: 2 });
  for (const direction of ["forward", "rewind"] as const) {
    const renderPlan = projectKpReaderEquationRenderPlan({ animation, runtimeFrame: sampleKpAnimationRuntimeFrame({ animation, direction, progress: direction === "forward" ? .12 : .88 }) });
    const transition = renderPlan.transitions[0]!;
    const ids = (side: "source" | "target") => [...new Set(transition.relations.flatMap(r => side === "source" ? r.sourceSelectorIds : r.targetSelectorIds))];
    const label = (id: string) => animation.bundle.objects.flatMap(o => o.selectors).find(s => s.id === id)!.label!;
    const session = createKpReaderEquationSceneCompositorSession({ renderPlan,
      materialPlan: compileKpReaderEquationMaterialPlan(renderPlan), transitionId: transition.id,
      nativeKatex: kpNativeKatexFeaturePack, measurementIdentity,
      source: fractionScene("source", ids("source"), ids("source").map(label)),
      target: fractionScene("target", ids("target"), ids("target").map(label)) });
    const sourceSide = direction === "forward" ? "source" : "target";
    const targetSide = direction === "forward" ? "target" : "source";
    const sixIndex = ids(sourceSide).findIndex(id => label(id) === "6");
    const six = session.tracks.find(t => t.visualAtomId === `atom.${sourceSide}.fraction.${sixIndex}`)!;
    const twoIndex = ids(targetSide).findIndex(id => label(id) === "2");
    const two = session.tracks.find(t => t.visualAtomId === `atom.${targetSide}.fraction.${twoIndex}`)!;
    assert.ok(six); assert.ok(two);
    for (const progress of [.2, .5, .8, .5, .2]) {
      const frames = session.sample(direction === "forward" ? progress : 1 - progress);
      const source = frames.find(f => f.trackId === six.id)!;
      const descendant = frames.find(f => f.trackId === two.id)!;
      assert.equal(source.opacity + descendant.opacity, 1, "exclusive handoff has neither a blank nor a crossfade");
      assert.equal(source.opacity, progress < .36 ? 1 : 0);
    }
  }
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
      nativeKatex: kpNativeKatexFeaturePack,
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

test("reader sessions expose the exact executed program and phase telemetry", () => {
  const { renderPlan, materialPlan } = evaluationPlans();
  const transition = renderPlan.transitions[0]!;
  const sourceIds = [...new Set(transition.relations.flatMap(
    ({ sourceSelectorIds }) => sourceSelectorIds
  ))];
  const targetIds = [...new Set(transition.relations.flatMap(
    ({ targetSelectorIds }) => targetSelectorIds
  ))];
  const session = createKpReaderEquationSceneCompositorSession({
    renderPlan,
    materialPlan,
    transitionId: transition.id,
    nativeKatex: kpNativeKatexFeaturePack,
    measurementIdentity,
    source: fractionScene("source", sourceIds),
    target: fractionScene("target", targetIds)
  });

  const execution = session.executableProgramExecution;
  assert.equal(
    execution?.programId,
    "kp.executable-program.operation-evaluation"
  );
  assert.equal(execution?.programVersion, "1.0.0");
  assert.equal(execution?.programKind, "operation-evaluation");
  assert.equal(
    stage.dataset["kpExecutedMotifProgramId"],
    execution?.programId
  );
  const telemetry = execution!.samplePhaseTelemetry(0.45);
  session.apply(0.45);
  assert.equal(
    stage.dataset["kpExecutedMotifProgramPhase"],
    telemetry.activePhaseId
  );
  assert.deepEqual(
    execution!.samplePhaseTelemetry(0.45),
    telemetry
  );
});

test("the canonical adapter exhaustively dispatches the closed reader plan union", async () => {
  const source = await readFile(
    "src/reader/renderers/equation-scene-compositor-adapter.ts",
    "utf8"
  );
  const dispatch = source.slice(
    source.indexOf("function dispatchReaderEquationPresentation"),
    source.indexOf("type KpReaderEquationRoutingFields")
  );
  const cases = [...dispatch.matchAll(/case "([^"]+)"/g)]
    .map((match) => match[1])
    .sort();

  assert.deepEqual(cases, [
    "default-motion",
    "distribution",
    "explicit-static-checkpoint",
    "factoring",
    "fraction-material",
    "operation-choreography",
    "structural-succession",
    "successor-synthesis",
    "visual-motif"
  ]);
  assert.equal(
    (source.match(/switch \(plan\.planKind\)/g) ?? []).length,
    1
  );
  assert.equal(
    source.includes("projectKpReaderEquationTransitionPresentation"),
    false
  );
  assert.match(dispatch, /default:\s*[\s\S]*unreachablePresentationPlan/);
});

test("the reader compiles once and renders that nominal scene plan once", async () => {
  const source = await readFile(
    "src/reader/renderers/equation-scene-compositor-adapter.ts",
    "utf8"
  );
  const session = source.slice(
    source.indexOf("export function createKpReaderEquationSceneCompositorSession"),
    source.indexOf("function prepareReaderEquationScene")
  );

  assert.equal(
    (session.match(/\.compose\.compileScenePlan\(/gu) ?? []).length,
    1
  );
  assert.equal(
    (session.match(/\.compose\.createSession\(/gu) ?? []).length,
    1
  );
  assert.match(
    session,
    /const rendererReadyPlan = [\s\S]*?createSession\(\s*rendererReadyPlan\s*\)/u
  );
  assert.doesNotMatch(
    session,
    /createSession\(\s*\{/u
  );
});
