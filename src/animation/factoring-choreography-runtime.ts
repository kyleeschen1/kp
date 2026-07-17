import type {
  compileKpFactoringChoreography,
  sampleKpFactoringChoreography
} from "./factoring-choreography.ts";

export interface KpFactoringChoreographyRuntime {
  readonly compile: typeof compileKpFactoringChoreography;
  readonly sample: typeof sampleKpFactoringChoreography;
}

let registeredRuntime: KpFactoringChoreographyRuntime | undefined;

export function registerKpFactoringChoreographyRuntime(
  runtime: KpFactoringChoreographyRuntime
): void {
  registeredRuntime = runtime;
}

export function kpFactoringChoreographyRuntime(): KpFactoringChoreographyRuntime {
  if (registeredRuntime === undefined) {
    throw new Error("Missing factoring choreography capability runtime.");
  }
  return registeredRuntime;
}
