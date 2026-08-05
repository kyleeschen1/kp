import compiledArtifactSource from
  "./economics-demand-shift-publication.generated.json" with { type: "json" };

import {
  assertKpCompiledPublicationArtifact
} from "../kp-compiled-publication-artifact.ts";
import type {
  KpEconomicsDemandShiftPublication
} from "./economics-demand-shift-publication.ts";

const expectedArtifactId = "publication.economics.demand-shift";

/**
 * The build owns digest verification; the browser checks only the cheap schema
 * and route identity before trusting the already-compiled publication payload.
 */
export function readKpEconomicsDemandShiftCompiledPublication(
): KpEconomicsDemandShiftPublication {
  const artifact: unknown = compiledArtifactSource;
  assertKpCompiledPublicationArtifact(artifact);
  if (artifact.artifactId !== expectedArtifactId) {
    throw new Error(
      `Unexpected economics publication artifact: ${artifact.artifactId}.`
    );
  }
  return artifact.payload as KpEconomicsDemandShiftPublication;
}
