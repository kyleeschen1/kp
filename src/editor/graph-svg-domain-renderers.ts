import type { KpAnimationAsset } from "../animation/asset.ts";
import { sampleLinearMapVectorGraphRuntimeFrame } from
  "../animation/graph-runtime-frame.ts";
import { sampleDerivativeTangentRuntimeFrame } from
  "../animation/derivative-tangent-runtime-frame.ts";
import { sampleIntegralAreaSweepRuntimeFrame } from
  "../animation/integral-area-sweep-runtime-frame.ts";
import { sampleDotProjectionRuntimeFrame } from
  "../animation/dot-projection-runtime-frame.ts";
import {
  sampleKpConstantForceWorkEnergyRuntimeFrame
} from "../animation/constant-force-work-energy-runtime-frame.ts";
import {
  createKpMatrixLinearMapPlan,
  sampleKpMatrixLinearMapFrame,
  type KpMatrixLinearMapAccessibilityMode,
  type KpMatrixLinearMapPlan
} from "../animation/matrix-linear-map-frame.ts";
import {
  economicsEquilibriumAnimationId
} from "../animation/economics-equilibrium-adapter.ts";
import { renderLatexToHtml } from "../rendering/katex-adapter.ts";
import {
  kpPhysicsGraphPresentationProfile,
  renderKpConstantForceWorkEnergyRuntimeContent
} from "../rendering/constant-force-work-energy-svg.ts";
import {
  kpVectorDotProjectionGraphPresentationProfile,
  renderKpVectorDotProjectionRuntimeContent
} from "../rendering/vector-dot-projection-svg.ts";
import {
  kpMatrixLinearMapGraphPresentationProfile,
  renderKpMatrixLinearMapRuntimeContent
} from "../rendering/matrix-linear-map-svg.ts";
import {
  kpEditorAnimationSurfaceAdapterRegistry,
  type KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";
import {
  disposeKpEconomicsGraphSvgViewport,
  kpEconomicsGraphSvgViewportRenderer
} from "./graph-svg-viewport.ts";
import {
  createKpEditorGraphSvgViewportLifecycleAdapter,
  scaleKpEditorGraphCoordinate,
  type KpEditorGraphSvgViewportModel,
  type KpEditorGraphSvgViewportPresentation,
  type KpEditorGraphSvgViewportRenderInput
} from "./graph-svg-viewport-lifecycle.ts";

const matrixLinearMapPlanCache = new Map<string, KpMatrixLinearMapPlan>();

export function createKpEditorGraphSvgDomainAdapter(
  supportedAnimationIds: readonly string[]
): KpEditorAnimationSurfaceAdapter {
  return createKpEditorGraphSvgViewportLifecycleAdapter({
    supportedAnimationIds,
    renderer: {
      presentation: graphSvgViewportPresentation,
      render: renderGraphSvgDomainFrame
    }
  });
}

export function registerKpEditorGraphSvgDomainAdapter(
  supportedAnimationIds: readonly string[]
): () => void {
  return kpEditorAnimationSurfaceAdapterRegistry.register(
    createKpEditorGraphSvgDomainAdapter(supportedAnimationIds)
  );
}

function graphSvgViewportPresentation(input: {
  readonly animation: KpAnimationAsset;
  readonly model: KpEditorGraphSvgViewportModel;
}): KpEditorGraphSvgViewportPresentation {
  if (input.animation.id === economicsEquilibriumAnimationId) {
    return kpEconomicsGraphSvgViewportRenderer.presentation(input);
  }
  const physicsProfile = input.animation.id ===
    "animation.physics.constant-force-work-energy";
  const vectorProjectionProfile = input.animation.id ===
    "animation.dot-projection.basic";
  const matrixLinearMapProfile = input.animation.id ===
    "animation.generated.linear-algebra.matrix-vector.two-by-two";
  const profile = physicsProfile
    ? kpPhysicsGraphPresentationProfile
    : vectorProjectionProfile
      ? kpVectorDotProjectionGraphPresentationProfile
      : matrixLinearMapProfile
        ? kpMatrixLinearMapGraphPresentationProfile
        : undefined;
  return Object.freeze({
    profileId: profile?.id ?? "kp.graph.editor-default.v1",
    ...(profile === undefined ? {} : { languageId: profile.languageId }),
    axes: physicsProfile ? "hidden" : "visible",
    axisMarkers: profile !== undefined
  });
}

function renderGraphSvgDomainFrame(
  input: KpEditorGraphSvgViewportRenderInput
): void {
  if (input.animation.id === economicsEquilibriumAnimationId) {
    kpEconomicsGraphSvgViewportRenderer.render(input);
    return;
  }
  disposeKpEconomicsGraphSvgViewport(input.slot);
  input.content.innerHTML = renderRuntimeContent(
    input.animation,
    input.state,
    input.model,
    graphAccessibilityMode(input.player)
  );
  syncGraphAccessibility(input.svg, input.content);
}

function renderRuntimeContent(
  animation: KpAnimationAsset,
  state: KpEditorGraphSvgViewportRenderInput["state"],
  model: KpEditorGraphSvgViewportModel,
  accessibilityMode: KpMatrixLinearMapAccessibilityMode
): string {
  const point = (coordinates: readonly number[]) => [
    scaleKpEditorGraphCoordinate(
      coordinates[0] ?? 0,
      model.xDomain,
      [36, model.width - 20]
    ),
    scaleKpEditorGraphCoordinate(
      coordinates[1] ?? 0,
      model.yDomain,
      [model.height - 28, 20]
    )
  ] as const;
  const origin = point([0, 0]);

  switch (animation.id) {
    case "animation.generated.linear-algebra.matrix-vector.two-by-two": {
      let plan = matrixLinearMapPlanCache.get(animation.id);
      if (plan === undefined) {
        plan = createKpMatrixLinearMapPlan(animation);
        matrixLinearMapPlanCache.set(animation.id, plan);
      }
      return renderKpMatrixLinearMapRuntimeContent({
        frame: sampleKpMatrixLinearMapFrame({
          plan,
          progress: state.progress,
          direction: state.direction,
          accessibilityMode
        }),
        viewport: model
      });
    }
    case "animation.graph.vector.linear-map-scale": {
      const frame = sampleLinearMapVectorGraphRuntimeFrame({
        animation,
        runtimeFrame: state.runtimeFrame
      });
      const source = point(frame.sourceCoordinates);
      const end = point(frame.currentCoordinates);
      const target = point(frame.targetCoordinates);
      return `<line class="editor-graph-stage__path" x1="${source[0]}" y1="${source[1]}" x2="${target[0]}" y2="${target[1]}" /><line class="editor-graph-stage__vector editor-graph-stage__vector--ghost" data-kp-editor-graph-vector-source x1="${origin[0]}" y1="${origin[1]}" x2="${source[0]}" y2="${source[1]}" marker-end="url(#kp-editor-graph-arrow)" /><line class="editor-graph-stage__vector" data-kp-editor-graph-vector data-kp-editor-graph-vector-coordinates="${frame.currentCoordinates.join(",")}" x1="${origin[0]}" y1="${origin[1]}" x2="${end[0]}" y2="${end[1]}" marker-end="url(#kp-editor-graph-arrow)" />${renderAnnotation(`v(t) = (${frame.currentCoordinates.map(formatNumber).join(", ")})`, model)}`;
    }
    case "animation.derivative-rules.tangent-graph": {
      const frame = sampleDerivativeTangentRuntimeFrame({
        animation,
        runtimeFrame: state.runtimeFrame
      });
      const curve = Array.from({ length: 61 }, (_, index) => {
        const x = -2 + index / 12;
        return point([x, x ** 3]);
      });
      const secant = frame.secantSegment.map(point);
      const tangent = frame.tangentSegment.map(point);
      const anchor = point([frame.anchorX, frame.anchorY]);
      const moving = point([frame.movingX, frame.movingY]);
      return `<polyline class="editor-graph-stage__curve" points="${curve.map((p) => p.join(",")).join(" ")}" />
        <line class="editor-graph-stage__tangent-target" data-kp-editor-graph-tangent-target data-kp-editor-graph-tangent-slope="${frame.tangentSlope}" x1="${tangent[0]![0]}" y1="${tangent[0]![1]}" x2="${tangent[1]![0]}" y2="${tangent[1]![1]}" style="opacity:${0.12 + frame.derivativeRevealProgress * 0.48}" />
        <line class="editor-graph-stage__secant" data-kp-editor-graph-secant data-kp-editor-graph-tangent data-kp-editor-graph-secant-h="${frame.h}" data-kp-editor-graph-secant-slope="${frame.secantSlope}" data-kp-editor-graph-tangent-slope="${frame.secantSlope}" x1="${secant[0]![0]}" y1="${secant[0]![1]}" x2="${secant[1]![0]}" y2="${secant[1]![1]}" />
        <line class="editor-graph-stage__secant-span" data-kp-editor-graph-secant-span x1="${anchor[0]}" y1="${anchor[1]}" x2="${moving[0]}" y2="${moving[1]}" style="opacity:${frame.movingPointOpacity}" />
        <circle class="editor-graph-stage__point editor-graph-stage__point--anchor" data-kp-editor-graph-tangent-point data-kp-editor-graph-anchor-point data-kp-editor-graph-tangent-x="${frame.anchorX}" cx="${anchor[0]}" cy="${anchor[1]}" r="5" />
        <circle class="editor-graph-stage__point editor-graph-stage__point--secant" data-kp-editor-graph-secant-point data-kp-editor-graph-secant-x="${frame.movingX}" cx="${moving[0]}" cy="${moving[1]}" r="5" style="opacity:${frame.movingPointOpacity}" />
        ${renderDerivativeMath(frame, model)}`;
    }
    case "animation.integral-ftc.area-sweep": {
      const frame = sampleIntegralAreaSweepRuntimeFrame({
        animation,
        runtimeFrame: state.runtimeFrame
      });
      const polygon = frame.areaPolygon.map(point);
      const boundBase = point([frame.upperBound, 0]);
      const boundTop = point([frame.upperBound, frame.integrandAtUpperBound]);
      return `<polygon class="editor-graph-stage__area" data-kp-editor-graph-area data-kp-editor-graph-area-value="${frame.accumulatedArea}" points="${polygon.map((p) => p.join(",")).join(" ")}" /><line class="editor-graph-stage__sweep" data-kp-editor-graph-area-bound data-kp-editor-graph-upper-bound="${frame.upperBound}" x1="${boundBase[0]}" y1="${boundBase[1]}" x2="${boundTop[0]}" y2="${boundTop[1]}" /><text class="editor-graph-stage__label" data-kp-editor-graph-area-label x="${model.width - 130}" y="32">Area ${frame.accumulatedArea.toFixed(2)}</text>${renderAnnotation(`b = ${formatNumber(frame.upperBound)} · area = ${formatNumber(frame.accumulatedArea)}`, model)}`;
    }
    case "animation.dot-projection.basic":
      return renderKpVectorDotProjectionRuntimeContent({
        frame: sampleDotProjectionRuntimeFrame({
          animation,
          runtimeFrame: state.runtimeFrame
        }),
        viewport: model
      });
    case "animation.physics.constant-force-work-energy":
      return renderKpConstantForceWorkEnergyRuntimeContent({
        frame: sampleKpConstantForceWorkEnergyRuntimeFrame({
          animation,
          runtimeFrame: state.runtimeFrame
        }),
        viewport: model
      });
    default:
      return "";
  }
}

function syncGraphAccessibility(
  svg: SVGSVGElement,
  content: SVGGElement
): void {
  const description = content.querySelector<SVGDescElement>(
    "[data-kp-physics-nonvisual-summary], " +
    "[data-kp-vector-nonvisual-summary], " +
    "[data-kp-matrix-linear-map-nonvisual-summary]"
  );
  if (description?.id === undefined || description.id.length === 0) {
    svg.removeAttribute("aria-describedby");
    return;
  }
  svg.setAttribute("aria-describedby", description.id);
}

function graphAccessibilityMode(
  player: HTMLElement
): KpMatrixLinearMapAccessibilityMode {
  const value = player.dataset["kpEditorAnimationAccessibilityMode"];
  return value === "reduced-motion" || value === "static" || value === "narrated"
    ? value
    : "full-motion";
}

function renderDerivativeMath(
  frame: ReturnType<typeof sampleDerivativeTangentRuntimeFrame>,
  model: KpEditorGraphSvgViewportModel
): string {
  return `<foreignObject class="editor-graph-stage__math-foreign-object" x="18" y="12" width="356" height="116">
      <div xmlns="http://www.w3.org/1999/xhtml" class="editor-graph-stage__math-panel">
        <div data-kp-editor-graph-function-context data-kp-latex="${escapeHtml(frame.contextLatex)}">${renderLatexToHtml(frame.contextLatex, { displayMode: false })}</div>
        <div data-kp-editor-graph-difference-quotient data-kp-latex="${escapeHtml(frame.differenceQuotientLatex)}">${renderLatexToHtml(frame.differenceQuotientLatex, { displayMode: false })}</div>
        <div data-kp-editor-graph-current-sample data-kp-latex="${escapeHtml(frame.currentSampleLatex)}">${renderLatexToHtml(frame.currentSampleLatex, { displayMode: false })}</div>
      </div>
    </foreignObject>
    <foreignObject class="editor-graph-stage__math-foreign-object" x="18" y="${model.height - 58}" width="${model.width - 36}" height="48">
      <div xmlns="http://www.w3.org/1999/xhtml" class="editor-graph-stage__math-limit" data-kp-editor-graph-derivative-expression data-kp-latex="${escapeHtml(frame.convergenceLatex)}" style="opacity:${0.35 + 0.65 * frame.derivativeRevealProgress}">
        ${renderLatexToHtml(frame.convergenceLatex, { displayMode: false })}
      </div>
    </foreignObject>`;
}

function renderAnnotation(
  value: string,
  model: KpEditorGraphSvgViewportModel
): string {
  return `<text class="editor-graph-stage__annotation" data-kp-editor-graph-annotation x="36" y="${model.height - 10}">${value}</text>`;
}

function formatNumber(value: number): string {
  return Number(value.toFixed(2)).toString();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
