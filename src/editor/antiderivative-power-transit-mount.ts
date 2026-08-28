import type { KpAnimationAsset } from "../animation/asset.ts";
import {
  sampleKpAntiderivativePowerChoreography,
  sampleKpAntiderivativeRuleTemplateApplication,
  type KpAntiderivativeRuleInstructionalProjection
} from "../animation/antiderivative-power-choreography.ts";
import {
  resolveKpSemanticSalience
} from "../animation/semantic-salience-resolver.ts";
import {
  createKpEquationFontReadiness
} from "../rendering/equation-font-readiness.ts";
import {
  syncKpEquationMaterialLayer
} from "../rendering/equation-material-layer-dom.ts";
import {
  createKpAntiderivativePowerNativeKatexTransitPlan,
  type KpAntiderivativePowerNativeKatexTransitPlan
} from "../rendering/native-katex-antiderivative-power-transit.ts";
import { renderLatexToHtml } from "../rendering/katex-adapter.ts";
import type {
  KpEditorEquationStageHotPathCache
} from "./equation-stage-hot-path-cache.ts";
import {
  dispatchKpEditorAnimationPlaybackAction,
  KP_EDITOR_ANIMATION_DISPOSE_EVENT
} from "./animation-player-controller.ts";
import {
  removeKpAntiderivativePowerExplanationRail,
  syncKpAntiderivativePowerExplanationRail
} from "./antiderivative-power-explanation-rail.ts";
export const kpAntiderivativePowerTransitRepairGapCode =
  "repair-gap.integration-power-rule.native-katex-transit-unavailable";
export const kpAntiderivativeRuleApplicationNativeKatexMechanismId =
  "kp.rendering.native-katex.antiderivative-rule-application.v1";
export const kpAntiderivativeRuleApplicationPresentationProfileId =
  "kp.rendering.native-katex.antiderivative-rule-application-exemplar.v11";

type RuleLensPhase = "match" | "replacement";
type RuleLensView = "abstract" | "concrete";

export interface KpAntiderivativePowerTransitMountResult {
  readonly status: "inactive" | "preparing" | "mounted" | "repair-gap";
  readonly mechanismId?:
    typeof kpAntiderivativeRuleApplicationNativeKatexMechanismId | undefined;
  readonly repairGapCode?:
    typeof kpAntiderivativePowerTransitRepairGapCode | undefined;
}

interface PendingFrame {
  readonly localProgress: number;
  readonly direction: "forward" | "rewind";
  readonly accessibilityMode:
    | "full-motion"
    | "reduced-motion"
    | "static"
    | "narrated";
}

interface TransitMountSession {
  readonly stage: HTMLElement;
  readonly player: HTMLElement;
  readonly contentKey: string;
  readonly cacheRevision: number;
  readonly roots: {
    readonly source: HTMLElement;
    readonly target: HTMLElement;
  };
  readonly objectIds: {
    readonly source: string;
    readonly target: string;
  };
  readonly plan: KpAntiderivativePowerNativeKatexTransitPlan;
  readonly templateReceiver: HTMLElement;
  readonly ruleLensControl: HTMLElement;
  readonly fontReadiness: ReturnType<typeof createKpEquationFontReadiness>;
  generation: number;
  pending: PendingFrame;
  ready: boolean;
  failure?: string | undefined;
  ruleLensOverride?: RuleLensView | undefined;
  disposed: boolean;
}

const sessions = new WeakMap<HTMLElement, TransitMountSession>();

/**
 * The Catalogue keeps its existing equation stage. This mount only borrows
 * paint ownership for the governed first transition and keys preparation to
 * the stage's native measurement revision.
 */
export function applyKpAntiderivativePowerTransitMount(input: {
  readonly player: HTMLElement;
  readonly stage: HTMLElement;
  readonly animation: KpAnimationAsset;
  readonly activeTransformationIds: readonly string[];
  readonly contentKey: string;
  readonly localProgress: number;
  readonly direction: "forward" | "rewind";
  readonly accessibilityMode:
    | "full-motion"
    | "reduced-motion"
    | "static"
    | "narrated";
  readonly hotPath: KpEditorEquationStageHotPathCache;
}): KpAntiderivativePowerTransitMountResult {
  const transformation = input.animation.transformations.find(
    ({ transformType }) => transformType === "applyAntiderivativePowerRule"
  );
  if (transformation === undefined) {
    disposeKpAntiderivativePowerTransitMount(input.stage, "scene-replaced");
    removeKpAntiderivativePowerExplanationRail(input.stage);
    clearTelemetry(input.stage);
    return Object.freeze({ status: "inactive" as const });
  }
  if (!input.activeTransformationIds.includes(transformation.id)) {
    // The evaluation mount immediately follows this call and reuses the same
    // explanation rail. Keep it alive across the semantic operation boundary.
    disposeKpAntiderivativePowerTransitMount(input.stage, "scene-replaced");
    clearTelemetry(input.stage);
    return Object.freeze({ status: "inactive" as const });
  }

  const pending: PendingFrame = Object.freeze({
    localProgress: bounded(input.localProgress),
    direction: input.direction,
    accessibilityMode: input.accessibilityMode
  });
  let session = sessions.get(input.stage);
  if (
    session !== undefined &&
    (session.contentKey !== input.contentKey ||
      session.cacheRevision !== input.hotPath.revision)
  ) {
    disposeKpAntiderivativePowerTransitMount(
      input.stage,
      session.contentKey === input.contentKey
        ? "measurement-invalidated"
        : "scene-replaced"
    );
    session = undefined;
  }
  if (session === undefined) {
    const endpoints = requireEndpointRoots(input.stage);
    const plan = createKpAntiderivativePowerNativeKatexTransitPlan(
      input.animation
    );
    const templateReceiver = createTemplateReceiver(
      input.stage,
      plan.choreography.ruleTemplateApplication
    );
    const ruleLensControl = createRuleLensControl(input.stage);
    session = {
      stage: input.stage,
      player: input.player,
      contentKey: input.contentKey,
      cacheRevision: input.hotPath.revision,
      roots: endpoints.roots,
      objectIds: endpoints.objectIds,
      plan,
      templateReceiver,
      ruleLensControl,
      fontReadiness: createKpEquationFontReadiness(
        input.stage.ownerDocument
      ),
      generation: 1,
      pending,
      ready: false,
      disposed: false
    };
    sessions.set(input.stage, session);
    bindRuleLensControl(session);
    input.player.addEventListener(
      KP_EDITOR_ANIMATION_DISPOSE_EVENT,
      () => disposeKpAntiderivativePowerTransitMount(
        input.stage,
        "surface-disposed"
      ),
      { once: true }
    );
    input.stage.dataset["kpAntiderivativePowerTransit"] = "preparing";
    void prepareSession(session, session.generation);
  }
  session.pending = pending;

  if (session.failure !== undefined) {
    hideTemplateReceiver(session);
    showNativeCheckpoint(session, semanticProgress(pending));
    publishRepairGap(session);
    return Object.freeze({
      status: "repair-gap" as const,
      repairGapCode: kpAntiderivativePowerTransitRepairGapCode
    });
  }
  if (!session.ready) {
    showNativeCheckpoint(session, semanticProgress(pending));
    return Object.freeze({ status: "preparing" as const });
  }

  try {
    applyFrame(session);
  } catch (error: unknown) {
    session.failure = error instanceof Error ? error.message : String(error);
    hideTemplateReceiver(session);
    showNativeCheckpoint(session, semanticProgress(session.pending));
    publishRepairGap(session);
    return Object.freeze({
      status: "repair-gap" as const,
      repairGapCode: kpAntiderivativePowerTransitRepairGapCode
    });
  }
  return Object.freeze({
    status: "mounted" as const,
    mechanismId: kpAntiderivativeRuleApplicationNativeKatexMechanismId
  });
}

export function disposeKpAntiderivativePowerTransitMount(
  stage: HTMLElement,
  reason: "scene-replaced" | "surface-disposed" |
    "measurement-invalidated" = "surface-disposed"
): void {
  const session = sessions.get(stage);
  if (session === undefined || session.disposed) return;
  session.disposed = true;
  session.generation += 1;
  void reason;
  session.fontReadiness.dispose();
  syncKpEquationMaterialLayer({ stage, owners: [] });
  clearInstructionalTemplateSlots(session);
  session.templateReceiver.remove();
  session.ruleLensControl.remove();
  delete session.player.dataset["kpAntiderivativeRuleLensOverride"];
  sessions.delete(stage);
}

function createTemplateReceiver(
  stage: HTMLElement,
  template: KpAntiderivativePowerNativeKatexTransitPlan["choreography"]["ruleTemplateApplication"]
): HTMLElement {
  const element = stage.ownerDocument.createElement("div");
  element.className =
    "editor-equation-stage__antiderivative-template-receiver";
  element.dataset["kpAntiderivativeTemplateReceiver"] = template.lawRefId;
  element.dataset["kpAntiderivativeTemplateLawRefId"] = template.lawRefId;
  element.dataset["kpSemanticTraceRole"] = "absent";
  element.style.setProperty(
    "--kp-antiderivative-rule-template-panel-presence",
    "0"
  );
  element.style.setProperty(
    "--kp-antiderivative-rule-match-presence",
    "0"
  );
  element.style.setProperty(
    "--kp-antiderivative-metavariable-bindings-presence",
    "0"
  );
  element.style.setProperty(
    "--kp-antiderivative-rule-preview-presence",
    "0"
  );
  element.style.setProperty(
    "--kp-antiderivative-pattern-projection-presence",
    "0"
  );
  element.style.setProperty(
    "--kp-antiderivative-schema-plane-presence",
    "0"
  );
  element.style.setProperty(
    "--kp-antiderivative-correspondence-plane-presence",
    "0"
  );
  element.setAttribute("aria-hidden", "true");

  const rulePanel = stage.ownerDocument.createElement("div");
  rulePanel.className =
    "editor-equation-stage__antiderivative-rule-template";
  rulePanel.dataset["kpAntiderivativeRuleTemplate"] = template.lawRefId;
  rulePanel.dataset["kpAntiderivativeRulePattern"] =
    template.instructionalProjection.patternLatex;
  rulePanel.dataset["kpAntiderivativeRuleReplacementTemplate"] =
    template.instructionalProjection.replacementTemplateLatex;
  rulePanel.dataset["kpAntiderivativeRuleAuthorityPattern"] =
    template.patternLatex;
  rulePanel.dataset["kpAntiderivativeRuleAuthorityReplacementTemplate"] =
    template.replacementTemplateLatex;
  rulePanel.setAttribute("role", "img");
  rulePanel.setAttribute("aria-hidden", "true");

  const patternProjection = createInstructionalPatternProjection(
    stage,
    template.instructionalProjection
  );
  rulePanel.append(patternProjection);
  element.append(rulePanel);
  stage.append(element);
  return element;
}

function createRuleLensControl(stage: HTMLElement): HTMLElement {
  const control = stage.ownerDocument.createElement("div");
  control.className = "editor-equation-stage__antiderivative-rule-lens";
  control.dataset["kpAntiderivativeRuleLensControl"] = "true";
  control.setAttribute("role", "group");
  control.setAttribute("aria-label", "Rule inspection");
  control.hidden = true;

  const cue = stage.ownerDocument.createElement("span");
  cue.className = "editor-equation-stage__antiderivative-rule-lens-cue";
  cue.textContent = "RULE LENS";
  cue.setAttribute("aria-hidden", "true");

  const toggle = stage.ownerDocument.createElement("button");
  toggle.className = "editor-equation-stage__antiderivative-rule-lens-toggle";
  toggle.dataset["kpAntiderivativeRuleLensToggle"] = "true";
  toggle.type = "button";
  toggle.disabled = true;
  toggle.setAttribute("aria-pressed", "false");
  toggle.textContent = "Show pattern";
  control.append(cue, toggle);
  stage.append(control);
  return control;
}

function bindRuleLensControl(session: TransitMountSession): void {
  const toggle = session.ruleLensControl.querySelector<HTMLButtonElement>(
    "[data-kp-antiderivative-rule-lens-toggle]"
  );
  if (toggle === null) {
    throw new Error("Antiderivative Rule Lens requires its toggle.");
  }
  toggle.addEventListener("click", () => {
    if (!session.ready || session.disposed) return;
    const currentView = session.stage.dataset["kpAntiderivativeRuleLensView"];
    session.ruleLensOverride = currentView === "abstract"
      ? "concrete"
      : "abstract";
    session.player.dataset["kpAntiderivativeRuleLensOverride"] =
      session.ruleLensOverride;
    // Inspection is a support projection at the current semantic time. Pause
    // before repainting so the comparison cannot quietly advance the lesson.
    dispatchKpEditorAnimationPlaybackAction(session.player, {
      type: "pause",
      nowMs: performance.now()
    });
    applyFrame(session);
  });
}

/*
 * The pattern temporarily takes over the source's focal locus. This makes
 * abstraction perceptible without asking the reader to compare two equations
 * or interpret a second spatial diagram. The RHS appears only after the
 * pattern has withdrawn.
 */
function createInstructionalPatternProjection(
  stage: HTMLElement,
  projection: KpAntiderivativeRuleInstructionalProjection
): HTMLElement {
  const pattern = createRuleTemplateFormula({
    stage,
    className:
      "editor-equation-stage__antiderivative-pattern-projection",
    dataAttribute: "kpAntiderivativeRulePatternProjection",
    latex: projection.patternLatex,
    annotatedLatex: annotateInstructionalPatternProjectionLatex(
      projection.patternLatex
    )
  });
  pattern.dataset["kpSemanticTraceRole"] = "absent";
  return pattern;
}

function annotateInstructionalPatternProjectionLatex(latex: string): string {
  if (latex !== String.raw`\int u^n\,du`) {
    throw new Error("Antiderivative instructional pattern cannot be projected.");
  }
  return String.raw`\htmlData{kp-antiderivative-pattern-fixed=operator}{\int}` +
    String.raw`\htmlData{kp-antiderivative-pattern-slot=u-base}{u}^{\htmlData{kp-antiderivative-pattern-slot=n}{n}}` +
    String.raw`\htmlData{kp-antiderivative-pattern-fixed=differential}{\,d}` +
    String.raw`\htmlData{kp-antiderivative-pattern-slot=u-differential}{u}`;
}

function createRuleTemplateFormula(input: {
  readonly stage: HTMLElement;
  readonly className: string;
  readonly dataAttribute: "kpAntiderivativeRulePatternProjection";
  readonly latex: string;
  readonly annotatedLatex?: string | undefined;
}): HTMLElement {
  const formula = input.stage.ownerDocument.createElement("div");
  formula.className = input.className;
  formula.dataset[input.dataAttribute] = input.latex;
  formula.innerHTML = renderLatexToHtml(
    input.annotatedLatex ?? input.latex,
    {
      displayMode: false,
      output: "htmlAndMathml",
      trust: input.annotatedLatex !== undefined
    }
  );
  // The panel owns one phase-specific accessible description; hidden
  // crossfade layers must not announce duplicate equations to screen readers.
  formula.setAttribute("aria-hidden", "true");
  return formula;
}

function hideTemplateReceiver(session: TransitMountSession): void {
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-rule-template-panel-presence",
    "0"
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-rule-match-presence",
    "0"
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-metavariable-bindings-presence",
    "0"
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-rule-preview-presence",
    "0"
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-pattern-projection-presence",
    "0"
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-schema-plane-presence",
    "0"
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-correspondence-plane-presence",
    "0"
  );
  session.templateReceiver.dataset["kpSemanticTraceRole"] = "absent";
  session.templateReceiver.setAttribute("aria-hidden", "true");
  session.templateReceiver.setAttribute("inert", "");
  session.ruleLensControl.hidden = true;
  const toggle = session.ruleLensControl.querySelector<HTMLButtonElement>(
    "[data-kp-antiderivative-rule-lens-toggle]"
  );
  if (toggle !== null) toggle.disabled = true;
}

async function prepareSession(
  session: TransitMountSession,
  generation: number
): Promise<void> {
  try {
    await session.fontReadiness.whenReady();
    if (session.disposed || session.generation !== generation) return;
    prepareNativeMeasurement(session);
    if (session.disposed || session.generation !== generation) return;
    assertSingleInstantiatedFractionOwner(session);
    bindInstructionalTemplateSlots(session);
    registerInstructionalPatternSlots(session);
    session.ready = true;
    session.ruleLensControl.hidden = false;
    const ruleLensToggle = session.ruleLensControl
      .querySelector<HTMLButtonElement>(
        "[data-kp-antiderivative-rule-lens-toggle]"
      );
    if (ruleLensToggle !== null) ruleLensToggle.disabled = false;
    session.stage.dataset["kpAntiderivativePowerTransit"] = "ready";
    session.stage.dataset["kpAntiderivativePowerTransitMechanismId"] =
      kpAntiderivativeRuleApplicationNativeKatexMechanismId;
    session.stage.dataset["kpAntiderivativeTemplateProfileId"] =
      kpAntiderivativeRuleApplicationPresentationProfileId;
    session.stage.dataset["kpAntiderivativePowerTransitDynamicTrackCount"] =
      "0";
    session.stage.dataset["kpAntiderivativeInstantiatedResultOwner"] =
      "canonical-target-native";
    session.stage.dataset["kpAntiderivativeTemplateVacancyCount"] = "0";
    applyFrame(session);
  } catch (error: unknown) {
    if (session.disposed || session.generation !== generation) return;
    session.failure = error instanceof Error ? error.message : String(error);
    showNativeCheckpoint(session, semanticProgress(session.pending));
    publishRepairGap(session);
  }
}

function prepareNativeMeasurement(session: TransitMountSession): void {
  const materialLayer = session.stage.querySelector<HTMLElement>(
    "[data-kp-editor-equation-material-layer]"
  );
  const sourceObject = session.roots.source.querySelector<HTMLElement>(
    "[data-kp-editor-equation-object-id]"
  );
  if (materialLayer === null || sourceObject === null) {
    throw new Error(
      "Antiderivative transit requires its Catalogue material and object layers."
    );
  }
  // The shared material layer normally uses the generic equation type size.
  // This exemplar renders larger native KaTeX, so its inert clones need the
  // same em context before the compositor can certify intrinsic paint size.
  materialLayer.style.fontSize = getComputedStyle(sourceObject).fontSize;
  session.stage.dataset["kpAntiderivativePowerNativeFontSize"] =
    getComputedStyle(sourceObject).fontSize;
  session.stage.dataset["kpAntiderivativePowerMaterialFontSize"] =
    getComputedStyle(materialLayer).fontSize;
  for (const [side, root] of [
    ["source", session.roots.source],
    ["target", session.roots.target]
  ] as const) {
    root.style.opacity = "1";
    root.style.visibility = "visible";
    root.style.transform = "none";
    root.style.filter = "none";
    root.dataset["kpSemanticEntityId"] = session.objectIds[side];
    root.dataset["kpPresentationGroupId"] =
      `${session.objectIds[side]}.root`;
    root.querySelectorAll<HTMLElement>("[data-kp-motion-id]")
      .forEach((token) => {
        token.style.opacity = "1";
        token.style.visibility = "visible";
        token.style.transform = "none";
        token.style.filter = "none";
        delete token.dataset["kpEquationMaterialNativeHidden"];
        const selectorId = selectorIdFromMotionId(token);
        token.dataset["kpSemanticEntityId"] = selectorId;
        token.dataset["kpPresentationGroupId"] = selectorId;
      });
    bindSemanticGroups(root);
  }
}

function assertSingleInstantiatedFractionOwner(
  session: TransitMountSession
): void {
  const fractionRules = session.roots.target.querySelectorAll<HTMLElement>(
    ".frac-line"
  );
  if (fractionRules.length !== 1) {
    throw new Error(
      `Antiderivative instantiated result requires one native fraction rule; ` +
      `received ${fractionRules.length}.`
    );
  }
  fractionRules[0]!.dataset["kpAntiderivativeInstantiatedFractionOwner"] =
    "canonical-target-native";
}

function bindInstructionalTemplateSlots(session: TransitMountSession): void {
  const targetTokens = [
    ...session.roots.target.querySelectorAll<HTMLElement>("[data-kp-motion-id]")
  ];
  for (const [selectorId, metavariable] of [
    [session.plan.choreography.persistentBase.targetSelectorId, "u"],
    ...session.plan.choreography.exponentBranch.targetSelectorIds.map(
      (selectorId) => [selectorId, "n"] as const
    )
  ] as const) {
    const token = targetTokens.find((candidate) =>
      candidate.dataset["kpMotionId"]?.endsWith(selectorId) === true
    );
    if (token === undefined) {
      throw new Error(
        `Antiderivative template cannot bind instructional slot ${selectorId}.`
      );
    }
    token.dataset["kpAntiderivativeRuleTemplateSlot"] = metavariable;
  }
  session.roots.target.style.setProperty(
    "--kp-antiderivative-template-slot-presence",
    "0"
  );
  session.roots.target.style.setProperty(
    "--kp-antiderivative-bound-value-presence",
    "0"
  );
}

function registerInstructionalPatternSlots(
  session: TransitMountSession
): void {
  const template = session.plan.choreography.ruleTemplateApplication;
  const baseBinding = template.metavariableBindings.find(
    ({ metavariable }) => metavariable === "u"
  );
  const exponentBinding = template.metavariableBindings.find(
    ({ metavariable }) => metavariable === "n"
  );
  if (baseBinding === undefined || exponentBinding === undefined) {
    throw new Error("Antiderivative skeletonization requires u and n bindings.");
  }
  const baseSourceId = baseBinding.sourceSelectorIds[0];
  const differentialSourceId = baseBinding.sourceSelectorIds[1];
  const exponentSourceId = exponentBinding.sourceSelectorIds[0];
  if (
    baseSourceId === undefined ||
    differentialSourceId === undefined ||
    exponentSourceId === undefined
  ) {
    throw new Error("Antiderivative skeletonization has incomplete bindings.");
  }
  const pairs = [
    ["slot", "u-base", baseSourceId],
    ["slot", "u-differential", differentialSourceId],
    ["slot", "n", exponentSourceId]
  ] as const;
  const bindingSourceIds = new Set([
    baseSourceId,
    differentialSourceId,
    exponentSourceId
  ]);
  const fixedSourceIds = session.plan.choreography.operatorApplication
    .operatorSelectorIds.filter((id) => !bindingSourceIds.has(id));
  if (fixedSourceIds.length !== 2) {
    throw new Error(
      "Antiderivative skeletonization requires integral and differential fixed syntax."
    );
  }
  const registeredPairs = [
    ...pairs,
    ["fixed", "operator", fixedSourceIds[0]!],
    ["fixed", "differential", fixedSourceIds[1]!]
  ] as const;
  let maxRegistrationError = 0;
  for (const [kind, patternId, sourceSelectorId] of registeredPairs) {
    const source = findNativeMotionToken(
      session.roots.source,
      sourceSelectorId
    );
    const slot = session.templateReceiver.querySelector<HTMLElement>(
      kind === "slot"
        ? `[data-kp-antiderivative-pattern-slot="${patternId}"]`
        : `[data-kp-antiderivative-pattern-fixed="${patternId}"]`
    );
    if (source === undefined || slot === null) {
      throw new Error(
        `Antiderivative skeletonization cannot register ${kind} ${patternId}.`
      );
    }
    slot.style.removeProperty("translate");
    const sourceRect = source.getBoundingClientRect();
    const slotRect = slot.getBoundingClientRect();
    const offsetX = centerX(sourceRect) - centerX(slotRect);
    const offsetY = centerY(sourceRect) - centerY(slotRect);
    slot.style.translate = `${offsetX.toFixed(3)}px ${offsetY.toFixed(3)}px`;
    const registeredRect = slot.getBoundingClientRect();
    maxRegistrationError = Math.max(
      maxRegistrationError,
      Math.abs(centerX(sourceRect) - centerX(registeredRect)),
      Math.abs(centerY(sourceRect) - centerY(registeredRect))
    );
  }
  session.stage.dataset["kpAntiderivativeSkeletonizationRegistrationCount"] =
    String(registeredPairs.length);
  session.stage.dataset["kpAntiderivativeSkeletonizationRegistrationError"] =
    maxRegistrationError.toFixed(4);
}

function clearInstructionalTemplateSlots(session: TransitMountSession): void {
  for (const token of session.roots.target.querySelectorAll<HTMLElement>(
    "[data-kp-antiderivative-rule-template-slot]"
  )) {
    token.style.removeProperty(
      "--kp-antiderivative-template-slot-presence"
    );
    token.style.removeProperty(
      "--kp-antiderivative-bound-value-presence"
    );
    delete token.dataset["kpAntiderivativeRuleTemplateSlot"];
  }
  session.roots.target.style.removeProperty(
    "--kp-antiderivative-template-slot-presence"
  );
  session.roots.target.style.removeProperty(
    "--kp-antiderivative-bound-value-presence"
  );
  for (const slot of session.templateReceiver.querySelectorAll<HTMLElement>(
    "[data-kp-antiderivative-pattern-slot], " +
      "[data-kp-antiderivative-pattern-fixed]"
  )) {
    slot.style.removeProperty("--kp-antiderivative-pattern-slot-presence");
    slot.style.removeProperty("translate");
  }
}

function applyFrame(session: TransitMountSession): void {
  if (!session.ready) return;
  if (
    session.ruleLensOverride !== undefined &&
    session.player.dataset["kpEditorAnimationStatus"] === "playing"
  ) {
    // Play resumes the authored explanation; the lens remains available but
    // does not become a second timeline or a sticky semantic state.
    session.ruleLensOverride = undefined;
    delete session.player.dataset["kpAntiderivativeRuleLensOverride"];
  }
  const frame = sampleKpAntiderivativePowerChoreography({
    plan: session.plan.choreography,
    progress: session.pending.localProgress,
    direction: session.pending.direction
  });
  const projection = session.pending.accessibilityMode === "static"
    ? "no-depth"
    : session.pending.accessibilityMode === "reduced-motion"
      ? "reduced"
      : "full";
  const ruleApplication = projection === "full"
    ? frame.ruleTemplateApplication
    : sampleKpAntiderivativeRuleTemplateApplication(
        frame.rewriteProgress < 0.5 ? 0 : 1
      );
  const templateAuthority =
    session.plan.choreography.ruleTemplateApplication;
  const baseBinding = templateAuthority.metavariableBindings.find(
    ({ metavariable }) => metavariable === "u"
  );
  const exponentBinding = templateAuthority.metavariableBindings.find(
    ({ metavariable }) => metavariable === "n"
  );
  if (baseBinding === undefined || exponentBinding === undefined) {
    throw new Error(
      "Antiderivative explanation requires verified u and n bindings."
    );
  }
  syncKpAntiderivativePowerExplanationRail({
    stage: session.stage,
    beatId: ruleApplication.explanationBeatId,
    presence: ruleApplication.explanationPresence,
    baseValue: baseBinding.value,
    exponentValue: exponentBinding.value
  });
  // The generic equation sampler runs earlier in the shared host. Restore the
  // native endpoints before projecting this exemplar's deterministic presence
  // and trace roles, or inherited transforms would move the matched subject.
  resetEndpointPresentation(session);
  syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
  applyOperatorAndScopeSalience(session, frame, projection);
  const ruleProjection = applyRuleTemplateApplicationState(
    session,
    ruleApplication,
    projection
  );
  session.stage.dataset["kpAntiderivativeDepthLens"] =
    projection === "full" ? "schema-projection" : projection;
  const visualOwner = applyNativeRuleApplicationState(
    session,
    ruleApplication,
    ruleProjection.visualProjection
  );
  syncRuleLensControl(session, ruleApplication, ruleProjection.visualProjection);
  settleAccessibility(
    session,
    ruleProjection.visualProjection
  );
  session.stage.dataset["kpAntiderivativePowerTransit"] = "ready";
  session.stage.dataset["kpAntiderivativePowerTransitProgress"] =
    String(ruleApplication.rewriteCommitProgress);
  session.stage.dataset["kpAntiderivativePowerSemanticProgress"] =
    String(frame.semanticProgress);
  session.stage.dataset["kpAntiderivativePowerVisualOwner"] =
    visualOwner;
  session.stage.dataset["kpAntiderivativePowerAccessibilityProjection"] =
    projection;
  delete session.stage.dataset["kpAntiderivativePowerRepairGap"];
  delete session.stage.dataset["kpAntiderivativePowerRepairGapReason"];
}

function applyRuleTemplateApplicationState(
  session: TransitMountSession,
  template: ReturnType<typeof sampleKpAntiderivativeRuleTemplateApplication>,
  projection: "full" | "reduced" | "no-depth"
): {
  readonly panelPresence: number;
  readonly visualProjection: SchemaProjectionState;
} {
  const visualProjection = schemaProjectionState(
    template,
    projection,
    session.ruleLensOverride
  );
  const skeletonization = skeletonizationState(
    template,
    projection,
    session.ruleLensOverride
  );
  const templateSlotPresence = Math.max(
    1 - skeletonization.targetBaseInstantiation,
    1 - skeletonization.targetExponentInstantiation
  );
  const boundValuePresence = Math.max(
    skeletonization.targetBaseInstantiation,
    skeletonization.targetExponentInstantiation
  );
  const panelPresence = visualProjection.patternInkPresence > 0.01
    ? Math.max(1, template.panelPresence)
    : template.panelPresence;
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-rule-template-panel-presence",
    panelPresence.toFixed(4)
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-rule-match-presence",
    template.matchPresence.toFixed(4)
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-metavariable-bindings-presence",
    template.metavariableBindingsPresence.toFixed(4)
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-rule-preview-presence",
    template.rulePreviewPresence.toFixed(4)
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-pattern-projection-presence",
    visualProjection.patternInkPresence.toFixed(4)
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-pattern-projection-fixed-presence",
    skeletonization.fixedPatternPresence.toFixed(4)
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-schema-plane-presence",
    template.depthLens.schemaPlanePresence.toFixed(4)
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-correspondence-plane-presence",
    template.depthLens.correspondencePlanePresence.toFixed(4)
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-template-face-progress",
    template.templateRevealProgress.toFixed(4)
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-template-commit-progress",
    template.rewriteCommitProgress.toFixed(4)
  );
  session.templateReceiver.dataset["kpSemanticTraceRole"] =
    template.traceRole;
  session.roots.target.style.setProperty(
    "--kp-antiderivative-template-slot-presence",
    templateSlotPresence.toFixed(4)
  );
  session.roots.target.style.setProperty(
    "--kp-antiderivative-bound-value-presence",
    boundValuePresence.toFixed(4)
  );
  const templateAuthority =
    session.plan.choreography.ruleTemplateApplication;
  const rulePanel = session.templateReceiver.querySelector<HTMLElement>(
    "[data-kp-antiderivative-rule-template]"
  );
  if (rulePanel === null) {
    throw new Error("Antiderivative rewrite lacks its rule-template panel.");
  }
  applySkeletonizationPaintState(
    session,
    skeletonization
  );
  applyInstructionalRuleLayerState(session, template, visualProjection);
  const panelIsPresent =
    visualProjection.primaryRepresentation === "schema-pattern" ||
    visualProjection.primaryRepresentation === "replacement-template";
  session.templateReceiver.setAttribute(
    "aria-hidden",
    panelIsPresent ? "false" : "true"
  );
  rulePanel.setAttribute("aria-hidden", panelIsPresent ? "false" : "true");
  if (panelIsPresent) {
    session.templateReceiver.removeAttribute("inert");
  } else {
    session.templateReceiver.setAttribute("inert", "");
  }
  const baseBinding = templateAuthority.metavariableBindings.find(
    ({ metavariable }) => metavariable === "u"
  );
  const exponentBinding = templateAuthority.metavariableBindings.find(
    ({ metavariable }) => metavariable === "n"
  );
  if (baseBinding === undefined || exponentBinding === undefined) {
    throw new Error("Antiderivative rule projection requires u and n bindings.");
  }
  rulePanel.setAttribute(
    "aria-label",
    visualProjection.primaryRepresentation === "instantiated-rewrite" ||
      visualProjection.primaryRepresentation === "committed-rewrite"
      ? `Instantiated power-rule result: u maps to ${baseBinding.value}, and n maps to ${exponentBinding.value} in both occurrences, giving ${templateAuthority.instantiatedResultLatex} before evaluation.`
      : visualProjection.primaryRepresentation === "replacement-template"
        ? `Prospective power-rule template: ${templateAuthority.instructionalProjection.replacementTemplateLatex}. The bindings are u maps to ${baseBinding.value} and n maps to ${exponentBinding.value}.`
      : template.metavariableBindingsPresence > 0.01
        ? `Power rule bindings: u maps to ${baseBinding.value}, and n maps to ${exponentBinding.value}.`
        : `Power-rule match: ${templateAuthority.instructionalProjection.patternLatex} matches the integral. The base and differential fill u, and the exponent fills n.`
  );
  const semanticIds = [
    ...session.plan.choreography.ruleTemplateApplication
      .scaffoldSemanticEntityIds,
    ...session.plan.choreography.ruleTemplateApplication.fixedSyntaxGroups
      .flatMap(({ selectorIds }) => selectorIds),
    ...session.plan.choreography.ruleTemplateApplication.closureSelectorIds
  ];
  const closureIds = new Set(templateAuthority.closureSelectorIds);
  for (const semanticId of semanticIds) {
    for (const element of semanticPaintOwners(session.stage, semanticId)) {
      element.dataset["kpSemanticTraceRole"] = template.traceRole;
      element.dataset["kpAntiderivativeTemplatePaintRole"] = "grammar";
      element.dataset["kpSemanticSalienceLevel"] =
        closureIds.has(semanticId) &&
          template.targetPresence > 0.01 &&
          template.rewriteCommitProgress < 1
          ? "context"
          : "normal";
      element.style.color = "";
      element.style.filter = "none";
    }
  }
  const relations = session.plan.choreography.ruleTemplateApplication
    .bindingRelations;
  const exponentRelation = relations.find(({ relation }) =>
    relation === "fan-out"
  );
  if (exponentRelation === undefined) {
    throw new Error("Antiderivative rule projection requires exponent fan-out.");
  }
  const exponentSourceIds = new Set([exponentRelation.sourceSelectorId]);
  const exponentTargetIds = new Set(exponentRelation.targetSelectorIds);
  const receiverIds = relations.flatMap((relation) => [
      relation.sourceSelectorId,
      ...relation.targetSelectorIds
    ]);
  for (const semanticId of receiverIds) {
    for (const element of semanticPaintOwners(session.stage, semanticId)) {
      element.dataset["kpAntiderivativeTemplatePaintRole"] = "binding";
      const sourceIsActive = exponentSourceIds.has(semanticId) &&
        (template.matchPresence > 0.01 ||
          template.metavariableBindingsPresence > 0.01) &&
        template.templateRevealProgress < 1;
      const targetIsActive = exponentTargetIds.has(semanticId) &&
        template.targetPresence > 0.01 &&
        template.rewriteCommitProgress < 1;
      element.dataset["kpSemanticSalienceLevel"] =
        sourceIsActive || targetIsActive ? "focus" : "normal";
      element.style.color = "";
      element.style.filter = "none";
    }
  }
  session.stage.dataset["kpAntiderivativeTemplateApplication"] =
    "match-bind-instantiate-rewrite";
  session.stage.dataset["kpAntiderivativeTemplateTraceRole"] =
    template.traceRole;
  session.stage.dataset["kpAntiderivativeTemplateReceiverFocus"] =
    template.receiverFocus.toFixed(4);
  session.stage.dataset["kpAntiderivativeRuleTemplatePanelPresence"] =
    panelPresence.toFixed(4);
  session.stage.dataset["kpAntiderivativeMetavariableBindingsPresence"] =
    template.metavariableBindingsPresence.toFixed(4);
  session.stage.dataset["kpAntiderivativeRulePreviewPresence"] =
    template.rulePreviewPresence.toFixed(4);
  session.stage.dataset["kpAntiderivativeRulePreviewWithdrawalProgress"] =
    template.rulePreviewWithdrawalProgress.toFixed(4);
  session.stage.dataset["kpAntiderivativePatternProjectionPresence"] =
    template.patternProjectionPresence.toFixed(4);
  session.stage.dataset["kpAntiderivativePatternProjectionProgress"] =
    template.patternProjectionProgress.toFixed(4);
  session.stage.dataset["kpAntiderivativeInstantiatedResultPresence"] =
    template.instantiatedResultPresence.toFixed(4);
  session.stage.dataset["kpAntiderivativeRuleMatchProgress"] =
    template.matchProgress.toFixed(4);
  session.stage.dataset["kpAntiderivativeRuleMatchPresence"] =
    template.matchPresence.toFixed(4);
  session.stage.dataset["kpAntiderivativeRuleInstantiationProgress"] =
    template.instantiationProgress.toFixed(4);
  session.stage.dataset["kpAntiderivativeRuleTemplateRevealProgress"] =
    template.templateRevealProgress.toFixed(4);
  session.stage.dataset["kpAntiderivativeRuleTemplateSlotPresence"] =
    templateSlotPresence.toFixed(4);
  session.stage.dataset["kpAntiderivativeRuleRewriteCommitProgress"] =
    template.rewriteCommitProgress.toFixed(4);
  session.stage.dataset["kpAntiderivativeTemplateVacancyPresence"] =
    template.vacancyPresence.toFixed(4);
  session.stage.dataset["kpAntiderivativeTemplateReceiverSettlementProgress"] =
    template.receiverSettlementProgress.toFixed(4);
  session.stage.dataset["kpAntiderivativeTemplateLawRefId"] =
    session.plan.choreography.ruleTemplateApplication.lawRefId;
  session.stage.dataset["kpAntiderivativeTemplateScaffoldPresence"] =
    template.scaffoldPresence.toFixed(4);
  session.stage.dataset["kpAntiderivativeTemplateBindingProgress"] =
    template.bindingProgress.toFixed(4);
  session.stage.dataset["kpAntiderivativeTemplateSyntaxPresence"] =
    template.syntaxPresence.toFixed(4);
  session.stage.dataset["kpAntiderivativeTemplateSyntaxResolutionProgress"] =
    template.syntaxResolutionProgress.toFixed(4);
  session.stage.dataset["kpAntiderivativeTemplateClosurePresence"] =
    template.closurePresence.toFixed(4);
  session.stage.dataset["kpAntiderivativeFixedSyntaxOwner"] =
    visualProjection.primaryRepresentation === "schema-pattern"
      ? "single-locus-skeletonization"
      : visualProjection.primaryRepresentation === "source"
        ? "source-native"
        : "none";
  session.stage.dataset["kpAntiderivativeDepthLens"] =
    projection === "full" ? "schema-projection" : projection;
  session.stage.dataset["kpAntiderivativeSchemaPlanePresence"] =
    template.depthLens.schemaPlanePresence.toFixed(4);
  session.stage.dataset["kpAntiderivativeCorrespondencePlanePresence"] =
    template.depthLens.correspondencePlanePresence.toFixed(4);
  session.stage.dataset["kpAntiderivativeProspectivePlaneDepth"] =
    template.depthLens.prospectivePlaneDepth.toFixed(4);
  session.stage.dataset["kpAntiderivativeSchemaProjection"] =
    "single-focal";
  session.stage.dataset["kpAntiderivativePrimaryRepresentation"] =
    visualProjection.primaryRepresentation;
  session.stage.dataset["kpAntiderivativePrimaryRepresentationCount"] =
    visualProjection.primaryRepresentation === "turnover" ? "0" : "1";
  session.stage.dataset["kpAntiderivativeRegistrationFrameCount"] = "0";
  session.stage.dataset["kpAntiderivativeBindingRelationCount"] = "0";
  session.stage.dataset["kpAntiderivativeBindingRelationPresence"] = "0.0000";
  session.stage.dataset["kpAntiderivativeSkeletonization"] =
    "abstract-bind-instantiate";
  session.stage.dataset["kpAntiderivativeSkeletonBaseProgress"] =
    skeletonization.sourceBaseAbstraction.toFixed(4);
  session.stage.dataset["kpAntiderivativeSkeletonExponentProgress"] =
    skeletonization.sourceExponentAbstraction.toFixed(4);
  session.stage.dataset["kpAntiderivativeInstantiationBaseProgress"] =
    skeletonization.targetBaseInstantiation.toFixed(4);
  session.stage.dataset["kpAntiderivativeInstantiationExponentProgress"] =
    skeletonization.targetExponentInstantiation.toFixed(4);
  return Object.freeze({ panelPresence, visualProjection });
}

interface SkeletonizationState {
  readonly sourceBaseAbstraction: number;
  readonly sourceExponentAbstraction: number;
  readonly fixedPatternPresence: number;
  readonly targetBaseInstantiation: number;
  readonly targetExponentInstantiation: number;
}

function skeletonizationState(
  template: ReturnType<typeof sampleKpAntiderivativeRuleTemplateApplication>,
  projection: "full" | "reduced" | "no-depth",
  lensOverride?: RuleLensView | undefined
): SkeletonizationState {
  if (lensOverride !== undefined) {
    const abstract = lensOverride === "abstract";
    if (ruleLensPhase(template) === "match") {
      return Object.freeze({
        sourceBaseAbstraction: abstract ? 1 : 0,
        sourceExponentAbstraction: abstract ? 1 : 0,
        fixedPatternPresence: abstract ? 1 : 0,
        targetBaseInstantiation: 0,
        targetExponentInstantiation: 0
      });
    }
    return Object.freeze({
      sourceBaseAbstraction: 1,
      sourceExponentAbstraction: 1,
      fixedPatternPresence: 0,
      targetBaseInstantiation: abstract ? 0 : 1,
      targetExponentInstantiation: abstract ? 0 : 1
    });
  }
  if (projection !== "full") {
    const instantiated = template.rewriteCommitProgress >= 0.5 ? 1 : 0;
    return Object.freeze({
      sourceBaseAbstraction: 0,
      sourceExponentAbstraction: 0,
      fixedPatternPresence: 0,
      targetBaseInstantiation: instantiated,
      targetExponentInstantiation: instantiated
    });
  }
  const instantiation = template.instantiationProgress;
  return Object.freeze({
    // The two u occurrences abstract as one binding before n becomes general.
    sourceBaseAbstraction: template.patternProjectionProgress,
    sourceExponentAbstraction: template.matchProgress,
    // Identical fixed glyphs hand off atomically at the registered pixel;
    // crossfading them would create a darker duplicate instead of abstraction.
    fixedPatternPresence: template.patternProjectionProgress > 0 ? 1 : 0,
    // Reverse skeletonization first restores u, then propagates n to both uses.
    targetBaseInstantiation: intervalProgress(instantiation, 0, 0.58),
    targetExponentInstantiation: intervalProgress(instantiation, 0.28, 1)
  });
}

function applySkeletonizationPaintState(
  session: TransitMountSession,
  state: SkeletonizationState
): void {
  const authority = session.plan.choreography.ruleTemplateApplication;
  const baseBinding = authority.metavariableBindings.find(
    ({ metavariable }) => metavariable === "u"
  );
  const exponentBinding = authority.metavariableBindings.find(
    ({ metavariable }) => metavariable === "n"
  );
  if (baseBinding === undefined || exponentBinding === undefined) {
    throw new Error("Antiderivative skeletonization requires u and n bindings.");
  }
  const sourcePresenceById = new Map<string, number>([
    ...baseBinding.sourceSelectorIds.map((id) =>
      [id, 1 - state.sourceBaseAbstraction] as const
    ),
    ...exponentBinding.sourceSelectorIds.map((id) =>
      [id, 1 - state.sourceExponentAbstraction] as const
    )
  ]);
  if (
    state.sourceBaseAbstraction > 0 ||
    state.sourceExponentAbstraction > 0
  ) {
    for (const [selectorId, presence] of sourcePresenceById) {
      const token = findNativeMotionToken(session.roots.source, selectorId);
      if (token === undefined) {
        throw new Error(
          `Antiderivative skeletonization cannot resolve ${selectorId}.`
        );
      }
      token.style.opacity = presence.toFixed(4);
    }
    const slotIds = new Set(sourcePresenceById.keys());
    for (const selectorId of
      session.plan.choreography.operatorApplication.operatorSelectorIds) {
      if (slotIds.has(selectorId)) continue;
      const token = findNativeMotionToken(session.roots.source, selectorId);
      if (token === undefined) continue;
      const existingPresence = Number(token.style.opacity || "1");
      token.style.opacity = (
        existingPresence * (1 - state.fixedPatternPresence)
      ).toFixed(4);
    }
  }
  for (const slot of session.templateReceiver.querySelectorAll<HTMLElement>(
    "[data-kp-antiderivative-pattern-slot]"
  )) {
    const slotId = slot.dataset["kpAntiderivativePatternSlot"];
    const presence = slotId === "n"
      ? state.sourceExponentAbstraction
      : state.sourceBaseAbstraction;
    slot.style.setProperty(
      "--kp-antiderivative-pattern-slot-presence",
      presence.toFixed(4)
    );
  }
  for (const token of session.roots.target.querySelectorAll<HTMLElement>(
    "[data-kp-antiderivative-rule-template-slot]"
  )) {
    const metavariable = token.dataset["kpAntiderivativeRuleTemplateSlot"];
    const progress = metavariable === "n"
      ? state.targetExponentInstantiation
      : state.targetBaseInstantiation;
    token.style.setProperty(
      "--kp-antiderivative-template-slot-presence",
      (1 - progress).toFixed(4)
    );
    token.style.setProperty(
      "--kp-antiderivative-bound-value-presence",
      progress.toFixed(4)
    );
  }
}

interface SchemaProjectionState {
  readonly sourceInkPresence: number;
  readonly patternInkPresence: number;
  readonly targetInkPresence: number;
  readonly primaryRepresentation:
    | "source"
    | "schema-pattern"
    | "replacement-template"
    | "instantiated-rewrite"
    | "committed-rewrite"
    | "turnover";
}

function schemaProjectionState(
  template: ReturnType<typeof sampleKpAntiderivativeRuleTemplateApplication>,
  projection: "full" | "reduced" | "no-depth",
  lensOverride?: RuleLensView | undefined
): SchemaProjectionState {
  if (lensOverride !== undefined) {
    const phase = ruleLensPhase(template);
    if (phase === "match") {
      return Object.freeze({
        sourceInkPresence: 1,
        patternInkPresence: lensOverride === "abstract" ? 1 : 0,
        targetInkPresence: 0,
        primaryRepresentation: lensOverride === "abstract"
          ? "schema-pattern" as const
          : "source" as const
      });
    }
    return Object.freeze({
      sourceInkPresence: 0,
      patternInkPresence: 0,
      targetInkPresence: 1,
      primaryRepresentation: lensOverride === "abstract"
        ? "replacement-template" as const
        : "instantiated-rewrite" as const
    });
  }
  if (projection !== "full") {
    const committed = template.rewriteCommitProgress >= 0.5;
    return Object.freeze({
      sourceInkPresence: committed ? 0 : 1,
      patternInkPresence: 0,
      targetInkPresence: committed ? 1 : 0,
      primaryRepresentation: committed
        ? "committed-rewrite" as const
        : "source" as const
    });
  }
  // Skeletonization keeps one composited equation surface: the source retains
  // layout while its concrete leaves yield paint to registered abstract slots.
  // Source and pattern roots may both participate without duplicating a glyph.
  const sourceInkPresence = Math.max(
    1 - template.patternProjectionProgress,
    template.patternProjectionPresence
  );
  const patternInkPresence = template.patternProjectionPresence;
  const targetInkPresence = template.targetPresence;
  const primaryRepresentation = template.rewriteCommitProgress >= 1
    ? "committed-rewrite" as const
    : targetInkPresence > 0.01
      ? template.instantiationProgress >= 1
        ? "instantiated-rewrite" as const
        : "replacement-template" as const
      : patternInkPresence > 0.01
        ? "schema-pattern" as const
        : sourceInkPresence > 0.01
          ? "source" as const
          : "turnover" as const;
  return Object.freeze({
    sourceInkPresence,
    patternInkPresence,
    targetInkPresence,
    primaryRepresentation
  });
}

function ruleLensPhase(
  template: ReturnType<typeof sampleKpAntiderivativeRuleTemplateApplication>
): RuleLensPhase {
  switch (template.explanationBeatId) {
    case "instantiate-template":
    case "propagate-binding":
    case "explain-closure":
    case "commit-rewrite":
    case "prepare-reduction":
      return "replacement";
    default:
      return "match";
  }
}

function syncRuleLensControl(
  session: TransitMountSession,
  template: ReturnType<typeof sampleKpAntiderivativeRuleTemplateApplication>,
  visualProjection: SchemaProjectionState
): void {
  const phase = ruleLensPhase(template);
  const view = visualProjection.primaryRepresentation === "schema-pattern" ||
      visualProjection.primaryRepresentation === "replacement-template"
    ? "abstract"
    : visualProjection.primaryRepresentation === "turnover"
      ? "turnover"
      : "concrete";
  const toggle = session.ruleLensControl.querySelector<HTMLButtonElement>(
    "[data-kp-antiderivative-rule-lens-toggle]"
  );
  if (toggle === null) {
    throw new Error("Antiderivative Rule Lens requires its toggle.");
  }
  const label = phase === "match"
    ? view === "abstract" ? "Show instance" : "Show pattern"
    : view === "abstract" ? "Show bound form" : "Show template";
  toggle.textContent = label;
  toggle.setAttribute("aria-label", label);
  toggle.setAttribute("aria-pressed", view === "abstract" ? "true" : "false");
  toggle.dataset["kpAntiderivativeRuleLensPhase"] = phase;
  toggle.dataset["kpAntiderivativeRuleLensView"] = view;
  session.ruleLensControl.dataset["kpAntiderivativeRuleLensPhase"] = phase;
  session.ruleLensControl.dataset["kpAntiderivativeRuleLensView"] = view;
  session.stage.dataset["kpAntiderivativeRuleLensPhase"] = phase;
  session.stage.dataset["kpAntiderivativeRuleLensView"] = view;
  session.stage.dataset["kpAntiderivativeRuleLensOverride"] =
    session.ruleLensOverride ?? "automatic";
}

function applyInstructionalRuleLayerState(
  session: TransitMountSession,
  template: ReturnType<typeof sampleKpAntiderivativeRuleTemplateApplication>,
  visualProjection: SchemaProjectionState
): void {
  const pattern = session.templateReceiver.querySelector<HTMLElement>(
    "[data-kp-antiderivative-rule-pattern-projection]"
  );
  if (pattern === null) {
    throw new Error(
      "Antiderivative rule application lacks its instructional pattern."
    );
  }
  pattern.dataset["kpSemanticTraceRole"] = template.traceRole;
  pattern.dataset["kpSemanticSalienceLevel"] =
    visualProjection.patternInkPresence > 0.01 ? "focus" : "context";
  pattern.style.transform = "translate3d(-50%, -50%, 0)";
  pattern.style.clipPath = "none";
  pattern.style.opacity = visualProjection.patternInkPresence.toFixed(4);
}

function applyNativeRuleApplicationState(
  session: TransitMountSession,
  template: ReturnType<typeof sampleKpAntiderivativeRuleTemplateApplication>,
  visualProjection: SchemaProjectionState
): "source-native" | "rule-application-native" | "target-native" {
  const commit = template.rewriteCommitProgress;
  session.roots.source.style.opacity =
    visualProjection.sourceInkPresence.toFixed(4);
  session.roots.target.style.opacity =
    visualProjection.targetInkPresence.toFixed(4);
  session.roots.source.style.transform = "none";
  session.roots.target.style.transform = "none";
  session.roots.source.style.clipPath = "none";
  session.roots.target.style.clipPath = "none";
  session.roots.target.style.setProperty(
    "--kp-antiderivative-prospective-depth",
    (template.targetPresence * (1 - commit)).toFixed(4)
  );
  // The canonical target remains stationary and owns the only fraction rule.
  // Schema projection is a change of semantic owner, not a spatial transit.
  session.roots.target.style.filter = "none";
  session.roots.target.dataset["kpAntiderivativeProspectivePlacement"] =
    "center";
  session.roots.target.dataset["kpSemanticTraceRole"] = template.traceRole;
  session.roots.target.dataset["kpAntiderivativeInstantiatedResultOwner"] =
    "canonical-target-native";

  if (
    session.ruleLensOverride === "concrete" &&
    ruleLensPhase(template) === "match"
  ) {
    // The authored operator may already have faded at this semantic instant.
    // Concrete inspection restores its native paint without restoring semantic
    // ownership or changing the playhead.
    for (const selectorId of
      session.plan.choreography.operatorApplication.operatorSelectorIds) {
      for (const element of semanticPaintOwners(session.stage, selectorId)) {
        element.style.opacity = "1";
      }
    }
    session.stage.dataset["kpAntiderivativeOperatorOpacity"] = "1";
  }

  if (commit >= 1) return "target-native";
  if (
    visualProjection.targetInkPresence > 0.01 ||
    visualProjection.patternInkPresence > 0.01
  ) return "rule-application-native";
  return "source-native";
}

function resetEndpointPresentation(session: TransitMountSession): void {
  for (const root of [session.roots.source, session.roots.target]) {
    root.style.opacity = "1";
    root.style.visibility = "visible";
    root.style.transform = "none";
    root.style.translate = "none";
    root.style.scale = "none";
    root.style.filter = "none";
    root.style.color = "";
    root.style.clipPath = "none";
    root.querySelectorAll<HTMLElement>("[data-kp-motion-id]")
      .forEach((token) => {
        token.style.opacity = "1";
        token.style.visibility = "visible";
        token.style.transform = "none";
        token.style.translate = "none";
        token.style.scale = "none";
        token.style.filter = "none";
        token.style.color = "";
        delete token.dataset["kpEquationMaterialNativeHidden"];
        delete token.dataset["kpAntiderivativeTemplatePaintRole"];
      });
  }
}

function applyOperatorAndScopeSalience(
  session: TransitMountSession,
  frame: ReturnType<typeof sampleKpAntiderivativePowerChoreography>,
  projection: "full" | "reduced" | "no-depth"
): void {
  const focusStrength = projection === "no-depth"
    ? 0
    : frame.focus.operatorApplication;
  const scopeStrength = projection === "no-depth"
    ? 0
    : frame.focus.integrandScope;
  const operatorOpacity = projection === "no-depth"
    ? frame.rewriteProgress < 0.5 ? 1 : 0
    : frame.operator.opacity;
  const salience = (strength: number) => resolveKpSemanticSalience({
    baseLevel: "normal",
    identityFamily: "neutral",
    presence: 1,
    signals: strength > 0.01 ? ["focused"] : []
  }).state;
  const operatorState = salience(focusStrength);
  const scopeState = salience(scopeStrength);
  for (const selectorId of
    session.plan.choreography.operatorApplication.operatorSelectorIds) {
    for (const element of semanticPaintOwners(session.stage, selectorId)) {
      element.style.opacity = String(operatorOpacity);
      element.dataset["kpSemanticSalienceLevel"] = operatorState.level;
      element.dataset["kpSemanticIdentityFamily"] =
        operatorState.identityFamily;
      element.style.filter =
        `brightness(${(1 + 0.1 * focusStrength).toFixed(4)})`;
    }
  }
  for (const selectorId of
    session.plan.choreography.operatorApplication.argumentSelectorIds) {
    for (const element of semanticPaintOwners(session.stage, selectorId)) {
      element.dataset["kpSemanticSalienceLevel"] = scopeState.level;
      element.dataset["kpSemanticIdentityFamily"] =
        scopeState.identityFamily;
      element.style.filter =
        `brightness(${(1 + 0.1 * scopeStrength).toFixed(4)})`;
    }
  }
  session.stage.dataset["kpAntiderivativeOperatorPresentation"] =
    "salience-only";
  session.stage.dataset["kpAntiderivativeOperatorOpacity"] =
    String(operatorOpacity);
  session.stage.dataset["kpAntiderivativeOperatorSalienceStrength"] =
    focusStrength.toFixed(4);
  session.stage.dataset["kpAntiderivativeIntegrandSalienceStrength"] =
    scopeStrength.toFixed(4);
}

function semanticPaintOwners(
  stage: HTMLElement,
  selectorId: string
): readonly HTMLElement[] {
  return [
    ...stage.querySelectorAll<HTMLElement>("[data-kp-motion-id]"),
    ...stage.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-semantic-entity-id]"
    )
  ].filter((element) =>
    element.dataset["kpMotionId"]?.endsWith(selectorId) === true ||
    element.dataset["kpAntiderivativeTemplateSourceSelectorId"] === selectorId ||
    element.dataset["kpEquationMaterialSemanticEntityId"] === selectorId
  );
}

function findNativeMotionToken(
  root: HTMLElement,
  selectorId: string
): HTMLElement | undefined {
  return [...root.querySelectorAll<HTMLElement>("[data-kp-motion-id]")]
    .find((candidate) =>
      candidate.dataset["kpMotionId"]?.endsWith(selectorId) === true
    );
}

function centerX(rect: DOMRect): number {
  return rect.left + rect.width / 2;
}

function centerY(rect: DOMRect): number {
  return rect.top + rect.height / 2;
}

function settleAccessibility(
  session: TransitMountSession,
  visualProjection: SchemaProjectionState
): void {
  const templateIsAccessible =
    visualProjection.primaryRepresentation === "schema-pattern" ||
    visualProjection.primaryRepresentation === "replacement-template";
  const accessible = visualProjection.targetInkPresence >
      visualProjection.sourceInkPresence
    ? "target"
    : "source";
  for (const [side, root] of [
    ["source", session.roots.source],
    ["target", session.roots.target]
  ] as const) {
    const active = !templateIsAccessible && side === accessible;
    root.setAttribute("aria-hidden", active ? "false" : "true");
    if (active) root.removeAttribute("inert");
    else root.setAttribute("inert", "");
  }
  session.stage.dataset["kpAntiderivativePowerAccessibleEndpoint"] =
    templateIsAccessible ? "rule-template" : accessible;
}

function showNativeCheckpoint(
  session: TransitMountSession,
  progress: number
): void {
  syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
  session.roots.target.style.setProperty(
    "--kp-antiderivative-template-slot-presence",
    "0"
  );
  session.roots.target.style.setProperty(
    "--kp-antiderivative-bound-value-presence",
    "1"
  );
  const active = progress < 0.5 ? "source" : "target";
  for (const [side, root] of [
    ["source", session.roots.source],
    ["target", session.roots.target]
  ] as const) {
    const visible = side === active;
    root.style.opacity = visible ? "1" : "0";
    root.style.visibility = visible ? "visible" : "hidden";
    root.style.transform = "none";
    root.style.filter = "none";
    root.setAttribute("aria-hidden", visible ? "false" : "true");
    if (visible) root.removeAttribute("inert");
    else root.setAttribute("inert", "");
    root.querySelectorAll<HTMLElement>("[data-kp-motion-id]")
      .forEach((token) => {
        token.style.opacity = "1";
        token.style.visibility = "visible";
        token.style.transform = "none";
        token.style.filter = "none";
        delete token.dataset["kpEquationMaterialNativeHidden"];
      });
  }
  session.stage.dataset["kpAntiderivativePowerAccessibleEndpoint"] = active;
}

function requireEndpointRoots(stage: HTMLElement): {
  readonly roots: {
    readonly source: HTMLElement;
    readonly target: HTMLElement;
  };
  readonly objectIds: {
    readonly source: string;
    readonly target: string;
  };
} {
  const sourceObject = stage.querySelector<HTMLElement>(
    '[data-kp-editor-equation-object-id$=".initial"]'
  );
  const targetObject = stage.querySelector<HTMLElement>(
    '[data-kp-editor-equation-object-id$=".expanded"]'
  );
  const source = sourceObject?.closest<HTMLElement>(
    "[data-kp-editor-equation-source], [data-kp-editor-equation-target]"
  );
  const target = targetObject?.closest<HTMLElement>(
    "[data-kp-editor-equation-source], [data-kp-editor-equation-target]"
  );
  const sourceId = sourceObject?.dataset["kpEditorEquationObjectId"];
  const targetId = targetObject?.dataset["kpEditorEquationObjectId"];
  if (
    source === null || source === undefined ||
    target === null || target === undefined ||
    sourceId === undefined || targetId === undefined
  ) {
    throw new Error(
      "Antiderivative transit requires initial and expanded Catalogue endpoints."
    );
  }
  return {
    roots: Object.freeze({ source, target }),
    objectIds: Object.freeze({ source: sourceId, target: targetId })
  };
}

function selectorIdFromMotionId(token: HTMLElement): string {
  const motionId = token.dataset["kpMotionId"];
  const marker = ".expression.generated.calculus.integral.power-rule-";
  // The annotation id contains the object id before the selector id; take the
  // final occurrence so paint ownership binds to the selector, not its prefix.
  const markerIndex = motionId?.lastIndexOf(marker) ?? -1;
  if (motionId === undefined || markerIndex < 0) {
    throw new Error("Antiderivative native paint lacks a governed selector id.");
  }
  return motionId.slice(markerIndex + 1);
}

function bindSemanticGroups(root: HTMLElement): void {
  for (const attribute of [
    "data-kp-antiderivative-integrand-scope",
    "data-kp-antiderivative-differential-binding",
    "data-kp-antiderivative-exact-quotient",
    "data-kp-antiderivative-integration-constant"
  ]) {
    root.querySelectorAll<HTMLElement>(`[${attribute}]`).forEach((element) => {
      const entityId = element.getAttribute(attribute);
      if (entityId === null) return;
      element.dataset["kpSemanticEntityId"] = entityId;
      element.dataset["kpPresentationGroupId"] = entityId;
    });
  }
}

function semanticProgress(frame: PendingFrame): number {
  return frame.direction === "forward"
    ? frame.localProgress
    : 1 - frame.localProgress;
}

function publishRepairGap(session: TransitMountSession): void {
  session.stage.dataset["kpAntiderivativePowerTransit"] = "repair-gap";
  session.stage.dataset["kpAntiderivativePowerRepairGap"] =
    kpAntiderivativePowerTransitRepairGapCode;
  session.stage.dataset["kpAntiderivativePowerRepairGapReason"] =
    session.failure ?? "Native KaTeX transit preparation did not complete.";
}

function clearTelemetry(stage: HTMLElement): void {
  delete stage.dataset["kpAntiderivativePowerTransit"];
  delete stage.dataset["kpAntiderivativePowerTransitMechanismId"];
  delete stage.dataset["kpAntiderivativeTemplateProfileId"];
  delete stage.dataset["kpAntiderivativePowerTransitDynamicTrackCount"];
  delete stage.dataset["kpAntiderivativePowerTransitProgress"];
  delete stage.dataset["kpAntiderivativePowerSemanticProgress"];
  delete stage.dataset["kpAntiderivativePowerVisualOwner"];
  delete stage.dataset["kpAntiderivativePowerAccessibilityProjection"];
  delete stage.dataset["kpAntiderivativePowerAccessibleEndpoint"];
  delete stage.dataset["kpAntiderivativePowerRepairGap"];
  delete stage.dataset["kpAntiderivativePowerRepairGapReason"];
  delete stage.dataset["kpAntiderivativeOperatorPresentation"];
  delete stage.dataset["kpAntiderivativeOperatorOpacity"];
  delete stage.dataset["kpAntiderivativeOperatorSalienceStrength"];
  delete stage.dataset["kpAntiderivativeIntegrandSalienceStrength"];
  delete stage.dataset["kpAntiderivativeTemplateApplication"];
  delete stage.dataset["kpAntiderivativeTemplateTraceRole"];
  delete stage.dataset["kpAntiderivativeTemplateReceiverFocus"];
  delete stage.dataset["kpAntiderivativeRuleTemplatePanelPresence"];
  delete stage.dataset["kpAntiderivativeMetavariableBindingsPresence"];
  delete stage.dataset["kpAntiderivativeInstantiatedResultPresence"];
  delete stage.dataset["kpAntiderivativeRuleMatchProgress"];
  delete stage.dataset["kpAntiderivativeRuleMatchPresence"];
  delete stage.dataset["kpAntiderivativeRuleInstantiationProgress"];
  delete stage.dataset["kpAntiderivativeRuleRewriteCommitProgress"];
  delete stage.dataset["kpAntiderivativeTemplateVacancyPresence"];
  delete stage.dataset["kpAntiderivativeTemplateVacancyCount"];
  delete stage.dataset["kpAntiderivativeInstantiatedResultOwner"];
  delete stage.dataset["kpAntiderivativeTemplateReceiverSettlementProgress"];
  delete stage.dataset["kpAntiderivativeTemplateLawRefId"];
  delete stage.dataset["kpAntiderivativeTemplateScaffoldPresence"];
  delete stage.dataset["kpAntiderivativeTemplateBindingProgress"];
  delete stage.dataset["kpAntiderivativeTemplateSyntaxPresence"];
  delete stage.dataset["kpAntiderivativeTemplateSyntaxResolutionProgress"];
  delete stage.dataset["kpAntiderivativeTemplateClosurePresence"];
  delete stage.dataset["kpAntiderivativeFixedSyntaxOwner"];
  delete stage.dataset["kpAntiderivativeDepthLens"];
  delete stage.dataset["kpAntiderivativeSchemaPlanePresence"];
  delete stage.dataset["kpAntiderivativeCorrespondencePlanePresence"];
  delete stage.dataset["kpAntiderivativeProspectivePlaneDepth"];
  delete stage.dataset["kpAntiderivativeBindingRelationCount"];
  delete stage.dataset["kpAntiderivativeBindingRelationPresence"];
  delete stage.dataset["kpAntiderivativeRegistrationFrameCount"];
  delete stage.dataset["kpAntiderivativeSchemaProjection"];
  delete stage.dataset["kpAntiderivativePrimaryRepresentation"];
  delete stage.dataset["kpAntiderivativePrimaryRepresentationCount"];
  delete stage.dataset["kpAntiderivativeRuleLensPhase"];
  delete stage.dataset["kpAntiderivativeRuleLensView"];
  delete stage.dataset["kpAntiderivativeRuleLensOverride"];
  delete stage.dataset["kpAntiderivativeSkeletonization"];
  delete stage.dataset["kpAntiderivativeSkeletonBaseProgress"];
  delete stage.dataset["kpAntiderivativeSkeletonExponentProgress"];
  delete stage.dataset["kpAntiderivativeInstantiationBaseProgress"];
  delete stage.dataset["kpAntiderivativeInstantiationExponentProgress"];
  delete stage.dataset["kpAntiderivativeSkeletonizationRegistrationCount"];
  delete stage.dataset["kpAntiderivativeSkeletonizationRegistrationError"];
}

function bounded(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function intervalProgress(value: number, start: number, end: number): number {
  if (end <= start) return value >= end ? 1 : 0;
  return bounded((value - start) / (end - start));
}
