import { createFlaggedTicketSource } from "../../../domains/probability/binary-joint-model.ts";
import { bindBayesEvidence } from "./evidence.ts";
import { annotateBayesQuotient, compileBayesNotation } from "./notation.ts";
import { compileKpEquationExemplarTemplate } from "../../reader/compiler/equation-exemplar-page.ts";

export function buildBayesNativeProbe() {
  const notation = compileBayesNotation(bindBayesEvidence(createFlaggedTicketSource()).trace);
  return `<h1>Bayes native mechanism probe</h1><p>Exact conditional count ratio: ${notation.numeratorUnits}/${notation.denominatorUnits} = ${notation.result}.</p>
    <div data-bayes-native-host style="height:240px"></div><output data-bayes-native-status>Preparing</output>
    ${compileKpEquationExemplarTemplate(notation.animation, annotateBayesQuotient)}`;
}
