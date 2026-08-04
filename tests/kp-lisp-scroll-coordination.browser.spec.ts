import { expect, test, type Page } from "@playwright/test";

const route = "/tutorials/programming/lisp-function-application/";

test("scroll owns one block, honors holds, and rebases manual control without jumping", async ({
  page
}) => {
  await page.goto(route);
  const root = page.locator("[data-kp-lisp-function-application-tutorial]");
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-scroll-coordinator", "connected");

  await setTravel(page, "bind-and-reconstruct", 0.5, "wheel");
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-motion-owner", "scroll");
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-active-motion-block", "bind-and-reconstruct");
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-progress", "0.3404");
  await expect(root.locator("kp-tutorial-toc")).toHaveAttribute(
    "data-kp-tutorial-toc-active-id",
    "bind-and-reconstruct"
  );

  await setTravel(page, "bind-and-reconstruct", 0.58, "wheel");
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-progress", "0.3404");

  const scrub = root.locator(
    '[data-kp-tutorial-motion-controls="bind-and-reconstruct"] input[data-action="seek"]'
  );
  await scrub.evaluate((element: HTMLInputElement) => {
    element.value = "0.8";
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-motion-owner", "manual");
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-progress", "0.5920");

  const before = Number(await root.getAttribute("data-kp-lisp-tutorial-progress"));
  await shiftScroll(page, 18, "wheel");
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-motion-owner", "scroll");
  const after = Number(await root.getAttribute("data-kp-lisp-tutorial-progress"));
  expect(after).toBeGreaterThan(before);
  expect(after - before).toBeLessThan(0.08);

  await shiftScroll(page, -18, "touch");
  const reversed = Number(await root.getAttribute("data-kp-lisp-tutorial-progress"));
  expect(reversed).toBeLessThan(after);

  await page.keyboard.press("Alt+ArrowRight");
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-motion-owner", "manual");
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-progress", "0.7400");
});

test("scroll hands cumulative ownership to the second block", async ({ page }) => {
  await page.goto(route);
  const root = page.locator("[data-kp-lisp-function-application-tutorial]");
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-scroll-coordinator", "connected");
  await setTravel(page, "evaluate-and-gather", 0.55, "touch");
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-motion-owner", "scroll");
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-active-motion-block", "evaluate-and-gather");
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-progress", "0.8908");
  await expect(root.locator('[data-kp-tutorial-motion-controls="bind-and-reconstruct"]'))
    .toHaveAttribute("progress", "1.0000");
});

async function setTravel(
  page: Page,
  blockId: string,
  travel: number,
  intent: "wheel" | "touch"
): Promise<void> {
  await page.evaluate(({ blockId, travel, intent }) => {
    document.documentElement.style.scrollBehavior = "auto";
    window.dispatchEvent(intent === "wheel"
      ? new WheelEvent("wheel", { deltaY: 1 })
      : new Event("touchmove"));
    const anchor = document.querySelector<HTMLElement>(
      `[data-kp-tutorial-motion-controls="${blockId}"]`
    )!;
    const start = window.innerHeight * 0.72;
    const end = window.innerHeight * 0.16;
    const targetTop = start - travel * (start - end);
    window.scrollTo(0, window.scrollY + anchor.getBoundingClientRect().top - targetTop);
  }, { blockId, travel, intent });
  await page.waitForTimeout(80);
}

async function shiftScroll(
  page: Page,
  delta: number,
  intent: "wheel" | "touch"
): Promise<void> {
  await page.evaluate(({ delta, intent }) => {
    document.documentElement.style.scrollBehavior = "auto";
    window.dispatchEvent(intent === "wheel"
      ? new WheelEvent("wheel", { deltaY: delta })
      : new Event("touchmove"));
    window.scrollBy(0, delta);
  }, { delta, intent });
  await page.waitForTimeout(80);
}
