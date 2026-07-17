import {
  compileKpFactoringChoreography,
  sampleKpFactoringChoreography
} from "./factoring-choreography.ts";
import {
  registerKpFactoringChoreographyRuntime
} from "./factoring-choreography-runtime.ts";

registerKpFactoringChoreographyRuntime({
  compile: compileKpFactoringChoreography,
  sample: sampleKpFactoringChoreography
});
