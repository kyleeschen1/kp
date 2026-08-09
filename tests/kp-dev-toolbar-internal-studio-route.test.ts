import assert from "node:assert/strict";
import test from "node:test";

import {
  kpInternalStudioViews,
  readKpInternalStudioView,
  writeKpInternalStudioView
} from "../src/editor/internal-studio-route.ts";

test("internal studio views include the addressable project dashboard", () => {
  assert.deepEqual(kpInternalStudioViews, [
    "editor",
    "dashboard",
    "animation-library-host",
    "animation-workbench",
    "ftc-tutorial"
  ]);
  assert.equal(readKpInternalStudioView("?view=dashboard"), "dashboard");
});

test("writing an internal view preserves incidental state", () => {
  assert.equal(
    writeKpInternalStudioView("?animation=solve-x&view=editor", "dashboard"),
    "?animation=solve-x&view=dashboard"
  );
});

test("unknown or absent view values do not claim internal route authority", () => {
  assert.equal(readKpInternalStudioView(""), undefined);
  assert.equal(readKpInternalStudioView("?view=animation-catalogue"), undefined);
  assert.equal(readKpInternalStudioView("?view=unknown"), undefined);
});
