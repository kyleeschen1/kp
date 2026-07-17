import type {
  compileKpDistributionChoreography,
  sampleKpDistributionChoreography
} from "./distribution-choreography.ts";

export interface KpDistributionChoreographyRuntime {
  readonly compile: typeof compileKpDistributionChoreography;
  readonly sample: typeof sampleKpDistributionChoreography;
}

let registeredRuntime: KpDistributionChoreographyRuntime | undefined;

export function registerKpDistributionChoreographyRuntime(
  runtime: KpDistributionChoreographyRuntime
): void {
  registeredRuntime = runtime;
}

export function kpDistributionChoreographyRuntime(): KpDistributionChoreographyRuntime {
  if (registeredRuntime === undefined) {
    throw new Error("Missing distribution choreography capability runtime.");
  }
  return registeredRuntime;
}
