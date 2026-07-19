import { expect, test } from "@playwright/test";
import type { Server } from "node:http";

import { createExactRationalLinearProblemProvider } from "../providers/linear-problems/public-api.ts";
import { createAppServer } from "../server/app.ts";

let server: Server;
let reviewUrl: string;

test.beforeAll(async () => {
  server = createAppServer({
    linearProblemProvider: createExactRationalLinearProblemProvider()
  });
  reviewUrl = `${await listen(server)}/concepts/mathematics/linear-equations/solve-with-balance`;
});

test.afterAll(async () => {
  await close(server);
});

test("Review remains readable without JavaScript and supports browser Find", async ({ browser }) => {
  const noScriptContext = await browser.newContext({ javaScriptEnabled: false });
  const noScriptPage = await noScriptContext.newPage();
  await noScriptPage.goto(reviewUrl);
  await expect(noScriptPage.getByRole("heading", { name: "Solve 2x + 3 = 8" })).toBeVisible();
  await expect(noScriptPage.getByText("Subtract 3 from both sides", { exact: false })).toBeVisible();
  await expect(noScriptPage.locator("[data-kp-review-checkpoint]")).toHaveCount(4);
  await expect(noScriptPage.locator("[data-kp-review-balance-svg]")).toHaveCount(4);
  await noScriptContext.close();

  const searchPage = await browser.newPage();
  await searchPage.goto(reviewUrl);
  expect(await searchPage.evaluate(() =>
    (window as unknown as { find(text: string): boolean }).find("Two copies of x become one")
  )).toBe(true);
  const exploreHref = await searchPage
    .locator('[data-kp-review-checkpoint="divide-two"] [data-kp-review-explore-link]')
    .getAttribute("href");
  expect(exploreHref).toContain("checkpoint=divide-two");
  expect(exploreHref).toContain("t=750");
  await searchPage.close();
});

async function listen(target: Server): Promise<string> {
  await new Promise<void>((resolve) => target.listen(0, "127.0.0.1", resolve));
  const address = target.address();
  if (address === null || typeof address === "string") throw new Error("Expected TCP server.");
  return `http://127.0.0.1:${address.port}`;
}

async function close(target: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => target.close((error) =>
    error === undefined ? resolve() : reject(error)
  ));
}
