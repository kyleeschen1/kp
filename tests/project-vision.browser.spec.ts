import { expect, test } from "@playwright/test";
import { projectVision } from "../src/project-dashboard/vision-data.ts";

const executionPath = `**/docs/theseus/nodes/run-contracts/${projectVision.commitment.contractId}.json`;

test("unavailable or foreign progress stays explicit without hiding direction", async ({ page }) => {
  await page.route(executionPath, route => route.fulfill({ status: 503, body: "Unavailable" }));
  await page.goto("/?view=dashboard#project-vision");
  const progress = page.locator("[data-kp-vision-execution]");
  await expect(progress).toHaveAttribute("data-kp-vision-execution", "unavailable");
  await expect(progress).not.toContainText("complete");
  await expect(page.getByRole("heading", { name: "Where we are going" })).toBeVisible();
  await page.unroute(executionPath);
  await page.route(executionPath, route => route.fulfill({
    json: { id: "run-contract.foreign", kind: "run-contract", title: "Wrong project", status: "resolved", slices: [] }
  }));
  await page.reload();
  await expect(progress).toHaveAttribute("data-kp-vision-execution", "unavailable");
  await expect(progress).not.toContainText("Wrong project");
});

test("a delayed progress read cannot overwrite a replacement dashboard", async ({ page }) => {
  let releaseFirst: (() => void) | undefined;
  const firstMayFinish = new Promise<void>(resolve => { releaseFirst = resolve; });
  let requests = 0;
  await page.route(executionPath, async route => {
    const request = ++requests;
    if (request === 1) await firstMayFinish;
    await route.fulfill({ json: {
      id: projectVision.commitment.contractId, kind: "run-contract", title: "Selected scope", status: "ready",
      slices: [{ id: "one", title: "Current work", status: request === 1 ? "complete" : "in-progress" }]
    } });
  });
  await page.goto("/?view=dashboard#project-vision");
  await expect.poll(() => requests).toBe(1);
  await page.locator("[data-kp-project-dashboard-search]").fill("Matrix");
  // Search intentionally hides the orientation surface; clearing it mounts a
  // replacement while the first request still belongs to the detached surface.
  await expect(page.locator("[data-kp-vision-execution]")).toHaveCount(0);
  await page.locator("[data-kp-project-dashboard-search]").fill("");
  await expect(page.locator("[data-kp-vision-execution]")).toContainText("0/1 work packages complete");
  const oldResponse = page.waitForResponse(response => response.url().endsWith(`${projectVision.commitment.contractId}.json`));
  releaseFirst?.();
  await oldResponse;
  await expect.poll(() => requests).toBe(2);
  await expect(page.locator("[data-kp-vision-execution]")).toContainText("0/1 work packages complete");
});

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  test(`vision keeps finite outcomes and closure inspectable at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/?view=dashboard#project-vision");
    const view = page.locator("[data-kp-project-vision]");
    await expect(view.getByRole("heading", { name: "Where we are going" })).toBeVisible();
    await expect(view.locator("[data-kp-vision-commitment]")).toContainText("Approved scope");
    await expect(view.locator("[data-kp-vision-execution]")).toHaveAttribute("data-kp-vision-execution", "loaded");
    await expect(view.locator("[data-kp-vision-execution]")).toContainText("Read from Theseus");
    await expect(view.locator(".project-vision__progression li")).toHaveCount(4);
    await expect(view.locator("[data-kp-vision-area]")).toHaveCount(6);
    await expect(view.locator(".project-vision__next").last()).toContainText("not an active run");
    await view.getByText("Supporting capabilities and their boundaries", { exact: true }).click();
    const architecture = view.locator('[data-kp-vision-area="architecture"]');
    await architecture.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(architecture.getByRole("heading", { name: "Finish line", exact: true })).toBeVisible();
    await expect(architecture).toContainText("selected authoring proof identifies a concrete boundary");
    const sources = architecture.locator('a[href^="/docs/project/"]');
    await expect(sources).toHaveCount(2);
    const href = await sources.first().getAttribute("href");
    expect(href).toBeTruthy();
    const response = await page.request.get(href!);
    expect(response.ok()).toBe(true);
    expect(await response.text()).toContain("algebra");
    await view.getByText("What changed, and why", { exact: false }).click();
    await expect(view.locator(".project-vision__history li")).toHaveCount(projectVision.changes.length);
    await expect(view.locator(".project-vision__history")).toContainText("Before.");
    await expect(view.getByRole("heading", { name: "Progress you can inspect" })).toBeVisible();
    await expect(view.locator(".project-vision__legacy")).toContainText("not the current commitment queue");
    const overflow = await view.evaluate(element => {
      const box = element.getBoundingClientRect();
      return [...element.querySelectorAll("article, summary, a")].some(child => {
        const childBox = child.getBoundingClientRect();
        return childBox.width > 0 && (childBox.right > box.right + 2 || childBox.left < box.left - 2);
      });
    });
    expect(overflow).toBe(false);
    await view.getByText("What changed, and why", { exact: false }).click();
    await architecture.locator("summary").click();
    await view.getByText("Supporting capabilities and their boundaries", { exact: true }).click();
    for (const theme of ["dark", "light"]) {
      if (await page.locator("html").getAttribute("data-kp-development-theme") !== theme) {
        await page.locator('[data-kp-dev-toolbar-control="kp.dev-toolbar.theme"]').click();
      }
      await expect(page.locator("html")).toHaveAttribute("data-kp-development-theme", theme);
      // A theme can leave typography visible to Playwright but unreadable to a
      // person. Check realized foreground/background contrast at both surfaces.
      const contrasts = await view.evaluate(root => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Missing color sampler");
        const rgba = (color: string) => {
          ctx.clearRect(0, 0, 1, 1);
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, 1, 1);
          return ctx.getImageData(0, 0, 1, 1).data;
        };
        const luminance = (color: Uint8ClampedArray) => [0, 1, 2].reduce((sum, i) => {
          const channel = (color[i] ?? 0) / 255;
          return sum + (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
            * ([0.2126, 0.7152, 0.0722][i] ?? 0);
        }, 0);
        return [...root.querySelectorAll("h3, .project-vision__freshness, .project-vision__area > p, .project-vision__closed p")].map(element => {
          const foreground = luminance(rgba(getComputedStyle(element).color));
          let ancestor: Element | null = element;
          while (ancestor) {
            const background = rgba(getComputedStyle(ancestor).backgroundColor);
            if (background[3] === 255) {
              const light = luminance(background);
              return { text: element.textContent?.slice(0, 45), ratio: (Math.max(foreground, light) + 0.05) / (Math.min(foreground, light) + 0.05) };
            }
            ancestor = ancestor.parentElement;
          }
          throw new Error("Missing opaque background");
        });
      });
      for (const contrast of contrasts) expect(contrast.ratio, `${theme}: ${contrast.text}`).toBeGreaterThanOrEqual(4.5);
      await view.evaluate(element => element.scrollIntoView({ block: "start" }));
      await page.screenshot({ path: testInfo.outputPath(`vision-${theme}.png`), fullPage: false });
    }
    await page.reload();
    await expect(page.locator("[data-kp-project-vision]")).toBeVisible();
    await expect(page.locator('[data-kp-agenda-section="work"]')).toBeVisible();
    const search = page.locator("[data-kp-project-dashboard-search]");
    await search.fill("Matrix");
    await expect(page.locator("[data-kp-project-dashboard-search-count]")).toContainText("Showing");
    await search.fill("");
    await expect(page.locator("[data-kp-project-vision]")).toBeVisible();
    await page.getByRole("button", { name: "Back to Editor" }).click();
    await expect(page.getByRole("heading", { name: "Identity Matrix" })).toBeVisible();
    expect(errors).toEqual([]);
  });
}
