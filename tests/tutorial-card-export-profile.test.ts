import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createKpTutorialCardManifest,
  createLinearSolveTutorialCardManifest
} from "../src/tutorial/card-manifest.ts";
import {
  resolveKpTutorialCardIframeExportProfile
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
