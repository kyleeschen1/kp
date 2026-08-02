import { expect, test } from "@playwright/test";

const equationId = "animation.linear-solve.solve-x";
const graph3DId = "animation.graph.surface-mode.mesh-to-donut";
const programmingId = "animation.programming.add.execution-trace";

test("equation capability leaves an accessible loading state before settlement", async ({
  page
}) => {
  let releaseCapability = (): void => undefined;
  const capabilityGate = new Promise<void>((resolve) => {
    releaseCapability = resolve;
  });
  await page.route(/equation-surface-capability\.ts/, async (route) => {
    await capabilityGate;
    await route.continue();
  });

  await page.goto(`/?artifact=${equationId}`);
  const bootstrap = page.locator("[data-kp-animation-catalogue]");
  await expect(bootstrap).toHaveAttribute(
    "data-kp-animation-catalogue-state",
    "loading"
  );
  await expect(bootstrap).toHaveAttribute("aria-busy", "true");
  await expect(bootstrap.getByRole("status")).toContainText("Preparing");

  releaseCapability();
  await waitForOutcome(page, equationId, "painted");
  await expect(page.locator(
    '[data-kp-editor-animation-surface-slot="equation"]'
  )).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.equation.katex"
  );
});

test("equation typography settles inside reserved catalogue stage geometry", async ({
  page
}) => {
  await page.goto(`/?artifact=${equationId}`);
  await waitForOutcome(page, equationId, "painted");
  const stage = page.locator("[data-kp-animation-catalogue-stage]");
  const before = await stage.boundingBox();
  const shift = await page.evaluate(async () => {
    const values: number[] = [];
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const item = entry as PerformanceEntry & {
          readonly value: number;
          readonly hadRecentInput: boolean;
        };
        if (!item.hadRecentInput) values.push(item.value);
      }
    });
    observer.observe({ type: "layout-shift", buffered: false });
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())
    ));
    observer.disconnect();
    return values.reduce((sum, value) => sum + value, 0);
  });
  const after = await stage.boundingBox();

  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  expect(Math.abs((after?.width ?? 0) - (before?.width ?? 0))).toBeLessThan(0.5);
  expect(Math.abs((after?.height ?? 0) - (before?.height ?? 0))).toBeLessThan(0.5);
  expect(shift).toBe(0);
});

test("programming and 3D selections request only their selected capabilities", async ({
  page
}) => {
  const unrelatedRequests: string[] = [];
  const graph3DRequests: string[] = [];
  page.on("request", (request) => {
    if (/equation-surface-capability|graph-svg-surface-capability|katex(?:\.min)?\.(?:js|css)(?:\?|$)|api-catalog|animation-diagnostics-capability|shiki|highlight\.js|prismjs|code-highlighter/i
      .test(request.url())) {
      unrelatedRequests.push(request.url());
    }
    if (/graph-3d-surface-capability/i.test(request.url())) {
      graph3DRequests.push(request.url());
    }
  });

  await page.goto(`/?artifact=${programmingId}`);
  await waitForOutcome(page, programmingId, "capability-gap");
  expect(unrelatedRequests).toEqual([]);
  expect(graph3DRequests).toEqual([]);

  await page.goto(`/?artifact=${graph3DId}`);
  await waitForOutcome(page, graph3DId, "painted");
  expect(unrelatedRequests).toEqual([]);
  expect(graph3DRequests).toHaveLength(1);
});

async function waitForOutcome(
  page: import("@playwright/test").Page,
  animationId: string,
  outcome: "painted" | "capability-gap"
): Promise<void> {
  await page.waitForFunction(({ expectedAnimationId, expectedOutcome }) => {
    const shell = document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue]"
    );
    return shell?.dataset["kpAnimationCatalogueSelection"] ===
      expectedAnimationId &&
      shell.dataset["kpAnimationCatalogueHostOutcome"] === expectedOutcome;
  }, { expectedAnimationId: animationId, expectedOutcome: outcome });
}
