import { defineKpExpressionProjection, projectKpExpressionTree } from "./expression-node-protocol.ts";
import { kpStructuredExpressionProtocol } from "./structured-expression-protocol.ts";
import type { KpStructuredExpressionNode } from "./structured-expression.ts";

export class KpScalarLatexProjectionGap extends Error {
  readonly code = "unsupported-presentation";
}

function scalarProjection(id: string, multiplication: string) {
  return defineKpExpressionProjection<KpStructuredExpressionNode, string>({ id,
    protocol: kpStructuredExpressionProtocol,
    handlers: {
      number: { project: node => String(node.value) },
      symbol: { project: node => node.name },
      sum: { project: (_node, children) => `(${children.join("+")})` },
      product: { project: (_node, children) => `(${children.join(multiplication)})` },
      // Inventory coverage is not permission to render an unsupported task.
      quotient: { project: unsupported }, power: { project: unsupported }, negate: { project: unsupported }
    }
  });
}
const projections = Object.freeze({
  explicit: scalarProjection("kp.scalar-latex.explicit.v1", "*"),
  display: scalarProjection("kp.scalar-latex.display.v1", "\\cdot ")
});

/** Notation is a projection of the shared tree protocol, never a new parser. */
export function projectKpStructuredScalarLatex(node: KpStructuredExpressionNode, notation: keyof typeof projections): string {
  return projectKpExpressionTree(node, kpStructuredExpressionProtocol, projections[notation]);
}
function unsupported(): never {
  throw new KpScalarLatexProjectionGap("Only verified scalar sums and products have this presentation.");
}
