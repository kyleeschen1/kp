import { expect, test, type Locator } from "@playwright/test";

const animationId =
  "animation.algebra.radical.compound-carrier-normalization";

test("compound carrier seeks continuously, rewinds, and survives resize", async ({
  page
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`/?artifact=${animationId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-compound-root-carrier-stage]");
  const seek = player.locator('[data-action="seek-editor-animation"]');
  await expect(stage).toHaveAttribute(
    "data-kp-compound-root-carrier-stage",
    "ready",
    { timeout: 10_000 }
  );
  expect(Number(await stage.getAttribute(
    "data-kp-compound-root-carrier-dynamic-track-count"
  ))).toBeGreaterThan(0);

  await seek.fill("0");
  expect(await activeMath(stage)).toBe("\\sqrt{(x+1)^{2}}");
  await seek.fill("0.55");
  await expect(stage).toHaveAttribute(
    "data-kp-compound-root-carrier-progress",
    "0.55"
  );
  expect(await visibleMaterialOwnerCount(stage)).toBeGreaterThan(0);
  await stage.screenshot({
    path: "tmp/codex/compound-root-carrier-midpoint.png",
    animations: "disabled"
  });
  await seek.fill("1");
  expect(await activeMath(stage)).toBe("\\lvertx+1\\rvert");
  await seek.fill("0");
  expect(await activeMath(stage)).toBe("\\sqrt{(x+1)^{2}}");

  const revision = Number(await stage.getAttribute(
    "data-kp-compound-root-carrier-measurement-revision"
  ));
  await page.setViewportSize({ width: 390, height: 760 });
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-compound-root-carrier-measurement-revision"
  ))).toBeGreaterThan(revision);
  await expect(stage).toHaveAttribute(
    "data-kp-compound-root-carrier-stage",
    "ready"
  );
  await seek.fill("1");
  expect(await activeMath(stage)).toBe("\\lvertx+1\\rvert");
  expect(pageErrors).toEqual([]);
});

test("reduced motion retains exact semantic endpoints", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/?artifact=${animationId}&playhead=1`);
  const stage = page.locator("[data-kp-compound-root-carrier-stage]");
  await expect(stage).toHaveAttribute(
    "data-kp-compound-root-carrier-stage",
    "ready",
    { timeout: 10_000 }
  );
  expect(await activeMath(stage)).toBe("\\lvertx+1\\rvert");
});

async function activeMath(stage: Locator) {
  return stage.locator(
    '[data-kp-compound-root-carrier-endpoint][aria-hidden="false"]'
  ).getAttribute("data-kp-compound-root-carrier-latex");
}

async function visibleMaterialOwnerCount(stage: Locator): Promise<number> {
  return stage.locator("[data-kp-equation-material-owner-id]").evaluateAll(
    (owners) => owners.filter((owner) => {
      const style = getComputedStyle(owner);
      return style.visibility !== "hidden" && Number(style.opacity) > 0;
    }).length
  );
}
