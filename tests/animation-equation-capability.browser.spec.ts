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

test("equation capability settles inside one reserved wide stage", async ({
  page
}) => {
  await expectReservedCapabilitySettlement({
    page,
    viewport: { width: 1280, height: 900 },
    animationId: equationId,
    capabilityPattern: /equation-surface-capability\.ts/
  });
  const catalogue = page.locator("[data-kp-animation-catalogue]");
  await expect(catalogue).toHaveAttribute("data-kp-svelte-catalogue-shell", "");
  await expect(catalogue.locator(
    "[data-kp-animation-catalogue-stage] .katex-display"
  )).toHaveCount(0);
  expect(await catalogue.locator(
    "[data-kp-animation-catalogue-stage] .katex"
  ).count()).toBeGreaterThan(0);
  await expect(catalogue.getByRole("heading", {
    level: 3,
    name: "Details",
    exact: true
  })).toBeVisible();
  await expect(catalogue.locator(
    "[data-kp-animation-catalogue-stage] [data-kp-editor-solve-x-step]"
  )).toHaveCount(4);
  const stepHeights = await catalogue.locator(
    "[data-kp-animation-catalogue-stage] [data-kp-editor-solve-x-step]"
  ).evaluateAll((steps) => steps.map((step) =>
    step.getBoundingClientRect().height
  ));
  expect(Math.max(...stepHeights)).toBeLessThanOrEqual(34);
});

test("graph labels settle inside the same reserved narrow stage", async ({
  page
}) => {
  await expectReservedCapabilitySettlement({
    page,
    viewport: { width: 390, height: 844 },
    animationId: "animation.dot-projection.basic",
    capabilityPattern: /graph-svg-surface-capability\.ts/
  });
});

test("programming and 3D selections request only their selected capabilities", async ({
  page
}) => {
  const unrelatedRequests: string[] = [];
  const graph3DRequests: string[] = [];
  const programmingRequests: string[] = [];
  page.on("request", (request) => {
    if (/equation-surface-capability|graph-svg-surface-capability|katex(?:\.min)?\.(?:js|css)(?:\?|$)|api-catalog|animation-diagnostics-capability|shiki|highlight\.js|prismjs|code-highlighter/i
      .test(request.url())) {
      unrelatedRequests.push(request.url());
    }
    if (/graph-3d-surface-capability/i.test(request.url())) {
      graph3DRequests.push(request.url());
    }
    if (/programming-surface-capability/i.test(request.url())) {
      programmingRequests.push(request.url());
    }
  });

  await page.goto(`/?artifact=${programmingId}`);
  await waitForOutcome(page, programmingId, "painted");
  expect(unrelatedRequests).toEqual([]);
  expect(graph3DRequests).toEqual([]);
  expect(programmingRequests).toHaveLength(1);

  await page.goto(`/?artifact=${graph3DId}`);
  await waitForOutcome(page, graph3DId, "painted");
  expect(unrelatedRequests).toEqual([]);
  expect(graph3DRequests).toHaveLength(1);
  expect(programmingRequests).toHaveLength(1);
});

test("canonical Svelte catalogue and full editor load only their application capabilities", async ({
  page
}) => {
  const svelteCatalogueRequests: string[] = [];
  const imperativeCatalogueRequests: string[] = [];
  const legacyMainRequests: string[] = [];
  const gestaltRequests: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (/svelte-catalogue-exemplar-entry\.ts/.test(url)) {
      svelteCatalogueRequests.push(url);
    }
    if (/animation-catalogue-application\.ts/.test(url)) {
      imperativeCatalogueRequests.push(url);
    }
    if (/\/src\/main\.ts(?:\?|$)/.test(url)) legacyMainRequests.push(url);
    if (/animation-player-gestalt-capability\.ts/.test(url)) {
      gestaltRequests.push(url);
    }
  });

  await page.goto(
    "/?artifact=animation.economics.supply-demand-equilibrium-shift"
  );
  await waitForOutcome(
    page,
    "animation.economics.supply-demand-equilibrium-shift",
    "painted"
  );
  expect(svelteCatalogueRequests).toHaveLength(1);
  expect(imperativeCatalogueRequests).toEqual([]);
  expect(legacyMainRequests).toEqual([]);
  expect(gestaltRequests).toEqual([]);
  await expect(page.locator(
    "[data-kp-editor-animation-player]"
  )).toHaveAttribute("data-kp-editor-animation-focus-experiment", "flat");

  await page.goto(
    "/?view=animation-library-host&" +
    "animation=editor-animation.animation.linear-solve.solve-x"
  );
  const player = page.locator("[data-kp-editor-animation-player]");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await expect(player.locator(
    "[data-kp-editor-animation-quality-control]"
  )).toHaveValue("auto");
  await expect(page.locator(
    "[data-kp-editor-animation-gestalt-diagnostics]"
  )).toHaveCount(1);
  expect(legacyMainRequests).toHaveLength(1);
  expect(gestaltRequests).toHaveLength(1);
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

async function expectReservedCapabilitySettlement(input: {
  readonly page: import("@playwright/test").Page;
  readonly viewport: { readonly width: number; readonly height: number };
  readonly animationId: string;
  readonly capabilityPattern: RegExp;
}): Promise<void> {
  let releaseCapability = (): void => undefined;
  const capabilityGate = new Promise<void>((resolve) => {
    releaseCapability = resolve;
  });
  await input.page.setViewportSize(input.viewport);
  await input.page.addInitScript(() => {
    type ProbeWindow = Window & {
      __kpCatalogueLayoutShiftProbe?: {
        readonly values: number[];
        readonly observer: PerformanceObserver;
      };
    };
    const values: number[] = [];
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & {
          readonly value: number;
          readonly hadRecentInput: boolean;
        };
        if (!shift.hadRecentInput) values.push(shift.value);
      }
    });
    observer.observe({ type: "layout-shift", buffered: true });
    (window as ProbeWindow).__kpCatalogueLayoutShiftProbe = {
      values,
      observer
    };
  });
  await input.page.route(input.capabilityPattern, async (route) => {
    await capabilityGate;
    await route.continue();
  });

  await input.page.goto(`/?artifact=${input.animationId}`);
  const reservation = input.page.locator(
    "[data-kp-animation-catalogue-stage-reservation]"
  );
  await expect(reservation).toHaveAttribute(
    "data-kp-animation-catalogue-stage-reservation",
    "kp.animation-catalogue.stage-reservation.v1"
  );
  const before = await reservation.boundingBox();

  releaseCapability();
  await waitForOutcome(input.page, input.animationId, "painted");
  await input.page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())
    ));
  });
  const after = await reservation.boundingBox();
  const shift = await input.page.evaluate(() => {
    type ProbeWindow = Window & {
      __kpCatalogueLayoutShiftProbe?: {
        readonly values: number[];
        readonly observer: PerformanceObserver;
      };
    };
    const probe = (window as ProbeWindow).__kpCatalogueLayoutShiftProbe;
    probe?.observer.disconnect();
    return probe?.values.reduce((sum, value) => sum + value, 0) ?? 0;
  });

  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  for (const dimension of ["x", "y", "width", "height"] as const) {
    expect(Math.abs(
      (after?.[dimension] ?? 0) - (before?.[dimension] ?? 0)
    )).toBeLessThan(0.5);
  }
  expect(shift).toBeLessThan(0.001);
}
