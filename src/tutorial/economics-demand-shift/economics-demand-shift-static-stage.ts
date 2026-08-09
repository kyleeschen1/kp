import {
  createKpSupplyDemandEquilibriumModel
} from "../../../domains/economics/supply-demand-equilibrium-model.ts";
import {
  createEconomicsEquilibriumAnimationAsset
} from "../../animation/economics-equilibrium-adapter.ts";
import {
  sampleKpEconomicsEquilibriumRuntimeFrame
} from "../../animation/economics-equilibrium-runtime-frame.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../../animation/runtime-sampler.ts";
import {
  createKpEditorGraphSvgViewportModel,
  renderKpEditorGraphSvgViewportStaticShell
} from "../../editor/graph-svg-viewport-lifecycle.ts";
import {
  kpEconomicsGraphPlotInsets,
  kpEconomicsGraphPresentationProfile,
  renderKpEconomicsEquilibriumRuntimeContent
} from "../../rendering/economics-equilibrium-svg.ts";
import {
  renderKpEconomicsRetainedInlineLatex
} from "../../rendering/economics-equilibrium-retained-math.ts";
import {
  kpEconomicsMotionBlocks
} from "./economics-demand-shift-motion-blocks.ts";

export function renderKpEconomicsDemandShiftStaticStage(): string {
  const model = createKpSupplyDemandEquilibriumModel();
  const animation = createEconomicsEquilibriumAnimationAsset(model);
  const viewport = createKpEditorGraphSvgViewportModel(animation);
  const frame = sampleKpEconomicsEquilibriumRuntimeFrame({
    animation,
    model,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      direction: "forward",
      progress: 0
    })
  });
  const contentHtml = renderKpEconomicsEquilibriumRuntimeContent({
    frame,
    viewport,
    renderInlineLatex: renderKpEconomicsRetainedInlineLatex
  });
  const svg = renderKpEditorGraphSvgViewportStaticShell({
    model: viewport,
    presentation: {
      profileId: kpEconomicsGraphPresentationProfile.id,
      languageId: kpEconomicsGraphPresentationProfile.languageId,
      axes: "visible",
      axisMarkers: true,
      xAxisEnd: viewport.width - kpEconomicsGraphPlotInsets.right
    },
    progress: 0,
    direction: "forward",
    title: "Supply and demand equilibrium",
    contentHtml
  });
  const initialBlock = kpEconomicsMotionBlocks[0]!;
  const initialCheckpoint = initialBlock.checkpoints[0]!;
  return `<figure class="kp-economics-static-publication__stage" data-kp-economics-static-stage data-kp-economics-static-stage-state="initial">
    <div class="kp-economics-static-publication__stage-slot" data-kp-economics-static-stage-slot>${svg}</div>
    <figcaption data-kp-economics-stage-caption>Initial supply and demand equilibrium before demand increases.</figcaption>
    <p class="kp-economics-static-publication__accessible-state" data-kp-economics-accessible-state role="status" aria-live="polite" aria-atomic="true">${initialBlock.label}. ${initialCheckpoint.label}. ${initialCheckpoint.description}</p>
  </figure>`;
}
