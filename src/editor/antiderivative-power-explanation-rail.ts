import type {
  KpAntiderivativePowerExplanationBeatId as KpAntiderivativePowerRuleExplanationBeatId
} from "../animation/antiderivative-power-choreography.ts";
import { renderLatexToHtml } from "../rendering/katex-adapter.ts";

export type KpAntiderivativePowerEvaluationExplanationBeatId =
  | "reduce-arithmetic"
  | "recognize-reduction"
  | "final-result";

export type KpAntiderivativePowerExplanationBeatId =
  | KpAntiderivativePowerRuleExplanationBeatId
  | KpAntiderivativePowerEvaluationExplanationBeatId;

interface ExplanationSegment {
  readonly kind: "text" | "math";
  readonly value: string;
}

interface ExplanationClaim {
  readonly cue: string;
  readonly ariaLabel: string;
  readonly grounding: string;
  readonly segments: readonly ExplanationSegment[];
}

export function syncKpAntiderivativePowerExplanationRail(input: {
  readonly stage: HTMLElement;
  readonly beatId: KpAntiderivativePowerExplanationBeatId;
  readonly presence: number;
  readonly baseValue?: string | undefined;
  readonly exponentValue?: string | undefined;
}): void {
  const rail = ensureRail(input.stage);
  const claim = explanationClaim(input);
  rail.style.setProperty(
    "--kp-antiderivative-explanation-presence",
    bounded(input.presence).toFixed(4)
  );
  rail.dataset["kpAntiderivativeExplanationBeat"] = input.beatId;
  rail.dataset["kpAntiderivativeExplanationGrounding"] = claim.grounding;
  rail.setAttribute("aria-label", claim.ariaLabel);
  input.stage.dataset["kpAntiderivativeExplanationBeat"] = input.beatId;
  input.stage.dataset["kpAntiderivativeExplanationGrounding"] =
    claim.grounding;
  if (rail.dataset["kpAntiderivativeExplanationRenderedBeat"] ===
      input.beatId) {
    return;
  }

  const cue = input.stage.ownerDocument.createElement("span");
  cue.className = "editor-equation-stage__antiderivative-explanation-cue";
  cue.textContent = claim.cue;
  const statement = input.stage.ownerDocument.createElement("span");
  statement.className =
    "editor-equation-stage__antiderivative-explanation-statement";
  for (const segment of claim.segments) {
    if (segment.kind === "text") {
      statement.append(input.stage.ownerDocument.createTextNode(segment.value));
      continue;
    }
    const math = input.stage.ownerDocument.createElement("span");
    math.className =
      "editor-equation-stage__antiderivative-explanation-math";
    math.dataset["kpAntiderivativeExplanationMath"] = segment.value;
    math.innerHTML = renderLatexToHtml(segment.value, {
      displayMode: false,
      output: "htmlAndMathml"
    });
    statement.append(math);
  }
  rail.replaceChildren(cue, statement);
  rail.dataset["kpAntiderivativeExplanationRenderedBeat"] = input.beatId;
}

export function removeKpAntiderivativePowerExplanationRail(
  stage: HTMLElement
): void {
  stage.querySelector<HTMLElement>(
    "[data-kp-antiderivative-explanation-rail]"
  )?.remove();
  delete stage.dataset["kpAntiderivativeExplanationBeat"];
  delete stage.dataset["kpAntiderivativeExplanationGrounding"];
}

function ensureRail(stage: HTMLElement): HTMLElement {
  const existing = stage.querySelector<HTMLElement>(
    "[data-kp-antiderivative-explanation-rail]"
  );
  if (existing !== null) return existing;
  const rail = stage.ownerDocument.createElement("div");
  rail.className = "editor-equation-stage__antiderivative-explanation";
  rail.dataset["kpAntiderivativeExplanationRail"] = "grounded";
  rail.setAttribute("role", "note");
  // The rail changes only at deterministic pedagogical beats. Avoid a live
  // region here: automatic playback must not queue unsolicited announcements.
  rail.setAttribute("aria-live", "off");
  stage.append(rail);
  return rail;
}

function explanationClaim(input: {
  readonly beatId: KpAntiderivativePowerExplanationBeatId;
  readonly baseValue?: string | undefined;
  readonly exponentValue?: string | undefined;
}): ExplanationClaim {
  const base = input.baseValue ?? "x";
  const exponent = input.exponentValue ?? "2";
  const text = (value: string): ExplanationSegment => ({
    kind: "text",
    value
  });
  const math = (value: string): ExplanationSegment => ({
    kind: "math",
    value
  });
  switch (input.beatId) {
    case "orient-source":
      return {
        cue: "ORIENT",
        ariaLabel: "Find the power inside the integral.",
        grounding: "intent.notice-integrand-power",
        segments: [text("Find the power inside the integral.")]
      };
    case "recognize-rule":
      return {
        cue: "RULE",
        ariaLabel:
          "The rule applies when the integrand is a power of the integration variable.",
        grounding: "law.calculus.integral.power-rule",
        segments: [
          text("The rule applies when the integrand is a power of the integration variable.")
        ]
      };
    case "match-structure":
      return {
        cue: "MATCH",
        ariaLabel:
          `The base and differential use ${base}, so u maps to ${base}.`,
        grounding: "binding.u.source-base-and-integration-variable",
        segments: [
          text("The base and differential use "),
          math(base),
          text(", so "),
          math(String.raw`u\mapsto ${base}`),
          text(".")
        ]
      };
    case "bind-metavariables":
      return {
        cue: "BIND",
        ariaLabel:
          `The exponent is ${exponent}, so n maps to ${exponent}.`,
        grounding: "binding.n.source-exponent",
        segments: [
          text("The exponent is "),
          math(exponent),
          text(", so "),
          math(String.raw`n\mapsto ${exponent}`),
          text(".")
        ]
      };
    case "instantiate-template":
      return {
        cue: "INSTANTIATE",
        ariaLabel:
          `Use u maps to ${base} and n maps to ${exponent} in every matching slot.`,
        grounding: "rule-template.binding-environment",
        segments: [
          text("Use "),
          math(String.raw`u\mapsto ${base},\;n\mapsto ${exponent}`),
          text(" in every matching slot.")
        ]
      };
    case "propagate-binding":
      return {
        cue: "PROPAGATE",
        ariaLabel:
          `One n maps to ${exponent} binding supplies both exponent occurrences.`,
        grounding: "binding.n.fan-out",
        segments: [
          text("One "),
          math(String.raw`n\mapsto ${exponent}`),
          text(" binding supplies both exponent occurrences.")
        ]
      };
    case "explain-closure":
      return {
        cue: "CONSTANT",
        ariaLabel:
          "Plus C records the family of antiderivatives.",
        grounding: "introduction.integration-constant",
        segments: [
          math(String.raw`+C`),
          text(" records the family of antiderivatives.")
        ]
      };
    case "commit-rewrite":
      return {
        cue: "REWRITE",
        ariaLabel:
          "The instantiated template becomes the live expression.",
        grounding: "rewrite.commit-instantiated-result",
        segments: [
          text("The instantiated template becomes the live expression.")
        ]
      };
    case "prepare-reduction":
      return {
        cue: "READY",
        ariaLabel:
          "Rule application is complete. Only local arithmetic remains.",
        grounding: "handoff.rule-application-to-evaluation",
        segments: [
          text("Rule application is complete; only local arithmetic remains.")
        ]
      };
    case "reduce-arithmetic":
      return {
        cue: "REDUCE",
        ariaLabel:
          "Evaluate each remaining sum with ordinary arithmetic.",
        grounding: "evaluation.successor-sums",
        segments: [
          text("Evaluate each remaining sum with ordinary arithmetic.")
        ]
      };
    case "recognize-reduction":
      return {
        cue: "RECOGNIZE",
        ariaLabel:
          "Both sums resolve independently while the fraction structure persists.",
        grounding: "evaluation.dual-successor-recognition",
        segments: [
          text("Both sums resolve independently while the fraction structure persists.")
        ]
      };
    case "final-result":
      return {
        cue: "RESULT",
        ariaLabel:
          "The rule application and its arithmetic are complete.",
        grounding: "evaluation.native-target-settlement",
        segments: [
          text("The rule application and its arithmetic are complete.")
        ]
      };
  }
}

function bounded(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
