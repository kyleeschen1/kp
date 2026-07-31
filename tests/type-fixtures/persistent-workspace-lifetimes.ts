import {
  defineKpPersistentDocumentaryLifetime,
  defineKpPersistentNativeEndpointLifetime,
  defineKpPersistentWorkspaceRegion
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
