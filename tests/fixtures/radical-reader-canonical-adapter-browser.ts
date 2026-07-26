import katex from "katex";

import {
  sampleKpAnimationRuntimeFrame
} from "../../src/animation/runtime-sampler.ts";
import {
  createKpGovernedRadicalSuccessionFixture
} from "../../src/authoring/governed-radical-succession-fixture.ts";
import { createKpEquationFontReadiness } from "../../src/rendering/equation-font-readiness.ts";
import {
  bindKpExponentRadicalStructuralAnchors,
  createKpExponentRadicalSelectorAnnotatedLatex
} from "../../src/rendering/exponent-radical-selector-annotated-latex.ts";
import {
  settleAndObserveKpNativeKatexRenderedScene
} from "../../src/rendering/native-katex-rendered-scene.ts";
import {
  createKpReaderEquationSceneCompositorSession
} from "../../src/reader/renderers/equation-scene-compositor-adapter.ts";
import {
  compileKpReaderEquationMaterialPlan,
  projectKpReaderEquationRenderPlan
} from "../../src/reader/renderers/public-api.ts";
import type {
  KpSemanticAssetObject
} from "../../src/semantic/asset.ts";

const fixture = createKpGovernedRadicalSuccessionFixture();
const animation = fixture.authority.animation;
const runtimeFrame = sampleKpAnimationRuntimeFrame({
  id: "runtime.fixture.radical-reader-adapter",
  animation,
  direction: "forward",
  progress: 0.5
});
const renderPlan = projectKpReaderEquationRenderPlan({
  animation,
  runtimeFrame
});
const materialPlan = compileKpReaderEquationMaterialPlan(renderPlan);
const transition = renderPlan.transitions[0]!;
const stage = document.querySelector<HTMLElement>(
  "[data-kp-radical-adapter-stage]"
)!;
const sourceRoot = stage.querySelector<HTMLElement>("[data-source]")!;
const targetRoot = stage.querySelector<HTMLElement>("[data-target]")!;
const sourceState = requireObject(transition.source[0]!.objectId);
const targetState = requireObject(transition.target[0]!.objectId);
renderState(sourceRoot, sourceState, "source");
renderState(targetRoot, targetState, "target");

const fontReadiness = createKpEquationFontReadiness(document);
await fontReadiness.whenReady();
await nextFrame();
await nextFrame();
const source = await settleAndObserveKpNativeKatexRenderedScene({
  endpoint: "source",
  stage,
  root: sourceRoot,
  semanticEntityId: sourceState.id,
  presentationGroupId: "fixture.radical.source",
  fontReadiness
});
const target = await settleAndObserveKpNativeKatexRenderedScene({
  endpoint: "target",
  stage,
  root: targetRoot,
  semanticEntityId: targetState.id,
  presentationGroupId: "fixture.radical.target",
  fontReadiness
});
const session = createKpReaderEquationSceneCompositorSession({
  renderPlan,
  materialPlan,
  transitionId: transition.id,
  source,
  target
});
const first = session.sample(0.37);
session.sample(0.81);
const rewound = session.sample(0.37);
const denseProgress = Array.from({ length: 101 }, (_, index) => index / 100);
const denseSamples = denseProgress.map((progress) => session.sample(progress));
const samples = denseSamples.flat();
const ownership = session.apply(0.5);
const lifecycles = Object.freeze([...new Set(
  session.tracks.map(({ lifecycle }) => lifecycle)
)]);
const evidence = Object.freeze({
  fixtureId: fixture.id,
  routeActivated: location.pathname.startsWith("/reader/"),
  renderDiagnostics: renderPlan.diagnostics,
  materialDiagnostics: materialPlan.diagnostics,
  sessionKind: session.kind,
  sessionLifecycle: session.lifecycle,
  sessionMode: session.mode,
  transitionId: transition.id,
  lifecycles,
  trackCount: session.tracks.length,
  sourceAtomCount: source.atoms.length,
  targetAtomCount: target.atoms.length,
  statelessSeek: JSON.stringify(first) === JSON.stringify(rewound),
  finiteFrames: samples.every(({ opacity, rect }) =>
    Number.isFinite(opacity) &&
    [rect.left, rect.top, rect.width, rect.height].every(Number.isFinite)
  ),
  persistentPaintOpaque: session.tracks
    .filter(({ lifecycle }) => lifecycle === "persist")
    .every((track) => denseProgress.every((progress) =>
      session.sample(progress).find(({ trackId }) => track.id === trackId)
        ?.opacity === 1
    )),
  sourceMissingAtomIds: missingAtoms(
    source.atoms.map(({ id }) => id),
    session.tracks.flatMap(({ sourceAtomId }) =>
      sourceAtomId === undefined ? [] : [sourceAtomId]
    )
  ),
  targetMissingAtomIds: missingAtoms(
    target.atoms.map(({ id }) => id),
    session.tracks.flatMap(({ targetAtomId }) =>
      targetAtomId === undefined ? [] : [targetAtomId]
    )
  ),
  monotonicEmergence: session.tracks
    .filter(({ lifecycle }) => lifecycle === "introduce")
    .every((track) => isMonotonic(denseSamples.map((frames) =>
      frames.find(({ trackId }) => track.id === trackId)!.opacity
    ), "ascending")),
  monotonicAbsorption: session.tracks
    .filter(({ lifecycle }) => lifecycle === "eliminate")
    .every((track) => isMonotonic(denseSamples.map((frames) =>
      frames.find(({ trackId }) => track.id === trackId)!.opacity
    ), "descending")),
  reverseTraversalExact: JSON.stringify(denseSamples) === JSON.stringify(
    [...denseProgress].reverse().map((progress) => session.sample(progress))
      .reverse()
  ),
  endpointsSettled: session.apply(0).visualOwner === "source-native" &&
    session.apply(1).visualOwner === "target-native",
  visualOwner: ownership.visualOwner,
  materialOwnerCount: stage.querySelectorAll(
    '[data-kp-equation-material-owner-id^="native-scene-owner."]'
  ).length
});

Object.assign(window, {
  __kpRadicalReaderCanonicalAdapterEvidence: evidence
});
document.querySelector<HTMLElement>(
  "[data-kp-radical-adapter-fixture]"
)!.dataset["kpReady"] = "true";
document.querySelector<HTMLOutputElement>(
  "[data-kp-radical-adapter-status]"
)!.textContent = "Canonical radical adapter session ready";

function renderState(
  root: HTMLElement,
  state: KpSemanticAssetObject,
  endpoint: "source" | "target"
): void {
  const projection = createKpExponentRadicalSelectorAnnotatedLatex({
    objectId: state.id,
    selectors: state.selectors
  });
  if (projection === undefined) {
    throw new Error(`State ${state.id} has no radical presentation.`);
  }
  katex.render(projection.annotatedLatex, root, {
    displayMode: true,
    throwOnError: true,
    strict: false,
    trust: ({ command }) => command === "\\htmlData"
  });
  bindKpExponentRadicalStructuralAnchors({ root, state });
  root.dataset["kpSemanticEntityId"] = state.id;
  root.dataset["kpPresentationGroupId"] =
    `fixture.radical.${endpoint}.state.${state.id}`;
  projection.annotations.forEach((annotation) => {
    const element = root.querySelector<HTMLElement>(
      `[data-kp-motion-id="${CSS.escape(annotation.motionId)}"]`
    );
    if (element === null) {
      throw new Error(`Rendered state is missing ${annotation.selectorId}.`);
    }
    bindOwnership(element, annotation.selectorId, endpoint);
  });
  root.querySelectorAll<HTMLElement>("[data-kp-reader-selector-id]")
    .forEach((element) => {
      const selectorId = element.dataset["kpReaderSelectorId"];
      if (selectorId !== undefined) {
        bindOwnership(element, selectorId, endpoint);
      }
    });
}

function bindOwnership(
  element: HTMLElement,
  selectorId: string,
  endpoint: "source" | "target"
): void {
  element.dataset["kpSemanticEntityId"] = selectorId;
  element.dataset["kpPresentationGroupId"] =
    `fixture.radical.${endpoint}.selector.${selectorId}`;
}

function requireObject(id: string): KpSemanticAssetObject {
  const object = animation.bundle.objects.find(
    (candidate) => candidate.id === id
  );
  if (object === undefined) throw new Error(`Missing object ${id}.`);
  return object;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function missingAtoms(
  expected: readonly string[],
  observed: readonly string[]
): readonly string[] {
  const observedIds = new Set(observed);
  return expected.filter((id) => !observedIds.has(id));
}

function isMonotonic(
  values: readonly number[],
  direction: "ascending" | "descending"
): boolean {
  return values.every((value, index) => {
    const previous = values[index - 1];
    return previous === undefined ||
      (direction === "ascending" ? value >= previous : value <= previous);
  });
}
