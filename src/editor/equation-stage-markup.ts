import type { KpEditorEquationTransitionMotifFrame } from "./equation-transition-motifs.ts";
import type {
  KpEditorEquationObjectProjection,
  KpEditorEquationRuntimeFrameProjection
} from "./equation-runtime-frame-projection.ts";
import type { KpEditorEquationStageFrame } from "./equation-stage-frame.ts";
import type { KpEditorSolveXSharedPlayerFrame } from "./solve-x-shared-player.ts";
import {
  renderLatexToHtml,
  renderSelectorAnnotatedLatexToHtml
} from "../rendering/katex-adapter.ts";
import type { KpSelectorAnnotatedLatex } from "../rendering/selector-annotated-latex.ts";
import { createKpSolveXSelectorAnnotatedLatex } from "../rendering/solve-x-selector-annotated-latex.ts";
import {
  bindKpGeneratedLinearSolveStructuralMotionIds,
  createKpGeneratedLinearSolveSelectorAnnotatedLatex
} from "../rendering/generated-linear-solve-selector-annotated-latex.ts";
import {
  createKpFractionCompositionSelectorAnnotatedLatex
} from "../rendering/fraction-composition-selector-annotated-latex.ts";
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
import { createKpDerivativePowerSelectorAnnotatedLatex } from "./derivative-power-semantic-latex.ts";
import { createKpDerivativeSumSelectorAnnotatedLatex } from "./derivative-sum-semantic-latex.ts";
import { createKpAntiderivativePowerSelectorAnnotatedLatex } from "./antiderivative-power-semantic-latex.ts";
import { createKpInequalitySelectorAnnotatedLatex } from "./inequality-semantic-latex.ts";
import {
  bindKpMatrixStructuralMotionIds,
  createKpMatrixSelectorAnnotatedLatex
} from "./matrix-semantic-latex.ts";
import { createKpGenericSelectorAnnotatedLatex } from "./generic-semantic-latex.ts";

interface KpEquationMarkupState {
  readonly objectId: string;
  readonly latex: string;
  readonly selectors: readonly {
    readonly id: string;
    readonly kind?: string | undefined;
    readonly semanticKind?: string | undefined;
    readonly label?: string | undefined;
  }[];
}

export function renderStage(frame: KpEditorEquationStageFrame): string {
  return `
    <div class="editor-equation-stage" data-kp-editor-equation-stage data-kp-editor-equation-stage-identity-key="${escapeHtml(frame.stageIdentityKey)}" data-kp-editor-equation-content-key="${escapeHtml(frame.contentKey)}" data-kp-editor-equation-material-identity-key="${escapeHtml(frame.materialIdentityKey)}" data-kp-editor-equation-phase-id="${escapeHtml(frame.projection.phaseId)}" data-kp-editor-equation-global-progress="${frame.globalProgress}" data-kp-editor-equation-semantic-progress="${frame.semanticProgress}" data-kp-editor-equation-local-progress="${frame.localProgress}">
      <div class="editor-equation-stage__content" data-kp-editor-equation-content>
        ${renderStageContent(frame)}
      </div>
      <div class="editor-equation-stage__material-layer" data-kp-editor-equation-material-layer aria-hidden="true"></div>
    </div>
  `;
}

function renderStageContent(frame: KpEditorEquationStageFrame): string {
  return `${frame.projection.transitions.map((transition, index) => `
        <article class="editor-equation-stage__transition" data-kp-editor-equation-transition-id="${escapeHtml(transition.id)}" data-kp-editor-equation-transition-index="${index}" data-kp-editor-equation-motif="${frame.motifs[index]?.kind ?? "artifact-replace"}" data-kp-editor-equation-semantic-status="${transition.semanticStatus}" aria-label="${escapeHtml(transition.title)}">
          <div class="editor-equation-stage__layer editor-equation-stage__layer--source" data-kp-editor-equation-source>
            ${renderEquationObjects(transition.source, frame.mathLayout)}
          </div>
          <div class="editor-equation-stage__layer editor-equation-stage__layer--target" data-kp-editor-equation-target>
            ${renderEquationObjects(transition.target, frame.mathLayout)}
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

export function replaceStageContent(
  stage: HTMLElement,
  frame: KpEditorEquationStageFrame
): void {
  const template = document.createElement("template");
  template.innerHTML = renderStageContent(frame);
  const content = stage.querySelector<HTMLElement>(
    "[data-kp-editor-equation-content]"
  );
  if (content === null) {
    throw new Error("Equation stage is missing its replaceable content layer.");
  }
  content.replaceChildren(...template.content.childNodes);
  stage.dataset["kpEditorEquationContentKey"] = frame.contentKey;
  stage.dataset["kpEditorEquationMaterialIdentityKey"] =
    frame.materialIdentityKey;
}

function renderEquationObjects(
  objects: readonly KpEditorEquationObjectProjection[],
  mathLayout: KpEditorEquationStageFrame["mathLayout"]
): string {
  return objects.map((object) => {
    const annotated = annotatedLatexForObject(object);
    return `
    <div class="editor-equation-stage__object" data-kp-editor-equation-object-id="${escapeHtml(object.id)}">
      ${annotated === undefined
        ? renderLatexToHtml(object.latex, {
            displayMode: mathLayout === "display"
          })
        : renderSelectorAnnotatedLatexToHtml(annotated, {
            displayMode: mathLayout === "display"
          })}
    </div>
  `;
  }).join("");
}

export function annotatedLatexForStates(
  states: readonly KpEquationMarkupState[]
): readonly KpSelectorAnnotatedLatex[] | undefined {
  const annotated = states.map((state) => createKpSolveXSelectorAnnotatedLatex({
    objectId: state.objectId,
    selectorIds: state.selectors.map((selector) => selector.id)
  }) ?? createKpGeneratedLinearSolveSelectorAnnotatedLatex(state)
    ?? createKpFractionCompositionSelectorAnnotatedLatex(state.objectId)
    ?? createKpFractionSelectorAnnotatedLatex(state)
    ?? createKpFunctionWrapSelectorAnnotatedLatex(state)
    ?? createKpDistributionSelectorAnnotatedLatex(state)
    ?? createKpExponentRadicalSelectorAnnotatedLatex(state)
    ?? createKpDerivativeSumSelectorAnnotatedLatex(state)
    ?? createKpAntiderivativePowerSelectorAnnotatedLatex(state)
    ?? createKpDerivativePowerSelectorAnnotatedLatex(state)
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
  }) ?? createKpGeneratedLinearSolveSelectorAnnotatedLatex({
    objectId: object.id,
    selectors: object.selectors
  }) ?? createKpFractionCompositionSelectorAnnotatedLatex(
    object.id
  ) ?? createKpFractionSelectorAnnotatedLatex({
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
  }) ?? createKpDerivativePowerSelectorAnnotatedLatex({
    objectId: object.id,
    selectors: object.selectors
  }) ?? createKpDerivativeSumSelectorAnnotatedLatex({
    objectId: object.id,
    selectors: object.selectors
  }) ?? createKpAntiderivativePowerSelectorAnnotatedLatex({
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

export function bindStructuralMotionIds(
  root: HTMLElement,
  states: readonly {
    readonly objectId: string;
    readonly selectors: readonly {
      readonly id: string;
      readonly label?: string | undefined;
    }[];
  }[]
): Readonly<Record<string, string>> {
  const generatedLinearSolve = Object.fromEntries(states.flatMap((state) => {
    const object = root.querySelector<HTMLElement>(
      `[data-kp-editor-equation-object-id="${CSS.escape(state.objectId)}"]`
    );
    return object === null
      ? []
      : Object.entries(bindKpGeneratedLinearSolveStructuralMotionIds({
          root: object,
          state
        }));
  }));
  return {
    ...generatedLinearSolve,
    ...bindKpFractionStructuralMotionIds({ root, states }),
    ...bindKpExponentRadicalStructuralMotionIds({ root, states }),
    ...bindKpMatrixStructuralMotionIds({ root, states })
  };
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

export function syncSolveXSequence(
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

export function renderUnavailable(slot: HTMLElement, message: string): void {
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
