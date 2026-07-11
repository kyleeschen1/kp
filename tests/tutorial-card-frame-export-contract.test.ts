import { strict as assert } from "node:assert";
import test from "node:test";

import { createLinearSolveTutorialCardManifest } from "../src/tutorial/card-manifest.ts";
import { createLinearSolveTutorialCardFrameSampler } from "../src/tutorial/card-frame-sampler.ts";
import { createKpTutorialParentTimelineFrameExportContract } from "../src/tutorial/frame-export-contract.ts";

test("parent-timeline frame export contract declares media artifact and sample points", () => {
  const contract = createKpTutorialParentTimelineFrameExportContract({
    manifest: createLinearSolveTutorialCardManifest(),
    parentTimeline: createLinearSolveTutorialCardFrameSampler().parentTimeline,
    exportKind: "gif",
    frameCount: 5
  });

  assert.equal(contract.id, "frame-export.tutorial.linear-solve.card.gif");
  assert.equal(contract.manifestId, "tutorial.linear-solve.card");
  assert.equal(contract.profileId, "export.linear-solve.gif");
  assert.equal(contract.timelineId, "timeline.linear-solve.shared");
  assert.equal(contract.frameCount, 5);
  assert.equal(contract.sampleSource, "parent-timeline");
  assert.equal(contract.rewindable, true);
  assert.deepEqual(contract.diagnostics, []);
  assert.deepEqual(contract.artifact, {
    id: "artifact.linear-solve.gif",
    manifestId: "tutorial.linear-solve.card",
    profileId: "export.linear-solve.gif",
    exportKind: "gif",
    target: "media",
    artifactKind: "media-encoding",
    payloadKind: "metadata",
    status: "metadata",
    timelineIds: ["timeline.linear-solve.shared"],
    dependencies: {
      phases: ["critical", "interactive", "optional"],
      capabilityKeys: [
        "kp.semantic:document.read:*:*",
        "kp.layout:sample.synchronized-panel:*:*",
        "kp.equation:render.katex:equation:*",
        "kp.graph:render.webgl:graph-3d:surface.mesh",
        "kp.export:encode.gif:*:*",
        "kp.export:render.step-sequence:*:*"
      ],
      assetIds: []
    },
    fallback: {
      strategy: "static-snapshot",
      preservesLayout: true,
      message:
        "Show static equation and graph snapshots when the interactive runtime is unavailable."
    },
    metadata: {
      frameCount: 5,
      frameSampleSource: "parent-timeline",
      fps: 30,
      loop: true,
      maxWidthPx: 640,
      resolver: "parent-timeline-frame-export"
    }
  });
  assert.deepEqual(
    contract.samplePoints.map((point) => [
      point.id,
      point.index,
      point.progress,
      point.beat,
      point.elapsedMs
    ]),
    [
      ["frame.timeline-linear-solve-shared.0000", 0, 0, 0, 0],
      ["frame.timeline-linear-solve-shared.0001", 1, 0.25, 12.5, 600],
      ["frame.timeline-linear-solve-shared.0002", 2, 0.5, 25, 1200],
      ["frame.timeline-linear-solve-shared.0003", 3, 0.75, 37.5, 1800],
      ["frame.timeline-linear-solve-shared.0004", 4, 1, 50, 2400]
    ]
  );
  assert.equal(contract.samplePoints[2]?.parentTimelineFrame.beat, 25);
  assert.equal(
    contract.samplePoints[2]?.parentTimelineFrame.tracks.find(
      (track) =>
        track.trackId ===
        "timeline.linear-solve.shared.transformation.transform.linear-solve.cancel-left-additive-inverse"
    )?.active,
    true
  );
  assert.deepEqual(
    contract.rewindSamplePoints.map((point) => point.index),
    [4, 3, 2, 1, 0]
  );
});

test("parent-timeline frame export contract requires positive frame count", () => {
  assert.throws(
    () =>
      createKpTutorialParentTimelineFrameExportContract({
        manifest: createLinearSolveTutorialCardManifest(),
        parentTimeline: createLinearSolveTutorialCardFrameSampler().parentTimeline,
        exportKind: "gif",
        frameCount: 0
      }),
    /Frame export frameCount must be a positive integer/
  );
});
