import {
  compileKpSchemeFactorialBindingChoreography
} from "./scheme-factorial-binding-choreography.ts";
import {
  defineKpSchemeFactorialChoreography
} from "./scheme-factorial-choreography.ts";
import {
  compileKpSchemeFactorialEvaluationMotifs
} from "./scheme-factorial-evaluation-motifs.ts";
import {
  compileKpSchemeFactorialReturnChoreography
} from "./scheme-factorial-return-choreography.ts";
import {
  compileKpSchemeFactorialStructuralChoreography
} from "./scheme-factorial-structural-choreography.ts";
import { kpSchemeFactorialCheckpoints } from
  "../semantic/scheme-factorial-checkpoints.ts";
import { parseKpSchemeFactorialSource } from
  "../semantic/scheme-factorial-parser.ts";
import { kpSchemeFactorialScore } from
  "../semantic/scheme-factorial-score.ts";
import { readKpSchemeFactorialTraceArtifact } from
  "../semantic/scheme-factorial-trace-artifact.ts";

const document = parseKpSchemeFactorialSource();
const trace = readKpSchemeFactorialTraceArtifact().trace;

// This build-authority module is serialized into the publication artifact;
// learner playback imports the samplers, never the evaluator or trace.
export const kpSchemeFactorialChoreography =
  defineKpSchemeFactorialChoreography({
    structural: compileKpSchemeFactorialStructuralChoreography({
      document,
      checkpoints: kpSchemeFactorialCheckpoints
    }),
    binding: compileKpSchemeFactorialBindingChoreography(trace),
    evaluation: compileKpSchemeFactorialEvaluationMotifs({
      trace,
      score: kpSchemeFactorialScore
    }),
    returns: compileKpSchemeFactorialReturnChoreography({
      trace,
      checkpoints: kpSchemeFactorialCheckpoints
    })
  });
