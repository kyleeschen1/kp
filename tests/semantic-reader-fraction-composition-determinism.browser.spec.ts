import {
  expect,
  test,
  type Page
} from "@playwright/test";

const animationId = "animation.fraction-composition.two-thirds-solve";
const route = (
  progressPermille: number,
  additions: Record<string, string> = {}
) => {
  const parameters = new URLSearchParams({
    kpLesson: "lesson.algebra.fraction-composition",
    kpVersion: "1",
    kpProgress: String(progressPermille),
    kpMotion: "full",
    kpProfile: "standard",
    kpFoldMode: "expanded",
    ...additions
  });
  return `/reader/fraction-composition/?${parameters}`;
};

test("fraction composition is history-independent across seek, fold, resize, and font invalidation", async ({
  page
}) => {
  await page.setViewportSize({ width: 1_100, height: 800 });
  await page.goto(route(462), { waitUntil: "domcontentloaded" });
  await ready(page);
  const baseline = await frameSnapshot(page);

  for (const progress of [620, 790, 462, 620, 462]) {
    await seek(page, progress);
  }
  expect(await frameSnapshot(page)).toEqual(baseline);

  const foldMode = page.getByLabel("Evaluation detail", { exact: true });
  await foldMode.selectOption("collapsed");
  await expect(page.locator("[data-kp-reader-equation-stage]"))
    .toHaveAttribute("data-kp-reader-fold-mode", "collapsed");
  await foldMode.selectOption("expanded");
  await expect(page.locator("[data-kp-reader-equation-stage]"))
    .toHaveAttribute("data-kp-reader-fold-mode", "expanded");
  expect(await frameSnapshot(page)).toEqual(baseline);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => activeLayoutPolicy(page))
    .toBe("semantic-two-row-stage");
  await page.setViewportSize({ width: 1_100, height: 800 });
  await expect.poll(() => activeLayoutPolicy(page)).toBe("single-row");
  expect(await frameSnapshot(page)).toEqual(baseline);

  const revisionBefore = await layoutRevision(page);
  await page.evaluate(() =>
    document.fonts.dispatchEvent(new Event("loadingdone"))
  );
  await expect.poll(() => layoutRevision(page)).toBeGreaterThan(revisionBefore);
  expect(await frameSnapshot(page)).toEqual(baseline);

  await page.goto(route(462), { waitUntil: "domcontentloaded" });
  await ready(page);
  expect(await frameSnapshot(page)).toEqual(baseline);
});

test("fraction composition layout and native endpoints are invariant in CSS pixels across DPR", async ({
  browser
}) => {
  let reference: Awaited<ReturnType<typeof layoutSnapshot>> | undefined;
  for (const deviceScaleFactor of [1, 2]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor
    });
    const page = await context.newPage();
    await page.goto(route(462), { waitUntil: "domcontentloaded" });
    await ready(page);
    expect(await page.evaluate(() => window.devicePixelRatio))
      .toBe(deviceScaleFactor);
    const snapshot = await layoutSnapshot(page);
    if (reference === undefined) reference = snapshot;
    else expect(snapshot).toEqual(reference);

    await seek(page, 0);
    await expectNativeEndpoint(page, "source");
    await seek(page, 1_000);
    await expectNativeEndpoint(page, "target");
    await context.close();
  }
});

test("replacing the selected library host releases the prior renderer resources", async ({
  page
}) => {
  await page.goto("/canonical-animation-review.html");
  const root = page.locator("[data-kp-animation-library]");
  const frame = page.frameLocator("[data-animation-library-frame]");
  await frame.locator("[data-kp-reader-equation-stage]").waitFor();
  await seekFrame(frame, 500);
  await frame.locator("body").evaluate(async () => {
    const poolUrl = "/src/rendering/webgl-context-lease-pool.ts";
    const pool = await import(/* @vite-ignore */ poolUrl);
    const library = parent.document.querySelector<HTMLElement>(
      "[data-kp-animation-library]"
    );
    if (library === null) throw new Error("Missing parent animation library.");
    window.addEventListener("pagehide", () => {
      library.dataset["kpReleasedHostLeaseSnapshot"] = JSON.stringify(
        pool.inspectKpWebglContextLeasePool(document)
      );
    }, { once: true });
  });

  const search = page.locator("[data-animation-library-search]");
  await search.fill("Distribute and solve with a fraction");
  await page.locator("[data-animation-library-list] button").click();
  await expect(root).toHaveAttribute("data-animation-id", animationId);
  await page.frameLocator("[data-animation-library-frame]")
    .locator("[data-kp-reader-equation-stage]")
    .waitFor();
  await expect.poll(async () => {
    const raw = await root.getAttribute("data-kp-released-host-lease-snapshot");
    return raw === null ? undefined : JSON.parse(raw);
  }).toEqual({ limit: 2, active: 0, waiting: 0 });
  expect(await inspectSelectedHostLeasePool(page)).toEqual({
    limit: 2,
    active: 0,
    waiting: 0
  });
});

async function ready(page: Page): Promise<void> {
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-hydrated",
    "true"
  );
  await expect(page.locator("[data-kp-reader-equation-stage]"))
    .toHaveAttribute(
      "data-kp-reader-canonical-equation-session-active",
      "true"
    );
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
  });
}

async function seek(page: Page, progress: number): Promise<void> {
  const scrubber = page.locator("[data-kp-reader-attention-scrubber]");
  await scrubber.evaluate((node, value) => {
    const input = node as HTMLInputElement;
    input.value = String(value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, progress);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    String(progress)
  );
  await page.evaluate(() => new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  ));
}

async function frameSnapshot(page: Page) {
  return page.locator("[data-kp-reader-equation-stage]").evaluate((stage) => {
    const body = document.body;
    const active = stage.querySelector<HTMLElement>(
      "[data-kp-reader-transition-active='true']"
    );
    const fit = active?.querySelector<HTMLElement>(
      "[data-kp-reader-fit-surface]"
    );
    if (active === null || active === undefined || fit === null || fit === undefined) {
      throw new Error("Fraction snapshot requires one active fitted transition.");
    }
    const applied = [...active.querySelectorAll<HTMLElement>(
      '[data-kp-equation-stage-layout-authority="applied-v1"]'
    )];
    return {
      reviewFrame: body.dataset["kpReaderReviewFrame"],
      checkpoint: body.dataset["kpReaderCheckpoint"],
      transition: body.dataset["kpReaderTransition"],
      accessibleState:
        stage.dataset["kpReaderAccessibleEquationState"],
      layoutPolicy: active.dataset["kpReaderStageLayoutPolicy"],
      fit: {
        status: fit.dataset["kpReaderEquationFitStatus"],
        scale: fit.dataset["kpReaderEquationFitScale"],
        bounds: fit.dataset["kpReaderEquationFitBounds"],
        centering: fit.dataset["kpReaderEquationFitCenteringBounds"],
        transform: fit.style.transform
      },
      members: applied.map((element) => ({
        id:
          element.dataset["kpReaderSelectorId"] ??
          element.dataset["kpFoldableEnvelopeId"] ??
          element.dataset["kpReaderEquationAnchorId"],
        row: element.dataset["kpEquationStageLayoutRow"],
        translate: element.style.translate
      })).sort((left, right) =>
        String(left.id).localeCompare(String(right.id))
      ),
      material: [...stage.querySelectorAll<HTMLElement>(
        "[data-kp-reader-equation-material-owner-id]"
      )].map((owner) => ({
        id: owner.dataset["kpReaderEquationMaterialOwnerId"],
        opacity: owner.style.opacity,
        transform: owner.style.transform,
        fragments: [...owner.querySelectorAll<HTMLElement>(
          "[data-kp-reader-equation-material-fragment-id]"
        )].map((fragment) => ({
          id: fragment.dataset["kpReaderEquationMaterialFragmentId"],
          opacity: fragment.style.opacity,
          transform: fragment.style.transform
        })).sort((left, right) =>
          String(left.id).localeCompare(String(right.id))
        )
      })).sort((left, right) =>
        String(left.id).localeCompare(String(right.id))
      )
    };
  });
}

async function layoutSnapshot(page: Page) {
  return page.locator(
    "[data-kp-reader-transition-active='true']"
  ).evaluate((active) => {
    const fit = active.querySelector<HTMLElement>(
      "[data-kp-reader-fit-surface]"
    );
    if (fit === null) throw new Error("Fraction layout requires a fit surface.");
    const round = (value: number) => Math.round(value * 1_000) / 1_000;
    const rect = (raw: string | undefined) => {
      if (raw === undefined) throw new Error("Missing certified bounds.");
      const value = JSON.parse(raw) as {
        left: number;
        top: number;
        width: number;
        height: number;
      };
      return {
        left: round(value.left),
        top: round(value.top),
        width: round(value.width),
        height: round(value.height)
      };
    };
    const matrix = new DOMMatrix(getComputedStyle(fit).transform);
    return {
      transition: (active as HTMLElement).dataset["kpReaderTransition"],
      policy: (active as HTMLElement).dataset["kpReaderStageLayoutPolicy"],
      fit: {
        status: fit.dataset["kpReaderEquationFitStatus"],
        scale: round(Number(fit.dataset["kpReaderEquationFitScale"])),
        bounds: rect(fit.dataset["kpReaderEquationFitBounds"]),
        centering: rect(fit.dataset["kpReaderEquationFitCenteringBounds"]),
        transform: [
          matrix.a,
          matrix.b,
          matrix.c,
          matrix.d,
          matrix.e,
          matrix.f
        ].map(round)
      },
      members: [...active.querySelectorAll<HTMLElement>(
        '[data-kp-equation-stage-layout-authority="applied-v1"]'
      )].map((element) => ({
        id:
          element.dataset["kpReaderSelectorId"] ??
          element.dataset["kpFoldableEnvelopeId"] ??
          element.dataset["kpReaderEquationAnchorId"],
        row: element.dataset["kpEquationStageLayoutRow"],
        translate: element.style.translate
      })).sort((left, right) =>
        String(left.id).localeCompare(String(right.id))
      )
    };
  });
}

async function layoutRevision(page: Page): Promise<number> {
  const revisions = await page.locator(
    "[data-kp-reader-transition-active='true'] " +
    '[data-kp-equation-stage-layout-authority="applied-v1"]'
  ).evaluateAll((elements) => [...new Set(elements.map((element) =>
    Number((element as HTMLElement)
      .dataset["kpEquationStageLayoutRevision"])
  ))]);
  if (revisions.length !== 1 || !Number.isFinite(revisions[0])) {
    throw new Error(`Expected one layout revision, received ${revisions}.`);
  }
  return revisions[0]!;
}

async function activeLayoutPolicy(page: Page): Promise<string | null> {
  return page.locator("[data-kp-reader-transition-active='true']")
    .getAttribute("data-kp-reader-stage-layout-policy");
}

async function expectNativeEndpoint(
  page: Page,
  owner: "source" | "target"
): Promise<void> {
  const active = page.locator("[data-kp-reader-transition-active='true']");
  await expect(active.locator(`[data-kp-reader-native="${owner}"]`))
    .toHaveCSS("opacity", "1");
  await expect(active.locator(
    "[data-kp-reader-equation-material-owner-id]"
  )).toHaveCount(0);
}

async function seekFrame(
  frame: import("@playwright/test").FrameLocator,
  progress: number
): Promise<void> {
  const scrubber = frame.locator("[data-kp-reader-attention-scrubber]");
  await scrubber.evaluate((node, value) => {
    const input = node as HTMLInputElement;
    input.value = String(value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, progress);
  await expect(frame.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    String(progress)
  );
}

async function inspectSelectedHostLeasePool(page: Page) {
  const handle = await page.locator("[data-animation-library-frame]")
    .elementHandle();
  const frame = await handle?.contentFrame();
  if (frame === undefined || frame === null) {
    throw new Error("Selected animation host is unavailable.");
  }
  return frame.evaluate(async () => {
    const poolUrl = "/src/rendering/webgl-context-lease-pool.ts";
    const pool = await import(/* @vite-ignore */ poolUrl);
    return pool.inspectKpWebglContextLeasePool(document);
  });
}
