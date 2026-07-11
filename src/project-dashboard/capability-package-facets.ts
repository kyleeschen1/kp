import type { KpCapabilityPackageManifest } from "../semantic/capability-package-manifest.ts";

export function capabilityPackageFacetSearchFields(
  manifest: KpCapabilityPackageManifest
): readonly string[] {
  return uniqueStrings([
    manifest.id,
    manifest.title,
    manifest.summary,
    manifest.capabilityKey,
    ...facet("package", manifest.id),
    ...facet("key", manifest.capabilityKey),
    ...facet("capability-key", manifest.capabilityKey),
    manifest.library,
    ...facet("library", manifest.library),
    manifest.capability,
    ...facet("capability", manifest.capability),
    manifest.objectType,
    ...facet("object", manifest.objectType),
    ...facet("object-type", manifest.objectType),
    manifest.mode,
    ...facet("mode", manifest.mode),
    manifest.status,
    ...facet("status", manifest.status),
    manifest.target,
    ...facet("target", manifest.target),
    manifest.loadPhase,
    ...facet("load", manifest.loadPhase),
    ...facet("load-phase", manifest.loadPhase),
    ...manifest.semanticCapabilities.flatMap((capability) => [
      capability,
      ...facet("semantic", capability),
      ...facet("semantic-capability", capability)
    ]),
    ...manifest.protocols.flatMap((protocol) => [
      protocol,
      ...facet("protocol", protocol)
    ]),
    ...manifest.views.flatMap((view) => [view, ...facet("view", view)]),
    ...manifest.tags.flatMap((tag) => [tag, ...facet("tag", tag)]),
    ...manifest.sourceRefs.flatMap((sourceRef) => [
      sourceRef.label,
      sourceRef.href,
      ...facet("source", sourceRef.href)
    ])
  ]);
}

function facet(name: string, value: string): readonly string[] {
  return value.trim().length === 0 ? [] : [`${name}:${value}`];
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}
