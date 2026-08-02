import { expect, test } from "@playwright/test";

const graph3DAnimationId = "animation.graph.surface-mode.mesh-to-donut";
const unrelatedAnimationId = "animation.dot-projection.basic";

test("catalogue loads and releases the bounded Graph3D capability in place", async ({
  page
}) => {
  const capabilityRequests: string[] = [];
  page.on("request", (request) => {
    if (/graph-webgl-three|\/three(?:\.js|\.module\.js|[?])/i.test(request.url())) {
      capabilityRequests.push(request.url());
    }
  });

  await page.goto("/?artifact=animation.linear-solve.solve-x");
  await waitForPaintedSelection(page, "animation.linear-solve.solve-x");
  expect(capabilityRequests).toEqual([]);

  await page.locator(
    `[data-kp-animation-catalogue-row="${graph3DAnimationId}"] a`
  ).click();
  await waitForPaintedSelection(page, graph3DAnimationId);

  const slot = page.locator(
    '[data-kp-editor-animation-surface-slot="graph"]'
  );
  const shell = slot.locator(".graph-webgl");
  await expect(slot).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.graph.webgl-3d"
  );
  await expect(slot).toHaveAttribute(
    "data-kp-editor-graph-3d-contract",
    "kp.editor-animation.graph-3d-host.v1"
  );
  await expect.poll(() => shell.getAttribute("data-kp-webgl-status"))
    .not.toBe("pending");
  const webglStatus = await shell.getAttribute("data-kp-webgl-status");
  if (webglStatus !== "ready") {
    throw new Error(
      `Graph3D WebGL hydration failed: ${await shell.getAttribute("data-kp-webgl-error")}`
    );
  }
  await expect(shell).toHaveAttribute(
    "data-kp-editor-graph-3d-capability",
    "ready"
  );
  expect(capabilityRequests.some((url) =>
    url.includes("graph-webgl-three")
  )).toBe(true);

  const scrubber = page.locator('[data-action="seek-editor-animation"]');
  await scrubber.fill("0.37");
  await expect(shell).toHaveAttribute("data-kp-editor-graph-3d-progress", "0.37");
  await expect(shell).toHaveAttribute(
    "aria-label",
    "Saddle surface: mesh to donut, 37 percent complete."
  );
  await expect(shell).toHaveAttribute("data-kp-webgl-transition", "sampled");

  const activeBeforeSwitch = await activeLeaseCount(page);
  expect(activeBeforeSwitch).toBe(1);

  await page.locator(
    `[data-kp-animation-catalogue-row="${unrelatedAnimationId}"] a`
  ).click();
  await waitForPaintedSelection(page, unrelatedAnimationId);
  expect(await activeLeaseCount(page)).toBe(0);
  await expect(page.locator(".graph-webgl")).toHaveCount(0);
});

test("Graph3D context loss releases its lease and returns to semantic SVG", async ({
  page
}) => {
  await page.goto(`/?artifact=${graph3DAnimationId}`);
  await waitForPaintedSelection(page, graph3DAnimationId);
  const shell = page.locator(".graph-webgl");
  await expect(shell).toHaveAttribute("data-kp-webgl-status", "ready");
  expect(await activeLeaseCount(page)).toBe(1);

  await page.locator(".graph-webgl__canvas").evaluate((canvas) => {
    canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  });

  await expect(shell).toHaveAttribute("data-kp-webgl-status", "fallback");
  await expect(shell).toHaveAttribute(
    "data-kp-webgl-error",
    "WebGL context lost."
  );
  expect(await activeLeaseCount(page)).toBe(0);
  await expect(shell.locator(".graph-webgl__fallback")).toBeVisible();
  await expect(shell.locator(".graph-webgl__canvas")).toBeHidden();
});

async function waitForPaintedSelection(
  page: import("@playwright/test").Page,
  animationId: string
): Promise<void> {
  await page.waitForFunction((expectedAnimationId) => {
    const shell = document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue]"
    );
    return shell?.dataset["kpAnimationCatalogueSelection"] ===
      expectedAnimationId &&
      shell.dataset["kpAnimationCatalogueHostOutcome"] === "painted";
  }, animationId);
}

async function activeLeaseCount(
  page: import("@playwright/test").Page
): Promise<number> {
  return page.evaluate(async () => {
    const modulePath = "/src/rendering/webgl-context-lease-pool.ts";
    const pool = await import(/* @vite-ignore */ modulePath) as typeof import(
      "../src/rendering/webgl-context-lease-pool.ts"
    );
    return pool.inspectKpWebglContextLeasePool(document).active;
  });
}
