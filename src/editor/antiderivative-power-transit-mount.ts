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
  "kp.rendering.native-katex.antiderivative-rule-application-exemplar.v7";

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
  clearInstructionalTemplateSlots(session);
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
  element.style.setProperty(
    "--kp-antiderivative-template-relation-presence",
    "0"
  );
  element.style.setProperty(
    "--kp-antiderivative-template-relation-progress",
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

  const rulePreview = createInstructionalRulePreview(
    stage,
    template.instructionalProjection
  );
  const patternProjection = createInstructionalPatternProjection(
    stage,
    template.instructionalProjection
  );
  const bindings = createRuleTemplateFormula({
    stage,
    className: "editor-equation-stage__antiderivative-rule-bindings",
    dataAttribute: "kpAntiderivativeRuleBindings",
    latex: template.instructionalProjection.bindingLatex,
    annotatedLatex: annotateInstructionalBindingsLatex(
      template.instructionalProjection.bindingLatex
    )
  });
  const relationLayer = createInstructionalRelationLayer(stage);
  rulePanel.append(rulePreview, patternProjection, bindings, relationLayer);
  element.append(rulePanel);
  stage.append(element);
  return element;
}

function createInstructionalRulePreview(
  stage: HTMLElement,
  projection: KpAntiderivativeRuleInstructionalProjection
): HTMLElement {
  const preview = stage.ownerDocument.createElement("div");
  preview.className =
    "editor-equation-stage__antiderivative-rule-preview";
  preview.dataset["kpAntiderivativeRulePreview"] = "transient";
  preview.dataset["kpSemanticTraceRole"] = "absent";
  preview.setAttribute("aria-hidden", "true");

  const pattern = createRuleTemplateFormula({
    stage,
    className:
      "editor-equation-stage__antiderivative-rule-preview-side",
    dataAttribute: "kpAntiderivativeRulePreviewPattern",
    latex: projection.patternLatex,
    annotatedLatex: annotateInstructionalRulePreviewLatex(
      projection.patternLatex
    )
  });
  pattern.dataset["kpAntiderivativeRulePreviewRole"] = "pattern";
  const connector = createRuleTemplateFormula({
    stage,
    className:
      "editor-equation-stage__antiderivative-rule-preview-connector",
    dataAttribute: "kpAntiderivativeRulePreviewConnector",
    latex: String.raw`\Rightarrow`
  });
  connector.dataset["kpAntiderivativeRulePreviewRole"] = "connector";
  const replacement = createRuleTemplateFormula({
    stage,
    className:
      "editor-equation-stage__antiderivative-rule-preview-side",
    dataAttribute: "kpAntiderivativeRulePreviewReplacement",
    latex: projection.replacementTemplateLatex,
    annotatedLatex: annotateInstructionalRulePreviewLatex(
      projection.replacementTemplateLatex
    )
  });
  replacement.dataset["kpAntiderivativeRulePreviewRole"] = "replacement";
  preview.append(pattern, connector, replacement);
  return preview;
}

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

function annotateInstructionalRulePreviewLatex(
  latex: string
): string {
  return latex
    .replace(
      /\bu\b/gu,
      String.raw`{\htmlData{kp-antiderivative-rule-preview-slot=u}{u}}`
    )
    .replace(
      /\bn\b/gu,
      String.raw`{\htmlData{kp-antiderivative-rule-preview-slot=n}{n}}`
    );
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

function annotateInstructionalBindingsLatex(latex: string): string {
  const parts = latex.split(String.raw`,\qquad `);
  if (parts.length !== 2) {
    throw new Error(
      "Antiderivative instructional bindings require u and n relations."
    );
  }
  return String.raw`\htmlData{kp-antiderivative-binding-origin=u}{${parts[0]!}}` +
    String.raw`,\qquad ` +
    String.raw`\htmlData{kp-antiderivative-binding-origin=n}{${parts[1]!}}`;
}

function createInstructionalRelationLayer(stage: HTMLElement): SVGSVGElement {
  const namespace = "http://www.w3.org/2000/svg";
  const svg = stage.ownerDocument.createElementNS(namespace, "svg");
  svg.classList.add(
    "editor-equation-stage__antiderivative-binding-relations"
  );
  svg.dataset["kpAntiderivativeBindingRelations"] = "u-persist-n-fan-out";
  svg.setAttribute("aria-hidden", "true");
  for (const [relation, ordinal] of [
    ["u-persist", "0"],
    ["n-fan-out", "0"],
    ["n-fan-out", "1"]
  ] as const) {
    const line = stage.ownerDocument.createElementNS(namespace, "line");
    line.dataset["kpAntiderivativeBindingRelation"] = relation;
    line.dataset["kpAntiderivativeBindingRelationOrdinal"] = ordinal;
    svg.append(line);
  }
  return svg;
}

function createRuleTemplateFormula(input: {
  readonly stage: HTMLElement;
  readonly className: string;
  readonly dataAttribute:
    | "kpAntiderivativeRuleBindings"
    | "kpAntiderivativeRulePreviewPattern"
    | "kpAntiderivativeRulePreviewConnector"
    | "kpAntiderivativeRulePreviewReplacement"
    | "kpAntiderivativeRulePatternProjection";
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
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-template-relation-presence",
    "0"
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-template-relation-progress",
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
    bindInstructionalTemplateSlots(session);
    prepareInstructionalRelationLayer(session);
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

function prepareInstructionalRelationLayer(
  session: TransitMountSession
): void {
  const layer = session.templateReceiver.querySelector<SVGSVGElement>(
    "[data-kp-antiderivative-binding-relations]"
  );
  const stageRect = session.stage.getBoundingClientRect();
  if (layer === null || stageRect.width <= 0 || stageRect.height <= 0) {
    throw new Error(
      "Antiderivative binding relations require measurable stage geometry."
    );
  }
  layer.setAttribute("viewBox", `0 0 ${stageRect.width} ${stageRect.height}`);
  layer.setAttribute("preserveAspectRatio", "none");
  const origin = (metavariable: "u" | "n"): HTMLElement => {
    const element = session.templateReceiver.querySelector<HTMLElement>(
      `[data-kp-antiderivative-binding-origin="${metavariable}"]`
    );
    if (element === null) {
      throw new Error(
        `Antiderivative relation layer lacks binding origin ${metavariable}.`
      );
    }
    return element;
  };
  const target = (selectorId: string): HTMLElement => {
    const matches = [
      ...session.roots.target.querySelectorAll<HTMLElement>(
        "[data-kp-motion-id]"
      )
    ].filter((candidate) =>
      candidate.dataset["kpMotionId"]?.endsWith(selectorId) === true
    );
    if (matches.length !== 1) {
      throw new Error(
        `Antiderivative relation layer requires one target ${selectorId}.`
      );
    }
    return matches[0]!;
  };
  const relations = [
    {
      line: layer.querySelector<SVGLineElement>(
        '[data-kp-antiderivative-binding-relation="u-persist"]'
      ),
      from: origin("u"),
      to: target(session.plan.choreography.persistentBase.targetSelectorId)
    },
    ...session.plan.choreography.exponentBranch.targetSelectorIds.map(
      (selectorId, ordinal) => ({
        line: layer.querySelector<SVGLineElement>(
          `[data-kp-antiderivative-binding-relation="n-fan-out"]` +
          `[data-kp-antiderivative-binding-relation-ordinal="${ordinal}"]`
        ),
        from: origin("n"),
        to: target(selectorId)
      })
    )
  ];
  for (const { line, from, to } of relations) {
    if (line === null) {
      throw new Error("Antiderivative relation layer lacks a governed line.");
    }
    const fromRect = from.getBoundingClientRect();
    const toRect = to.getBoundingClientRect();
    line.setAttribute("x1", String(fromRect.left - stageRect.left +
      fromRect.width / 2));
    line.setAttribute("y1", String(fromRect.bottom - stageRect.top));
    line.setAttribute("x2", String(toRect.left - stageRect.left +
      toRect.width / 2));
    line.setAttribute("y2", String(toRect.top - stageRect.top));
  }
  session.stage.dataset["kpAntiderivativeBindingRelationCount"] =
    String(relations.length);
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

function clearInstructionalTemplateSlots(session: TransitMountSession): void {
  for (const token of session.roots.target.querySelectorAll<HTMLElement>(
    "[data-kp-antiderivative-rule-template-slot]"
  )) {
    delete token.dataset["kpAntiderivativeRuleTemplateSlot"];
  }
  session.roots.target.style.removeProperty(
    "--kp-antiderivative-template-slot-presence"
  );
  session.roots.target.style.removeProperty(
    "--kp-antiderivative-bound-value-presence"
  );
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
  const templatePanelPresence = applyRuleTemplateApplicationState(
    session,
    ruleApplication
  );
  session.stage.dataset["kpAntiderivativeDepthLens"] =
    projection === "full" ? "three-plane" : projection;
  const visualOwner = applyNativeRuleApplicationState(
    session,
    ruleApplication,
    projection
  );
  settleAccessibility(
    session,
    ruleApplication,
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
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-rule-preview-presence",
    template.rulePreviewPresence.toFixed(4)
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-pattern-projection-presence",
    template.patternProjectionPresence.toFixed(4)
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-pattern-projection-fixed-presence",
    "0"
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-pattern-projection-lift",
    "0rem"
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-pattern-slot-lift",
    "-0.72em"
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-pattern-slot-shift",
    "0.62em"
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-schema-plane-presence",
    template.depthLens.schemaPlanePresence.toFixed(4)
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-correspondence-plane-presence",
    template.depthLens.correspondencePlanePresence.toFixed(4)
  );
  const relationPresence = Math.min(
    template.metavariableBindingsPresence,
    template.targetPresence
  ) * (1 - template.rewriteCommitProgress);
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-template-relation-presence",
    relationPresence.toFixed(4)
  );
  session.templateReceiver.style.setProperty(
    "--kp-antiderivative-template-relation-progress",
    template.instantiationProgress.toFixed(4)
  );
  session.templateReceiver.dataset["kpSemanticTraceRole"] =
    template.traceRole;
  session.roots.target.style.setProperty(
    "--kp-antiderivative-template-slot-presence",
    template.templateSlotPresence.toFixed(4)
  );
  session.roots.target.style.setProperty(
    "--kp-antiderivative-bound-value-presence",
    template.instantiationProgress.toFixed(4)
  );
  const templateAuthority =
    session.plan.choreography.ruleTemplateApplication;
  const rulePanel = session.templateReceiver.querySelector<HTMLElement>(
    "[data-kp-antiderivative-rule-template]"
  );
  if (rulePanel === null) {
    throw new Error("Antiderivative rewrite lacks its rule-template panel.");
  }
  applyInstructionalRuleLayerState(session, template);
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
    template.instantiationProgress >= 1
      ? `Instantiated power-rule result: u maps to ${baseBinding.value}, and n maps to ${exponentBinding.value} in both occurrences, giving ${templateAuthority.instantiatedResultLatex} before evaluation.`
      : template.templateRevealProgress > 0.01
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
    template.panelPresence.toFixed(4);
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
    template.templateSlotPresence.toFixed(4);
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
    template.rulePreviewPresence > 0.01
      ? "rule-preview"
      : template.sourcePresence > 0.01
        ? "source-native"
        : "none";
  session.stage.dataset["kpAntiderivativeDepthLens"] = "three-plane";
  session.stage.dataset["kpAntiderivativeSchemaPlanePresence"] =
    template.depthLens.schemaPlanePresence.toFixed(4);
  session.stage.dataset["kpAntiderivativeCorrespondencePlanePresence"] =
    template.depthLens.correspondencePlanePresence.toFixed(4);
  session.stage.dataset["kpAntiderivativeProspectivePlaneDepth"] =
    template.depthLens.prospectivePlaneDepth.toFixed(4);
  session.stage.dataset["kpAntiderivativeBindingRelationPresence"] =
    relationPresence.toFixed(4);
  return template.panelPresence;
}

function applyInstructionalRuleLayerState(
  session: TransitMountSession,
  template: ReturnType<typeof sampleKpAntiderivativeRuleTemplateApplication>
): void {
  const preview = session.templateReceiver.querySelector<HTMLElement>(
    "[data-kp-antiderivative-rule-preview]"
  );
  const previewPattern = preview?.querySelector<HTMLElement>(
    '[data-kp-antiderivative-rule-preview-role="pattern"]'
  );
  const previewReplacement = preview?.querySelector<HTMLElement>(
    '[data-kp-antiderivative-rule-preview-role="replacement"]'
  );
  const projection = session.templateReceiver.querySelector<HTMLElement>(
    "[data-kp-antiderivative-rule-pattern-projection]"
  );
  if (
    preview === null || preview === undefined ||
    previewPattern === null || previewPattern === undefined ||
    previewReplacement === null || previewReplacement === undefined ||
    projection === null
  ) {
    throw new Error(
      "Antiderivative rule application lacks its instructional layers."
    );
  }
  preview.dataset["kpSemanticTraceRole"] = template.traceRole;
  previewPattern.dataset["kpSemanticSalienceLevel"] = "focus";
  previewReplacement.dataset["kpSemanticSalienceLevel"] = "focus";
  projection.dataset["kpSemanticTraceRole"] = template.traceRole;
  projection.dataset["kpSemanticSalienceLevel"] =
    template.patternProjectionPresence > 0.01 ? "focus" : "context";
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
  const targetOpacity = template.targetPresence * (0.84 + 0.16 * commit);
  session.roots.source.style.opacity = String(template.sourcePresence);
  session.roots.target.style.opacity = targetOpacity.toFixed(4);
  const prospectiveLift = template.targetPresence > 0.01
    ? -0.56 * (1 - commit)
    : 0;
  const prospectiveDepth = projection === "full"
    ? -22 * template.depthLens.prospectivePlaneDepth
    : 0;
  const prospectivePitch = projection === "full"
    ? 1.4 * template.depthLens.prospectivePlaneDepth
    : 0;
  session.roots.target.style.transform =
    prospectiveLift === 0 && prospectiveDepth === 0
    ? "none"
    : `translate3d(0, ${prospectiveLift.toFixed(4)}rem, ` +
      `${prospectiveDepth.toFixed(4)}px) ` +
      `rotateX(${prospectivePitch.toFixed(4)}deg)`;
  session.roots.target.style.setProperty(
    "--kp-antiderivative-prospective-depth",
    (template.targetPresence * (1 - commit)).toFixed(4)
  );
  // A subtree drop-shadow duplicates the fraction bar's realized paint and
  // reads as a second rule even though the DOM has only one `.frac-line`.
  // Depth therefore uses one owner's lift, shallow plane placement, and
  // salience only.
  session.roots.target.style.filter = "none";
  session.roots.target.dataset["kpAntiderivativeProspectivePlacement"] =
    "center";
  session.roots.target.dataset["kpSemanticTraceRole"] = template.traceRole;
  session.roots.target.dataset["kpAntiderivativeInstantiatedResultOwner"] =
    "canonical-target-native";

  if (commit >= 1) return "target-native";
  if (template.targetPresence > 0.01) return "rule-application-native";
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
  template: ReturnType<typeof sampleKpAntiderivativeRuleTemplateApplication>,
  templatePanelPresence: number
): void {
  const accessible = template.targetPresence > template.sourcePresence
    ? "target"
    : "source";
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
}

function bounded(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}
