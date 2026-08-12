import { projectKpSchemeFactorialCheckpoints } from
  "./scheme-factorial-checkpoint-projector.ts";
import { parseKpSchemeFactorialSource } from
  "./scheme-factorial-parser.ts";
import { kpSchemeFactorialScore } from "./scheme-factorial-score.ts";
import { readKpSchemeFactorialTraceArtifact } from
  "./scheme-factorial-trace-artifact.ts";

export const kpSchemeFactorialCheckpoints =
  projectKpSchemeFactorialCheckpoints({
    document: parseKpSchemeFactorialSource(),
    trace: readKpSchemeFactorialTraceArtifact().trace,
    score: kpSchemeFactorialScore
  });
