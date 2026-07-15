import {
  validateKpAnimationAsset,
  type KpAnimationAsset
} from "../animation/asset.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../animation/runtime-sampler.ts";
import {
  createKpAnimationVisualFrame,
  type KpAnimationVisualBinding
} from "../animation/visual-frame-adapter.ts";
import {
  createKpAnimationVisualFrameDiagnosticsPanelData,
  type KpAnimationVisualFrameBindingSummary
} from "../animation/visual-frame-diagnostics-panel.ts";

export type KpEditorAnimationDiagnosticSeverity =
  | "info"
  | "warning"
  | "error";

export interface KpEditorAnimationDiagnosticRow {
  readonly id: string;
  readonly scope: "asset" | "runtime" | "binding";
  readonly severity: KpEditorAnimationDiagnosticSeverity;
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface KpEditorAnimationDiagnostics {
  readonly animationId: string;
  readonly status: "passed" | "warning" | "error";
  readonly runtimeFrameId: string;
  readonly phaseId: string;
  readonly progress: number;
  readonly bindingSummary: KpAnimationVisualFrameBindingSummary;
  readonly severityCounts: Readonly<Record<KpEditorAnimationDiagnosticSeverity, number>>;
  readonly rows: readonly KpEditorAnimationDiagnosticRow[];
}

export function createKpEditorAnimationDiagnostics(input: {
  readonly animation: KpAnimationAsset;
  readonly catalog: readonly KpAnimationAsset[];
  readonly progress?: number | undefined;
  readonly bindings?: readonly KpAnimationVisualBinding[] | undefined;
}): KpEditorAnimationDiagnostics {
  const progress = input.progress ?? 0.5;
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    animation: input.animation,
    childAnimations: input.catalog,
    progress
  });
  const visualFrame = createKpAnimationVisualFrame({
    id: `visual.editor.${input.animation.id}.${progress.toFixed(4)}`,
    runtimeFrame,
    bindings: input.bindings ?? []
  });
  const bindingPanel = createKpAnimationVisualFrameDiagnosticsPanelData(
    visualFrame
  );
  const rows: KpEditorAnimationDiagnosticRow[] = [
    ...validateKpAnimationAsset(input.animation).map((issue, index) => ({
      id: `asset.${index}`,
      scope: "asset" as const,
      severity: "error" as const,
      code: "animation-asset.validation",
      path: issue.path,
      message: issue.message
    })),
    ...[
      ...runtimeFrame.phaseDiagnostics,
      ...runtimeFrame.selectorDiagnostics,
      ...runtimeFrame.childDiagnostics
    ].map((diagnostic, index) => ({
      id: `runtime.${index}`,
      scope: "runtime" as const,
      ...diagnostic
    })),
    ...runtimeFrame.diagnostics.map((diagnostic, index) => ({
      id: `runtime-law.${index}`,
      scope: "runtime" as const,
      severity: "error" as const,
      code: "animation-runtime.law-failure",
      path: diagnostic.path,
      message: diagnostic.message
    })),
    ...bindingPanel.diagnostics.map((diagnostic) => ({
      id: diagnostic.id,
      scope: "binding" as const,
      severity: diagnostic.severity,
      code: diagnostic.code,
      path: diagnostic.path,
      message: diagnostic.message
    }))
  ];
  const severityCounts = rows.reduce(
    (counts, row) => ({
      ...counts,
      [row.severity]: counts[row.severity] + 1
    }),
    { info: 0, warning: 0, error: 0 }
  );

  return {
    animationId: input.animation.id,
    status:
      severityCounts.error > 0
        ? "error"
        : severityCounts.warning > 0
          ? "warning"
          : "passed",
    runtimeFrameId: runtimeFrame.id,
    phaseId: runtimeFrame.phase.phaseId,
    progress,
    bindingSummary: bindingPanel.bindingSummary,
    severityCounts,
    rows
  };
}

export function renderKpEditorAnimationDiagnostics(
  diagnostics: KpEditorAnimationDiagnostics
): string {
  const binding = diagnostics.bindingSummary;

  return `
    <details class="editor-animation-diagnostics" data-kp-editor-animation-diagnostics data-kp-editor-animation-diagnostics-status="${diagnostics.status}">
      <summary>
        Diagnostics: ${diagnostics.status}
        <span>${diagnostics.severityCounts.error} errors · ${diagnostics.severityCounts.warning} warnings</span>
      </summary>
      <div class="editor-animation-diagnostics__body">
        <dl>
          <div><dt>Runtime phase</dt><dd>${escapeHtml(diagnostics.phaseId)}</dd></div>
          <div><dt>Render targets bound</dt><dd>${binding.boundRenderTargetCount}/${binding.renderTargetCount}</dd></div>
          <div><dt>Selectors bound</dt><dd>${binding.boundSelectorCount}/${binding.selectorCount}</dd></div>
        </dl>
        <ul>
          ${diagnostics.rows.map((row) => `
            <li data-kp-editor-animation-diagnostic-scope="${row.scope}" data-kp-editor-animation-diagnostic-severity="${row.severity}" data-kp-editor-animation-diagnostic-code="${escapeHtml(row.code)}">
              <strong>${escapeHtml(row.code)}</strong>
              <span>${escapeHtml(row.message)}</span>
            </li>
          `).join("")}
        </ul>
      </div>
    </details>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
