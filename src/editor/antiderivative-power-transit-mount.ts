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
  createKpAntiderivativePowerNativeKatexSceneSession,
  createKpAntiderivativePowerNativeKatexTransitPlan,
  kpAntiderivativePowerNativeKatexTransitMechanismId,
  type KpAntiderivativePowerNativeKatexTransitPlan
} from "../rendering/native-katex-antiderivative-power-transit.ts";
import {
  observeKpNativeKatexRenderedScene
} from "../rendering/native-katex-rendered-scene.ts";
import { renderLatexToHtml } from "../rendering/katex-adapter.ts";
import {
  kpAntiderivativeTemplateInstantiationProfileId
} from "../rendering/native-katex-antiderivative-template-instantiation.ts";
import type {
  KpSelectorAnnotatedLatex
} from "../rendering/selector-annotated-latex.ts";
import type {
  KpCanonicalNativeKatexSceneSession
} from "../rendering/native-katex-scene-compositor.ts";
import type {
  KpEditorEquationStageHotPathCache
} from "./equation-stage-hot-path-cache.ts";
import {
  KP_EDITOR_ANIMATION_DISPOSE_EVENT
} from "./animation-player-controller.ts";
import {
  createKpAntiderivativePowerSelectorAnnotatedLatex
} from "./antiderivative-power-semantic-latex.ts";

export const kpAntiderivativePowerTransitRepairGapCode =
  "repair-gap.integration-power-rule.native-katex-transit-unavailable";

export interface KpAntiderivativePowerTransitMountResult {
  readonly status: "inactive" | "preparing" | "mounted" | "repair-gap";
  readonly mechanismId?:
    typeof kpAntiderivativePowerNativeKatexTransitMechanismId | undefined;
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
  canonical?: KpCanonicalNativeKatexSceneSession | undefined;
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
      plan.choreography.ruleTemplateApplication,
      input.animation,
      input.player.dataset["kpEditorAnimationMathLayout"] !== "inline"
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
  if (session.canonical === undefined) {
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
    mechanismId: kpAntiderivativePowerNativeKatexTransitMechanismId
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
  session.canonical?.session.retire({
    kind: "native-katex-paint-preserving-retirement",
    reason,
    structuralSuccession: "retire-preserving-paint"
  });
  session.fontReadiness.dispose();
  syncKpEquationMaterialLayer({ stage, owners: [] });
  session.templateReceiver.remove();
  sessions.delete(stage);
}

function createTemplateReceiver(
  stage: HTMLElement,
  template: KpAntiderivativePowerNativeKatexTransitPlan["choreography"]["ruleTemplateApplication"],
  animation: KpAnimationAsset,
  displayMode: boolean
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
    "--kp-antiderivative-general-rule-presence",
    "0"
  );
  element.style.setProperty(
    "--kp-antiderivative-metavariable-bindings-presence",
    "0"
  );
  element.style.setProperty(
    "--kp-antiderivative-instantiated-rule-presence",
    "0"
  );
  element.setAttribute("aria-hidden", "true");

  const rulePanel = stage.ownerDocument.createElement("div");
  rulePanel.className =
    "editor-equation-stage__antiderivative-rule-template";
  rulePanel.dataset["kpAntiderivativeRuleTemplate"] = template.lawRefId;
  rulePanel.setAttribute("role", "img");
  rulePanel.setAttribute("aria-hidden", "true");

  const formulaStack = stage.ownerDocument.createElement("div");
  formulaStack.className =
    "editor-equation-stage__antiderivative-rule-formula-stack";
  const generalRule = createRuleTemplateFormula({
    stage,
    className: "editor-equation-stage__antiderivative-general-rule",
    dataAttribute: "kpAntiderivativeGeneralRule",
    latex: template.generalRuleLatex
  });
  const instantiatedRule = createInstantiatedRuleTemplateFormula({
    stage,
    className: "editor-equation-stage__antiderivative-instantiated-rule",
    dataAttribute: "kpAntiderivativeInstantiatedRule",
    latex: template.instantiatedRuleLatex,
    animation,
    displayMode
  });
  formulaStack.append(generalRule, instantiatedRule);
  const bindings = createRuleTemplateFormula({
    stage,
    className: "editor-equation-stage__antiderivative-rule-bindings",
    dataAttribute: "kpAntiderivativeRuleBindings",
    latex: template.bindingLatex
  });
  rulePanel.append(formulaStack, bindings);
  element.append(rulePanel);
  stage.append(element);
  return element;
}

function createRuleTemplateFormula(input: {
  readonly stage: HTMLElement;
  readonly className: string;
  readonly dataAttribute:
    | "kpAntiderivativeGeneralRule"
    | "kpAntiderivativeRuleBindings"
    | "kpAntiderivativeInstantiatedRule";
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

function createInstantiatedRuleTemplateFormula(input: {
  readonly stage: HTMLElement;
  readonly className: string;
  readonly dataAttribute: "kpAntiderivativeInstantiatedRule";
  readonly latex: string;
  readonly animation: KpAnimationAsset;
  readonly displayMode: boolean;
}): HTMLElement {
  const template = instantiatedRuleTemplateLatex(input.animation);
  if (normalizeTemplateLatex(template.rawLatex) !==
      normalizeTemplateLatex(input.latex)) {
    throw new Error(
      `Antiderivative instantiated template rendered ${template.rawLatex}; ` +
      `expected ${input.latex}.`
    );
  }
  const formula = input.stage.ownerDocument.createElement("div");
  formula.className = input.className;
  formula.dataset[input.dataAttribute] = input.latex;
  const prefix = input.stage.ownerDocument.createElement("span");
  prefix.dataset["kpAntiderivativeInstantiatedPrefix"] = template.sourceLatex;
  prefix.innerHTML = renderLatexToHtml(`${template.sourceLatex} =`, {
    // Match the host's KaTeX math style. A display-style source handed to an
    // inline-style target changes fraction script levels during the move.
    displayMode: input.displayMode,
    output: "htmlAndMathml",
    trust: true
  });
  const result = input.stage.ownerDocument.createElement("span");
  result.dataset["kpAntiderivativeTemplateResult"] =
    template.targetObjectId;
  // Keep this as a standalone KaTeX render. Nesting the annotated RHS inside
  // another htmlData group changed script-level paint ownership on narrow
  // layouts even though the printed formula looked equivalent.
  result.innerHTML = renderLatexToHtml(
    template.targetAnnotated.annotatedLatex,
    {
      displayMode: input.displayMode,
      output: "htmlAndMathml",
      trust: true
    }
  );
  formula.append(prefix, result);
  formula.setAttribute("aria-hidden", "true");
  return formula;
}

interface InstantiatedRuleTemplateLatex {
  readonly rawLatex: string;
  readonly sourceLatex: string;
  readonly targetObjectId: string;
  readonly targetAnnotated: KpSelectorAnnotatedLatex;
}

function instantiatedRuleTemplateLatex(
  animation: KpAnimationAsset
): InstantiatedRuleTemplateLatex {
  const transformation = animation.transformations.find(
    ({ transformType }) => transformType === "applyAntiderivativePowerRule"
  );
  const source = animation.bundle.objects.find(({ id }) =>
    id === transformation?.sourceObjectIds[0]
  );
  const target = animation.bundle.objects.find(({ id }) =>
    id === transformation?.targetObjectIds[0]
  );
  const sourceLatex = semanticObjectLatex(source?.value);
  const targetLatex = semanticObjectLatex(target?.value);
  if (
    transformation === undefined ||
    source === undefined ||
    target === undefined ||
    sourceLatex === undefined ||
    targetLatex === undefined
  ) {
    throw new Error(
      "Antiderivative instantiated template requires exact source and expanded objects."
    );
  }
  const targetAnnotated = createKpAntiderivativePowerSelectorAnnotatedLatex({
    objectId: target.id,
    selectors: target.selectors
  });
  if (targetAnnotated === undefined) {
    throw new Error(
      "Antiderivative instantiated template requires selector-annotated expanded KaTeX."
    );
  }
  return Object.freeze({
    rawLatex: `${sourceLatex} = ${targetLatex}`,
    sourceLatex,
    targetObjectId: target.id,
    targetAnnotated
  });
}

function semanticObjectLatex(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null || !("latex" in value)) {
    return undefined;
  }
  const latex = (value as { readonly latex?: unknown }).latex;
  return typeof latex === "string" ? latex : undefined;
}

function normalizeTemplateLatex(latex: string): string {
  return latex.replace(/\s+/gu, "");
}

function hideTemplateReceiver(session: TransitMountSession): void {
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-rule-template-panel-presence",
    "0"
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-general-rule-presence",
    "0"
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-metavariable-bindings-presence",
    "0"
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-instantiated-rule-presence",
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
    const source = observeKpNativeKatexRenderedScene({
      endpoint: "source",
      stage: session.stage,
      root: session.roots.source,
      semanticEntityId: session.objectIds.source,
      presentationGroupId: `${session.objectIds.source}.root`,
      fontReadiness: session.fontReadiness,
      includeHiddenPaint: true,
      viewportRevision: session.cacheRevision
    });
    const target = observeKpNativeKatexRenderedScene({
      endpoint: "target",
      stage: session.stage,
      root: session.roots.target,
      semanticEntityId: session.objectIds.target,
      presentationGroupId: `${session.objectIds.target}.root`,
      fontReadiness: session.fontReadiness,
      includeHiddenPaint: true,
      viewportRevision: session.cacheRevision
    });
    const templateSourceRoot = requireTemplateSourceRoot(session);
    alignTemplateSourceTypography(session, templateSourceRoot);
    bindTemplateSourceOwnership(session, templateSourceRoot);
    const templateSource = observeKpNativeKatexRenderedScene({
      endpoint: "source",
      stage: session.stage,
      root: templateSourceRoot,
      semanticEntityId: session.objectIds.target,
      presentationGroupId:
        `${session.objectIds.target}.template-instance-rhs`,
      fontReadiness: session.fontReadiness,
      includeHiddenPaint: true,
      viewportRevision: session.cacheRevision
    });
    if (session.disposed || session.generation !== generation) return;
    session.canonical = createKpAntiderivativePowerNativeKatexSceneSession({
      plan: session.plan,
      source,
      target,
      templateSource
    });
    session.stage.dataset["kpAntiderivativePowerTransit"] = "ready";
    session.stage.dataset["kpAntiderivativePowerTransitMechanismId"] =
      kpAntiderivativePowerNativeKatexTransitMechanismId;
    session.stage.dataset["kpAntiderivativeTemplateProfileId"] =
      kpAntiderivativeTemplateInstantiationProfileId;
    session.stage.dataset["kpAntiderivativePowerTransitDynamicTrackCount"] =
      String(session.canonical.executableMotion.dynamicTrackIds.length);
    session.stage.dataset["kpAntiderivativeTemplateHandoffSource"] =
      "instantiated-rule-rhs";
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

function requireTemplateSourceRoot(session: TransitMountSession): HTMLElement {
  const root = session.templateReceiver.querySelector<HTMLElement>(
    "[data-kp-antiderivative-template-result]"
  );
  if (root === null) {
    throw new Error(
      "Antiderivative instantiated rule lacks its annotated RHS source."
    );
  }
  return root;
}

function alignTemplateSourceTypography(
  session: TransitMountSession,
  templateSourceRoot: HTMLElement
): void {
  const targetObject = session.roots.target.querySelector<HTMLElement>(
    ".editor-equation-stage__object"
  );
  const instantiatedRule = templateSourceRoot.closest<HTMLElement>(
    "[data-kp-antiderivative-instantiated-rule]"
  );
  if (targetObject === null || instantiatedRule === null) {
    throw new Error(
      "Antiderivative template handoff cannot resolve target typography."
    );
  }
  // Native fitting may select a smaller display font on narrow hosts. The
  // instantiated RHS must inherit that realized size before measurement or
  // its script glyphs cannot satisfy the compositor's uniform-scale law.
  instantiatedRule.style.fontSize = getComputedStyle(targetObject).fontSize;
}

function bindTemplateSourceOwnership(
  session: TransitMountSession,
  root: HTMLElement
): void {
  root.dataset["kpSemanticEntityId"] = session.objectIds.target;
  root.dataset["kpPresentationGroupId"] =
    `${session.objectIds.target}.template-instance-rhs`;
  root.querySelectorAll<HTMLElement>("[data-kp-motion-id]")
    .forEach((token, index) => {
      const selectorId = selectorIdFromMotionId(token);
      token.dataset["kpSemanticEntityId"] = selectorId;
      token.dataset["kpPresentationGroupId"] =
        `${selectorId}.template-instance`;
      token.dataset["kpAntiderivativeTemplateSourceSelectorId"] = selectorId;
      // The template is an ephemeral native source, not a second canonical
      // endpoint. Namespace its DOM motion IDs so global endpoint queries and
      // review tooling continue to see exactly one canonical selector owner.
      token.dataset["kpMotionId"] =
        `antiderivative-template-source.paint.${index}`;
    });
  bindSemanticGroups(root);
  const fractionRules = root.querySelectorAll<HTMLElement>(".frac-line");
  if (fractionRules.length !== 1) {
    throw new Error(
      `Antiderivative instantiated rule requires one native fraction rule; ` +
      `received ${fractionRules.length}.`
    );
  }
  fractionRules[0]!.dataset["kpAntiderivativeTemplateFractionSource"] =
    "true";
}

function applyFrame(session: TransitMountSession): void {
  if (session.canonical === undefined) return;
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
  // The visible rule must finish before material transit begins. Sampling the
  // compositor from the handoff beat prevents two complete formula owners
  // from crossfading into an unreadable stack of fraction bars.
  const rendererProgress = projection === "full"
    ? frame.ruleTemplateApplication.rewriteHandoffProgress
    : frame.rewriteProgress < 0.5 ? 0 : 1;
  // The generic equation sampler runs earlier in the shared host. Restore the
  // measured native endpoints before cloning so its presentation transforms
  // can never become the compositor's source geometry or paint.
  resetEndpointPresentation(session);
  const ownership = session.canonical.session.apply(rendererProgress);
  applyOperatorAndScopeSalience(session, frame, projection);
  const templatePanelPresence = applyRuleTemplateApplicationState(
    session,
    frame,
    rendererProgress,
    projection
  );
  // The compositor's presentation source is the instantiated template RHS.
  // Retire the earlier integral while that panel or its material successor
  // owns the scene; otherwise it resurfaces beneath the moving fraction.
  session.roots.source.style.opacity =
    templatePanelPresence <= 0.01 && rendererProgress === 0 ? "1" : "0";
  settleAccessibility(session, rendererProgress, templatePanelPresence);
  session.stage.dataset["kpAntiderivativePowerTransit"] = "ready";
  session.stage.dataset["kpAntiderivativePowerTransitProgress"] =
    String(rendererProgress);
  session.stage.dataset["kpAntiderivativePowerSemanticProgress"] =
    String(frame.semanticProgress);
  session.stage.dataset["kpAntiderivativePowerVisualOwner"] =
    ownership.visualOwner;
  session.stage.dataset["kpAntiderivativePowerAccessibilityProjection"] =
    projection;
  delete session.stage.dataset["kpAntiderivativePowerRepairGap"];
  delete session.stage.dataset["kpAntiderivativePowerRepairGapReason"];
}

function applyRuleTemplateApplicationState(
  session: TransitMountSession,
  frame: ReturnType<typeof sampleKpAntiderivativePowerChoreography>,
  rendererProgress: number,
  projection: "full" | "reduced" | "no-depth"
): number {
  const template = projection === "full"
    ? frame.ruleTemplateApplication
    : sampleKpAntiderivativeRuleTemplateApplication(rendererProgress);
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-rule-template-panel-presence",
    template.panelPresence.toFixed(4)
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-general-rule-presence",
    template.generalRulePresence.toFixed(4)
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-metavariable-bindings-presence",
    template.metavariableBindingsPresence.toFixed(4)
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-instantiated-rule-presence",
    template.instantiatedRulePresence.toFixed(4)
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
    template.instantiatedRulePresence > 0.01
      ? `Instantiated power rule: integrate ${baseBinding.value} to the ${exponentBinding.value} power, then rewrite with exponent ${exponentBinding.value} plus one in the numerator and denominator, plus C.`
      : template.metavariableBindingsPresence > 0.01
        ? `Power rule binding: u maps to ${baseBinding.value}, and n maps to ${exponentBinding.value}.`
        : "Power rule template: the integral of u to the n maps to u to the n plus one over n plus one, plus C, when n is not negative one."
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
        template.receiverFocus > 0.01 ? "focus" : "normal";
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
        template.bindingProgress > 0.01 &&
          template.syntaxResolutionProgress < 1
          ? "focus"
          : "normal";
      element.style.color = "";
      element.style.filter =
        `brightness(${(1 + 0.08 * template.receiverFocus).toFixed(4)})`;
    }
  }
  session.stage.dataset["kpAntiderivativeTemplateApplication"] =
    "receiving-scaffold-binding";
  session.stage.dataset["kpAntiderivativeTemplateTraceRole"] =
    template.traceRole;
  session.stage.dataset["kpAntiderivativeTemplateReceiverFocus"] =
    template.receiverFocus.toFixed(4);
  session.stage.dataset["kpAntiderivativeRuleTemplatePanelPresence"] =
    template.panelPresence.toFixed(4);
  session.stage.dataset["kpAntiderivativeGeneralRulePresence"] =
    template.generalRulePresence.toFixed(4);
  session.stage.dataset["kpAntiderivativeMetavariableBindingsPresence"] =
    template.metavariableBindingsPresence.toFixed(4);
  session.stage.dataset["kpAntiderivativeInstantiatedRulePresence"] =
    template.instantiatedRulePresence.toFixed(4);
  session.stage.dataset["kpAntiderivativeRewriteHandoffProgress"] =
    template.rewriteHandoffProgress.toFixed(4);
  session.stage.dataset["kpAntiderivativeTemplateVacancyPresence"] =
    template.vacancyPresence.toFixed(4);
  session.stage.dataset["kpAntiderivativeTemplateReceiverSettlementProgress"] =
    template.receiverSettlementProgress.toFixed(4);
  session.stage.dataset["kpAntiderivativeTemplateLawRefId"] =
    session.plan.choreography.ruleTemplateApplication.lawRefId;
  session.stage.dataset["kpAntiderivativeTemplatePreviewPresence"] =
    template.previewPresence.toFixed(4);
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
  delete stage.dataset["kpAntiderivativeGeneralRulePresence"];
  delete stage.dataset["kpAntiderivativeMetavariableBindingsPresence"];
  delete stage.dataset["kpAntiderivativeInstantiatedRulePresence"];
  delete stage.dataset["kpAntiderivativeRewriteHandoffProgress"];
  delete stage.dataset["kpAntiderivativeTemplateVacancyPresence"];
  delete stage.dataset["kpAntiderivativeTemplateVacancyCount"];
  delete stage.dataset["kpAntiderivativeTemplateHandoffSource"];
  delete stage.dataset["kpAntiderivativeTemplateReceiverSettlementProgress"];
  delete stage.dataset["kpAntiderivativeTemplateLawRefId"];
  delete stage.dataset["kpAntiderivativeTemplatePreviewPresence"];
  delete stage.dataset["kpAntiderivativeTemplateScaffoldPresence"];
  delete stage.dataset["kpAntiderivativeTemplateBindingProgress"];
  delete stage.dataset["kpAntiderivativeTemplateSyntaxPresence"];
  delete stage.dataset["kpAntiderivativeTemplateSyntaxResolutionProgress"];
  delete stage.dataset["kpAntiderivativeTemplateClosurePresence"];
}

function bounded(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}
