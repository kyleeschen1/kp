import {
  compileKpFissionFusionPlan,
  sampleKpFissionFusion
} from "./fission-fusion.ts";

export interface KpFissionFusionCapability {
  readonly compile: typeof compileKpFissionFusionPlan;
  readonly sample: typeof sampleKpFissionFusion;
}

/**
 * The capability is a value, not ambient runtime state, so callers can make
 * their dependency explicit without relying on a prior module import.
 */
export const kpFissionFusionCapability = Object.freeze({
  compile: compileKpFissionFusionPlan,
  sample: sampleKpFissionFusion
}) satisfies KpFissionFusionCapability;
