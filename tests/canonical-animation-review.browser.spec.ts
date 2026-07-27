import { expect, test, type Page } from "@playwright/test";
import type {
  KpDevReviewCreateRequestV2
} from "../protocols/dev-review-v2.ts";

const radicalId =
  "animation.generated.radical.square-root-as-power";
const splitMergeId = "animation.numerator-split-merge.round-trip";

test.beforeEach(async ({ page }) => {
  await mockReviewInbox(page);
});

test("Animation Library lists all metadata but mounts only the selected host", async ({
  page
}) => {
  const documentRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "document") {
      documentRequests.push(new URL(request.url()).pathname);
    }
  });

  await page.goto("/canonical-animation-review.html");
  const library = page.locator(
    '[data-kp-animation-library][data-catalog-ready="true"]'
  );
  await expect(library).toBeVisible();
  await expect(page.locator("[data-animation-library-count]")).toHaveText(
    /\d+ animations/
  );
  const catalogCount = Number(
    (await page
      .locator("[data-animation-library-count]")
      .textContent())?.split(" ")[0]
  );
  expect(catalogCount).toBeGreaterThan(29);

  const frame = page.locator("[data-animation-library-frame]");
  await expect(frame).toHaveCount(1);
  await expect(frame).toHaveAttribute("src", "/reader/radical-succession/");
  await page
    .frameLocator("[data-animation-library-frame]")
    .locator("[data-kp-reader-equation-stage]")
    .waitFor();
  expect(
    await inspectSelectedHostLeasePool(page)
  ).toMatchObject({ limit: 2, waiting: 0 });
  expect((await inspectSelectedHostLeasePool(page)).active).toBeLessThanOrEqual(
    1
  );
  expect(
    documentRequests.filter((path) => path.startsWith("/reader/"))
  ).toEqual(["/reader/radical-succession/"]);

  const search = page.locator("[data-animation-library-search]");
  await search.fill("split and merge");
  await expect(page.locator("[data-animation-library-list] button")).toHaveCount(
    1
  );
  await page.locator("[data-animation-library-list] button").click();
  await expect(library).toHaveAttribute("data-animation-id", splitMergeId);
  await expect(frame).toHaveAttribute(
    "src",
    "/reader/split-merge-fractions/"
  );
  await expect(frame).toHaveCount(1);
  await page
    .frameLocator("[data-animation-library-frame]")
    .locator("[data-kp-reader-equation-stage]")
    .waitFor();
  expect((await inspectSelectedHostLeasePool(page)).active).toBeLessThanOrEqual(
    1
  );
  expect(
    documentRequests.filter((path) => path.startsWith("/reader/"))
  ).toEqual([
    "/reader/radical-succession/",
    "/reader/split-merge-fractions/"
  ]);
  await expect(page).toHaveURL(
    new RegExp(`animation=${splitMergeId.replaceAll(".", "\\.")}`)
  );
});

test("deep links preserve representation and phone preview without overflow", async ({
  page
}) => {
  const route =
    "/canonical-animation-review.html" +
    `?animation=${encodeURIComponent(radicalId)}` +
    "&representation=library.diagnostic.radical-reconciliation" +
    "&viewport=phone";
  await page.goto(route);

  const library = page.locator("[data-kp-animation-library]");
  await expect(library).toHaveAttribute(
    "data-representation-id",
    "library.diagnostic.radical-reconciliation"
  );
  await expect(
    page.locator("[data-animation-library-frame]")
  ).toHaveAttribute(
    "src",
    /glyph-reconciliation-experiment\.html/
  );
  const viewport = page.locator(
    '[data-animation-library-viewport-shell="phone"]'
  );
  await expect.poll(() =>
    viewport.evaluate((element) => element.getBoundingClientRect().width)
  ).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth -
    document.documentElement.clientWidth
  )).toBeLessThanOrEqual(1);
});

test("one review capture stays reachable while hosts switch and the page scrolls", async ({
  page
}) => {
  let request: KpDevReviewCreateRequestV2 | undefined;
  await page.route("**/api/dev/reviews/v2/notes", async (route) => {
    request = route.request().postDataJSON() as KpDevReviewCreateRequestV2;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        ...request,
        id: "note.animation-library",
        sequence: 9,
        status: "new"
      })
    });
  });
  await page.goto("/canonical-animation-review.html");
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-dev-review-ready",
    "true"
  );

  const review = page.locator("[data-kp-dev-review-shell]");
  await expect(review).toHaveCount(1);
  await expect(review).toHaveAttribute(
    "data-kp-dev-review-placement",
    "bottom-right"
  );
  await expect(
    page
      .frameLocator("[data-animation-library-frame]")
      .locator("[data-kp-dev-review-shell]")
  ).toHaveCount(0);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(review.locator("button.launcher")).toBeVisible();
  const launcherBox = await review
    .locator("button.launcher")
    .boundingBox();
  expect(launcherBox).not.toBeNull();
  expect(launcherBox!.y + launcherBox!.height).toBeLessThanOrEqual(
    page.viewportSize()!.height
  );

  await review.locator("button.launcher").click();
  await expect(review.locator("textarea")).toBeEnabled();
  await review.locator("textarea").fill(
    "Keep this review control available while switching hosts."
  );

  await page.locator("[data-animation-library-search]").fill("solve for x");
  await page.locator("[data-animation-library-list] button").click();
  await expect(
    page.locator("[data-kp-animation-library]")
  ).toHaveAttribute(
    "data-animation-id",
    "animation.linear-solve.solve-x"
  );
  await expect(review.locator("textarea")).toHaveValue(
    "Keep this review control available while switching hosts."
  );
  await review.locator("button.save").click();
  await expect(review.locator("output.status")).toHaveText("Saved note 9.");

  expect(request?.capture.semantic.assetId).toBe(
    radicalId
  );
  expect(request?.capture.semantic.projectionId).toBe(
    "library.reader.radical-succession"
  );
  expect(request?.capture.semantic.documentId).toBe(
    "review.animation-library"
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(review).toHaveAttribute(
    "data-kp-dev-review-placement",
    "captured-moment-sheet"
  );
});

async function mockReviewInbox(page: Page): Promise<void> {
  await page.route("**/api/dev/reviews/v2/query", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        query: { scope: "all", limit: 100, detail: "full" },
        counts: {
          lifetime: 0,
          current: 0,
          currentNew: 0,
          historical: 0,
          matching: 0,
          byStatus: {
            new: 0,
            discussed: 0,
            grouped: 0,
            accepted: 0,
            fixed: 0,
            verified: 0,
            dismissed: 0
          }
        },
        rounds: [{
          id: "round.current",
          sequence: 1,
          label: "Current visual review",
          status: "open",
          synthetic: false,
          noteCount: 0,
          newCount: 0
        }],
        page: { notes: [], hasMore: false }
      })
    });
  });
}

async function inspectSelectedHostLeasePool(page: Page): Promise<{
  readonly limit: number;
  readonly active: number;
  readonly waiting: number;
}> {
  return page
    .frameLocator("[data-animation-library-frame]")
    .locator("body")
    .evaluate(async () => {
      const poolUrl = "/src/rendering/webgl-context-lease-pool.ts";
      const pool = await import(/* @vite-ignore */ poolUrl);
      return pool.inspectKpWebglContextLeasePool(document);
    });
}
