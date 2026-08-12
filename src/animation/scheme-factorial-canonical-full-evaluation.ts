import { compileKpSchemeFactorialFullEvaluation } from
  "./scheme-factorial-full-evaluation.ts";
import { parseKpSchemeFactorialSource } from
  "../semantic/scheme-factorial-parser.ts";
import { readKpSchemeFactorialTraceArtifact } from
  "../semantic/scheme-factorial-trace-artifact.ts";

// Trace authority remains build-only; publication receives the compact score.
export const kpSchemeFactorialFullEvaluation =
  compileKpSchemeFactorialFullEvaluation({
    document: parseKpSchemeFactorialSource(),
    trace: readKpSchemeFactorialTraceArtifact().trace
  });
