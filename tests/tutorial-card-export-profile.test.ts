import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createKpTutorialCardManifest,
  createLinearSolveTutorialCardManifest
} from "../src/tutorial/card-manifest.ts";
import {
  resolveKpTutorialCardIframeExportProfile,
  resolveKpTutorialCardStepExportProfile
} from "../src/tutorial/export-profile-resolver.ts";

test("iframe export profile resolver normalizes portable card metadata", () => {
  const profile = resolveKpTutorialCardIframeExportProfile(
    createLinearSolveTutorialCardManifest()
  );

  assert.deepEqual(profile, {
    manifestId: "tutorial.linear-solve.card",
    profileId: "export.linear-solve.iframe",
    kind: "iframe",
    target: "browser",
    responsive: true,
    requiresControls: true,
    fallbackStrategy: "static-snapshot",
    dependencyPhases: ["critical", "interactive"],
    settings: { responsive: true }
  });
});

test("iframe export profile resolver reports missing iframe profile", () => {
  const manifest = createLinearSolveTutorialCardManifest();

  assert.throws(
    () =>
      resolveKpTutorialCardIframeExportProfile(
        createKpTutorialCardManifest({
          ...manifest,
          exportProfiles: manifest.exportProfiles.filter(
            (profile) => profile.kind !== "iframe"
          )
        })
      ),
    /does not define an iframe export profile/
  );
});

test("step export profile resolver normalizes static checkpoint metadata", () => {
  const profile = resolveKpTutorialCardStepExportProfile(
    createLinearSolveTutorialCardManifest()
  );

  assert.deepEqual(profile, {
    manifestId: "tutorial.linear-solve.card",
    profileId: "export.linear-solve.steps",
    kind: "step-sequence",
    target: "static",
    includeCheckpoints: true,
    fallbackStrategy: "static-snapshot",
    sampleableTimelineIds: ["timeline.linear-solve.shared"],
    reversibleTimelineIds: ["timeline.linear-solve.shared"],
    dependencyPhases: ["critical", "optional"],
    settings: { includeCheckpoints: true }
  });
});

test("step export profile resolver reports missing step-sequence profile", () => {
  const manifest = createLinearSolveTutorialCardManifest();

  assert.throws(
    () =>
      resolveKpTutorialCardStepExportProfile(
        createKpTutorialCardManifest({
          ...manifest,
          exportProfiles: manifest.exportProfiles.filter(
            (profile) => profile.kind !== "step-sequence"
          )
        })
      ),
    /does not define a step-sequence export profile/
  );
});
