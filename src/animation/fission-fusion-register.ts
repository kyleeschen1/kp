import {
  compileKpFissionFusionPlan,
  sampleKpFissionFusion
} from "./fission-fusion.ts";
import { registerKpFissionFusionRuntime } from "./fission-fusion-runtime.ts";

registerKpFissionFusionRuntime({
  compile: compileKpFissionFusionPlan,
  sample: sampleKpFissionFusion
});
