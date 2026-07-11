import { expect, test } from "@playwright/test";

import {
  createLinearSolveStaticHostFixtureRoot
} from "../src/tutorial/static-host-fixture-root.ts";
import {
  loadKpStaticHostFixtureEntryDocument
} from "./support/tutorial-launch-smoke.ts";

test("packaged iframe fixture renders from static-host root entry", async ({
  page
}) => {
  const root = createLinearSolveStaticHostFixtureRoot({ iframeProgress: 0.5 });

  await loadKpStaticHostFixtureEntryDocument(
    page,
    root,
    "linear-solve/iframe/index.html"
  );

  await expect(page.locator("html")).toHaveAttribute(
    "data-kp-export-artifact",
    "artifact.linear-solve.iframe"
  );
  await expect(page.locator("[data-kp-tutorial-card]")).toHaveAttribute(
    "data-kp-tutorial-progress",
    "0.5"
  );
  await expect(page.locator("[data-kp-export-artifact-json]")).toBeAttached();
});
