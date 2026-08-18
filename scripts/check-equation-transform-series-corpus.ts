import {
  evaluateKpEquationTransformSeriesCorpus
} from "../src/authoring/equation-transform-series-corpus.ts";

const report = evaluateKpEquationTransformSeriesCorpus();
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.status !== "passed") process.exitCode = 1;
