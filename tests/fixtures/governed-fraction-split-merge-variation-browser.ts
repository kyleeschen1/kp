import katex from "katex";

import {
  sampleKpAnimationRuntimeFrame
} from "../../src/animation/runtime-sampler.ts";
import {
  createKpGovernedFractionSplitMergeVariation
} from "../../src/authoring/governed-fraction-split-merge-variation.ts";
import {
  createKpEquationFontReadiness
} from "../../src/rendering/equation-font-readiness.ts";
import {
  settleAndObserveKpNativeKatexRenderedScene
} from "../../src/rendering/native-katex-rendered-scene.ts";
import {
  kpNativeKatexFeaturePack
} from "../../src/rendering/native-katex-feature-pack-implementation.ts";
import {
  bindKpNumeratorSplitMergeStructuralAnchors,
  createKpNumeratorSplitMergeSelectorAnnotatedLatex
} from "../../src/rendering/numerator-split-merge-selector-annotated-latex.ts";
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

interface BrowserSessionEvidence {
  readonly transitionId: string;
  readonly sessionKind: string;
  readonly sessionMode: string;
  readonly lifecycles: readonly string[];
  readonly trackCount: number;
  readonly noFade: boolean;
  readonly statelessSeek: boolean;
  readonly visualOwner: string;
  readonly materialOwnerCount: number;
}

const fixture = createKpGovernedFractionSplitMergeVariation();
const fontReadiness = createKpEquationFontReadiness(document);
await fontReadiness.whenReady();
const split = await createBrowserSession(0.25, "split");
const merge = await createBrowserSession(0.75, "merge");
const evidence = Object.freeze({
  fixtureId: fixture.id,
  constructionKind: fixture.compilation.kind,
  equalityCertificate: fixture.equalityCertificate,
  sessions: Object.freeze([split, merge])
});

Object.assign(window, {
  __kpGovernedFractionVariationEvidence: evidence
});
document.querySelector<HTMLOutputElement>(
  "[data-kp-variation-status]"
)!.textContent = "Two canonical renderer sessions ready";
document.querySelector<HTMLElement>(
  "[data-kp-governed-fraction-variation]"
)!.dataset["kpReady"] = "true";

async function createBrowserSession(
  progress: number,
  name: "split" | "merge"
): Promise<BrowserSessionEvidence> {
  const animation = fixture.authority.animation;
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: `runtime.fixture.${name}`,
    animation,
    direction: "forward",
    progress
  });
  const renderPlan = projectKpReaderEquationRenderPlan({
    animation,
    runtimeFrame
  });
  const materialPlan = compileKpReaderEquationMaterialPlan(renderPlan);
  const transition = renderPlan.transitions[0]!;
  const stage = document.querySelector<HTMLElement>(
    `[data-kp-variation-stage="${name}"]`
  )!;
  prepareStage(stage);
  const sourceRoot = stage.querySelector<HTMLElement>("[data-source]")!;
  const targetRoot = stage.querySelector<HTMLElement>("[data-target]")!;
  const sourceState = requireObject(transition.source[0]!.objectId);
  const targetState = requireObject(transition.target[0]!.objectId);
  renderState(sourceRoot, sourceState);
  renderState(targetRoot, targetState);
  await document.fonts.ready;
  await nextFrame();
  await nextFrame();
  const source = await settleAndObserveKpNativeKatexRenderedScene({
    endpoint: "source",
    stage,
    root: sourceRoot,
    semanticEntityId: sourceState.id,
    presentationGroupId: `fixture.${name}.source`,
    fontReadiness
  });
  const target = await settleAndObserveKpNativeKatexRenderedScene({
    endpoint: "target",
    stage,
    root: targetRoot,
    semanticEntityId: targetState.id,
    presentationGroupId: `fixture.${name}.target`,
    fontReadiness
  });
  const session = createKpReaderEquationSceneCompositorSession({
    renderPlan,
    materialPlan,
    transitionId: transition.id,
    nativeKatex: kpNativeKatexFeaturePack,
    measurementIdentity: {
      revision: 1,
      coordinateSpaceId: `fixture.${name}.stage`
    },
    source,
    target
  });
  const first = session.sample(0.42);
  session.sample(0.83);
  const rewound = session.sample(0.42);
  const ownership = session.apply(0.5);
  return Object.freeze({
    transitionId: transition.id,
    sessionKind: session.kind,
    sessionMode: session.mode,
    lifecycles: Object.freeze([...new Set(
      session.tracks.map(({ lifecycle }) => lifecycle)
    )]),
    trackCount: session.tracks.length,
    noFade: session.tracks
      .filter(({ lifecycle }) =>
        lifecycle === "persist" ||
        lifecycle === "split" ||
        lifecycle === "merge"
      )
      .every((track) =>
        [0, 0.25, 0.5, 0.75, 1].every((sample) => {
          const frame = session.sample(sample).find(
            ({ trackId }) => track.id === trackId
          );
          return frame?.opacity === 1;
        })
      ),
    statelessSeek: JSON.stringify(first) === JSON.stringify(rewound),
    visualOwner: ownership.visualOwner,
    materialOwnerCount: stage.querySelectorAll(
      '[data-kp-equation-material-owner-id^="native-scene-owner."]'
    ).length
  });
}

function prepareStage(stage: HTMLElement): void {
  stage.innerHTML = `
    <div data-source></div>
    <div data-target></div>
    <div data-kp-editor-equation-material-layer aria-hidden="true"></div>
  `;
}

function renderState(
  root: HTMLElement,
  state: KpSemanticAssetObject
): void {
  const projection = createKpNumeratorSplitMergeSelectorAnnotatedLatex(state);
  if (projection === undefined) {
    throw new Error(`State ${state.id} has no fraction presentation.`);
  }
  katex.render(projection.annotated.annotatedLatex, root, {
    displayMode: true,
    throwOnError: true,
    strict: false,
    trust: ({ command }) => command === "\\htmlData"
  });
  bindKpNumeratorSplitMergeStructuralAnchors({ root, state });
  projection.annotated.annotations.forEach((annotation) => {
    const element = root.querySelector<HTMLElement>(
      `[data-kp-motion-id="${CSS.escape(annotation.motionId)}"]`
    );
    if (element === null) {
      throw new Error(`Rendered state is missing ${annotation.selectorId}.`);
    }
    bindOwnership(element, annotation.selectorId);
  });
  root.querySelectorAll<HTMLElement>("[data-kp-reader-selector-id]")
    .forEach((element) => {
      const selectorId = element.dataset["kpReaderSelectorId"];
      if (selectorId !== undefined) bindOwnership(element, selectorId);
    });
}

function bindOwnership(element: HTMLElement, selectorId: string): void {
  element.dataset["kpSemanticEntityId"] = selectorId;
  element.dataset["kpPresentationGroupId"] = `group.${selectorId}`;
}

function requireObject(id: string): KpSemanticAssetObject {
  const object = fixture.authority.animation.bundle.objects.find(
    (candidate) => candidate.id === id
  );
  if (object === undefined) throw new Error(`Missing object ${id}.`);
  return object;
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}
