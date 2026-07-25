import type { KpInteractivePresentationCapability } from "./presentation-constraints.ts";

export type KpBackendCapabilityDisposition =
  | "preserved"
  | "lowered-static-evidence"
  | "rejected";

export interface KpGlyphReconciliationBackendCapability {
  readonly capability: KpInteractivePresentationCapability;
  readonly disposition: KpBackendCapabilityDisposition;
  readonly reason: string;
}

export interface KpGlyphReconciliationBackendReport {
  readonly backendId: "static-js" | "headless";
  readonly runtimeDependencies: "none";
  readonly capabilities: readonly KpGlyphReconciliationBackendCapability[];
}

const headlessInteractiveCapabilities = new Set<KpInteractivePresentationCapability>([
  "accessibility",
  "annotation",
  "cloze",
  "hover"
]);

export function reportKpGlyphReconciliationBackendCapabilities(input: {
  readonly backendId: KpGlyphReconciliationBackendReport["backendId"];
  readonly requiredCapabilities: readonly KpInteractivePresentationCapability[];
}): KpGlyphReconciliationBackendReport {
  return Object.freeze({
    backendId: input.backendId,
    runtimeDependencies: "none",
    capabilities: Object.freeze(input.requiredCapabilities.map((capability) =>
      Object.freeze({
        capability,
        disposition:
          input.backendId === "headless" && headlessInteractiveCapabilities.has(capability)
            ? "lowered-static-evidence" as const
            : "preserved" as const,
        reason:
          input.backendId === "headless" && headlessInteractiveCapabilities.has(capability)
            ? `${capability} remains semantic evidence but has no interactive surface in headless output.`
            : `${capability} is executable in ${input.backendId}.`
      })
    ))
  });
}
