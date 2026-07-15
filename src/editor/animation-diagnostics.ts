import {
  checkKpAnimationAssetSeekRewindLaw,
  validateKpAnimationAsset,
  type KpAnimationAsset
} from "../animation/asset.ts";
import {
  sampleKpAnimationRuntimeFrame,
  type KpAnimationRuntimeFrame
} from "../animation/runtime-sampler.ts";
import {
  createKpAnimationVisualFrame,
  type KpAnimationVisualBinding,
  type KpAnimationVisualFrame
} from "../animation/visual-frame-adapter.ts";
import {
  createKpAnimationVisualFrameDiagnosticsPanelData,
  type KpAnimationVisualFrameBindingSummary
} from "../animation/visual-frame-diagnostics-panel.ts";
import { checkKpAnimationRuntimeRewindClockLaw } from "../animation/runtime-laws.ts";
import type { KpLawCheckResult } from "../semantic/asset-laws.ts";

export type KpEditorAnimationDiagnosticSeverity =
  | "info"
  | "warning"
  | "error";

export interface KpEditorAnimationDiagnosticRow {
  readonly id: string;
  readonly scope: "asset" | "runtime" | "binding" | "playback";
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
  readonly direction: KpAnimationRuntimeFrame["clock"]["direction"];
  readonly progress: number;
  readonly activeTransformationCount: number;
  readonly activeRenderTargetCount: number;
  readonly activeSelectorCount: number;
  readonly bindingSummary: KpAnimationVisualFrameBindingSummary;
  readonly playbackLaws: readonly KpLawCheckResult[];
  readonly severityCounts: Readonly<Record<KpEditorAnimationDiagnosticSeverity, number>>;
  readonly rows: readonly KpEditorAnimationDiagnosticRow[];
}

export function createKpEditorAnimationDiagnostics(input: {
  readonly animation: KpAnimationAsset;
  readonly catalog: readonly KpAnimationAsset[];
  readonly progress?: number | undefined;
  readonly bindings?: readonly KpAnimationVisualBinding[] | undefined;
  readonly runtimeFrame?: KpAnimationRuntimeFrame | undefined;
  readonly visualFrame?: KpAnimationVisualFrame | undefined;
}): KpEditorAnimationDiagnostics {
  const progress = input.progress ?? 0.5;
  const runtimeFrame = input.runtimeFrame ?? sampleKpAnimationRuntimeFrame({
    animation: input.animation,
    childAnimations: input.catalog,
    progress
  });
  const visualFrame = input.visualFrame ?? createKpAnimationVisualFrame({
    id: `visual.editor.${input.animation.id}.${progress.toFixed(4)}`,
    runtimeFrame,
    bindings: input.bindings ?? []
  });
  const bindingPanel = createKpAnimationVisualFrameDiagnosticsPanelData(
    visualFrame
  );
  const playbackLaws = [
    checkKpAnimationAssetSeekRewindLaw(input.animation),
    checkKpAnimationRuntimeRewindClockLaw({
      animation: input.animation,
      childAnimations: input.catalog
    })
  ];
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
    })),
    ...playbackLaws.flatMap((law) =>
      law.failures.map((failure, index) => ({
        id: `playback.${law.lawId}.${index}`,
        scope: "playback" as const,
        severity: "error" as const,
        code: law.lawId,
        path: failure.path,
        message: failure.message
      }))
    )
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
    direction: runtimeFrame.clock.direction,
    progress: runtimeFrame.clock.progress,
    activeTransformationCount: runtimeFrame.activeTransformationIds.length,
    activeRenderTargetCount: runtimeFrame.activeRenderTargets.length,
    activeSelectorCount: runtimeFrame.selectorFrames.length,
    bindingSummary: bindingPanel.bindingSummary,
    playbackLaws,
    severityCounts,
    rows
  };
}

export function renderKpEditorAnimationDiagnostics(
  diagnostics: KpEditorAnimationDiagnostics
): string {
  const binding = diagnostics.bindingSummary;
  const passedPlaybackLaws = diagnostics.playbackLaws.filter(
    (law) => law.passed
  ).length;

  return `
    <details class="editor-animation-diagnostics" data-kp-editor-animation-diagnostics data-kp-editor-animation-diagnostics-status="${diagnostics.status}">
      <summary>
        <span data-kp-editor-animation-diagnostics-label>Diagnostics: ${diagnostics.status}</span>
        <span data-kp-editor-animation-diagnostics-counts>${diagnostics.severityCounts.error} errors · ${diagnostics.severityCounts.warning} warnings</span>
      </summary>
      <div class="editor-animation-diagnostics__body">
        <dl>
          <div><dt>Runtime phase</dt><dd data-kp-editor-animation-diagnostics-phase>${escapeHtml(diagnostics.phaseId)}</dd></div>
          <div><dt>Progress</dt><dd data-kp-editor-animation-diagnostics-progress>${Math.round(diagnostics.progress * 100)}%</dd></div>
          <div><dt>Direction</dt><dd data-kp-editor-animation-diagnostics-direction>${diagnostics.direction}</dd></div>
          <div><dt>Active transforms</dt><dd data-kp-editor-animation-diagnostics-active-transformations>${diagnostics.activeTransformationCount}</dd></div>
          <div><dt>Active targets</dt><dd data-kp-editor-animation-diagnostics-active-targets>${diagnostics.activeRenderTargetCount}</dd></div>
          <div><dt>Active selectors</dt><dd data-kp-editor-animation-diagnostics-active-selectors>${diagnostics.activeSelectorCount}</dd></div>
          <div><dt>Render targets bound</dt><dd data-kp-editor-animation-diagnostics-targets>${binding.boundRenderTargetCount}/${binding.renderTargetCount}</dd></div>
          <div><dt>Selectors bound</dt><dd data-kp-editor-animation-diagnostics-selectors>${binding.boundSelectorCount}/${binding.selectorCount}</dd></div>
          <div><dt>Playback laws</dt><dd data-kp-editor-animation-diagnostics-playback-laws>${passedPlaybackLaws}/${diagnostics.playbackLaws.length}</dd></div>
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
