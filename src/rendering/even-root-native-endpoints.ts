import {
  isKpVerifiedEvenRootSolveExemplar,
  type KpEvenRootSolveState,
  type KpVerifiedEvenRootSolveExemplar
} from "../semantic/even-root-solve-exemplar.ts";
import type { KpEquationFontReadiness } from "./equation-font-readiness.ts";
import { renderLatexToHtml } from "./katex-adapter.ts";
import type { KpSettleAndObserveNativeKatexScene } from
  "./native-katex-feature-pack-contract.ts";
import type { KpNativeKatexRenderedSceneObservation } from
  "./native-katex-rendered-scene.ts";

export type KpEvenRootEndpointRole =
  | "subject"
  | "exponent"
  | "relation"
  | "plus-minus"
  | "radical-operator"
  | "radicand"
  | "value";

export interface KpEvenRootNativeEndpointNode {
  readonly entityId: string;
  readonly referentId: string;
  readonly role: KpEvenRootEndpointRole;
  readonly presentationGroupId: string;
  readonly measurement: "native-ink" | "native-structure";
  readonly motionId?: string | undefined;
}

export interface KpEvenRootNativeEndpoint {
  readonly schemaVersion: "kp.even-root-native-endpoint.v1";
  readonly endpoint: "source" | "target";
  readonly stateId: KpEvenRootSolveState["id"];
  readonly accessibleText: string;
  readonly rawLatex: string;
  readonly annotatedLatex: string;
  readonly nativeHtmlAndMathml: string;
  readonly rootPresentationGroupId: string;
  readonly nodes: readonly KpEvenRootNativeEndpointNode[];
}

export interface KpEvenRootNativeEndpointSet {
  readonly exemplar: KpVerifiedEvenRootSolveExemplar;
  readonly inversePower: Readonly<{
    readonly source: KpEvenRootNativeEndpoint;
    readonly target: KpEvenRootNativeEndpoint;
  }>;
  readonly evaluation: Readonly<{
    readonly source: KpEvenRootNativeEndpoint;
    readonly target: KpEvenRootNativeEndpoint;
  }>;
}

export function createKpEvenRootNativeEndpoints(
  exemplar: KpVerifiedEvenRootSolveExemplar
): KpEvenRootNativeEndpointSet {
  if (!isKpVerifiedEvenRootSolveExemplar(exemplar)) {
    throw new Error("Even-root endpoints require a verified exemplar.");
  }
  const [source, radical, evaluated] = exemplar.states;
  return Object.freeze({
    exemplar,
    inversePower: Object.freeze({
      source: endpointForState(source, "source"),
      target: endpointForState(radical, "target")
    }),
    evaluation: Object.freeze({
      source: endpointForState(radical, "source"),
      target: endpointForState(evaluated, "target")
    })
  });
}

export function bindKpEvenRootNativeEndpointOwnership(input: {
  readonly root: HTMLElement;
  readonly endpoint: KpEvenRootNativeEndpoint;
}): void {
  input.root.dataset["kpSemanticEntityId"] = input.endpoint.stateId;
  input.root.dataset["kpPresentationGroupId"] =
    input.endpoint.rootPresentationGroupId;
  for (const node of input.endpoint.nodes) {
    const elements = node.measurement === "native-structure"
      ? input.root.querySelectorAll<HTMLElement>(".sqrt .hide-tail")
      : input.root.querySelectorAll<HTMLElement>(
          `[data-kp-motion-id="${CSS.escape(node.motionId ?? "")}"]`
        );
    if (elements.length !== 1) {
      throw new Error(
        `Even-root ${input.endpoint.stateId} expected one native owner for ` +
        `${node.role}, received ${elements.length}.`
      );
    }
    const element = elements[0]!;
    if (node.motionId !== undefined) element.dataset["kpMotionId"] = node.motionId;
    element.dataset["kpSemanticEntityId"] = node.entityId;
    element.dataset["kpSemanticIdentityId"] = node.referentId;
    element.dataset["kpSemanticSelectorId"] = node.entityId;
    element.dataset["kpPresentationGroupId"] = node.presentationGroupId;
  }
}

export async function settleAndObserveKpEvenRootNativeEndpoint(input: {
  readonly stage: HTMLElement;
  readonly root: HTMLElement;
  readonly endpoint: KpEvenRootNativeEndpoint;
  readonly fontReadiness: KpEquationFontReadiness;
  readonly observe: KpSettleAndObserveNativeKatexScene;
}): Promise<KpNativeKatexRenderedSceneObservation> {
  bindKpEvenRootNativeEndpointOwnership(input);
  return input.observe({
    endpoint: input.endpoint.endpoint,
    stage: input.stage,
    root: input.root,
    semanticEntityId: input.endpoint.stateId,
    presentationGroupId: input.endpoint.rootPresentationGroupId,
    fontReadiness: input.fontReadiness
  });
}

function endpointForState(
  state: KpEvenRootSolveState,
  endpoint: "source" | "target"
): KpEvenRootNativeEndpoint {
  const rootPresentationGroupId = `group.${state.id}.${endpoint}`;
  const node = (
    role: KpEvenRootEndpointRole,
    entityId: string,
    referentId: string,
    latex?: string
  ): Readonly<{ descriptor: KpEvenRootNativeEndpointNode; latex: string }> => {
    const measurement = role === "radical-operator"
      ? "native-structure" as const
      : "native-ink" as const;
    const motionId = measurement === "native-structure"
      ? undefined
      : `even-root.${state.id}.${endpoint}.${role}`;
    return Object.freeze({
      descriptor: Object.freeze({
        entityId,
        referentId,
        role,
        presentationGroupId: `${rootPresentationGroupId}.${role}`,
        measurement,
        ...(motionId === undefined ? {} : { motionId })
      }),
      latex: motionId === undefined
        ? (latex ?? "")
        : `\\htmlData{kp-motion-id=${motionId}}{${latex ?? ""}}`
    });
  };

  let pieces: readonly ReturnType<typeof node>[];
  let annotatedLatex: string;
  if (state.kind === "powered-equality") {
    const subject = node("subject", state.subjectEntityId,
      "semantic.variable.x", "x");
    const exponent = node("exponent", state.exponentEntityId,
      "semantic.index.two", "2");
    const relation = node("relation", state.relationEntityId,
      "semantic.relation.equality", "=");
    const value = node("value", state.rightEntityId,
      "semantic.value.nine", "9");
    pieces = [subject, exponent, relation, value];
    annotatedLatex = `${subject.latex}^{${exponent.latex}}` +
      `${relation.latex}${value.latex}`;
  } else if (state.kind === "branched-radical-equality") {
    const subject = node("subject", state.subjectEntityId,
      "semantic.variable.x", "x");
    const relation = node("relation", state.relationEntityId,
      "semantic.relation.equality", "=");
    const plusMinus = node("plus-minus", state.plusMinusEntityId,
      "semantic.operator.plus-minus", "\\pm");
    const radical = node("radical-operator", state.radicalOperatorEntityId,
      "semantic.operator.square-root");
    const radicand = node("radicand", state.radicandEntityId,
      "semantic.value.nine", "9");
    pieces = [subject, relation, plusMinus, radical, radicand];
    // The square-root index is semantically explicit but visually implicit.
    // It therefore receives no fake glyph owner in the native endpoint.
    annotatedLatex = `${subject.latex}${relation.latex}${plusMinus.latex}` +
      `\\sqrt{${radicand.latex}}`;
  } else {
    const subject = node("subject", state.subjectEntityId,
      "semantic.variable.x", "x");
    const relation = node("relation", state.relationEntityId,
      "semantic.relation.equality", "=");
    const plusMinus = node("plus-minus", state.plusMinusEntityId,
      "semantic.operator.plus-minus", "\\pm");
    const value = node("value", state.valueEntityId,
      "semantic.value.three", "3");
    pieces = [subject, relation, plusMinus, value];
    annotatedLatex = `${subject.latex}${relation.latex}` +
      `${plusMinus.latex}${value.latex}`;
  }

  return Object.freeze({
    schemaVersion: "kp.even-root-native-endpoint.v1" as const,
    endpoint,
    stateId: state.id,
    accessibleText: state.latex,
    rawLatex: state.latex,
    annotatedLatex,
    nativeHtmlAndMathml: renderLatexToHtml(annotatedLatex, {
      displayMode: true,
      output: "htmlAndMathml",
      trust: true
    }),
    rootPresentationGroupId,
    nodes: Object.freeze(pieces.map(({ descriptor }) => descriptor))
  });
}
