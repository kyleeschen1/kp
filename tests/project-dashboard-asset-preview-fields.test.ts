import { strict as assert } from "node:assert";
import test from "node:test";

import { runKpInterpreter } from "../src/semantic/asset-interpreter.ts";
import { createKpDashboardAssetPreviewInterpreter } from "../src/semantic/dashboard-preview-interpreter.ts";
import { createLinearSolveKpAssetBundle } from "../src/semantic/linear-solve-asset.ts";
import {
  dashboardAssetPreviewDataAttributes,
  dashboardAssetPreviewFields,
  dashboardAssetPreviewSearchFields
} from "../src/project-dashboard/asset-preview-fields.ts";

test("dashboard asset preview fields adapt interpreter output for agenda rows", () => {
  const interpretation = runKpInterpreter(
    createKpDashboardAssetPreviewInterpreter(),
    createLinearSolveKpAssetBundle().bundle
  );

  assert.deepEqual(dashboardAssetPreviewDataAttributes(interpretation), [
    ["data-kp-dashboard-preview-interpreter", "interpreter.dashboard.asset-preview"]
  ]);
  assert.deepEqual(dashboardAssetPreviewFields(interpretation).slice(0, 3), [
    { label: "Dashboard interpreter", value: "interpreter.dashboard.asset-preview" },
    { label: "Asset summary", value: "4 objects, 17 selectors" },
    { label: "Asset id", value: "asset.linear-solve" }
  ]);
  assert.ok(
    dashboardAssetPreviewSearchFields(interpretation).includes("asset.linear-solve")
  );
});
