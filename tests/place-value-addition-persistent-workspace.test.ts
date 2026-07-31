import assert from "node:assert/strict";
import test from "node:test";

import {
  defineKpPersistentDocumentaryLifetime,
  defineKpPersistentNativeEndpointLifetime,
  defineKpPersistentWorkspaceRegion,
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
