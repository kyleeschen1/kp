import { createKpLawfulFractionSolveMacro } from "../../semantic/fraction-solve-macro.ts";
import { assembleKpSemanticStateModel } from "../../semantic-state/authoring-model-assembly.ts";
import { kpStateGroup, kpStateValue } from "../../semantic-state/authoring-schema.ts";

/** The existing macro owns equation truth; the aggregate owns retained versions.
 * Its nominal verification stays local, outside serializable state values.
 */
export function createKpAuthoredDistributionModel(
  namespace = "lesson.authoring-structural.distribution"
) {
  const macro = createKpLawfulFractionSolveMacro();
  const model = assembleKpSemanticStateModel({
    namespace,
    schema: kpStateGroup({ equation: kpStateValue(macro.states[0]!) })
  });
  return Object.freeze({ model, macro });
}
