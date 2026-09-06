import { createKpAuthoredDistributionExplanation } from "../../src/experiments/authoring-structural/distribution-explanation.ts";
import { createKpAuthoredSimplificationExplanation } from "../../src/experiments/authoring-structural/simplification-explanation.ts";
import { createKpSemanticProgress } from "../../src/semantic-state/semantic-progress.ts";

const distribution = createKpAuthoredDistributionExplanation("consumer.distribution");
const simplification = createKpAuthoredSimplificationExplanation("consumer.simplification");
const distributionSession = distribution.createSession();
const simplificationSession = simplification.createSession();
const equationText: string = distributionSession.evaluate(distribution.after, distribution.authored.model.handles.refs.accessibleEquation);
const notation: string = simplificationSession.evaluate(simplification.at(createKpSemanticProgress(1n, 2n)), simplification.authored.model.handles.refs.notation);
const expression = simplification.authored.model.handles.pin(simplification.explanation.chain.after).expression.read();
const latex: string = expression.value.latex;
const name: "simplify" = simplification.explanation.handles.root.name;
// @ts-expect-error A notation query does not silently erase its result type.
const numeric: number = simplificationSession.evaluate(simplification.after, simplification.authored.model.handles.refs.notation);
// @ts-expect-error Carrier simplification has no equation-tree field.
simplification.authored.model.handles.refs.equation;
// @ts-expect-error The registered operation parameter cannot become an arbitrary rewrite.
simplification.definition.prepareApplication({ applicationId: "wrong", sourceId: "consumer", parameters: { operation: "distribute" } });
// @ts-expect-error Retained semantic values remain immutable.
expression.value.latex = "3";
void [equationText, notation, latex, name, numeric];
distributionSession.dispose(); simplificationSession.dispose();
