import {
  evaluateKpBalancedOperationAuthoringCorpus
} from "../src/authoring/balanced-operation-authoring-corpus.ts";

const report = evaluateKpBalancedOperationAuthoringCorpus();
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.status !== "passed") process.exitCode = 1;
