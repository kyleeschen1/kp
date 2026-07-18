import type { KpFtcConvergenceFrame } from "./ftc-convergence.ts";

export type KpFtcDifferenceQuotientStage =
  | "name-area-change"
  | "form-ratio"
  | "expand-area-change";

export interface KpFtcDifferenceQuotientFrame {
  readonly id: string;
  readonly stage: KpFtcDifferenceQuotientStage;
  readonly latex: string;
  readonly areaChange: number;
  readonly deltaX: number;
  readonly quotient: number;
  readonly containsDerivativeNotation: false;
  readonly semanticRoles: Readonly<Record<string, string>>;
  readonly crossViewCorrespondenceIds: readonly string[];
}

export function createKpFtcDifferenceQuotientFrames(
  convergence: KpFtcConvergenceFrame
): readonly KpFtcDifferenceQuotientFrame[] {
  const common = {
    areaChange: convergence.strip.exactAreaChange,
    deltaX: convergence.strip.deltaX,
    quotient: convergence.finiteDifferenceQuotient,
    containsDerivativeNotation: false as const,
    semanticRoles: {
      "ftc.symbol.delta-area": "same finite area as the graph strip",
      "ftc.symbol.delta-x": "same finite width as the graph strip",
      "ftc.symbol.quotient": "finite average rate of accumulated area"
    },
    crossViewCorrespondenceIds: [
      "correspondence.ftc.strip-to-delta-area",
      "correspondence.ftc.strip-width-to-delta-x"
    ]
  };

  return [
    {
      id: `${convergence.id}.quotient.name-area-change`,
      stage: "name-area-change",
      latex: "\\Delta A=A(x+\\Delta x)-A(x)",
      ...common
    },
    {
      id: `${convergence.id}.quotient.form-ratio`,
      stage: "form-ratio",
      latex: "\\frac{\\Delta A}{\\Delta x}",
      ...common
    },
    {
      id: `${convergence.id}.quotient.expand-area-change`,
      stage: "expand-area-change",
      latex: "\\frac{A(x+\\Delta x)-A(x)}{\\Delta x}",
      ...common
    }
  ];
}
