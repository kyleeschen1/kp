import {
  describeKpAnimationAssetTransformationTree,
  type KpAnimationAsset
} from "../animation/asset.ts";
import { createKpAnimationAssets } from "../animation/catalog.ts";
import { renderLatexToHtml } from "../rendering/katex-adapter.ts";
import {
  projectKpEditorEquationRuntimeFrame,
  type KpEditorEquationRuntimeFrameProjection,
  type KpEditorEquationObjectProjection
} from "./equation-runtime-frame-projection.ts";
import type { KpEditorAnimationPlayerState } from "./animation-player-state.ts";
import {
  kpEditorAnimationSurfaceAdapterRegistry,
  type KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";

const animationCatalog = createKpAnimationAssets();

export interface KpEditorEquationStageFrame {
  readonly projection: KpEditorEquationRuntimeFrameProjection;
  readonly localProgress: number;
  readonly easedProgress: number;
}

export function createKpEditorEquationStageFrame(input: {
  readonly animation: KpAnimationAsset;
  readonly state: KpEditorAnimationPlayerState;
}): KpEditorEquationStageFrame {
  const projection = projectKpEditorEquationRuntimeFrame({
    animation: input.animation,
    runtimeFrame: input.state.runtimeFrame
  });
  const description = describeKpAnimationAssetTransformationTree(input.animation);
  const phaseCount = input.state.direction === "forward"
    ? description.forwardPhases.length
    : description.rewindPhases.length;
  const localProgress = phaseCount <= 1
    ? input.state.progress
    : Math.min(
        1,
        Math.max(
          0,
          input.state.progress * phaseCount - input.state.runtimeFrame.phase.phaseIndex
        )
      );

  return {
    projection,
    localProgress,
    easedProgress: localProgress * localProgress * (3 - 2 * localProgress)
  };
}

export const kpEditorEquationSurfaceAdapter: KpEditorAnimationSurfaceAdapter = {
  id: "editor-animation-surface.equation.katex",
  slotKind: "equation",
  priority: 0,
  supports(state) {
    return state.surface.slotKinds.includes("equation");
  },
  render({ slot, state }) {
    const animation = animationCatalog.find(
      (candidate) => candidate.id === state.animationId
    );
    if (animation === undefined) {
      renderUnavailable(slot, `Missing equation animation ${state.animationId}.`);
      return;
    }

    const frame = createKpEditorEquationStageFrame({ animation, state });
    if (frame.projection.transitions.length === 0) {
      renderUnavailable(
        slot,
        frame.projection.diagnostics[0]?.message ?? "No active equation transition."
      );
      return;
    }

    const frameKey = [
      frame.projection.direction,
      ...frame.projection.transitions.map((transition) => transition.id)
    ].join(":");
    let stage = slot.querySelector<HTMLElement>("[data-kp-editor-equation-stage]");

    if (stage?.dataset["kpEditorEquationFrameKey"] !== frameKey) {
      slot.innerHTML = renderStage(frame, frameKey);
      stage = slot.querySelector<HTMLElement>("[data-kp-editor-equation-stage]");
      if (stage !== null) measureStage(stage);
    }

    if (stage === null) return;

    stage.dataset["kpEditorEquationPhaseId"] = frame.projection.phaseId;
    stage.dataset["kpEditorEquationLocalProgress"] = String(frame.localProgress);
    stage.style.setProperty("--kp-editor-equation-progress", String(frame.easedProgress));
    stage.querySelectorAll<HTMLElement>("[data-kp-editor-equation-source]")
      .forEach((layer) => {
        layer.style.opacity = String(1 - frame.easedProgress);
        layer.style.transform =
          `translateY(${-6 * frame.easedProgress}px) scale(${1 - 0.02 * frame.easedProgress})`;
      });
    stage.querySelectorAll<HTMLElement>("[data-kp-editor-equation-target]")
      .forEach((layer) => {
        layer.style.opacity = String(frame.easedProgress);
        layer.style.transform =
          `translateY(${6 * (1 - frame.easedProgress)}px) scale(${0.98 + 0.02 * frame.easedProgress})`;
      });
  }
};

export function registerKpEditorEquationSurfaceAdapter(): () => void {
  return kpEditorAnimationSurfaceAdapterRegistry.register(
    kpEditorEquationSurfaceAdapter
  );
}

function renderStage(frame: KpEditorEquationStageFrame, frameKey: string): string {
  return `
    <div class="editor-equation-stage" data-kp-editor-equation-stage data-kp-editor-equation-frame-key="${escapeHtml(frameKey)}" data-kp-editor-equation-phase-id="${escapeHtml(frame.projection.phaseId)}" data-kp-editor-equation-local-progress="${frame.localProgress}">
      ${frame.projection.transitions.map((transition) => `
        <article class="editor-equation-stage__transition" data-kp-editor-equation-transition-id="${escapeHtml(transition.id)}" aria-label="${escapeHtml(transition.title)}">
          <div class="editor-equation-stage__layer editor-equation-stage__layer--source" data-kp-editor-equation-source>
            ${renderEquationObjects(transition.source)}
          </div>
          <div class="editor-equation-stage__layer editor-equation-stage__layer--target" data-kp-editor-equation-target>
            ${renderEquationObjects(transition.target)}
          </div>
          <p class="editor-equation-stage__caption">${escapeHtml(transition.title)}</p>
        </article>
      `).join("")}
    </div>
  `;
}

function renderEquationObjects(
  objects: readonly KpEditorEquationObjectProjection[]
): string {
  return objects.map((object) => `
    <div class="editor-equation-stage__object" data-kp-editor-equation-object-id="${escapeHtml(object.id)}">
      ${renderLatexToHtml(object.latex)}
    </div>
  `).join("");
}

function measureStage(stage: HTMLElement): void {
  stage.querySelectorAll<HTMLElement>(".editor-equation-stage__transition")
    .forEach((transition) => {
      const source = transition.querySelector<HTMLElement>(
        "[data-kp-editor-equation-source]"
      );
      const target = transition.querySelector<HTMLElement>(
        "[data-kp-editor-equation-target]"
      );
      if (source === null || target === null) return;

      const sourceRect = source.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      transition.dataset["kpEditorEquationSourceWidth"] = String(sourceRect.width);
      transition.dataset["kpEditorEquationSourceHeight"] = String(sourceRect.height);
      transition.dataset["kpEditorEquationTargetWidth"] = String(targetRect.width);
      transition.dataset["kpEditorEquationTargetHeight"] = String(targetRect.height);
    });
}

function renderUnavailable(slot: HTMLElement, message: string): void {
  slot.innerHTML =
    `<p class="editor-equation-stage__unavailable" data-kp-editor-equation-unavailable>${escapeHtml(message)}</p>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
