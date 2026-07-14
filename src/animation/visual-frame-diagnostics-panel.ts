import type {
  KpAnimationVisualFrame,
  KpAnimationVisualFrameDiagnostic
} from "./visual-frame-adapter.ts";

export type KpAnimationVisualFrameDiagnosticsPanelStatus =
  | "passed"
  | "warning"
  | "error";

export interface KpAnimationVisualFrameDiagnosticsPanelData {
  readonly id: string;
  readonly kind: "animation-visual-frame-diagnostics-panel";
  readonly visualFrameId: string;
  readonly runtimeFrameId: string;
  readonly animationId: string;
  readonly status: KpAnimationVisualFrameDiagnosticsPanelStatus;
  readonly severityCounts: KpAnimationVisualFrameDiagnosticsSeverityCounts;
  readonly bindingSummary: KpAnimationVisualFrameBindingSummary;
  readonly diagnostics: readonly KpAnimationVisualFrameDiagnosticsPanelRow[];
  readonly searchFields: readonly string[];
}

export interface KpAnimationVisualFrameDiagnosticsSeverityCounts {
  readonly info: number;
  readonly warning: number;
  readonly error: number;
}

export interface KpAnimationVisualFrameBindingSummary {
  readonly nodeCount: number;
  readonly renderTargetCount: number;
  readonly boundRenderTargetCount: number;
  readonly unboundRenderTargetCount: number;
  readonly selectorCount: number;
  readonly boundSelectorCount: number;
  readonly unboundSelectorCount: number;
}

export interface KpAnimationVisualFrameDiagnosticsPanelRow
  extends KpAnimationVisualFrameDiagnostic {
  readonly id: string;
}

export function createKpAnimationVisualFrameDiagnosticsPanelData(
  visualFrame: KpAnimationVisualFrame
): KpAnimationVisualFrameDiagnosticsPanelData {
  const severityCounts = visualFrame.diagnostics.reduce(
    (counts, diagnostic) => ({
      ...counts,
      [diagnostic.severity]: counts[diagnostic.severity] + 1
    }),
    { info: 0, warning: 0, error: 0 }
  );
  const bindingSummary = visualFrameBindingSummary(visualFrame);
  const diagnostics = visualFrame.diagnostics.map((diagnostic, index) => ({
    id: `diagnostic.${visualFrame.id}.${index}`,
    ...diagnostic
  }));
  const status = diagnosticsPanelStatus(severityCounts);

  return {
    id: `diagnostics.${visualFrame.id}`,
    kind: "animation-visual-frame-diagnostics-panel",
    visualFrameId: visualFrame.id,
    runtimeFrameId: visualFrame.runtimeFrameId,
    animationId: visualFrame.animationId,
    status,
    severityCounts,
    bindingSummary,
    diagnostics,
    searchFields: [
      "visual-frame-diagnostics-panel",
      `visual-frame:${visualFrame.id}`,
      `runtime-frame:${visualFrame.runtimeFrameId}`,
      `animation:${visualFrame.animationId}`,
      `visual-diagnostics:${status}`,
      `visual-diagnostics-warning:${severityCounts.warning}`,
      `visual-diagnostics-error:${severityCounts.error}`,
      `visual-bindings-targets:${bindingSummary.boundRenderTargetCount}/${bindingSummary.renderTargetCount}`,
      `visual-bindings-selectors:${bindingSummary.boundSelectorCount}/${bindingSummary.selectorCount}`,
      `visual-bindings-nodes:${bindingSummary.nodeCount}`,
      ...diagnostics.flatMap((diagnostic) => [
        diagnostic.id,
        diagnostic.code,
        diagnostic.path,
        diagnostic.message,
        `visual-diagnostic-severity:${diagnostic.severity}`,
        `visual-diagnostic-code:${diagnostic.code}`
      ])
    ]
  };
}

function visualFrameBindingSummary(
  visualFrame: KpAnimationVisualFrame
): KpAnimationVisualFrameBindingSummary {
  const boundRenderTargetCount = visualFrame.renderTargetVisuals.filter(
    (target) => target.nodeIds.length > 0
  ).length;
  const boundSelectorCount = visualFrame.selectorVisuals.filter(
    (selector) => selector.nodeIds.length > 0
  ).length;

  return {
    nodeCount: visualFrame.nodes.length,
    renderTargetCount: visualFrame.renderTargetVisuals.length,
    boundRenderTargetCount,
    unboundRenderTargetCount:
      visualFrame.renderTargetVisuals.length - boundRenderTargetCount,
    selectorCount: visualFrame.selectorVisuals.length,
    boundSelectorCount,
    unboundSelectorCount:
      visualFrame.selectorVisuals.length - boundSelectorCount
  };
}

function diagnosticsPanelStatus(
  counts: KpAnimationVisualFrameDiagnosticsSeverityCounts
): KpAnimationVisualFrameDiagnosticsPanelStatus {
  if (counts.error > 0) return "error";
  if (counts.warning > 0) return "warning";

  return "passed";
}
