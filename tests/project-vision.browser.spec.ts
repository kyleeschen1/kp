import { expect, test } from "@playwright/test";

for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  test(`vision keeps finite outcomes and closure inspectable at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/?view=dashboard#project-vision");
    const view = page.locator("[data-kp-project-vision]");
    await expect(view.getByRole("heading", { name: "Vision & finish lines" })).toBeVisible();
    await expect(view.locator("[data-kp-vision-area]")).toHaveCount(6);
    await expect(view.locator(".project-vision__next")).toContainText("not an active run");
    const architecture = view.locator('[data-kp-vision-area="architecture"]');
    await architecture.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(architecture.getByRole("heading", { name: "Finish line", exact: true })).toBeVisible();
    await expect(architecture).toContainText("superseded import paths are removed");
    const sources = architecture.locator('a[href^="/docs/project/"]');
    await expect(sources).toHaveCount(2);
    const href = await sources.first().getAttribute("href");
    expect(href).toBeTruthy();
    const response = await page.request.get(href!);
    expect(response.ok()).toBe(true);
    expect(await response.text()).toContain("algebra");
    await view.getByText("What changed, and why", { exact: false }).click();
    await expect(view.locator(".project-vision__history li")).toHaveCount(3);
    await expect(view.locator(".project-vision__history")).toContainText("Before.");
    await expect(view.getByRole("heading", { name: "Finished, at their actual scope" })).toBeVisible();
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
