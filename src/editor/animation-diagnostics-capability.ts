import type { KpAnimationAsset } from "../animation/asset.ts";
import {
  createLinearSolveRuntimeVisualFrameSample
} from "../rendering/linear-solve-runtime-visual-sample.ts";
import {
  createKpEditorAnimationDiagnostics,
  renderKpEditorAnimationDiagnostics
} from "./animation-diagnostics.ts";
import {
  hydrateKpEditorAnimationLiveDiagnostics
} from "./animation-live-diagnostics.ts";

export function hydrateKpEditorAnimationDiagnosticsCapability(
  root: ParentNode
): void {
  hydrateKpEditorAnimationLiveDiagnostics(root);
}

export function syncKpEditorAnimationLoadedDiagnostics(input: {
  readonly player: HTMLElement;
  readonly animation: KpAnimationAsset;
  readonly catalog: readonly KpAnimationAsset[];
}): void {
  const current = input.player.closest("[data-kp-editor-animation-library]")
    ?.querySelector<HTMLElement>("[data-kp-editor-animation-diagnostics]");
  if (current === null || current === undefined) return;
  const solveXVisualSample = input.animation.id ===
    "animation.linear-solve.solve-x"
    ? createLinearSolveRuntimeVisualFrameSample({ progress: 0.5 })
    : undefined;
  const diagnostics = createKpEditorAnimationDiagnostics({
    animation: input.animation,
    catalog: input.catalog,
    ...(solveXVisualSample === undefined ? {} : {
      runtimeFrame: solveXVisualSample.runtimeFrame,
      visualFrame: solveXVisualSample.visualFrame
    })
  });
  current.outerHTML = renderKpEditorAnimationDiagnostics(diagnostics);
}
