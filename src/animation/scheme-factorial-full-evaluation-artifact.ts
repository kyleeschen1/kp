import generatedArtifact from
  "./scheme-factorial-full-evaluation.generated.json" with { type: "json" };

import {
  defineKpSchemeFactorialFullEvaluation,
  type KpSchemeFactorialFullEvaluation
} from "./scheme-factorial-full-evaluation.ts";
import { unpackKpSchemeFactorialFullEvaluation } from
  "./scheme-factorial-full-evaluation-codec.ts";

// Catalogue playback consumes compiled data; parser, trace compiler, and
// evaluator remain build-only authorities.
const artifact = defineKpSchemeFactorialFullEvaluation(
  unpackKpSchemeFactorialFullEvaluation(
    generatedArtifact as unknown as Record<string, unknown>
  )
);

export function readKpSchemeFactorialFullEvaluationArtifact():
  KpSchemeFactorialFullEvaluation {
  return artifact;
}
