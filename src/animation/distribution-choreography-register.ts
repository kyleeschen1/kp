import {
  compileKpDistributionChoreography,
  sampleKpDistributionChoreography
} from "./distribution-choreography.ts";
import {
  registerKpDistributionChoreographyRuntime
} from "./distribution-choreography-runtime.ts";

registerKpDistributionChoreographyRuntime({
  compile: compileKpDistributionChoreography,
  sample: sampleKpDistributionChoreography
});
