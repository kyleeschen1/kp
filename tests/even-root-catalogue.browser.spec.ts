import { expect, test, type Locator } from "@playwright/test";

const animationId = "animation.algebra.radical.solve-x-squared-nine";

test("even-root exact URL seeks all native states and rewinds", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`/?artifact=${animationId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-even-root-stage]");
  const seek = player.locator('[data-action="seek-editor-animation"]');
  await expect(stage).toHaveAttribute("data-kp-even-root-stage", "ready", {
    timeout: 10_000
  });
  await expect(stage).toHaveAttribute(
    "data-kp-even-root-executable-transitions",
    "2"
  );
  const counts = JSON.parse(await stage.getAttribute(
    "data-kp-even-root-dynamic-track-counts"
  ) ?? "[]") as number[];
  expect(counts).toHaveLength(2);
  expect(counts.every((count) => count > 0)).toBe(true);

  await seek.fill("0");
  expect(await activeMath(stage)).toBe("x^2=9");
  await seek.fill("0.58");
  expect(await activeMath(stage)).toBe("x=\\pm\\sqrt{9}");
  await seek.fill("1");
  expect(await activeMath(stage)).toBe("x=\\pm3");
  await seek.fill("0.58");
  expect(await activeMath(stage)).toBe("x=\\pm\\sqrt{9}");
  await seek.fill("0");
  expect(await activeMath(stage)).toBe("x^2=9");

  const revision = Number(await stage.getAttribute(
    "data-kp-even-root-measurement-revision"
  ));
  await page.setViewportSize({ width: 390, height: 760 });
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-even-root-measurement-revision"
  ))).toBeGreaterThan(revision);
  await expect(stage).toHaveAttribute("data-kp-even-root-stage", "ready");
  await seek.fill("1");
  expect(await activeMath(stage)).toBe("x=\\pm3");
  expect(pageErrors).toEqual([]);
});

test("even-root reduced motion retains the same semantic checkpoints", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/?artifact=${animationId}&playhead=0.58`);
  const stage = page.locator("[data-kp-even-root-stage]");
  await expect(stage).toHaveAttribute("data-kp-even-root-stage", "ready", {
    timeout: 10_000
  });
  expect(await activeMath(stage)).toBe("x=\\pm\\sqrt{9}");
});

async function activeMath(stage: Locator) {
  return stage.locator(
    '[data-kp-even-root-endpoint][aria-hidden="false"]'
  ).getAttribute("data-kp-even-root-latex");
}
