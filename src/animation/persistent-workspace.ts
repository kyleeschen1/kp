declare const kpWorkspaceRegionBrand: unique symbol;
declare const kpWorkspaceLifetimeBrand: unique symbol;

const sealedRegions = new WeakSet<object>();
const sealedLifetimes = new WeakSet<object>();

export type KpPersistentWorkspaceRegionKind =
  | "documentary"
  | "operation-destination"
  | "transit"
  | "native-endpoint";

export interface KpPersistentWorkspaceRegion<
  Kind extends KpPersistentWorkspaceRegionKind =
    KpPersistentWorkspaceRegionKind
> {
  readonly id: string;
  readonly kind: Kind;
  readonly semanticRole: string;
  readonly geometryAuthority: "connected-native-paint";
  readonly [kpWorkspaceRegionBrand]: true;
}

interface KpPersistentEntityLifetimeBase {
  readonly entityId: string;
  readonly startPermille: 0;
  readonly endPermille: 1_000;
  readonly nodePolicy: "same-connected-node";
  readonly geometryPolicy: "stationary";
  readonly [kpWorkspaceLifetimeBrand]: true;
}

export interface KpPersistentDocumentaryLifetime
  extends KpPersistentEntityLifetimeBase {
  readonly kind: "documentary";
  readonly region: KpPersistentWorkspaceRegion<"documentary">;
  readonly initialVisibility: "visible";
  readonly consumptionPolicy:
    | "monotone-dim-never-hide"
    | "remain-opaque";
  readonly rewindPolicy: "restore-original-opacity";
}

export interface KpPersistentNativeEndpointLifetime
  extends KpPersistentEntityLifetimeBase {
  readonly kind: "native-endpoint";
  readonly region: KpPersistentWorkspaceRegion<"native-endpoint">;
  readonly initialVisibility: "hidden";
  readonly revealPolicy: "exclusive-handoff";
  readonly rewindPolicy: "hide-before-reverse-transit";
}

export type KpPersistentEntityLifetime =
  | KpPersistentDocumentaryLifetime
  | KpPersistentNativeEndpointLifetime;

export function defineKpPersistentWorkspaceRegion<
  const Kind extends KpPersistentWorkspaceRegionKind
>(input: {
  readonly id: string;
  readonly kind: Kind;
  readonly semanticRole: string;
}): KpPersistentWorkspaceRegion<Kind> {
  assertIdentifier(input.id, "workspace region");
  assertIdentifier(input.semanticRole, "workspace semantic role");
  const region = Object.freeze({
    ...input,
    geometryAuthority: "connected-native-paint" as const
  });
  sealedRegions.add(region);
  return region as unknown as KpPersistentWorkspaceRegion<Kind>;
}

export function defineKpPersistentDocumentaryLifetime(input: {
  readonly entityId: string;
  readonly region: KpPersistentWorkspaceRegion<"documentary">;
  readonly consumptionPolicy:
    | "monotone-dim-never-hide"
    | "remain-opaque";
}): KpPersistentDocumentaryLifetime {
  assertIdentifier(input.entityId, "persistent entity");
  assertRegion(input.region, "documentary");
  const lifetime = Object.freeze({
    kind: "documentary" as const,
    entityId: input.entityId,
    region: input.region,
    startPermille: 0 as const,
    endPermille: 1_000 as const,
    nodePolicy: "same-connected-node" as const,
    geometryPolicy: "stationary" as const,
    initialVisibility: "visible" as const,
    consumptionPolicy: input.consumptionPolicy,
    rewindPolicy: "restore-original-opacity" as const
  });
  sealedLifetimes.add(lifetime);
  return lifetime as unknown as KpPersistentDocumentaryLifetime;
}

export function defineKpPersistentNativeEndpointLifetime(input: {
  readonly entityId: string;
  readonly region: KpPersistentWorkspaceRegion<"native-endpoint">;
}): KpPersistentNativeEndpointLifetime {
  assertIdentifier(input.entityId, "persistent entity");
  assertRegion(input.region, "native-endpoint");
  const lifetime = Object.freeze({
    kind: "native-endpoint" as const,
    entityId: input.entityId,
    region: input.region,
    startPermille: 0 as const,
    endPermille: 1_000 as const,
    nodePolicy: "same-connected-node" as const,
    geometryPolicy: "stationary" as const,
    initialVisibility: "hidden" as const,
    revealPolicy: "exclusive-handoff" as const,
    rewindPolicy: "hide-before-reverse-transit" as const
  });
  sealedLifetimes.add(lifetime);
  return lifetime as unknown as KpPersistentNativeEndpointLifetime;
}

export function isKpPersistentWorkspaceRegion(
  value: unknown
): value is KpPersistentWorkspaceRegion {
  return typeof value === "object" &&
    value !== null &&
    sealedRegions.has(value);
}

export function isKpPersistentEntityLifetime(
  value: unknown
): value is KpPersistentEntityLifetime {
  return typeof value === "object" &&
    value !== null &&
    sealedLifetimes.has(value);
}

function assertRegion(
  region: KpPersistentWorkspaceRegion,
  expectedKind: KpPersistentWorkspaceRegionKind
): void {
  if (!isKpPersistentWorkspaceRegion(region) || region.kind !== expectedKind) {
    throw new Error(
      `Persistent lifetime requires a sealed ${expectedKind} region.`
    );
  }
}

function assertIdentifier(value: string, label: string): void {
  if (value.length === 0 || value.trim() !== value || /\s/u.test(value)) {
    throw new Error(`${label} ID must be a non-empty unspaced string.`);
  }
}
