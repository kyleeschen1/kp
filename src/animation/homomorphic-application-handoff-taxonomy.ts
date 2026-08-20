import {
  KP_POWER_APPLICATION_ENDPOINT_NORMALIZER,
  type KpNormalizedPowerApplicationEndpoint
} from "../semantic/power-application-endpoint-normalizer.ts";

export type KpHomomorphicApplicationSurfaceForm =
  | "shared-parameter-power"
  | "prefix-function-with-enclosure";

export type KpHomomorphicApplicationVisualHandoff =
  | "carrier-fission"
  | "scope-release-and-rewrap"
  | "matched-dissolve";

export type KpHomomorphicTargetTopology =
  | "lateral-product"
  | "vertical-quotient";

export type KpHomomorphicApplicationSurface =
  | Readonly<{
      kind: "shared-parameter-power";
      authorityId: typeof KP_POWER_APPLICATION_ENDPOINT_NORMALIZER;
      carrierRole: "shared-base";
    }>
  | KpPrefixFunctionApplicationSurface;

export interface KpPrefixFunctionApplicationSurface {
  readonly kind: "prefix-function-with-enclosure";
  readonly authorityId: "normalized-prefix-function-application";
  readonly operatorReferentId: string;
  readonly carrierRole: "scope-wrapper";
  readonly enclosureRole: "argument-scope";
}

export interface KpHomomorphicApplicationHandoffResolution {
  readonly schemaVersion: "kp.homomorphic-application-handoff.v1";
  readonly kind: "homomorphic-application-handoff";
  readonly semanticLineage:
    "one-application-to-many-derived-successors";
  readonly surfaceForm: KpHomomorphicApplicationSurfaceForm;
  readonly targetTopology: KpHomomorphicTargetTopology;
  readonly visualHandoff: Exclude<
    KpHomomorphicApplicationVisualHandoff,
    "matched-dissolve"
  >;
  readonly reception:
    | "native-scale-carrier-fan-out"
    | "canonical-function-wrap";
}

interface KpHomomorphicApplicationSurfaceDeclaration {
  readonly surfaceForm: KpHomomorphicApplicationSurfaceForm;
  readonly carrierRole: "shared-base" | "scope-wrapper";
  readonly defaultVisualHandoff: Exclude<
    KpHomomorphicApplicationVisualHandoff,
    "matched-dissolve"
  >;
  readonly reception:
    | "native-scale-carrier-fan-out"
    | "canonical-function-wrap";
}

/**
 * Mathematical lineage stays shared while normalized surface roles select
 * the visual handoff. In particular, an `exp(...)` wrapper must not inherit
 * the visible carrier split used by an equivalent `e^(...)` representation.
 */
export const kpHomomorphicApplicationSurfaceTaxonomy = Object.freeze([
  Object.freeze({
    surfaceForm: "shared-parameter-power" as const,
    carrierRole: "shared-base" as const,
    defaultVisualHandoff: "carrier-fission" as const,
    reception: "native-scale-carrier-fan-out" as const
  }),
  Object.freeze({
    surfaceForm: "prefix-function-with-enclosure" as const,
    carrierRole: "scope-wrapper" as const,
    defaultVisualHandoff: "scope-release-and-rewrap" as const,
    reception: "canonical-function-wrap" as const
  })
] satisfies readonly KpHomomorphicApplicationSurfaceDeclaration[]);

export const kpHomomorphicApplicationExplicitFallback = Object.freeze({
  visualHandoff: "matched-dissolve" as const,
  selection: "explicit-evidence-only" as const,
  summary:
    "Use only when a measured or reviewed conflict makes the surface default misleading."
});

const prefixFunctionSurfaces = new WeakSet<object>();

export function classifyKpNormalizedPowerApplicationSurface(
  endpoint: KpNormalizedPowerApplicationEndpoint
): Extract<KpHomomorphicApplicationSurface, {
  readonly kind: "shared-parameter-power";
}> {
  if (
    endpoint.kind !== "normalized-power-application-endpoint" ||
    endpoint.authority !== KP_POWER_APPLICATION_ENDPOINT_NORMALIZER ||
    endpoint.base.role !== "shared-base"
  ) {
    throw new Error(
      "Power handoff classification requires normalized shared-base authority."
    );
  }
  return Object.freeze({
    kind: "shared-parameter-power" as const,
    authorityId: KP_POWER_APPLICATION_ENDPOINT_NORMALIZER,
    carrierRole: endpoint.base.role
  });
}

export function defineKpPrefixFunctionApplicationSurface(input: {
  readonly operatorReferentId: string;
  readonly enclosureRole: "argument-scope";
}): KpPrefixFunctionApplicationSurface {
  if (input.operatorReferentId.trim().length === 0) {
    throw new Error(
      "Prefix-function handoff classification requires an operator referent."
    );
  }
  const surface = Object.freeze({
    kind: "prefix-function-with-enclosure" as const,
    authorityId: "normalized-prefix-function-application" as const,
    operatorReferentId: input.operatorReferentId,
    carrierRole: "scope-wrapper" as const,
    enclosureRole: input.enclosureRole
  });
  prefixFunctionSurfaces.add(surface);
  return surface;
}

export function resolveKpHomomorphicApplicationHandoff(input: {
  readonly surface: KpHomomorphicApplicationSurface;
  readonly targetTopology: KpHomomorphicTargetTopology;
}): KpHomomorphicApplicationHandoffResolution {
  if (
    input.surface.kind === "prefix-function-with-enclosure" &&
    !prefixFunctionSurfaces.has(input.surface)
  ) {
    throw new Error(
      "Prefix-function handoff resolution requires declared surface authority."
    );
  }
  const declaration = kpHomomorphicApplicationSurfaceTaxonomy.find(
    ({ surfaceForm, carrierRole }) =>
      surfaceForm === input.surface.kind &&
      carrierRole === input.surface.carrierRole
  );
  if (declaration === undefined) {
    throw new Error(
      `No homomorphic handoff is registered for ${input.surface.kind}.`
    );
  }
  return Object.freeze({
    schemaVersion: "kp.homomorphic-application-handoff.v1" as const,
    kind: "homomorphic-application-handoff" as const,
    semanticLineage:
      "one-application-to-many-derived-successors" as const,
    surfaceForm: declaration.surfaceForm,
    targetTopology: input.targetTopology,
    visualHandoff: declaration.defaultVisualHandoff,
    reception: declaration.reception
  });
}
