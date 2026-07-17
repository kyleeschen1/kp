import {
  createKpSuccessorSynthesisPlan,
  type KpSuccessorSynthesisPlan
} from "../../src/animation/successor-synthesis.ts";

export function createConstantDifferenceSuccessorFixture(): KpSuccessorSynthesisPlan {
  return createKpSuccessorSynthesisPlan({
    id: "successor.linear-solve.constant-difference",
    authority: {
      operationId: "kp.algebra.simplify-constant-difference",
      bindingId: "binding.linear-solve.seven-minus-four"
    },
    sourceAnnotations: [
      {
        id: "operand.seven",
        semanticRole: "minuend",
        selectorIds: ["equation.after-cancel.rhs.seven"],
        contribution: "material-input",
        propagationRank: 0
      },
      {
        id: "operator.minus",
        semanticRole: "subtraction-operator",
        selectorIds: ["equation.after-cancel.rhs.minus"],
        contribution: "catalyst",
        propagationRank: 0
      },
      {
        id: "operand.four",
        semanticRole: "subtrahend",
        selectorIds: ["equation.after-cancel.rhs.four"],
        contribution: "material-input",
        propagationRank: 1
      }
    ],
    targetAnnotations: [{
      id: "result.three",
      semanticRole: "evaluated-difference",
      selectorIds: ["equation.solved.rhs.three"],
      propagationRank: 0
    }],
    lineages: [{
      id: "lineage.seven-minus-four.to-three",
      sourceAnnotationIds: ["operand.seven", "operand.four"],
      targetAnnotationIds: ["result.three"]
    }],
    measurements: {
      "operand.seven": { left: 12, top: 12, width: 9, height: 16 },
      "operator.minus": { left: 24, top: 18, width: 10, height: 3 },
      "operand.four": { left: 37, top: 12, width: 9, height: 16 },
      "result.three": { left: 24, top: 12, width: 9, height: 16 }
    }
  });
}
