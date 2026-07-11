import assert from "node:assert/strict";
import test from "node:test";

import { createLinearSolveTutorialCardManifest } from "../src/tutorial/card-manifest.ts";
import { createLinearSolveTutorialCardFrameSampler } from "../src/tutorial/card-frame-sampler.ts";
import { createKpTutorialExportCapabilityAdvertisements } from "../src/tutorial/export-capability-advertisements.ts";
import { createKpTutorialParentTimelineFrameExportContract } from "../src/tutorial/frame-export-contract.ts";

test("export capability advertisements connect dependency keys to hosted readiness", () => {
  const manifest = createLinearSolveTutorialCardManifest();
  const contract = createKpTutorialParentTimelineFrameExportContract({
    manifest,
    parentTimeline: createLinearSolveTutorialCardFrameSampler().parentTimeline,
    exportKind: "gif",
    frameCount: 5
  });
  const advertisements = createKpTutorialExportCapabilityAdvertisements({
    artifact: contract.artifact,
    manifest
  });
  const graphAdvertisement = advertisements.find(
    (advertisement) =>
      advertisement.capabilityKey ===
      "kp.graph:render.webgl:graph-3d:surface.mesh"
  );
  const gifAdvertisement = advertisements.find(
    (advertisement) =>
      advertisement.capabilityKey === "kp.export:encode.gif:*:*"
  );

  assert.equal(advertisements.length, 6);
  assert.equal(graphAdvertisement?.library, "kp.graph");
  assert.equal(graphAdvertisement?.capability, "render.webgl");
  assert.equal(graphAdvertisement?.objectType, "graph-3d");
  assert.equal(graphAdvertisement?.mode, "surface.mesh");
  assert.deepEqual(graphAdvertisement?.capabilityPackageIds, [
    "package.kp.graph3d.render.webgl.surface-mesh"
  ]);
  assert.deepEqual(graphAdvertisement?.capabilityPackageLoadPhases, [
    "interaction"
  ]);
  assert.deepEqual(graphAdvertisement?.dependencyPhases, ["interactive"]);
  assert.deepEqual(graphAdvertisement?.loadStages, ["interaction"]);
  assert.equal(graphAdvertisement?.requiredForInitialRender, false);
  assert.equal(graphAdvertisement?.hostedReadiness, "ready");
  assert.deepEqual(graphAdvertisement?.diagnostics, []);
  assert.match(
    graphAdvertisement?.summary ?? "",
    /artifact\.linear-solve\.gif advertises kp\.graph:render\.webgl:graph-3d:surface\.mesh/
  );

  assert.deepEqual(gifAdvertisement?.dependencyPhases, ["optional"]);
  assert.deepEqual(gifAdvertisement?.loadStages, ["export"]);
  assert.deepEqual(gifAdvertisement?.capabilityPackageIds, [
    "package.kp.export.encode.gif"
  ]);
  assert.deepEqual(gifAdvertisement?.capabilityPackageLoadPhases, ["export"]);
  assert.equal(gifAdvertisement?.hostedReadiness, "ready");
});
