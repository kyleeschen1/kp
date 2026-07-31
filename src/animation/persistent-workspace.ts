declare const kpWorkspaceRegionBrand: unique symbol;
declare const kpWorkspaceLifetimeBrand: unique symbol;
declare const kpWorkspaceDestinationBrand: unique symbol;
declare const kpWorkspaceRouteBrand: unique symbol;
declare const kpWorkspaceTransitBrand: unique symbol;
declare const kpWorkspaceHandoffBrand: unique symbol;

const sealedRegions = new WeakSet<object>();
const sealedLifetimes = new WeakSet<object>();
const sealedDestinations = new WeakSet<object>();
const sealedRoutes = new WeakSet<object>();
const sealedTransits = new WeakSet<object>();
const sealedHandoffs = new WeakSet<object>();

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

export type KpSemanticDestinationRegionKind =
  | "operation-destination"
  | "native-endpoint";

export interface KpSemanticDestination<
  Kind extends KpSemanticDestinationRegionKind =
    KpSemanticDestinationRegionKind
> {
  readonly id: string;
  readonly semanticEntityId: string;
  readonly region: KpPersistentWorkspaceRegion<Kind>;
  readonly anchorPolicy: "measure-native-paint";
  readonly [kpWorkspaceDestinationBrand]: true;
}

export interface KpMeasuredRouteIntent {
  readonly id: string;
  readonly kind: "converge" | "carry-arch";
  readonly materialEntityId: string;
  readonly fromRegion: KpPersistentWorkspaceRegion;
  readonly to: KpSemanticDestination;
  readonly geometryPolicy: "renderer-resolves-connected-paint";
  readonly authoredGeometry: false;
  readonly [kpWorkspaceRouteBrand]: true;
}

export interface KpTransitOwnership {
  readonly materialEntityId: string;
  readonly route: KpMeasuredRouteIntent;
  readonly paintPolicy: "visible-and-opaque-through-route";
  readonly releasePolicy: "only-after-native-endpoint-match";
  readonly [kpWorkspaceTransitBrand]: true;
}

export interface KpEndpointHandoff {
  readonly transit: KpTransitOwnership;
  readonly endpoint: KpSemanticDestination<"native-endpoint">;
  readonly endpointLifetime: KpPersistentNativeEndpointLifetime;
  readonly ownershipPolicy: "exclusive-at-native-match";
  readonly opacityPolicy: "opaque";
  readonly [kpWorkspaceHandoffBrand]: true;
}

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

export function defineKpSemanticDestination<
  const Kind extends KpSemanticDestinationRegionKind
>(input: {
  readonly id: string;
  readonly semanticEntityId: string;
  readonly region: KpPersistentWorkspaceRegion<Kind>;
}): KpSemanticDestination<Kind> {
  assertIdentifier(input.id, "semantic destination");
  assertIdentifier(input.semanticEntityId, "destination entity");
  if (
    !isKpPersistentWorkspaceRegion(input.region) ||
    (
      input.region.kind !== "operation-destination" &&
      input.region.kind !== "native-endpoint"
    )
  ) {
    throw new Error(
      "Semantic destination requires a sealed destination or endpoint region."
    );
  }
  const destination = Object.freeze({
    ...input,
    anchorPolicy: "measure-native-paint" as const
  });
  sealedDestinations.add(destination);
  return destination as unknown as KpSemanticDestination<Kind>;
}

export function defineKpMeasuredRouteIntent(input: {
  readonly id: string;
  readonly kind: KpMeasuredRouteIntent["kind"];
  readonly materialEntityId: string;
  readonly fromRegion: KpPersistentWorkspaceRegion;
  readonly to: KpSemanticDestination;
}): KpMeasuredRouteIntent {
  assertIdentifier(input.id, "route intent");
  assertIdentifier(input.materialEntityId, "route material");
  if (
    !isKpPersistentWorkspaceRegion(input.fromRegion) ||
    !isKpSemanticDestination(input.to)
  ) {
    throw new Error(
      "Measured routes require sealed semantic regions and destinations."
    );
  }
  const route = Object.freeze({
    ...input,
    geometryPolicy: "renderer-resolves-connected-paint" as const,
    authoredGeometry: false as const
  });
  sealedRoutes.add(route);
  return route as unknown as KpMeasuredRouteIntent;
}

export function defineKpTransitOwnership(input: {
  readonly materialEntityId: string;
  readonly route: KpMeasuredRouteIntent;
}): KpTransitOwnership {
  assertIdentifier(input.materialEntityId, "transit material");
  if (
    !isKpMeasuredRouteIntent(input.route) ||
    input.materialEntityId !== input.route.materialEntityId
  ) {
    throw new Error(
      "Transit ownership must match one sealed measured route material."
    );
  }
  const transit = Object.freeze({
    ...input,
    paintPolicy: "visible-and-opaque-through-route" as const,
    releasePolicy: "only-after-native-endpoint-match" as const
  });
  sealedTransits.add(transit);
  return transit as unknown as KpTransitOwnership;
}

export function defineKpEndpointHandoff(input: {
  readonly transit: KpTransitOwnership;
  readonly endpoint: KpSemanticDestination<"native-endpoint">;
  readonly endpointLifetime: KpPersistentNativeEndpointLifetime;
}): KpEndpointHandoff {
  if (
    !isKpTransitOwnership(input.transit) ||
    !isKpSemanticDestination(input.endpoint) ||
    input.endpoint.region.kind !== "native-endpoint" ||
    !isKpPersistentEntityLifetime(input.endpointLifetime) ||
    input.endpointLifetime.kind !== "native-endpoint" ||
    input.transit.route.to !== input.endpoint ||
    input.endpoint.region !== input.endpointLifetime.region ||
    input.endpoint.semanticEntityId !== input.endpointLifetime.entityId
  ) {
    throw new Error(
      "Endpoint handoff requires one route target and its matching native lifetime."
    );
  }
  const handoff = Object.freeze({
    ...input,
    ownershipPolicy: "exclusive-at-native-match" as const,
    opacityPolicy: "opaque" as const
  });
  sealedHandoffs.add(handoff);
  return handoff as unknown as KpEndpointHandoff;
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

export function isKpSemanticDestination(
  value: unknown
): value is KpSemanticDestination {
  return typeof value === "object" &&
    value !== null &&
    sealedDestinations.has(value);
}

export function isKpMeasuredRouteIntent(
  value: unknown
): value is KpMeasuredRouteIntent {
  return typeof value === "object" &&
    value !== null &&
    sealedRoutes.has(value);
}

export function isKpTransitOwnership(
  value: unknown
): value is KpTransitOwnership {
  return typeof value === "object" &&
    value !== null &&
    sealedTransits.has(value);
}

export function isKpEndpointHandoff(
  value: unknown
): value is KpEndpointHandoff {
  return typeof value === "object" &&
    value !== null &&
    sealedHandoffs.has(value);
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
