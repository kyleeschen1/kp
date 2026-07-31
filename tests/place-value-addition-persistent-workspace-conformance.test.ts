import assert from "node:assert/strict";
import test from "node:test";

import {
  bindKpPlaceValuePersistentWorkspacePlan,
  compileKpPlaceValuePersistentWorkspacePlan,
  isKpPlaceValuePersistentWorkspaceConformance,
  isKpPlaceValuePersistentWorkspacePlan
} from "../src/animation/place-value-addition-persistent-workspace.ts";
import {
  isKpEndpointHandoff,
  isKpMeasuredRouteIntent,
  isKpPersistentEntityLifetime,
  isKpTransitOwnership
} from "../src/animation/persistent-workspace.ts";

test("adversarial matrix leaves no structural escape into the renderer", () => {
  const plan = compileKpPlaceValuePersistentWorkspacePlan();
  const documentary = plan.lifetimes.find(
    (lifetime) => lifetime.kind === "documentary"
  );
  assert.ok(documentary);

  const replacedScene = {
    ...documentary,
    nodePolicy: "replace-scene-per-beat"
  };
  const disappearingHistory = {
    ...documentary,
    endPermille: 400,
    consumptionPolicy: "hide-after-use"
  };
  const wrongDestination = {
    ...plan.onesOperation.carry.route,
    to: plan.onesOperation.result.destination
  };
  const teleportingCarry = {
    ...plan.onesOperation.carry.route,
    authoredGeometry: {
      from: [0, 0],
      to: [10, 10]
    }
  };
  const copiedTransit = { ...plan.onesOperation.carry.transit };
  const copiedHandoff = { ...plan.onesOperation.carry.handoff };
  const copiedPlan = { ...plan };

  assert.equal(isKpPersistentEntityLifetime(replacedScene), false);
  assert.equal(isKpPersistentEntityLifetime(disappearingHistory), false);
  assert.equal(isKpMeasuredRouteIntent(wrongDestination), false);
  assert.equal(isKpMeasuredRouteIntent(teleportingCarry), false);
  assert.equal(isKpTransitOwnership(copiedTransit), false);
  assert.equal(isKpEndpointHandoff(copiedHandoff), false);
  assert.equal(isKpPlaceValuePersistentWorkspacePlan(copiedPlan), false);
  assert.throws(
    () => bindKpPlaceValuePersistentWorkspacePlan(
      copiedPlan as typeof plan
    ),
    /copied persistent workspace plan/u
  );
});

test("only a sealed conforming plan mints renderer-facing authority", () => {
  const plan = compileKpPlaceValuePersistentWorkspacePlan();
  const certificate = bindKpPlaceValuePersistentWorkspacePlan(plan);

  assert.equal(isKpPlaceValuePersistentWorkspaceConformance(
    certificate
  ), true);
  assert.equal(
    isKpPlaceValuePersistentWorkspaceConformance({
      ...certificate,
      routePolicy: "teleport"
    }),
    false
  );
  assert.equal(certificate.plan.onesOperation.carry.route.kind,
    "carry-arch");
  assert.equal(certificate.plan.onesOperation.carry.route.authoredGeometry,
    false);
  assert.equal(certificate.plan.onesOperation.carry.transit.paintPolicy,
    "visible-and-opaque-through-route");
});
