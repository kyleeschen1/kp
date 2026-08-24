import {
  createKpGraph2DQuadraticTranslationAnimationAsset,
  KP_GRAPH_2D_QUADRATIC_TRANSLATION_ANIMATION_ID,
  sampleKpGraph2DQuadraticTranslationRuntimeFrame
} from "../animation/graph-2d-quadratic-translation-asset.ts";
import {
  createKpGraph2DQuadraticTranslationSvgRuntimeSession,
  kpGraph2DQuadraticTranslationPresentationProfile,
  type KpGraph2DQuadraticTranslationSvgRuntimeSession,
  type KpGraph2DQuadraticTranslationViewport
} from "../rendering/graph-2d-quadratic-translation-svg.ts";
import { KpGraph2DRuntimeSessionLifecycle } from
  "../rendering/graph-2d-runtime-session.ts";
import {
  createKpEditorGraphSvgViewportLifecycleAdapter,
  type KpEditorGraphSvgViewportRenderInput
} from "./graph-svg-viewport-lifecycle.ts";
import { KP_EDITOR_ANIMATION_DISPOSE_EVENT } from
  "./animation-player-controller.ts";
import type { KpEditorAnimationSurfaceAdapter } from
  "./animation-surface-adapter-registry.ts";
import { kpEditorAnimationSurfaceAdapterRegistry } from
  "./animation-surface-adapter-registry.ts";

const exemplar = createKpGraph2DQuadraticTranslationAnimationAsset();
const runtimeLifecycle = new KpGraph2DRuntimeSessionLifecycle<
  HTMLElement,
  SVGGElement,
  ReturnType<typeof sampleKpGraph2DQuadraticTranslationRuntimeFrame>,
  KpGraph2DQuadraticTranslationViewport,
  KpGraph2DQuadraticTranslationSvgRuntimeSession
>(createKpGraph2DQuadraticTranslationSvgRuntimeSession);

export const KP_EDITOR_GRAPH_2D_QUADRATIC_TRANSLATION_ADAPTER_ID =
  "adapter.graph-2d.quadratic-translation.svg" as const;

const lifecycleAdapter = createKpEditorGraphSvgViewportLifecycleAdapter({
  adapterId: KP_EDITOR_GRAPH_2D_QUADRATIC_TRANSLATION_ADAPTER_ID,
  supportedAnimationIds: [KP_GRAPH_2D_QUADRATIC_TRANSLATION_ANIMATION_ID],
  renderer: {
    presentation() {
      return Object.freeze({
        profileId: kpGraph2DQuadraticTranslationPresentationProfile.id,
        languageId:
          kpGraph2DQuadraticTranslationPresentationProfile.languageId,
        textPolicy: "katex-only" as const,
        axes: "visible" as const,
        axisMarkers: true
      });
    },
    render: renderQuadraticTranslationFrame
  }
});

export const kpEditorGraph2DQuadraticTranslationSurfaceAdapter =
  Object.freeze({
    ...lifecycleAdapter,
    priority: 120
  } satisfies KpEditorAnimationSurfaceAdapter);

export function registerKpEditorGraph2DQuadraticTranslationSurfaceAdapter():
() => void {
  return kpEditorAnimationSurfaceAdapterRegistry.register(
    kpEditorGraph2DQuadraticTranslationSurfaceAdapter
  );
}

function renderQuadraticTranslationFrame(
  input: KpEditorGraphSvgViewportRenderInput
): void {
  const frame = sampleKpGraph2DQuadraticTranslationRuntimeFrame({
    asset: exemplar,
    runtimeFrame: input.state.runtimeFrame
  });
  const result = runtimeLifecycle.apply({
    owner: input.slot,
    content: input.content,
    frame,
    viewport: input.model
  });
  if (result.created) input.player.addEventListener(
    KP_EDITOR_ANIMATION_DISPOSE_EVENT,
    () => runtimeLifecycle.dispose(input.slot),
    { once: true }
  );
  const description = input.content.querySelector<SVGDescElement>(
    "[data-kp-graph2d-quadratic-description]"
  );
  if (description?.id !== undefined && description.id.length > 0) {
    input.svg.setAttribute("aria-describedby", description.id);
  }
  input.slot.dataset["kpGraph2dQuadraticRenderer"] =
    kpGraph2DQuadraticTranslationPresentationProfile.rendererId;
}
