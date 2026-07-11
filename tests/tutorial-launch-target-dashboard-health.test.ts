import { strict as assert } from "node:assert";
import test from "node:test";

import { projectDashboardData } from "../src/project-dashboard/data.ts";
import type { ProjectDashboardData } from "../src/project-dashboard/model.ts";
import { listKpTutorialLaunchTargets } from "../src/tutorial/launch-targets.ts";
import {
  validateKpDashboardExportLaunchTargetLinks
} from "../src/tutorial/launch-target-dashboard-health.ts";

test("dashboard export launch target links match registry metadata", () => {
  assert.deepEqual(
    validateKpDashboardExportLaunchTargetLinks(
      projectDashboardData,
      listKpTutorialLaunchTargets()
    ),
    []
  );
});

test("dashboard export launch target health reports missing sample targets", () => {
  const dataWithoutIframeSample: ProjectDashboardData = {
    ...projectDashboardData,
    gallery: projectDashboardData.gallery.map((item) =>
      item.id === "iframe-export-artifact"
        ? { ...item, sampleTargets: [] }
        : item
    )
  };

  assert.deepEqual(
    validateKpDashboardExportLaunchTargetLinks(
      dataWithoutIframeSample,
      listKpTutorialLaunchTargets()
    ),
    [
      {
        targetId: "launch.export.linear-solve.iframe",
        dashboardRowId: "iframe-export-artifact",
        path: "gallery.iframe-export-artifact.sampleTargets",
        message:
          "Dashboard row iframe-export-artifact must include export artifact sample target artifact.linear-solve.iframe."
      }
    ]
  );
});
