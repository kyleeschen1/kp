import { expect, test } from "@playwright/test";

const animationId = "animation.generated.linear-solve.linear-68c15d41";
const catalogueRoute = `/?artifact=${animationId}`;
const readerRoute =
  "/reader/generated-solve-x/?kpLesson=" +
  "lesson.generated-solve-x.linear-68c15d41&kpVersion=1";

test("verified generated solve paints natively in the persistent catalogue", async ({
  page
}) => {
  const providerRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("linear-problems")) {
      providerRequests.push(request.url());
    }
  });
  await page.goto(catalogueRoute);
  await page.waitForFunction((expected) => {
    const shell = document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue]"
    );
    return shell?.dataset["kpAnimationCatalogueSelection"] === expected &&
      shell.dataset["kpAnimationCatalogueHostOutcome"] === "painted";
  }, animationId);

  const shell = page.locator("[data-kp-animation-catalogue]");
  const player = shell.locator("[data-kp-editor-animation-player]");
  await expect(shell).toHaveAttribute("data-kp-svelte-catalogue-shell", "");
  await expect(player).toHaveAttribute("data-kp-editor-animation-id", animationId);
  await expect(player.locator(".katex").first()).toBeVisible();
  await expect(shell.locator("iframe")).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`artifact=${animationId}`));
  expect(providerRequests).toEqual([]);

  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  await scrubber.fill("0.8");
  await expect(scrubber).toHaveValue("0.8");
  await scrubber.fill("0.2");
  await expect(scrubber).toHaveValue("0.2");

  await shell.locator(
    '[data-action="select-animation-catalogue-inspector"]'
  ).selectOption("explanation");
  const explanation = shell.locator("[data-kp-generated-explanation]");
  await expect(explanation).toBeVisible();
  await expect(explanation.locator("h3")).toHaveCount(4);
  await expect(explanation.locator(".katex").first()).toBeVisible();
  await expect(explanation.locator(".katex-display")).toHaveCount(0);
});

test("generated reader is searchable, direct-seekable, and reduced-motion safe", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${readerRoute}&kpProgress=800`, { waitUntil: "networkidle" });

  const body = page.locator("body");
  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(page.locator("[data-kp-animation-catalogue]")).toHaveCount(0);
  await expect(body).toHaveAttribute("data-kp-reader-hydrated", "true");
  await expect(body).toHaveAttribute("data-kp-reader-progress", "800");
  await expect(body).toHaveAttribute("data-kp-reader-motion-mode", "essential");
  await expect(stage).toHaveAttribute("data-kp-reader-animation-id", animationId);
  expect(await stage.locator(".katex").count()).toBeGreaterThan(0);
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(page.getByText("The verified solution is five halves.")).toBeVisible();
  await expect(page.locator("[data-kp-beat]")).toHaveCount(6);

  const scrubber = page.locator("[data-kp-reader-attention-scrubber]");
  await seekReader(scrubber, 200);
  await expect(body).toHaveAttribute("data-kp-reader-progress", "200");
  await seekReader(scrubber, 800);
  await expect(body).toHaveAttribute("data-kp-reader-progress", "800");
});

async function seekReader(
  scrubber: import("@playwright/test").Locator,
  progress: number
): Promise<void> {
  await scrubber.evaluate((element, value) => {
    const input = element as HTMLInputElement;
    input.value = String(value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, progress);
}
