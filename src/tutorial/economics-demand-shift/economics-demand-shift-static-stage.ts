import {
  sampleKpSupplyDemandEquilibriumFrame
} from "../../../domains/economics/supply-demand-equilibrium-frame.ts";
import {
  createKpSupplyDemandEquilibriumModel
} from "../../../domains/economics/supply-demand-equilibrium-model.ts";
import {
  createEconomicsEquilibriumAnimationAsset
} from "../../animation/economics-equilibrium-adapter.ts";
import {
  createKpEditorGraphSvgViewportModel,
  renderKpEditorGraphSvgViewportStaticShell
} from "../../editor/graph-svg-viewport-lifecycle.ts";
import {
  kpEconomicsGraphPlotInsets,
  kpEconomicsGraphPresentationProfile,
  renderKpEconomicsEquilibriumStaticContent
} from "../../rendering/economics-equilibrium-svg.ts";
import {
  renderKpEconomicsRetainedInlineLatex
} from "../../rendering/economics-equilibrium-retained-math.ts";

export function renderKpEconomicsDemandShiftStaticStage(): string {
  const model = createKpSupplyDemandEquilibriumModel();
  const animation = createEconomicsEquilibriumAnimationAsset(model);
  const viewport = createKpEditorGraphSvgViewportModel(animation);
  const frame = sampleKpSupplyDemandEquilibriumFrame({
    model,
    progress: { numerator: "0", denominator: "1" }
  });
  const contentHtml = renderKpEconomicsEquilibriumStaticContent({
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
  return `<figure class="kp-economics-static-publication__stage" data-kp-economics-static-stage data-kp-economics-static-stage-state="initial">
    <div class="kp-economics-static-publication__stage-slot" data-kp-economics-static-stage-slot>${svg}</div>
    <figcaption>Initial supply and demand equilibrium before demand increases.</figcaption>
  </figure>`;
}
