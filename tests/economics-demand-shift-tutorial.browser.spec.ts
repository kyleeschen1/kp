import { mkdir } from "node:fs/promises";

import { expect, test } from "@playwright/test";

const route = "/tutorials/economics/demand-shift/";
const animationId =
  "animation.economics.supply-demand-equilibrium-shift";
const evidenceDirectory = "tmp/codex/economics-demand-shift-tutorial";

test("approved economics prose and semantic controls form one persistent tutorial", async ({
  page
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(route);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const player = root.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const graph = player.locator("[data-kp-editor-graph-svg]");
  const tutorialScrubber = root.getByRole("slider", {
    name: "Scrub demand shift progress"
  });

  await expect(page.locator("#app")).toHaveAttribute(
    "data-kp-economics-demand-shift-tutorial-mounted",
    "true"
  );
  await expect(root.getByText(
    "Why does an increase in demand raise both equilibrium price and equilibrium quantity when supply remains fixed?"
  )).toBeVisible();
  await expect(root.getByRole("heading", { level: 3 })).toHaveCount(4);
  await expect(root.locator(".kp-economics-tutorial__prose .katex")).not.toHaveCount(0);
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await expect(graph).toHaveAttribute(
    "data-kp-graph-presentation-profile",
    "kp.graph.dimensional-continuity.economics.v1"
  );
  await expect(player.locator(".editor-animation-player__controls")).toBeHidden();
  await expect(root.getByRole("button", {
    name: "Previous semantic checkpoint"
  })).toBeVisible();
  await expect(root.getByRole("button", {
    name: "Next semantic checkpoint"
  })).toBeVisible();
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-focus-profile",
    "market"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-focus-target",
    "market"
  );
  await expect(root.locator("[data-kp-economics-tutorial-spotlight]"))
    .toHaveAttribute("data-kp-attention-spotlight-visible", "true");
  await expect(root.locator("[data-kp-economics-tutorial-attention-bridge]"))
    .toHaveCount(0);
  await expect.poll(() => root.locator(".kp-economics-tutorial__passage p")
    .first()
    .evaluate((element) => Number.parseFloat(getComputedStyle(element).textIndent)))
    .toBeGreaterThan(0);
  await mkdir(evidenceDirectory, { recursive: true });
  await page.screenshot({
    path: `${evidenceDirectory}/wide-start.png`,
    fullPage: false
  });

  const demandChange = root.locator(
    '[data-kp-economics-tutorial-passage="demand-change"]'
  );
  await demandChange.evaluate((element) => window.scrollTo({
    top: window.scrollY + element.getBoundingClientRect().top -
      window.innerHeight * 0.38
  }));
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-focus-profile",
    "demand"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-focus-target",
    "demand"
  );
  await expect.poll(() => graph.locator("[data-kp-economics-demand-line]")
    .evaluate((element) => getComputedStyle(element).filter))
    .toContain("opacity(1)");
  await page.screenshot({
    path: `${evidenceDirectory}/wide-demand-focus.png`,
    fullPage: false
  });

  await page.evaluate(() => {
    (window as typeof window & { __kpTutorialDocumentToken?: string })
      .__kpTutorialDocumentToken = "persistent-economics-tutorial";
  });
  await tutorialScrubber.fill("0.72");
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-checkpoint",
    "handoff"
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-progress",
    "0.72"
  );
  await root.getByRole("button", {
    name: "Next semantic checkpoint"
  }).click();
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-checkpoint",
    "settled"
  );
  await expect(graph.locator("[data-kp-economics-equilibrium-point]"))
    .toHaveAttribute("data-kp-economics-equilibrium-quantity", "8");
  expect(await page.evaluate(() =>
    (window as typeof window & { __kpTutorialDocumentToken?: string })
      .__kpTutorialDocumentToken
  )).toBe("persistent-economics-tutorial");

  const synthesis = root.locator(
    '[data-kp-economics-tutorial-passage="synthesis"]'
  );
  await synthesis.evaluate((element) => window.scrollTo({
    top: window.scrollY + element.getBoundingClientRect().top -
      window.innerHeight * 0.38
  }));
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-checkpoint",
    "synthesis"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-focus-profile",
    "synthesis"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-focus-target",
    "supply"
  );
  await expect(root.locator("[data-kp-economics-tutorial-attention-bridge]"))
    .toHaveCount(0);
  await expect.poll(() => graph.locator("[data-kp-economics-supply-line]")
    .evaluate((element) => getComputedStyle(element).filter))
    .toContain("opacity(1)");
  await expect.poll(() => graph.locator("[data-kp-economics-demand-line]")
    .evaluate((element) => getComputedStyle(element).filter))
    .toContain("opacity(0.38)");
  await expect(player).not.toHaveAttribute(
    "data-kp-editor-animation-status",
    "playing"
  );
  await synthesis.getByText("Reveal the model explanation").click();
  await expect(synthesis).toContainText(
    "Quantity supplied rose because equilibrium selected a new point"
  );

  await root.getByText("Explore", { exact: true }).click();
  const parameter = root.getByRole("slider", {
    name: "New demand intercept"
  });
  await parameter.fill("20");
  await expect(root).toHaveAttribute(
    "data-kp-economics-demand-intercept",
    "20"
  );
  await expect.poll(() => new URL(page.url()).searchParams.get("demandIntercept"))
    .toBe("20");
  await root.getByRole("button", {
    name: "Return to lesson example"
  }).click();
  await expect(root).toHaveAttribute(
    "data-kp-economics-demand-intercept",
    "18"
  );
  expect(new URL(page.url()).pathname).toBe(route);
  expect(pageErrors).toEqual([]);

  await page.screenshot({
    path: `${evidenceDirectory}/wide-synthesis.png`,
    fullPage: false
  });
});

test("phone tutorial keeps a stable compact stage dock with optional expansion", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const stage = root.locator(".kp-economics-tutorial__stage");
  const player = root.locator("[data-kp-editor-animation-player]");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await expect(root.locator("[data-kp-economics-tutorial-attention-bridge]"))
    .toHaveCount(0);
  await expect(root.locator("[data-kp-economics-tutorial-spotlight]"))
    .toHaveAttribute("data-kp-attention-spotlight-visible", "true");
  const compact = await stage.boundingBox();
  expect(compact).not.toBeNull();
  expect(compact!.y).toBeCloseTo(0, 0);
  expect(compact!.height).toBeGreaterThan(280);
  expect(compact!.height).toBeLessThan(350);

  await root.getByRole("button", { name: "Expand stage" }).click();
  await expect(root).toHaveClass(/kp-economics-tutorial--stage-expanded/);
  await expect.poll(async () => (await stage.boundingBox())?.height ?? 0)
    .toBeGreaterThan(600);
  await root.getByRole("button", {
    name: "Return stage to compact size"
  }).click();
  await expect.poll(async () => (await stage.boundingBox())?.height ?? 0)
    .toBeLessThan(350);

  await mkdir(evidenceDirectory, { recursive: true });
  await page.screenshot({
    path: `${evidenceDirectory}/phone.png`,
    fullPage: false
  });
});
