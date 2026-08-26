import type { KpAnimationAsset } from "../animation/asset.ts";
import {
  sampleKpAntiderivativePowerChoreography,
  sampleKpAntiderivativeRuleTemplateApplication
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
  KP_EDITOR_ANIMATION_DISPOSE_EVENT
} from "./animation-player-controller.ts";
export const kpAntiderivativePowerTransitRepairGapCode =
  "repair-gap.integration-power-rule.native-katex-transit-unavailable";
export const kpAntiderivativeRuleApplicationNativeKatexMechanismId =
  "kp.rendering.native-katex.antiderivative-rule-application.v1";
export const kpAntiderivativeRuleApplicationPresentationProfileId =
  "kp.rendering.native-katex.antiderivative-rule-application-exemplar.v1";

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
  readonly fontReadiness: ReturnType<typeof createKpEquationFontReadiness>;
  generation: number;
  pending: PendingFrame;
  ready: boolean;
  failure?: string | undefined;
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
  if (
    transformation === undefined ||
    !input.activeTransformationIds.includes(transformation.id)
  ) {
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
    session = {
      stage: input.stage,
      player: input.player,
      contentKey: input.contentKey,
      cacheRevision: input.hotPath.revision,
      roots: endpoints.roots,
      objectIds: endpoints.objectIds,
      plan,
      templateReceiver,
      fontReadiness: createKpEquationFontReadiness(
        input.stage.ownerDocument
      ),
      generation: 1,
      pending,
      ready: false,
      disposed: false
    };
    sessions.set(input.stage, session);
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
  session.templateReceiver.remove();
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
  element.setAttribute("aria-hidden", "true");

  const rulePanel = stage.ownerDocument.createElement("div");
  rulePanel.className =
    "editor-equation-stage__antiderivative-rule-template";
  rulePanel.dataset["kpAntiderivativeRuleTemplate"] = template.lawRefId;
  rulePanel.dataset["kpAntiderivativeRulePattern"] = template.patternLatex;
  rulePanel.dataset["kpAntiderivativeRuleReplacementTemplate"] =
    template.replacementTemplateLatex;
  rulePanel.setAttribute("role", "img");
  rulePanel.setAttribute("aria-hidden", "true");

  const matchSlots = template.metavariableBindings.map(({ metavariable }) =>
    createRuleMatchSlot(stage, metavariable)
  );
  const bindings = createRuleTemplateFormula({
    stage,
    className: "editor-equation-stage__antiderivative-rule-bindings",
    dataAttribute: "kpAntiderivativeRuleBindings",
    latex: template.bindingLatex
  });
  rulePanel.append(...matchSlots, bindings);
  element.append(rulePanel);
  stage.append(element);
  return element;
}

function createRuleMatchSlot(
  stage: HTMLElement,
  metavariable: "u" | "n"
): HTMLElement {
  const slot = stage.ownerDocument.createElement("span");
  slot.className = "editor-equation-stage__antiderivative-rule-match-slot";
  slot.dataset["kpAntiderivativeRuleMatchSlot"] = metavariable;
  slot.innerHTML = renderLatexToHtml(metavariable, {
    displayMode: false,
    output: "htmlAndMathml"
  });
  slot.setAttribute("aria-hidden", "true");
  return slot;
}

function createRuleTemplateFormula(input: {
  readonly stage: HTMLElement;
  readonly className: string;
  readonly dataAttribute:
    "kpAntiderivativeRuleBindings";
  readonly latex: string;
}): HTMLElement {
  const formula = input.stage.ownerDocument.createElement("div");
  formula.className = input.className;
  formula.dataset[input.dataAttribute] = input.latex;
  formula.innerHTML = renderLatexToHtml(input.latex, {
    displayMode: false,
    output: "htmlAndMathml"
  });
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
  session.templateReceiver.dataset["kpSemanticTraceRole"] = "absent";
  session.templateReceiver.setAttribute("aria-hidden", "true");
  session.templateReceiver.setAttribute("inert", "");
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
    positionRuleMatchSlots(session);
    session.ready = true;
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

function positionRuleMatchSlots(session: TransitMountSession): void {
  const stageRect = session.stage.getBoundingClientRect();
  const bindings = session.plan.choreography.ruleTemplateApplication
    .metavariableBindings;
  for (const binding of bindings) {
    const slot = session.templateReceiver.querySelector<HTMLElement>(
      `[data-kp-antiderivative-rule-match-slot="${binding.metavariable}"]`
    );
    const sourceSelectorId = binding.metavariable === "u"
      ? session.plan.choreography.persistentBase.sourceSelectorId
      : session.plan.choreography.exponentBranch.sourceSelectorId;
    const source = [...session.roots.source.querySelectorAll<HTMLElement>(
      "[data-kp-motion-id]"
    )].find((element) =>
      element.dataset["kpMotionId"]?.endsWith(sourceSelectorId) === true
    );
    if (slot === null || source === undefined) {
      throw new Error(
        `Antiderivative rule match cannot place ${binding.metavariable}.`
      );
    }
    const sourceRect = source.getBoundingClientRect();
    slot.style.left = `${sourceRect.left - stageRect.left +
      sourceRect.width / 2}px`;
    slot.style.top = `${sourceRect.top - stageRect.top}px`;
    slot.dataset["kpAntiderivativeRuleMatchSourceSelectorId"] =
      sourceSelectorId;
  }
}

function applyFrame(session: TransitMountSession): void {
  if (!session.ready) return;
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
  // The generic equation sampler runs earlier in the shared host. Restore the
  // native endpoints before projecting this exemplar's deterministic presence
  // and trace roles, or inherited transforms would move the matched subject.
  resetEndpointPresentation(session);
  syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
  positionRuleMatchSlots(session);
  applyOperatorAndScopeSalience(session, frame, projection);
  const templatePanelPresence = applyRuleTemplateApplicationState(
    session,
    ruleApplication
  );
  const visualOwner = applyNativeRuleApplicationState(
    session,
    ruleApplication,
    projection
  );
  settleAccessibility(
    session,
    ruleApplication.rewriteCommitProgress,
    templatePanelPresence
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
  template: ReturnType<typeof sampleKpAntiderivativeRuleTemplateApplication>
): number {
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-rule-template-panel-presence",
    template.panelPresence.toFixed(4)
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-rule-match-presence",
    template.matchPresence.toFixed(4)
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-metavariable-bindings-presence",
    template.metavariableBindingsPresence.toFixed(4)
  );
  session.templateReceiver.dataset["kpSemanticTraceRole"] =
    template.traceRole;
  const templateAuthority =
    session.plan.choreography.ruleTemplateApplication;
  const rulePanel = session.templateReceiver.querySelector<HTMLElement>(
    "[data-kp-antiderivative-rule-template]"
  );
  if (rulePanel === null) {
    throw new Error("Antiderivative rewrite lacks its rule-template panel.");
  }
  const panelIsPresent = template.panelPresence > 0.01;
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
  const [baseBinding, exponentBinding] =
    templateAuthority.metavariableBindings;
  rulePanel.setAttribute(
    "aria-label",
    template.instantiationProgress > 0.01
      ? `Instantiated power-rule result: ${baseBinding.value} carries into the result and ${exponentBinding.value} fills both exponent slots before evaluation.`
      : template.metavariableBindingsPresence > 0.01
        ? `Power rule binding: u maps to ${baseBinding.value}, and n maps to ${exponentBinding.value}.`
        : "Power-rule match: u to the n matches the integrand's base and exponent."
  );
  const semanticIds = [
    ...session.plan.choreography.ruleTemplateApplication
      .scaffoldSemanticEntityIds,
    ...session.plan.choreography.ruleTemplateApplication.fixedSyntaxGroups
      .flatMap(({ selectorIds }) => selectorIds),
    ...session.plan.choreography.ruleTemplateApplication.closureSelectorIds
  ];
  for (const semanticId of semanticIds) {
    for (const element of semanticPaintOwners(session.stage, semanticId)) {
      element.dataset["kpSemanticTraceRole"] = template.traceRole;
      element.dataset["kpAntiderivativeTemplatePaintRole"] = "grammar";
      element.dataset["kpSemanticSalienceLevel"] =
        template.instantiationProgress > 0.01 &&
          template.rewriteCommitProgress < 1 ? "focus" : "normal";
      element.style.color = template.receiverFocus > 0.01
        ? "var(--kp-catalogue-link)"
        : "";
      element.style.filter =
        `brightness(${(1 + 0.12 * template.receiverFocus).toFixed(4)})`;
    }
  }
  const receiverIds = session.plan.choreography.ruleTemplateApplication
    .bindingRelations.flatMap((relation) => [
      relation.sourceSelectorId,
      ...relation.targetSelectorIds
    ]);
  for (const semanticId of receiverIds) {
    for (const element of semanticPaintOwners(session.stage, semanticId)) {
      element.dataset["kpAntiderivativeTemplatePaintRole"] = "binding";
      element.dataset["kpSemanticSalienceLevel"] =
        (template.matchPresence > 0.01 ||
          template.instantiationProgress > 0.01) &&
          template.rewriteCommitProgress < 1
          ? "focus"
          : "normal";
      element.style.color = "";
      element.style.filter =
        `brightness(${(1 + 0.08 * template.receiverFocus).toFixed(4)})`;
    }
  }
  session.stage.dataset["kpAntiderivativeTemplateApplication"] =
    "match-bind-instantiate-rewrite";
  session.stage.dataset["kpAntiderivativeTemplateTraceRole"] =
    template.traceRole;
  session.stage.dataset["kpAntiderivativeTemplateReceiverFocus"] =
    template.receiverFocus.toFixed(4);
  session.stage.dataset["kpAntiderivativeRuleTemplatePanelPresence"] =
    template.panelPresence.toFixed(4);
  session.stage.dataset["kpAntiderivativeMetavariableBindingsPresence"] =
    template.metavariableBindingsPresence.toFixed(4);
  session.stage.dataset["kpAntiderivativeInstantiatedResultPresence"] =
    template.instantiatedResultPresence.toFixed(4);
  session.stage.dataset["kpAntiderivativeRuleMatchProgress"] =
    template.matchProgress.toFixed(4);
  session.stage.dataset["kpAntiderivativeRuleMatchPresence"] =
    template.matchPresence.toFixed(4);
  session.stage.dataset["kpAntiderivativeRuleInstantiationProgress"] =
    template.instantiationProgress.toFixed(4);
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
  return template.panelPresence;
}

function applyNativeRuleApplicationState(
  session: TransitMountSession,
  template: ReturnType<typeof sampleKpAntiderivativeRuleTemplateApplication>,
  projection: "full" | "reduced" | "no-depth"
): "source-native" | "rule-application-native" | "target-native" {
  if (projection === "no-depth") {
    const target = template.rewriteCommitProgress >= 0.5;
    session.roots.source.style.opacity = target ? "0" : "1";
    session.roots.target.style.opacity = target ? "1" : "0";
    return target ? "target-native" : "source-native";
  }

  const commit = template.rewriteCommitProgress;
  const prospective = measureProspectiveTargetTranslation(session);
  const targetOpacity = template.targetPresence * (0.76 + 0.24 * commit);
  session.roots.source.style.opacity = String(template.sourcePresence);
  session.roots.target.style.opacity = targetOpacity.toFixed(4);
  session.roots.target.style.transform = `translate(${
    ((1 - commit) * prospective.x).toFixed(3)
  }px, ${((1 - commit) * prospective.y).toFixed(3)}px)`;
  session.roots.target.dataset["kpAntiderivativeProspectivePlacement"] =
    prospective.lane;
  session.roots.target.dataset["kpSemanticTraceRole"] = template.traceRole;
  session.roots.target.dataset["kpAntiderivativeInstantiatedResultOwner"] =
    "canonical-target-native";

  if (commit >= 1) return "target-native";
  if (template.targetPresence > 0.01) return "rule-application-native";
  return "source-native";
}

function measureProspectiveTargetTranslation(
  session: TransitMountSession
): Readonly<{ x: number; y: number; lane: "right" | "below" }> {
  const sourcePaint = session.roots.source.querySelector<HTMLElement>(
    ".katex-display > .katex, .katex"
  );
  const targetPaint = session.roots.target.querySelector<HTMLElement>(
    ".katex-display > .katex, .katex"
  );
  if (sourcePaint === null || targetPaint === null) {
    throw new Error(
      "Antiderivative rule application cannot measure its native equations."
    );
  }
  const stageRect = session.stage.getBoundingClientRect();
  const sourceRect = sourcePaint.getBoundingClientRect();
  const targetRect = targetPaint.getBoundingClientRect();
  const gap = Math.max(14, sourceRect.height * 0.35);
  const right = sourceRect.right + gap - targetRect.left;
  if (targetRect.right + right <= stageRect.right - 2) {
    return Object.freeze({ x: right, y: 0, lane: "right" as const });
  }
  return Object.freeze({
    x: 0,
    y: Math.max(38, (sourceRect.height + targetRect.height) * 0.62),
    lane: "below" as const
  });
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

function settleAccessibility(
  session: TransitMountSession,
  progress: number,
  templatePanelPresence: number
): void {
  const accessible = progress < 0.5 ? "source" : "target";
  for (const [side, root] of [
    ["source", session.roots.source],
    ["target", session.roots.target]
  ] as const) {
    const active = templatePanelPresence <= 0.01 && side === accessible;
    root.setAttribute("aria-hidden", active ? "false" : "true");
    if (active) root.removeAttribute("inert");
    else root.setAttribute("inert", "");
  }
  session.stage.dataset["kpAntiderivativePowerAccessibleEndpoint"] =
    templatePanelPresence > 0.01 ? "rule-template" : accessible;
}

function showNativeCheckpoint(
  session: TransitMountSession,
  progress: number
): void {
  syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
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
}

function bounded(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}
