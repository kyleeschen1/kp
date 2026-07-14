import { expect, test } from "@playwright/test";

test("project dashboard round trip keeps editor motion and graph controls usable", async ({
  page
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Identity Matrix" })).toBeVisible();
  await page.getByRole("button", { name: "Project Dashboard" }).click();

  await expect(
    page.getByRole("heading", { name: "Project Dashboard", exact: true })
  ).toBeVisible();
  const animationLayout = page.locator(
    "[data-kp-project-dashboard-animation-layout]"
  );
  await expect(animationLayout).toBeVisible();
  const dashboardSearch = page.locator(
    "[data-kp-project-dashboard-search]"
  );
  await expect(dashboardSearch).toBeVisible();
  await expect(dashboardSearch).toHaveAttribute(
    "placeholder",
    "Search work, animations, visuals, objects, reports"
  );
  await expect(page.locator("[data-kp-project-dashboard-status]")).toContainText(
    "Dashboard data is valid"
  );
  await expect(page.locator("[data-kp-project-dashboard-search-count]")).toHaveText(
    /Showing \d+ of \d+ rows/
  );
  await expect(page.locator('[data-kp-agenda-section="work"]')).toBeVisible();
  await expect(
    page.locator('[data-kp-agenda-section="report-cards"]')
  ).toBeVisible();
  await expect(
    page.locator('[data-kp-agenda-section="object-gallery"]')
  ).toBeVisible();
  await expect(
    page.locator('[data-kp-agenda-section="animation-layout"]')
  ).toBeVisible();
  await expect(
    page.locator('[data-kp-agenda-section="katex-transforms"]')
  ).toBeVisible();
  await expect(page.locator('[data-kp-agenda-section="api"]')).toBeVisible();
  await expect(
    page.locator('[data-kp-agenda-row="api-semantic-matrix"]')
  ).toBeVisible();
  await expect(
    page.locator('[data-kp-agenda-row="generated-linear-solve-y-plus-5"]')
  ).toBeVisible();
  const agendaPreview = page.locator("[data-kp-project-agenda-preview]");
  await expect(agendaPreview).toHaveAttribute(
    "data-kp-selected-agenda-row",
    "work-kp-asset-calculus"
  );
  await page
    .locator('[data-kp-select-agenda-row="api-semantic-matrix"]')
    .click();
  await expect(agendaPreview).toHaveAttribute(
    "data-kp-selected-agenda-row",
    "api-semantic-matrix"
  );
  await expect(agendaPreview).toContainText("Matrix");
  await expect(agendaPreview).toContainText(
    "Structured row, column, and entry object"
  );
  await expect(agendaPreview).toContainText("Source refs");
  await expect(agendaPreview).toContainText("src/editor/api-catalog.ts");
  await expect(agendaPreview).toContainText("tests/api-catalog.test.ts");
  await expect(
    page.locator('[data-kp-agenda-row="work-project-dashboard-v1-phase-1"]')
  ).toHaveAttribute("data-kp-agenda-depth", "1");
  await expect(page.locator(".project-card--row")).toHaveCount(0);
  await expect
    .poll(async () => {
      const workBox = await page
        .locator('[data-kp-agenda-section="work"]')
        .boundingBox();
      const reportBox = await page
        .locator('[data-kp-agenda-section="report-cards"]')
        .boundingBox();
      const galleryBox = await page
        .locator('[data-kp-agenda-section="object-gallery"]')
        .boundingBox();
      const animationSectionBox = await page
        .locator('[data-kp-agenda-section="animation-layout"]')
        .boundingBox();

      if (
        workBox === null ||
        reportBox === null ||
        galleryBox === null ||
        animationSectionBox === null
      ) {
        return false;
      }

      return (
        workBox.y < reportBox.y &&
        reportBox.y < galleryBox.y &&
        galleryBox.y < animationSectionBox.y
      );
    })
    .toBe(true);
  const tocToggle = page.locator('[data-action="toggle-project-dashboard-toc"]');
  await tocToggle.check();
  await expect(page.locator("[data-kp-project-agenda]")).toHaveAttribute(
    "data-kp-agenda-toc",
    "true"
  );
  await expect(page.locator(".project-agenda__table")).toHaveCount(0);
  await expect(page.locator("[data-kp-project-agenda-preview]")).toHaveCount(0);
  await expect(
    page.locator('[data-kp-agenda-section="work"] h2')
  ).toContainText(/\(\d+\)/);
  await tocToggle.uncheck();
  await expect(page.locator("[data-kp-project-agenda]")).toHaveAttribute(
    "data-kp-agenda-toc",
    "false"
  );
  await expect(page.locator(".project-agenda__table").first()).toBeVisible();
  await expect
    .poll(async () => {
      const searchBox = await dashboardSearch.boundingBox();
      const animationBox = await animationLayout.boundingBox();

      if (searchBox === null || animationBox === null) {
        return false;
      }

      return searchBox.y + searchBox.height <= animationBox.y;
    })
    .toBe(true);
  await dashboardSearch.fill("dnt");
  await expect(animationLayout).toHaveCount(0);
  await expect(page.locator("[data-kp-project-dashboard-search-count]")).toHaveText(
    /Showing 3 of \d+ rows/
  );
  await expect(page.locator('[data-kp-agenda-section="work"]')).toHaveCount(0);
  await expect(
    page.locator('[data-kp-agenda-row="visual-donut-surface"]')
  ).toBeVisible();
  await expect(
    page.locator('[data-kp-project-gallery-item="visual-donut-surface"]')
  ).toBeVisible();
  await expect(
    page.locator('[data-kp-project-gallery-item="visual-webgl-graph"]')
  ).toBeVisible();
  await expect(
    page.locator('[data-kp-project-gallery-item="visual-mesh-graph"]')
  ).toHaveCount(0);
  await expect(
    page.locator('[data-kp-project-card="work-project-dashboard-v1"]')
  ).toHaveCount(0);
  await dashboardSearch.fill("");
  await expect(animationLayout).toBeVisible();
  await expect(
    page.locator('[data-kp-project-card="work-project-dashboard-v1"]')
  ).toBeVisible();
  await expect(page.locator("[data-kp-project-dashboard-contract]")).toContainText(
    "src/project-dashboard/data.ts"
  );
  const fixtureGallery = page.locator("[data-kp-katex-fixture-gallery]");
  await expect(fixtureGallery).toBeVisible();
  await expect(
    fixtureGallery.locator(
      '[data-kp-katex-transform-fixture="fraction.make.inline-to-stacked"]'
    )
  ).toHaveAttribute("aria-pressed", "true");
  await fixtureGallery
    .locator('[data-kp-katex-transform-fixture="radical.rewrite-power-as-root"]')
    .click();
  await expect(
    fixtureGallery.locator(
      '[data-kp-katex-transform-fixture="radical.rewrite-power-as-root"]'
    )
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-kp-katex-fixture-sample]")).toHaveAttribute(
    "data-kp-selected-katex-transform-fixture",
    "radical.rewrite-power-as-root"
  );
  await expect(page.locator("[data-kp-katex-fixture-sample]")).toContainText(
    "rewritePowerAsRoot"
  );
  await page
    .locator(
      '[data-kp-select-agenda-row="katex-transform-wrapper.function.wrap"]'
    )
    .click();
  await expect(agendaPreview).toHaveAttribute(
    "data-kp-selected-agenda-row",
    "katex-transform-wrapper.function.wrap"
  );
  await page
    .locator(
      '[data-kp-preview-live-animation="fixture-wrapper-function-wrap"]'
    )
    .click();
  await expect(page.locator("[data-kp-katex-fixture-sample]")).toHaveAttribute(
    "data-kp-selected-katex-transform-fixture",
    "wrapper.function.wrap"
  );
  await expect(
    page.locator(
      '[data-kp-katex-transform-fixture="wrapper.function.wrap"]'
    )
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-kp-visual-tuning]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Back to Editor" })).toBeVisible();
  await page.locator('[data-kp-select-agenda-row="semantic-matrix"]').click();
  await expect(agendaPreview).toHaveAttribute(
    "data-kp-selected-agenda-row",
    "semantic-matrix"
  );
  await page
    .locator(
      '[data-kp-preview-link="api-catalog-item"][data-kp-preview-api-item="semantic-matrix"]'
    )
    .click();
  await expect(page.locator("[data-kp-project-dashboard]")).toHaveCount(0);
  await expect(
    page.locator('[data-kp-api-outline-item="semantic-matrix"]')
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-kp-api-sample-card]")).toContainText(
    "Matrix"
  );
  await page.getByRole("button", { name: "Project Dashboard" }).click();
  await expect(
    page.getByRole("heading", { name: "Project Dashboard", exact: true })
  ).toBeVisible();
  await page.locator('[data-kp-select-agenda-row="visual-donut-surface"]').click();
  await expect(agendaPreview).toHaveAttribute(
    "data-kp-selected-agenda-row",
    "visual-donut-surface"
  );
  await page
    .locator(
      '[data-kp-preview-link="graph-surface-mode"][data-kp-preview-graph-surface-mode="donut"]'
    )
    .click();

  await expect(page.getByRole("heading", { name: "Identity Matrix" })).toBeVisible();
  await expect(page.locator("[data-kp-project-dashboard]")).toHaveCount(0);
  await expect(page.locator("[data-kp-api-outline]")).toBeVisible();
  await expect(page.locator('[data-role="semantic-json"]')).toHaveCount(0);

  const demo = page.locator("[data-kp-equation-motion-demo]");
  await expect(page.locator("[data-kp-editor-visual-tuning]")).toHaveCount(0);
  await expect(page.locator('[data-action="set-katex-operator-scale"]')).toHaveCount(0);
  await expect(page.locator('[data-kp-object="identity-3x3"]')).toHaveCount(0);

  const matrixApiItem = page.locator(
    '[data-kp-api-outline-item="semantic-matrix"]'
  );
  const semanticObjectsGroup = page.locator(
    '[data-kp-api-outline-group="semantic-objects"]'
  );

  await expect(semanticObjectsGroup).not.toHaveAttribute("open", "");
  await semanticObjectsGroup.locator("summary").click();
  await expect(matrixApiItem).toBeVisible();
  await matrixApiItem.hover();
  await expect(matrixApiItem).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("[data-kp-api-sample-card]")).toContainText(
    "Matrix"
  );
  await expect(page.locator("[data-kp-api-sample-card]")).toContainText(
    "Sample card preview"
  );

  const beatScrubber = demo.locator('[data-action="set-equation-motion-beat"]');
  const beatOutput = demo.locator('[data-role="equation-motion-beat-output"]');

  await expect(demo).toHaveAttribute("data-kp-equation-motion-step", "0");
  await expect(beatScrubber).toHaveAttribute("max", "50");
  await beatScrubber.evaluate((input) => {
    const range = input as HTMLInputElement;

    range.value = "20";
    range.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(demo).toHaveAttribute("data-kp-equation-motion-progress", "0.4");
  await expect(beatOutput).toHaveText("20/50");

  const graphShell = page.locator(".graph-webgl[data-kp-object=\"saddle-orbit-graph\"]");
  await expect(graphShell).toHaveAttribute("data-kp-webgl-status", /^(ready|fallback)$/);

  const surfaceMode = page.locator('[data-action="set-graph-surface-mode"]');
  await expect(surfaceMode).toBeVisible();
  await expect(surfaceMode).toHaveValue("donut");
  await surfaceMode.selectOption("donut");
  await expect(surfaceMode).toHaveValue("donut");
  await expect(surfaceMode).toHaveAttribute("data-kp-graph-surface-mode", "donut");
  await expect(
    surfaceMode.locator("xpath=ancestor::label[1]").locator(".graph-control__value")
  ).toHaveText("donut");

  await expect(page.locator("[data-kp-api-outline]")).toContainText("Graph3D");
});
