import { strict as assert } from "node:assert";
import test from "node:test";

import { createLinearSolveTutorialCardManifest } from "../src/tutorial/card-manifest.ts";
import {
  createKpTutorialCardDependencyPlan,
  type KpTutorialDependencyPhase
} from "../src/tutorial/dependency-planner.ts";
import {
  createKpTutorialCardExportArtifact,
  validateKpTutorialCardExportArtifact
} from "../src/tutorial/export-artifact.ts";
import { resolveKpTutorialCardIframeExportArtifact } from "../src/tutorial/export-artifact-resolver.ts";

test("tutorial card export artifact contract preserves portable output metadata", () => {
  const manifest = createLinearSolveTutorialCardManifest();
  const dependencyPlan = createKpTutorialCardDependencyPlan(manifest);
  const dependencyPhases: KpTutorialDependencyPhase[] = [
    "critical",
    "interactive"
  ];
  const timelineIds = ["timeline.linear-solve.shared"];
  const capabilityKeys = dependencyPlan.phases
    .filter((phase) => dependencyPhases.includes(phase.phase))
    .flatMap((phase) => phase.capabilityKeys);
  const tags = ["embed", "linear-solve"];

  const artifact = createKpTutorialCardExportArtifact({
    id: "artifact.linear-solve.iframe",
    manifestId: manifest.id,
    profileId: "export.linear-solve.iframe",
    exportKind: "iframe",
    target: "browser",
    artifactKind: "iframe-document",
    payloadKind: "html-document",
    status: "metadata",
    timelineIds,
    dependencies: {
      phases: dependencyPhases,
      capabilityKeys,
      assetIds: []
    },
    fallback: manifest.fallback,
    metadata: {
      responsive: true,
      frameSampler: "parent-timeline",
      tags
    }
  });

  timelineIds.push("mutated.timeline");
  tags.push("mutated");

  assert.deepEqual(artifact, {
    id: "artifact.linear-solve.iframe",
    manifestId: "tutorial.linear-solve.card",
    profileId: "export.linear-solve.iframe",
    exportKind: "iframe",
    target: "browser",
    artifactKind: "iframe-document",
    payloadKind: "html-document",
    status: "metadata",
    timelineIds: ["timeline.linear-solve.shared"],
    dependencies: {
      phases: ["critical", "interactive"],
      capabilityKeys: [
        "kp.semantic:document.read:*:*",
        "kp.layout:sample.synchronized-panel:*:*",
        "kp.equation:render.katex:equation:*",
        "kp.graph:render.webgl:graph-3d:surface.mesh"
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
      responsive: true,
      frameSampler: "parent-timeline",
      tags: ["embed", "linear-solve"]
    }
  });
});

test("tutorial card export artifact validation reports missing identity", () => {
  const manifest = createLinearSolveTutorialCardManifest();
  const diagnostics = validateKpTutorialCardExportArtifact({
    id: "",
    manifestId: manifest.id,
    profileId: "",
    exportKind: "step-sequence",
    target: "static",
    artifactKind: "static-step-sequence",
    payloadKind: "json-document",
    status: "renderable",
    timelineIds: [],
    dependencies: {
      phases: [],
      capabilityKeys: [],
      assetIds: []
    },
    fallback: manifest.fallback
  });

  assert.deepEqual(diagnostics, [
    { path: "id", message: "Export artifact id is required." },
    { path: "profileId", message: "Export artifact profileId is required." },
    {
      path: "timelineIds",
      message: "Export artifact must reference at least one timeline."
    }
  ]);
});

test("iframe export artifact resolver maps profile metadata onto artifact contract", () => {
  const artifact = resolveKpTutorialCardIframeExportArtifact(
    createLinearSolveTutorialCardManifest()
  );

  assert.deepEqual(artifact, {
    id: "artifact.linear-solve.iframe",
    manifestId: "tutorial.linear-solve.card",
    profileId: "export.linear-solve.iframe",
    exportKind: "iframe",
    target: "browser",
    artifactKind: "iframe-document",
    payloadKind: "html-document",
    status: "metadata",
    timelineIds: ["timeline.linear-solve.shared"],
    dependencies: {
      phases: ["critical", "interactive"],
      capabilityKeys: [
        "kp.semantic:document.read:*:*",
        "kp.layout:sample.synchronized-panel:*:*",
        "kp.equation:render.katex:equation:*",
        "kp.graph:render.webgl:graph-3d:surface.mesh"
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
      responsive: true,
      requiresControls: true,
      fallbackStrategy: "static-snapshot",
      resolver: "iframe-export-profile"
    }
  });
});
