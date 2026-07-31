import assert from "node:assert/strict";
import test from "node:test";

import {
  defineKpEndpointHandoff,
  defineKpMeasuredRouteIntent,
  defineKpPersistentDocumentaryLifetime,
  defineKpPersistentNativeEndpointLifetime,
  defineKpPersistentWorkspaceRegion,
  defineKpSemanticDestination,
  defineKpTransitOwnership,
  isKpEndpointHandoff,
  isKpPersistentEntityLifetime,
  isKpPersistentWorkspaceRegion
} from "../src/animation/persistent-workspace.ts";

test("persistent regions retain semantic role without authored geometry", () => {
  const region = defineKpPersistentWorkspaceRegion({
    id: "region.place-value.addends",
    kind: "documentary",
    semanticRole: "written-addends"
  });

  assert.equal(isKpPersistentWorkspaceRegion(region), true);
  assert.equal(region.geometryAuthority, "connected-native-paint");
  assert.equal(
    "coordinates" in region || "offset" in region || "scale" in region,
    false
  );
  assert.equal(
    isKpPersistentWorkspaceRegion({ ...region }),
    false
  );
});

test("documentary lifetimes make disappearing history unrepresentable", () => {
  const lifetime = defineKpPersistentDocumentaryLifetime({
    entityId: "digit.first.ones",
    region: defineKpPersistentWorkspaceRegion({
      id: "region.place-value.addends",
      kind: "documentary",
      semanticRole: "written-addends"
    }),
    consumptionPolicy: "monotone-dim-never-hide"
  });

  assert.equal(isKpPersistentEntityLifetime(lifetime), true);
  assert.deepEqual(lifetime, {
    kind: "documentary",
    entityId: "digit.first.ones",
    region: lifetime.region,
    startPermille: 0,
    endPermille: 1_000,
    nodePolicy: "same-connected-node",
    geometryPolicy: "stationary",
    initialVisibility: "visible",
    consumptionPolicy: "monotone-dim-never-hide",
    rewindPolicy: "restore-original-opacity"
  });
  assert.equal(isKpPersistentEntityLifetime({ ...lifetime }), false);
});

test("native endpoint lifetimes stay mounted but reveal only by handoff", () => {
  const lifetime = defineKpPersistentNativeEndpointLifetime({
    entityId: "result.ones",
    region: defineKpPersistentWorkspaceRegion({
      id: "region.place-value.result.ones",
      kind: "native-endpoint",
      semanticRole: "ones-result-slot"
    })
  });

  assert.equal(isKpPersistentEntityLifetime(lifetime), true);
  assert.equal(lifetime.nodePolicy, "same-connected-node");
  assert.equal(lifetime.initialVisibility, "hidden");
  assert.equal(lifetime.revealPolicy, "exclusive-handoff");
  assert.equal(lifetime.rewindPolicy, "hide-before-reverse-transit");
});

test("lifetime compilers reject copied or wrong-kind region authority", () => {
  const endpoint = defineKpPersistentWorkspaceRegion({
    id: "region.place-value.result.ones",
    kind: "native-endpoint",
    semanticRole: "ones-result-slot"
  });

  assert.throws(
    () => defineKpPersistentNativeEndpointLifetime({
      entityId: "result.ones",
      region: { ...endpoint } as typeof endpoint
    }),
    /sealed native-endpoint region/u
  );
});

test("semantic destination and measured route remain separate contracts", () => {
  const source = defineKpPersistentWorkspaceRegion({
    id: "region.place-value.evaluated-total",
    kind: "operation-destination",
    semanticRole: "evaluated-total"
  });
  const endpointRegion = defineKpPersistentWorkspaceRegion({
    id: "region.place-value.carry.tens",
    kind: "native-endpoint",
    semanticRole: "carry-slot"
  });
  const endpoint = defineKpSemanticDestination({
    id: "destination.place-value.carry.tens",
    semanticEntityId: "carry.tens",
    region: endpointRegion
  });
  const route = defineKpMeasuredRouteIntent({
    id: "route.place-value.ones-carry",
    kind: "carry-arch",
    materialEntityId: "carry.ones-to-tens",
    fromRegion: source,
    to: endpoint
  });

  assert.equal(endpoint.anchorPolicy, "measure-native-paint");
  assert.equal(route.geometryPolicy, "renderer-resolves-connected-paint");
  assert.equal(route.authoredGeometry, false);
  assert.equal(
    "x" in route || "y" in route || "controlPoint" in route,
    false
  );
});

test("transit owns opaque paint until one matching native handoff", () => {
  const source = defineKpPersistentWorkspaceRegion({
    id: "region.place-value.evaluated-total",
    kind: "operation-destination",
    semanticRole: "evaluated-total"
  });
  const endpointRegion = defineKpPersistentWorkspaceRegion({
    id: "region.place-value.carry.tens",
    kind: "native-endpoint",
    semanticRole: "carry-slot"
  });
  const endpoint = defineKpSemanticDestination({
    id: "destination.place-value.carry.tens",
    semanticEntityId: "carry.tens",
    region: endpointRegion
  });
  const route = defineKpMeasuredRouteIntent({
    id: "route.place-value.ones-carry",
    kind: "carry-arch",
    materialEntityId: "carry.ones-to-tens",
    fromRegion: source,
    to: endpoint
  });
  const transit = defineKpTransitOwnership({
    materialEntityId: route.materialEntityId,
    route
  });
  const endpointLifetime = defineKpPersistentNativeEndpointLifetime({
    entityId: "carry.tens",
    region: endpointRegion
  });
  const handoff = defineKpEndpointHandoff({
    transit,
    endpoint,
    endpointLifetime
  });

  assert.equal(transit.paintPolicy, "visible-and-opaque-through-route");
  assert.equal(transit.releasePolicy, "only-after-native-endpoint-match");
  assert.equal(isKpEndpointHandoff(handoff), true);
  assert.equal(handoff.ownershipPolicy, "exclusive-at-native-match");
  assert.equal(handoff.opacityPolicy, "opaque");
  assert.deepEqual(
    JSON.parse(JSON.stringify(handoff)),
    JSON.parse(JSON.stringify(handoff))
  );
});

test("handoff rejects copied authority and mismatched native endpoints", () => {
  const source = defineKpPersistentWorkspaceRegion({
    id: "region.source",
    kind: "operation-destination",
    semanticRole: "evaluated-total"
  });
  const endpointRegion = defineKpPersistentWorkspaceRegion({
    id: "region.endpoint",
    kind: "native-endpoint",
    semanticRole: "carry-slot"
  });
  const endpoint = defineKpSemanticDestination({
    id: "destination.endpoint",
    semanticEntityId: "carry.tens",
    region: endpointRegion
  });
  const route = defineKpMeasuredRouteIntent({
    id: "route.carry",
    kind: "carry-arch",
    materialEntityId: "carry.material",
    fromRegion: source,
    to: endpoint
  });
  const transit = defineKpTransitOwnership({
    materialEntityId: "carry.material",
    route
  });

  assert.throws(
    () => defineKpEndpointHandoff({
      transit: { ...transit } as typeof transit,
      endpoint,
      endpointLifetime: defineKpPersistentNativeEndpointLifetime({
        entityId: "carry.tens",
        region: endpointRegion
      })
    }),
    /matching native lifetime/u
  );
});

test("one transit cannot mint duplicate visible endpoint ownership", () => {
  const source = defineKpPersistentWorkspaceRegion({
    id: "region.source.unique",
    kind: "operation-destination",
    semanticRole: "evaluated-total"
  });
  const endpointRegion = defineKpPersistentWorkspaceRegion({
    id: "region.endpoint.unique",
    kind: "native-endpoint",
    semanticRole: "result-slot"
  });
  const endpoint = defineKpSemanticDestination({
    id: "destination.endpoint.unique",
    semanticEntityId: "result.ones",
    region: endpointRegion
  });
  const transit = defineKpTransitOwnership({
    materialEntityId: "result.material.unique",
    route: defineKpMeasuredRouteIntent({
      id: "route.result.unique",
      kind: "converge",
      materialEntityId: "result.material.unique",
      fromRegion: source,
      to: endpoint
    })
  });
  const endpointLifetime = defineKpPersistentNativeEndpointLifetime({
    entityId: "result.ones",
    region: endpointRegion
  });

  defineKpEndpointHandoff({ transit, endpoint, endpointLifetime });
  assert.throws(
    () => defineKpEndpointHandoff({
      transit,
      endpoint,
      endpointLifetime
    }),
    /one unclaimed route target/u
  );
});
