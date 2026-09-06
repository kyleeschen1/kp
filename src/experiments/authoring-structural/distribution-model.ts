import { createKpLawfulFractionSolveMacro } from "../../semantic/fraction-solve-macro.ts";
import { assembleKpSemanticStateModel } from "../../semantic-state/authoring-model-assembly.ts";
import { kpStateDerived, kpStateGroup, kpStateValue } from "../../semantic-state/authoring-schema.ts";
import { compileKpStructuredExpressionAccessibleText } from "../../semantic/structured-expression.ts";

/** The existing macro owns equation truth; the aggregate owns retained versions.
 * Its nominal verification stays local, outside serializable state values.
 */
export function createKpAuthoredDistributionModel(
  namespace = "lesson.authoring-structural.distribution"
) {
  const macro = createKpLawfulFractionSolveMacro();
  const model = assembleKpSemanticStateModel({
    namespace,
    schema: kpStateGroup({ equation: kpStateValue(macro.states[0]!), accessibleEquation: kpStateDerived<string>() }),
    derive: ({ refs, derive }) => [derive({ target: refs.accessibleEquation,
      dependencies: [refs.equation], compute: ([equation]) =>
        `${compileKpStructuredExpressionAccessibleText(equation.left)} equals ${compileKpStructuredExpressionAccessibleText(equation.right)}`
    })]
  });
  return Object.freeze({ model, macro });
}
