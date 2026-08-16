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
  kpNativeKatexFeaturePack
} from "../../src/rendering/native-katex-feature-pack-implementation.ts";
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
  nativeKatex: kpNativeKatexFeaturePack,
  motionMode: "continuous",
  measurementIdentity: {
    revision: 1,
    coordinateSpaceId: "fixture.radical.stage"
  },
  source,
  target
});
await waitForStructuralSuccession(stage, session);
const first = session.sample(0.37);
session.sample(0.81);
const rewound = session.sample(0.37);
const denseProgress = Array.from({ length: 101 }, (_, index) => index / 100);
const denseSamples = denseProgress.map((progress) => session.sample(progress));
const samples = denseSamples.flat();
const ownership = session.apply(0.5);
const structuralCanvas = stage.querySelector<HTMLCanvasElement>(
  "[data-kp-native-katex-structural-succession]"
);
const structuralOwnersHidden = session.tracks
  .filter(({ lifecycle }) =>
    lifecycle === "introduce" || lifecycle === "eliminate"
  )
  .every((track) => stage.querySelector<HTMLElement>(
    `[data-kp-equation-material-owner-id="native-scene-owner.${
      CSS.escape(track.id)
    }"]`
  )?.style.opacity === "0");
const continuantOwnersOpaque = session.tracks
  .filter(({ lifecycle }) => lifecycle === "persist")
  .every((track) => stage.querySelector<HTMLElement>(
    `[data-kp-equation-material-owner-id="native-scene-owner.${
      CSS.escape(track.id)
    }"]`
  )?.style.opacity === "1");
const sourceAtoms = new Map(source.atoms.map((atom) => [atom.id, atom]));
const targetAtoms = new Map(target.atoms.map((atom) => [atom.id, atom]));
const sourceEndpointFrames = session.sample(0);
const targetEndpointFrames = session.sample(1);
const nearSourceFrames = session.sample(0.001);
const nearTargetFrames = session.sample(0.999);
const endpointTrackGeometryExact = session.tracks.every((track) => {
  const sourceAtom = sourceAtoms.get(track.sourceAtomId ?? "");
  const targetAtom = targetAtoms.get(track.targetAtomId ?? "");
  return (sourceAtom === undefined || rectDelta(track.startRect, sourceAtom.rect) === 0) &&
    (targetAtom === undefined || rectDelta(track.endRect, targetAtom.rect) === 0);
});
const endpointBoxesExact =
  rectDelta(
    unionRects(sourceEndpointFrames.filter(({ opacity }) => opacity === 1)
      .map(({ rect }) => rect)),
    unionRects(source.atoms.map(({ rect }) => rect))
  ) === 0 &&
  rectDelta(
    unionRects(targetEndpointFrames.filter(({ opacity }) => opacity === 1)
      .map(({ rect }) => rect)),
    unionRects(target.atoms.map(({ rect }) => rect))
  ) === 0;
const nearSourceMaximumResidualPx = maximum(nearSourceFrames.flatMap((frame) => {
  const track = session.tracks.find(({ id }) => id === frame.trackId)!;
  return track.startOpacity === 0 ? [] : [rectDelta(frame.rect, track.startRect)];
}));
const nearTargetMaximumResidualPx = maximum(nearTargetFrames.flatMap((frame) => {
  const track = session.tracks.find(({ id }) => id === frame.trackId)!;
  return track.endOpacity === 0 ? [] : [rectDelta(frame.rect, track.endRect)];
}));
session.apply(0.999);
const persistentHandoff = session.tracks.flatMap((track) => {
  if (
    track.lifecycle !== "persist" ||
    track.sourceAtomId === undefined ||
    track.targetAtomId === undefined
  ) return [];
  const owner = stage.querySelector<HTMLElement>(
    `[data-kp-equation-material-owner-id="native-scene-owner.${
      CSS.escape(track.id)
    }"]`
  )!;
  const visual = owner.firstElementChild as HTMLElement;
  const sourceAtom = sourceAtoms.get(track.sourceAtomId)!;
  const targetAtom = targetAtoms.get(track.targetAtomId)!;
  return [{
    styleExact: styleFingerprint(visual) ===
      styleFingerprint(targetAtom.sourceElement),
    baselineResidualPx: Math.abs(
      textBaseline(stage, visual) -
      textBaseline(stage, targetAtom.sourceElement)
    ),
    sourceTargetStyleExact:
      sourceAtom.styleFingerprint === targetAtom.styleFingerprint
  }];
});
const introducedPathGeometryExact = session.tracks
  .filter(({ lifecycle, paintKind }) =>
    lifecycle === "introduce" && paintKind === "path"
  )
  .every((track) => {
    const owner = stage.querySelector<HTMLElement>(
      `[data-kp-equation-material-owner-id="native-scene-owner.${
        CSS.escape(track.id)
      }"]`
    )!;
    const targetPath = targetAtoms.get(track.targetAtomId ?? "")
      ?.sourceElement.querySelector("path");
    return owner.querySelector("path")?.getAttribute("d") ===
      targetPath?.getAttribute("d");
  });
session.apply(0.5);
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
  structuralSuccessionStrategy:
    stage.dataset["kpNativeKatexStructuralSuccessionStrategy"],
  structuralSuccessionStatus:
    stage.dataset["kpNativeKatexStructuralSuccessionStatus"],
  choreographyFidelity:
    stage.dataset["kpNativeKatexChoreographyFidelity"],
  structuralCanvasVisible: structuralCanvas?.style.opacity === "1",
  structuralOwnersHidden,
  continuantOwnersOpaque,
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
  endpointTrackGeometryExact,
  endpointBoxesExact,
  nearSourceMaximumResidualPx,
  nearTargetMaximumResidualPx,
  persistentStyleExact: persistentHandoff.every(
    ({ styleExact, sourceTargetStyleExact }) =>
      styleExact && sourceTargetStyleExact
  ),
  maximumPersistentBaselineResidualPx: maximum(
    persistentHandoff.map(({ baselineResidualPx }) => baselineResidualPx)
  ),
  introducedPathGeometryExact,
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

async function waitForStructuralSuccession(
  stage: HTMLElement,
  session: { apply(progress: number): unknown }
): Promise<void> {
  for (let frame = 0; frame < 120; frame += 1) {
    session.apply(0);
    const status = stage.dataset["kpNativeKatexStructuralSuccessionStatus"];
    if (status === "ready" || status === "unavailable") return;
    await nextFrame();
  }
  throw new Error("Structural succession paint strategy did not settle.");
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

function rectDelta(
  left: { readonly left: number; readonly top: number;
    readonly width: number; readonly height: number },
  right: { readonly left: number; readonly top: number;
    readonly width: number; readonly height: number }
): number {
  return Math.max(
    Math.abs(left.left - right.left),
    Math.abs(left.top - right.top),
    Math.abs(left.width - right.width),
    Math.abs(left.height - right.height)
  );
}

function unionRects(
  rects: readonly { readonly left: number; readonly top: number;
    readonly width: number; readonly height: number }[]
) {
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
}

function maximum(values: readonly number[]): number {
  return values.length === 0 ? 0 : Math.max(...values);
}

function styleFingerprint(element: HTMLElement): string {
  const style = getComputedStyle(element);
  return [
    style.fontFamily,
    style.fontSize,
    style.fontStyle,
    style.fontWeight,
    style.lineHeight,
    style.letterSpacing
  ].join("|");
}

function textBaseline(stage: HTMLElement, element: HTMLElement): number {
  const range = document.createRange();
  range.selectNodeContents(element);
  const rangeRect = range.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const rect = rangeRect.width > 0 && rangeRect.height > 0
    ? rangeRect
    : elementRect;
  const style = getComputedStyle(element);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  context.font = [
    style.fontStyle,
    style.fontWeight,
    style.fontSize,
    style.fontFamily
  ].join(" ");
  const metrics = context.measureText(element.textContent?.trim() ?? "");
  const stageRect = stage.getBoundingClientRect();
  return rect.bottom - stageRect.top - metrics.actualBoundingBoxDescent;
}
