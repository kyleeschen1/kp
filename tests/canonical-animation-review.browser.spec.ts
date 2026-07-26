import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

test("review gallery controls fraction and governed cohort live", async ({
  page
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  await page.goto("/canonical-animation-review.html");
  await page.frameLocator("[data-review-frame]").locator(
    '[data-kp-glyph-review][data-kp-ready="true"]'
  ).waitFor();
  expect(await page.locator("[data-review-frame]").evaluate((element) => ({
    src: (element as HTMLIFrameElement).src,
    hasDocument: (element as HTMLIFrameElement).contentDocument !== null,
    ready: (element as HTMLIFrameElement).contentDocument?.querySelector(
      '[data-kp-glyph-review][data-kp-ready="true"]'
    ) !== null,
    section: (element as HTMLIFrameElement).contentDocument?.querySelector(
      "[data-fraction-card]"
    ) !== null,
    slider: (element as HTMLIFrameElement).contentDocument?.querySelector(
      "[data-fraction-card] [data-fraction-progress]"
    ) !== null
  }))).toMatchObject({
    hasDocument: true,
    ready: true,
    section: true,
    slider: true
  });
  await page.waitForTimeout(250);
  expect(
    pageErrors.filter((message) =>
      !message.includes("Visual review request failed with status 502")
    ),
    pageErrors.join("\n")
  ).toEqual([]);
  const review = page.locator(
    '[data-kp-canonical-animation-review][data-review-ready="true"]'
  );
  await review.waitFor();
  const frame = page.locator("[data-review-frame]");
  const progress = page.locator("input[data-review-progress]");

  await expect(frame).toHaveAttribute(
    "title",
    "Canonical fraction split animation"
  );
  await progress.fill("500");
  await progress.dispatchEvent("input");
  expect(await frame.evaluate((element) =>
    (element as HTMLIFrameElement).contentDocument!
      .querySelector<HTMLInputElement>(
      "[data-fraction-progress]"
    )!.value
  )).toBe("500");

  await page.locator('[data-review-artifact="cohort"]').click();
  await expect(review).toHaveAttribute("data-review-artifact", "cohort");
  await expect(frame).toHaveAttribute(
    "title",
    "Governed canonical animation cohort"
  );
  await frame.evaluate(async (element) => {
    const document = (element as HTMLIFrameElement).contentDocument!;
    for (let attempt = 0; attempt < 120; attempt += 1) {
      if (document.querySelector(
        '[data-compound-trace][data-governed-compound-ready="true"]'
      ) !== null) return;
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    throw new Error("Governed cohort did not become ready.");
  });
  await progress.fill("371");
  await progress.dispatchEvent("input");
  await expect(review).toHaveAttribute("data-review-progress", "371");
  expect(await frame.evaluate((element) =>
    (element as HTMLIFrameElement).contentDocument!
      .querySelector<HTMLElement>(
      "[data-compound-trace]"
    )!.dataset["governedCompoundProgress"]
  )).toBe("371");

  await page.locator('[data-review-viewport="phone"]').click();
  await expect(page.locator("[data-review-viewport-shell]")).toHaveAttribute(
    "data-review-viewport-shell",
    "phone"
  );
  await expect.poll(() =>
    page.locator("[data-review-viewport-shell]").evaluate(
      (element) => element.getBoundingClientRect().width
    )
  ).toBeLessThanOrEqual(390);

  await page.locator('[data-review-motion="reduced"]').click();
  await page.locator("[data-review-play]").click();
  await expect(review).toHaveAttribute("data-review-progress", "1000");
  await page.locator("[data-review-rewind]").click();
  await expect(review).toHaveAttribute("data-review-progress", "0");
  await expect(page.locator("[data-review-diagnostics]")).toContainText(
    "overflow 0 px"
  );
  await mkdir("tmp/codex/canonical-animation-review", { recursive: true });
  await page.screenshot({
    path: "tmp/codex/canonical-animation-review/gallery.png",
    fullPage: true
  });
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth -
    document.documentElement.clientWidth
  )).toBeLessThanOrEqual(1);
});

test("review gallery exposes keyboard-readable authority diagnostics", async ({
  page
}) => {
  await page.goto("/canonical-animation-review.html");
  await page.locator(
    '[data-kp-canonical-animation-review][data-review-ready="true"]'
  ).waitFor();

  await expect(page.getByRole("region", {
    name: "Authority diagnostics"
  })).toContainText("Verified refs and intent only");
  await expect(page.getByRole("region", {
    name: "Authority diagnostics"
  })).toContainText("Compiler verified");
  await expect(page.getByRole("region", {
    name: "Authority diagnostics"
  })).toContainText("Native endpoints + inert paint");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
});
