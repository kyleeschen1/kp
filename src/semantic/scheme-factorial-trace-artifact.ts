import generatedArtifact from
  "./scheme-factorial-trace.generated.json" with { type: "json" };

import {
  defineKpSchemeFactorialTraceArtifact,
  type KpSchemeFactorialTraceArtifact
} from "./scheme-factorial-trace-artifact-model.ts";

// The learner-side seam reads generated data only; evaluator imports remain in
// the build script so playback can never acquire semantic execution authority.
const artifact = defineKpSchemeFactorialTraceArtifact(
  generatedArtifact as KpSchemeFactorialTraceArtifact
);

export function readKpSchemeFactorialTraceArtifact():
  KpSchemeFactorialTraceArtifact {
  return artifact;
}

export type { KpSchemeFactorialTraceArtifact } from
  "./scheme-factorial-trace-artifact-model.ts";
