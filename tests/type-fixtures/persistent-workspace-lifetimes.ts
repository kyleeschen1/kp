import {
  defineKpEndpointHandoff,
  defineKpMeasuredRouteIntent,
  defineKpPersistentDocumentaryLifetime,
  defineKpPersistentNativeEndpointLifetime,
  defineKpPersistentWorkspaceRegion,
  defineKpSemanticDestination,
  defineKpTransitOwnership
} from "../../src/animation/persistent-workspace.ts";

const documentary = defineKpPersistentWorkspaceRegion({
  id: "region.documentary",
  kind: "documentary",
  semanticRole: "written-source"
});
const endpoint = defineKpPersistentWorkspaceRegion({
  id: "region.endpoint",
  kind: "native-endpoint",
  semanticRole: "settled-result"
});
const transit = defineKpPersistentWorkspaceRegion({
  id: "region.transit",
  kind: "transit",
  semanticRole: "moving-carry"
});

defineKpPersistentDocumentaryLifetime({
  entityId: "digit.first.ones",
  region: documentary,
  consumptionPolicy: "monotone-dim-never-hide"
});
defineKpPersistentNativeEndpointLifetime({
  entityId: "result.ones",
  region: endpoint
});

defineKpPersistentDocumentaryLifetime({
  entityId: "invalid.endpoint-as-documentary",
  // @ts-expect-error Endpoint regions cannot acquire documentary lifetime.
  region: endpoint,
  consumptionPolicy: "remain-opaque"
});
defineKpPersistentNativeEndpointLifetime({
  entityId: "invalid.transit-as-endpoint",
  // @ts-expect-error Transit regions cannot acquire native endpoint lifetime.
  region: transit
});

const operationDestination = defineKpSemanticDestination({
  id: "destination.operation",
  semanticEntityId: "evaluation.ones.total",
  region: defineKpPersistentWorkspaceRegion({
    id: "region.operation",
    kind: "operation-destination",
    semanticRole: "evaluated-total"
  })
});
const nativeDestination = defineKpSemanticDestination({
  id: "destination.native",
  semanticEntityId: "result.ones",
  region: endpoint
});
const route = defineKpMeasuredRouteIntent({
  id: "route.result",
  kind: "carry-arch",
  materialEntityId: "material.result",
  fromRegion: transit,
  to: nativeDestination
});
const ownership = defineKpTransitOwnership({
  materialEntityId: "material.result",
  route
});

defineKpEndpointHandoff({
  transit: ownership,
  endpoint: nativeDestination,
  endpointLifetime: defineKpPersistentNativeEndpointLifetime({
    entityId: "result.ones",
    region: endpoint
  })
});
defineKpEndpointHandoff({
  transit: ownership,
  // @ts-expect-error Operation destinations cannot receive native handoff.
  endpoint: operationDestination,
  endpointLifetime: defineKpPersistentNativeEndpointLifetime({
    entityId: "result.ones",
    region: endpoint
  })
});
