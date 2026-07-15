import {
  describeKpAnimationAssetTransformationTree,
  type KpAnimationAsset
} from "../animation/asset.ts";
import { createKpAnimationAssets } from "../animation/catalog.ts";
import {
  renderLatexToHtml,
  renderSelectorAnnotatedLatexToHtml
} from "../rendering/katex-adapter.ts";
import {
  measureKpEquationTransitionGeometry,
  type KpMeasuredEquationTransitionGeometry
} from "../rendering/equation-motion-dom.ts";
import { compileKpSemanticEquationTransitionResult } from "../rendering/semantic-equation-transition-compiler.ts";
import type { KpSelectorAnnotatedLatex } from "../rendering/selector-annotated-latex.ts";
import {
  projectKpEditorEquationRuntimeFrame,
  type KpEditorEquationRuntimeFrameProjection,
  type KpEditorEquationObjectProjection
} from "./equation-runtime-frame-projection.ts";
import {
  createKpEditorEquationTransitionMotifFrame,
  type KpEditorEquationTransitionMotifFrame
} from "./equation-transition-motifs.ts";
import type { KpEditorAnimationPlayerState } from "./animation-player-state.ts";
import {
  kpEditorAnimationSurfaceAdapterRegistry,
  type KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";
import {
  createKpEditorSolveXSharedPlayerFrame,
  type KpEditorSolveXSharedPlayerFrame
} from "./solve-x-shared-player.ts";
import {
  applyKpEditorSemanticEquationTokenFrame,
  createKpEditorSemanticEquationTokenFrame
} from "./semantic-equation-player-adapter.ts";
import { createKpSolveXSelectorAnnotatedLatex } from "./solve-x-semantic-latex.ts";
import {
  bindKpFractionStructuralMotionIds,
  createKpFractionSelectorAnnotatedLatex
} from "./fraction-semantic-latex.ts";
import { createKpFunctionWrapSelectorAnnotatedLatex } from "./function-wrap-semantic-latex.ts";
import { createKpDistributionSelectorAnnotatedLatex } from "./distribution-semantic-latex.ts";
import {
  bindKpExponentRadicalStructuralMotionIds,
  createKpExponentRadicalSelectorAnnotatedLatex
} from "./exponent-radical-semantic-latex.ts";
import { createKpInequalitySelectorAnnotatedLatex } from "./inequality-semantic-latex.ts";
import {
  bindKpMatrixStructuralMotionIds,
  createKpMatrixSelectorAnnotatedLatex
} from "./matrix-semantic-latex.ts";
import { createKpGenericSelectorAnnotatedLatex } from "./generic-semantic-latex.ts";

const animationCatalog = createKpAnimationAssets();
const semanticGeometryCache = new WeakMap<HTMLElement, {
  readonly contentKey: string;
  readonly geometries: ReadonlyMap<number, KpMeasuredEquationTransitionGeometry>;
}>();

export interface KpEditorEquationStageFrame {
  readonly stageIdentityKey: string;
  readonly contentKey: string;
  readonly projection: KpEditorEquationRuntimeFrameProjection;
  readonly localProgress: number;
  readonly easedProgress: number;
  readonly motifs: readonly KpEditorEquationTransitionMotifFrame[];
  readonly solveX?: KpEditorSolveXSharedPlayerFrame | undefined;
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

  const solveX = createKpEditorSolveXSharedPlayerFrame(input);
  const stageIdentityKey = `${projection.animationId}:${projection.direction}`;
  const contentKey = projection.transitions.map((transition) => transition.id).join(":");

  return {
    stageIdentityKey,
    contentKey,
    projection,
    localProgress,
    easedProgress: localProgress * localProgress * (3 - 2 * localProgress),
    motifs: projection.transitions.map((transition) =>
      createKpEditorEquationTransitionMotifFrame({
        transition,
        progress: localProgress * localProgress * (3 - 2 * localProgress)
      })
    ),
    ...(solveX === undefined ? {} : { solveX })
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

    let stage = slot.querySelector<HTMLElement>("[data-kp-editor-equation-stage]");

    if (stage?.dataset["kpEditorEquationStageIdentityKey"] !== frame.stageIdentityKey) {
      slot.innerHTML = renderStage(frame);
      stage = slot.querySelector<HTMLElement>("[data-kp-editor-equation-stage]");
      if (stage !== null) measureStage(stage);
    } else if (stage.dataset["kpEditorEquationContentKey"] !== frame.contentKey) {
      replaceStageContent(stage, frame);
      measureStage(stage);
    }

    if (stage === null) return;

    stage.dataset["kpEditorEquationPhaseId"] = frame.projection.phaseId;
    stage.dataset["kpEditorEquationLocalProgress"] = String(frame.localProgress);
    stage.style.setProperty("--kp-editor-equation-progress", String(frame.easedProgress));
    syncSolveXSequence(stage, frame.solveX);
    frame.projection.transitions.forEach((transition, index) => {
      const transitionElement = stage?.querySelector<HTMLElement>(
        `[data-kp-editor-equation-transition-index="${index}"]`
      );
      const motif = frame.motifs[index];
      if (transitionElement === null || transitionElement === undefined || motif === undefined) {
        return;
      }

      transitionElement.dataset["kpEditorEquationMotif"] = motif.kind;
      const semanticMotionApplied = transition.semanticStatus === "ready" &&
        applySemanticTokenMotion({
          stage,
          transitionElement,
          transitionIndex: index,
          animation,
          state,
          frame
        });
      transitionElement.dataset["kpEditorEquationSemanticMotion"] = semanticMotionApplied
        ? "active"
        : "fallback";
      if (!semanticMotionApplied) {
        applyLayerMotion(
          transitionElement.querySelector<HTMLElement>("[data-kp-editor-equation-source]"),
          motif.source
        );
        applyLayerMotion(
          transitionElement.querySelector<HTMLElement>("[data-kp-editor-equation-target]"),
          motif.target
        );
      }
      transitionElement.querySelectorAll<HTMLElement>("[data-kp-editor-equation-focus-token]")
        .forEach((token) => {
          token.style.setProperty("--kp-editor-equation-focus-progress", String(motif.progress));
        });
    });
  }
};

export function registerKpEditorEquationSurfaceAdapter(): () => void {
  return kpEditorAnimationSurfaceAdapterRegistry.register(
    kpEditorEquationSurfaceAdapter
  );
}

function renderStage(frame: KpEditorEquationStageFrame): string {
  return `
    <div class="editor-equation-stage" data-kp-editor-equation-stage data-kp-editor-equation-stage-identity-key="${escapeHtml(frame.stageIdentityKey)}" data-kp-editor-equation-content-key="${escapeHtml(frame.contentKey)}" data-kp-editor-equation-phase-id="${escapeHtml(frame.projection.phaseId)}" data-kp-editor-equation-local-progress="${frame.localProgress}">
      ${renderStageContent(frame)}
    </div>
  `;
}

function renderStageContent(frame: KpEditorEquationStageFrame): string {
  return `${frame.projection.transitions.map((transition, index) => `
        <article class="editor-equation-stage__transition" data-kp-editor-equation-transition-id="${escapeHtml(transition.id)}" data-kp-editor-equation-transition-index="${index}" data-kp-editor-equation-motif="${frame.motifs[index]?.kind ?? "artifact-replace"}" data-kp-editor-equation-semantic-status="${transition.semanticStatus}" aria-label="${escapeHtml(transition.title)}">
          <div class="editor-equation-stage__layer editor-equation-stage__layer--source" data-kp-editor-equation-source>
            ${renderEquationObjects(transition.source)}
          </div>
          <div class="editor-equation-stage__layer editor-equation-stage__layer--target" data-kp-editor-equation-target>
            ${renderEquationObjects(transition.target)}
          </div>
          <div class="editor-equation-stage__caption">
            <span data-kp-editor-equation-motif-label>${escapeHtml(motifLabel(frame.motifs[index]?.kind ?? "artifact-replace"))}</span>
            <span>${escapeHtml(transition.title)}</span>
            <span data-kp-editor-equation-semantic-diagnostic>${escapeHtml(semanticStatusLabel(transition))}</span>
            ${renderFocusTokens(frame.motifs[index]?.focusLabels ?? [])}
          </div>
        </article>
      `).join("")}
      ${frame.solveX === undefined ? "" : renderSolveXSequence(frame.solveX)}`;
}

function semanticStatusLabel(
  transition: KpEditorEquationRuntimeFrameProjection["transitions"][number]
): string {
  if (transition.semanticStatus === "ready") return "Semantic token motion ready";
  const codes = [...new Set(
    transition.semanticDiagnostics.map((diagnostic) => diagnostic.code)
  )];
  return `Whole-equation fallback: ${codes.join(", ") || "semantic coverage unavailable"}`;
}

function replaceStageContent(
  stage: HTMLElement,
  frame: KpEditorEquationStageFrame
): void {
  const template = document.createElement("template");
  template.innerHTML = renderStageContent(frame);
  stage.replaceChildren(...template.content.childNodes);
  stage.dataset["kpEditorEquationContentKey"] = frame.contentKey;
}

function renderEquationObjects(
  objects: readonly KpEditorEquationObjectProjection[]
): string {
  return objects.map((object) => {
    const annotated = annotatedLatexForObject(object);
    return `
    <div class="editor-equation-stage__object" data-kp-editor-equation-object-id="${escapeHtml(object.id)}">
      ${annotated === undefined
        ? renderLatexToHtml(object.latex)
        : renderSelectorAnnotatedLatexToHtml(annotated)}
    </div>
  `;
  }).join("");
}

function applySemanticTokenMotion(input: {
  readonly stage: HTMLElement;
  readonly transitionElement: HTMLElement;
  readonly transitionIndex: number;
  readonly animation: KpAnimationAsset;
  readonly state: KpEditorAnimationPlayerState;
  readonly frame: KpEditorEquationStageFrame;
}): boolean {
  let geometry = semanticGeometryCache.get(input.stage)?.contentKey === input.frame.contentKey
    ? semanticGeometryCache.get(input.stage)?.geometries.get(input.transitionIndex)
    : undefined;

  if (geometry === undefined) {
    const transformation = input.animation.transformations.find(
      (candidate) => candidate.id === input.frame.projection.transitions[input.transitionIndex]?.id
    );
    if (transformation === undefined) return false;
    const compiled = compileKpSemanticEquationTransitionResult({
      transformation,
      bundle: input.animation.bundle
    });
    if (compiled.status !== "semantic" || compiled.ir === undefined) return false;

    const sourceAnnotated = annotatedLatexForStates(compiled.ir.source);
    const targetAnnotated = annotatedLatexForStates(compiled.ir.target);
    if (sourceAnnotated === undefined || targetAnnotated === undefined) return false;
    const displayedSource = input.transitionElement.querySelector<HTMLElement>(
      "[data-kp-editor-equation-source]"
    );
    const displayedTarget = input.transitionElement.querySelector<HTMLElement>(
      "[data-kp-editor-equation-target]"
    );
    if (displayedSource === null || displayedTarget === null) return false;

    // IR remains forward-oriented; rewind swaps the displayed roots and samples
    // semantic progress backward, so both directions share exactly one geometry.
    geometry = measureKpEquationTransitionGeometry({
      ir: compiled.ir,
      sourceRoot: input.state.direction === "forward" ? displayedSource : displayedTarget,
      targetRoot: input.state.direction === "forward" ? displayedTarget : displayedSource,
      sourceAnnotated,
      targetAnnotated,
      sourceMotionIdsBySelector: bindStructuralMotionIds(
        input.state.direction === "forward" ? displayedSource : displayedTarget,
        compiled.ir.source
      ),
      targetMotionIdsBySelector: bindStructuralMotionIds(
        input.state.direction === "forward" ? displayedTarget : displayedSource,
        compiled.ir.target
      )
    });
    const existing = semanticGeometryCache.get(input.stage);
    const geometries = existing?.contentKey === input.frame.contentKey
      ? new Map(existing.geometries)
      : new Map<number, KpMeasuredEquationTransitionGeometry>();
    geometries.set(input.transitionIndex, geometry);
    semanticGeometryCache.set(input.stage, {
      contentKey: input.frame.contentKey,
      geometries
    });
  }

  resetLayerForSemanticMotion(input.transitionElement, "[data-kp-editor-equation-source]");
  resetLayerForSemanticMotion(input.transitionElement, "[data-kp-editor-equation-target]");
  const tokenFrame = createKpEditorSemanticEquationTokenFrame({
    geometry,
    playerState: input.state,
    phaseLocalProgress: input.frame.localProgress
  });
  applyKpEditorSemanticEquationTokenFrame(geometry, tokenFrame);
  input.transitionElement.dataset["kpEditorEquationSemanticProgress"] =
    String(tokenFrame.semanticProgress);
  return true;
}

function annotatedLatexForStates(
  states: readonly {
    readonly objectId: string;
    readonly latex: string;
    readonly selectors: readonly {
      readonly id: string;
      readonly kind?: string | undefined;
      readonly semanticKind?: string | undefined;
      readonly label?: string | undefined;
    }[];
  }[]
): readonly KpSelectorAnnotatedLatex[] | undefined {
  const annotated = states.map((state) => createKpSolveXSelectorAnnotatedLatex({
    objectId: state.objectId,
    selectorIds: state.selectors.map((selector) => selector.id)
  }) ?? createKpFractionSelectorAnnotatedLatex(state)
    ?? createKpFunctionWrapSelectorAnnotatedLatex(state)
    ?? createKpDistributionSelectorAnnotatedLatex(state)
    ?? createKpExponentRadicalSelectorAnnotatedLatex(state)
    ?? createKpInequalitySelectorAnnotatedLatex(state)
    ?? createKpMatrixSelectorAnnotatedLatex(state)
    ?? createKpGenericSelectorAnnotatedLatex(state));
  return annotated.every((state): state is KpSelectorAnnotatedLatex => state !== undefined)
    ? annotated
    : undefined;
}

function annotatedLatexForObject(
  object: KpEditorEquationObjectProjection
): KpSelectorAnnotatedLatex | undefined {
  return createKpSolveXSelectorAnnotatedLatex({
    objectId: object.id,
    selectorIds: object.selectors.map((selector) => selector.id)
  }) ?? createKpFractionSelectorAnnotatedLatex({
    objectId: object.id,
    selectors: object.selectors
  }) ?? createKpFunctionWrapSelectorAnnotatedLatex({
    objectId: object.id,
    selectors: object.selectors
  }) ?? createKpDistributionSelectorAnnotatedLatex({
    objectId: object.id,
    selectors: object.selectors
  }) ?? createKpExponentRadicalSelectorAnnotatedLatex({
    objectId: object.id,
    selectors: object.selectors
  }) ?? createKpInequalitySelectorAnnotatedLatex({
    objectId: object.id,
    selectors: object.selectors
  }) ?? createKpMatrixSelectorAnnotatedLatex({
    objectId: object.id,
    selectors: object.selectors
  }) ?? createKpGenericSelectorAnnotatedLatex({
    objectId: object.id,
    latex: object.latex,
    selectors: object.selectors
  });
}

function bindStructuralMotionIds(
  root: HTMLElement,
  states: readonly {
    readonly objectId: string;
    readonly selectors: readonly { readonly id: string; readonly label?: string | undefined }[];
  }[]
): Readonly<Record<string, string>> {
  return {
    ...bindKpFractionStructuralMotionIds({ root, states }),
    ...bindKpExponentRadicalStructuralMotionIds({ root, states }),
    ...bindKpMatrixStructuralMotionIds({ root, states })
  };
}

function resetLayerForSemanticMotion(
  transition: HTMLElement,
  selector: string
): void {
  const layer = transition.querySelector<HTMLElement>(selector);
  if (layer === null) return;
  layer.style.opacity = "1";
  layer.style.transform = "none";
  layer.style.filter = "none";
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

function applyLayerMotion(
  layer: HTMLElement | null,
  motion: KpEditorEquationTransitionMotifFrame["source"]
): void {
  if (layer === null) return;
  layer.style.opacity = String(motion.opacity);
  layer.style.transform =
    `translate(${motion.translateX}px, ${motion.translateY}px) rotateY(${motion.rotateY}deg) scale(${motion.scale})`;
  layer.style.filter = motion.blurPx === 0 ? "none" : `blur(${motion.blurPx}px)`;
}

function renderFocusTokens(labels: readonly string[]): string {
  return labels.length === 0
    ? ""
    : `<span class="editor-equation-stage__focus" aria-label="Focused terms">${labels.map((label) =>
        `<span data-kp-editor-equation-focus-token>${escapeHtml(label)}</span>`
      ).join("")}</span>`;
}

function motifLabel(kind: KpEditorEquationTransitionMotifFrame["kind"]): string {
  return kind.replaceAll("-", " ");
}

function renderSolveXSequence(frame: KpEditorSolveXSharedPlayerFrame): string {
  return `
    <ol class="editor-equation-stage__sequence" data-kp-editor-solve-x-sequence aria-label="Solve x sequence">
      ${frame.steps.map((step, index) => `
        <li data-kp-editor-solve-x-step="${index}" data-kp-editor-solve-x-step-status="${step.status}"${step.status === "active" ? ' aria-current="step"' : ""}>
          <span>${index + 1}</span>
          ${renderLatexToHtml(step.latex, { displayMode: false })}
        </li>
      `).join("")}
    </ol>
  `;
}

function syncSolveXSequence(
  stage: HTMLElement,
  frame: KpEditorSolveXSharedPlayerFrame | undefined
): void {
  if (frame === undefined) return;

  stage.dataset["kpEditorSolveXVisualProgress"] = String(frame.visualProgress);
  stage.querySelectorAll<HTMLElement>("[data-kp-editor-solve-x-step]")
    .forEach((step, index) => {
      const status = frame.steps[index]?.status;
      if (status === undefined) return;
      step.dataset["kpEditorSolveXStepStatus"] = status;
      if (status === "active") step.setAttribute("aria-current", "step");
      else step.removeAttribute("aria-current");
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
