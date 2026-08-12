import { compileKpSchemeFactorialFirstExpansion } from
  "./scheme-factorial-first-expansion.ts";
import { parseKpSchemeFactorialSource } from
  "../semantic/scheme-factorial-parser.ts";
import { readKpSchemeFactorialTraceArtifact } from
  "../semantic/scheme-factorial-trace-artifact.ts";

// Trace authority remains build-only; learner publication receives the compact
// certified material ledger and never imports the evaluator or trace artifact.
export const kpSchemeFactorialFirstExpansion =
  compileKpSchemeFactorialFirstExpansion({
    document: parseKpSchemeFactorialSource(),
    trace: readKpSchemeFactorialTraceArtifact().trace
  });
