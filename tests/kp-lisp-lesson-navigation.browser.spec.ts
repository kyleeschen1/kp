import { expect, test } from "@playwright/test";

const route = "/tutorials/programming/lisp-function-application/";

test("direct checkpoints restore exact state while the TOC names the animation", async ({ page }) => {
  await page.goto(`${route}#kp-checkpoint-result-settled`);
  const root = page.locator("[data-kp-lisp-function-application-tutorial]");
  const toc = root.locator("kp-tutorial-toc");
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-progress", "1.0000");
  await expect(root).toHaveAttribute(
    "data-kp-lisp-tutorial-active-motion-block",
    "evaluation"
  );
  await expect(toc).toHaveAttribute(
    "data-kp-tutorial-toc-active-id",
    "evaluation"
  );
  await expect(root.locator('[data-kp-lisp-native-code="result"]')).toHaveText("5");

  const observed: string[] = await root.evaluate((element) => {
    const values: string[] = [];
    new MutationObserver(() => values.push(
      (element as HTMLElement).dataset["kpLispTutorialProgress"] ?? ""
    )).observe(element, { attributes: true, attributeFilter: ["data-kp-lisp-tutorial-progress"] });
    (window as typeof window & { __kpObservedProgress?: string[] }).__kpObservedProgress = values;
    return values;
  });
  expect(observed).toEqual([]);
  await toc.locator('[data-kp-tutorial-destination-id="structure"]').click();
  await expect(page).toHaveURL(/\/tutorials\/programming\/lisp-function-application\/#kp-block-structure$/);
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-progress", "0.0000");
  expect(await page.evaluate(() =>
    (window as typeof window & { __kpObservedProgress?: string[] }).__kpObservedProgress
  )).toEqual(["0.0000"]);
});

test("Back and Forward restore text destination and animation transactionally", async ({ page }) => {
  await page.goto(`${route}#kp-checkpoint-source-readable`);
  const root = page.locator("[data-kp-lisp-function-application-tutorial]");
  const toc = root.locator("kp-tutorial-toc");
  await toc.locator('[data-kp-tutorial-destination-id="evaluation"]').click();
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-progress", "0.7400");
  await expect(toc).toHaveAttribute("data-kp-tutorial-toc-active-id", "evaluation");

  await page.goBack();
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-progress", "0.0000");
  await expect(toc).toHaveAttribute("data-kp-tutorial-toc-active-id", "structure");
  await page.goForward();
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-progress", "0.7400");
  await expect(toc).toHaveAttribute("data-kp-tutorial-toc-active-id", "evaluation");
});
