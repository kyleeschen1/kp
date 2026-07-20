import { expect, test } from "@playwright/test";

const conceptPath = "/concepts/mathematics/linear-equations/solve-with-balance";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        async writeText(text: string) {
          (window as typeof window & { __kpCopiedUrl?: string }).__kpCopiedUrl = text;
        }
      }
    });
  });
});

test("copy actions preserve exact frame and checkpoint URLs that mount directly", async ({ page }) => {
  await page.goto(conceptPath);
  const shell = page.locator("[data-kp-concept-room-shell]");
  await shell.getByRole("link", { name: "Touch", exact: true }).click();
  await shell.getByRole("slider", { name: "Scrub concept timeline" }).fill("575");
  await shell.locator(
    '[data-kp-correspondence-surface="symbolic"][data-kp-correspondence-semantic-id="term.two-x"]'
  ).first().dispatchEvent("click");

  await shell.getByRole("button", { name: "Copy link to current frame", exact: true }).click();
  await expect(shell.locator("[data-kp-concept-share-status]"))
    .toHaveText("Link copied.");
  const frameUrl = await copiedUrl(page);
  const frameRoute = new URL(frameUrl);
  expect(frameRoute.searchParams.get("checkpoint")).toBe("subtract-three");
  expect(frameRoute.searchParams.get("t")).toBe("575");
  expect(frameRoute.searchParams.get("mode")).toBe("touch");
  expect(frameRoute.searchParams.get("projection")).toBe("coordinated");
  expect(frameRoute.searchParams.getAll("focus")).toContain("term.two-x");

  await page.goto(frameUrl);
  await expect(shell).toHaveAttribute("data-kp-concept-checkpoint", "subtract-three");
  await expect(shell.getByRole("slider", { name: "Scrub concept timeline" })).toHaveValue("575");
  await expect(shell.locator("[data-kp-linear-equation-coordinated-stage]"))
    .toHaveAttribute("data-kp-coordinated-time-permille", "575");

  const divide = shell.locator('[data-kp-concept-explanation="divide-two"]');
  await divide.getByRole("button", { name: "Copy link to Reveal one x step", exact: true }).click();
  const stepUrl = await copiedUrl(page);
  const stepRoute = new URL(stepUrl);
  expect(stepRoute.searchParams.get("checkpoint")).toBe("divide-two");
  expect(stepRoute.searchParams.get("t")).toBe("750");
  expect(stepRoute.searchParams.getAll("focus")).toEqual([
    "diagram.balance",
    "equation.solved",
    "operation.divide-two"
  ]);
  await page.goto(stepUrl);
  await expect(shell).toHaveAttribute("data-kp-concept-checkpoint", "divide-two");
  await expect(shell.getByRole("slider", { name: "Scrub concept timeline" })).toHaveValue("750");
});

test("verification disclosure is exact, quiet, and omits internal diagnostics", async ({ page }) => {
  await page.goto(conceptPath);
  const disclosure = page.locator("[data-kp-concept-verification]");
  await expect(disclosure).toBeVisible();
  await disclosure.locator("summary").click();
  await expect(disclosure).toContainText("Exact rational arithmetic");
  await expect(disclosure).toContainText("linear-problem.v1, version 1.0.0");
  await expect(disclosure).toContainText("Source authorship: human");
  await expect(disclosure).toContainText("Published artifact 1.0.0 is integrity-checked");
  await expect(disclosure).not.toContainText("sha256:");
  await expect(disclosure).not.toContainText("content/mathematics");
  await expect(disclosure.locator("[data-kp-concept-verification-provider]"))
    .toHaveAttribute("data-kp-concept-verification-provider", "linear-problems.exact-rational");
});

test("clipboard failure leaves the canonical URL visible and reports no raw error", async ({ page }) => {
  await page.goto(conceptPath);
  await expect(page.locator('[data-kp-concept-room-mounted="true"]')).toBeAttached();
  await expect(page).toHaveURL(/route=1/);
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => { throw new Error("fixture secret"); } }
    });
  });
  const before = page.url();
  await page.getByRole("button", { name: "Copy link to current frame", exact: true }).click();
  const status = page.locator("[data-kp-concept-share-status]");
  await expect(status).toHaveText("Copy is unavailable. The current URL is still shareable.");
  await expect(status).not.toContainText("fixture secret");
  expect(page.url()).toBe(before);
});

async function copiedUrl(page: import("@playwright/test").Page): Promise<string> {
  await expect.poll(() => page.evaluate(() => (
    window as typeof window & { __kpCopiedUrl?: string }
  ).__kpCopiedUrl)).not.toBeUndefined();
  return page.evaluate(() => (
    window as typeof window & { __kpCopiedUrl: string }
  ).__kpCopiedUrl);
}
