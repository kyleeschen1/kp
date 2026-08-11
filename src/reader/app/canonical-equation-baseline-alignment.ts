import {
  measureKpNativeKatexBaselineY
} from "../../rendering/native-katex-paint-geometry.ts";

export interface KpCanonicalEquationBaselineAlignmentCertificate {
  readonly kind: "canonical-equation-baseline-alignment-certificate";
  readonly baselineY: number;
  readonly stateCount: number;
  readonly maximumResidualPx: number;
}

const alignmentAuthority = "canonical-equation-baseline-v1";

/**
 * Native KaTeX remains the geometry authority, but every endpoint shares one
 * stage math axis. Centering each expression by its box would move that axis
 * whenever a fraction bar or denominator enters or leaves.
 */
export function alignKpCanonicalEquationStateBaselines(input: {
  readonly viewport: HTMLElement;
  readonly transitionElements: readonly HTMLElement[];
  readonly tolerancePx?: number | undefined;
}): KpCanonicalEquationBaselineAlignmentCertificate {
  const tolerancePx = input.tolerancePx ?? 0.5;
  const states = input.transitionElements.flatMap((transition) => [
    ...transition.querySelectorAll<HTMLElement>(
      "[data-kp-reader-equation-state]"
    )
  ]);
  if (states.length === 0) {
    throw new Error("Canonical equation baseline alignment requires native states.");
  }
  const baselineY = input.viewport.clientHeight / 2;
  for (const state of states) {
    if (
      state.dataset["kpReaderEquationBaselineAuthority"] !== undefined &&
      state.dataset["kpReaderEquationBaselineAuthority"] !== alignmentAuthority
    ) {
      throw new Error("Canonical equation state has conflicting baseline authority.");
    }
    state.style.translate = "none";
    delete state.dataset["kpReaderEquationBaselineAuthority"];
  }
  for (const state of states) {
    const math = state.querySelector<HTMLElement>(".katex");
    if (math === null) {
      throw new Error("Canonical equation state lacks native KaTeX paint.");
    }
    const observed = measureKpNativeKatexBaselineY(input.viewport, math);
    state.style.translate = `0 ${cssPixel(baselineY - observed)}`;
    state.dataset["kpReaderEquationBaselineAuthority"] = alignmentAuthority;
  }
  const residuals = states.map((state) => {
    const math = state.querySelector<HTMLElement>(".katex")!;
    return Math.abs(
      measureKpNativeKatexBaselineY(input.viewport, math) - baselineY
    );
  });
  const maximumResidualPx = Math.max(...residuals);
  if (maximumResidualPx > tolerancePx) {
    throw new Error(
      `Canonical equation baseline residual ${maximumResidualPx.toFixed(3)}px ` +
      `exceeds ${tolerancePx.toFixed(3)}px.`
    );
  }
  return Object.freeze({
    kind: "canonical-equation-baseline-alignment-certificate" as const,
    baselineY,
    stateCount: states.length,
    maximumResidualPx
  });
}

function cssPixel(value: number): string {
  const normalized = Math.abs(value) < 1e-6 ? 0 : value;
  return `${normalized.toFixed(4)}px`;
}
