import {
  createKpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatex,
  type KpSelectorAnnotatedLatexSegment
} from "../rendering/selector-annotated-latex.ts";

interface SolveXAnnotatedLatexInput {
  readonly objectId: string;
  readonly selectorIds: readonly string[];
}

const solveXSegments: Readonly<Record<string, readonly KpSelectorAnnotatedLatexSegment[]>> = {
  "equation.linear-solve.initial": [
    semantic("equation.linear-solve.initial.lhs.x", "x"),
    gap(),
    semantic("equation.linear-solve.initial.lhs.plus3", "+3"),
    gap(),
    semantic("equation.linear-solve.initial.equals", "="),
    gap(),
    semantic("equation.linear-solve.initial.rhs.7", "7")
  ],
  "equation.linear-solve.after-subtract": [
    semantic("equation.linear-solve.after-subtract.lhs.x", "x"),
    gap(),
    semantic("equation.linear-solve.after-subtract.lhs.plus3", "+3"),
    gap(),
    semantic("equation.linear-solve.after-subtract.lhs.minus3", "-3"),
    gap(),
    semantic("equation.linear-solve.after-subtract.equals", "="),
    gap(),
    semantic("equation.linear-solve.after-subtract.rhs.7", "7"),
    gap(),
    semantic("equation.linear-solve.after-subtract.rhs.minus3", "-3")
  ],
  "equation.linear-solve.left-simplified": [
    semantic("equation.linear-solve.left-simplified.lhs.x", "x"),
    gap(),
    semantic("equation.linear-solve.left-simplified.equals", "="),
    gap(),
    semantic("equation.linear-solve.left-simplified.rhs.7", "7"),
    gap(),
    semantic("equation.linear-solve.left-simplified.rhs.minus3", "-3")
  ],
  "equation.linear-solve.solved": [
    semantic("equation.linear-solve.solved.lhs.x", "x"),
    gap(),
    semantic("equation.linear-solve.solved.equals", "="),
    gap(),
    semantic("equation.linear-solve.solved.rhs.4", "4")
  ]
};

export function createKpSolveXSelectorAnnotatedLatex(
  input: SolveXAnnotatedLatexInput
): KpSelectorAnnotatedLatex | undefined {
  const segments = solveXSegments[input.objectId];
  if (segments === undefined) return undefined;
  return createKpSelectorAnnotatedLatex({
    id: `solve-x.${input.objectId}`,
    expectedSelectorIds: input.selectorIds,
    segments
  });
}

function semantic(selectorId: string, latex: string): KpSelectorAnnotatedLatexSegment {
  return { kind: "selector", selectorId, latex };
}

function gap(): KpSelectorAnnotatedLatexSegment {
  return { kind: "latex", latex: "\\;" };
}
