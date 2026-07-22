import { expect, test } from "@playwright/test";

const route = "/reader/distribution-area/";

test("semantic editor opens the synchronized algebra and area exemplar", async ({ page }) => {
  const errors: Error[] = [];
  page.on("pageerror", (error) => errors.push(error));
  await page.goto("/", { waitUntil: "networkidle" });

  const library = page.locator("[data-kp-learner-experience-library]");
  const first = library.locator("[data-kp-learner-experience]").first();
  await expect(first).toHaveAttribute(
    "data-kp-learner-experience",
    "distribution-area-scroll-lesson"
  );
  const link = first.getByRole("link", { name: "Review algebra and area" });
  await expect(link).toHaveAttribute("href", route);
  await link.click();

  await expect(page).toHaveURL(/\/reader\/distribution-area\//);
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader", "distribution-area");
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-hydrated", "true");
  await expect(page.getByRole("heading", { name: "See distribution become area", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("distribution reader mounts review capture outside the visual stage", async ({ page }) => {
  await page.addInitScript(() => {
    (window as typeof window & { __kpDistributionReviewFrames?: unknown[] })
      .__kpDistributionReviewFrames = [];
    window.addEventListener("kp:reader-dev-review-frame", (event) => {
      if (!(event instanceof CustomEvent)) return;
      (window as typeof window & { __kpDistributionReviewFrames: unknown[] })
        .__kpDistributionReviewFrames.push(event.detail);
    });
  });
  await page.goto(`${route}?kpProgress=500`, { waitUntil: "networkidle" });
  await expect(page.locator("body")).toHaveAttribute("data-kp-reader-font-ready", "true");
  await expect(page.locator("body")).toHaveAttribute("data-kp-dev-review-ready", "true");
  const host = page.locator("[data-kp-dev-review-shell]");
  await expect(host).toHaveAttribute("data-kp-dev-review-placement", "left-prose-rail");
  await host.locator("button.launcher").click();
  await expect(host.locator("textarea")).toBeEnabled();

  const stage = await page.locator("[data-kp-distribution-stage]").boundingBox();
  const panel = await host.locator("[role=dialog]").boundingBox();
  expect(stage).not.toBeNull();
  expect(panel).not.toBeNull();
  expect(panel!.x + panel!.width).toBeLessThanOrEqual(stage!.x);
  const latestFrame = await page.evaluate(() =>
    (window as typeof window & { __kpDistributionReviewFrames: Array<{
      fontReady: boolean;
      fontRevision: number;
    }> }).__kpDistributionReviewFrames.at(-1)
  );
  expect(latestFrame?.fontReady).toBe(true);
  expect(latestFrame?.fontRevision).toBeGreaterThanOrEqual(0);
});

test("distribution reader keeps one visual owner and reversible native endpoints", async ({ page }) => {
  await page.goto(`${route}?kpProgress=0&kpDirection=forward`, { waitUntil: "networkidle" });
  const stage = page.locator("[data-kp-distribution-stage]");
  const scrubber = page.locator("[data-kp-distribution-scrubber]");
  const factored = page.locator('[data-kp-native="factored"]');
  const expanded = page.locator('[data-kp-native="expanded"]');
  const material = page.locator("[data-kp-algebra-material]");

  await expect(stage).toHaveAttribute("data-kp-owner", "factored-native");
  await expect(factored).toBeVisible();
  await expect(expanded).toBeHidden();
  await expect(material).toBeHidden();

  await scrubber.fill("500");
  await expect(stage).toHaveAttribute("data-kp-owner", "material");
  await expect(factored).toBeHidden();
  await expect(expanded).toBeHidden();
  await expect(material).toBeVisible();

  await scrubber.fill("1000");
  await expect(stage).toHaveAttribute("data-kp-owner", "expanded-native");
  await expect(expanded).toBeVisible();
  await page.getByRole("button", { name: "Factor" }).click();
  await expect(stage).toHaveAttribute("data-kp-direction", "inverse");
  await expect(stage).toHaveAttribute("data-kp-owner", "expanded-native");
  await expect(scrubber).toHaveValue("0");

  await scrubber.fill("1000");
  await expect(stage).toHaveAttribute("data-kp-owner", "factored-native");
  await expect(factored).toBeVisible();
  await expect(page).toHaveURL(/kpDirection=inverse/);
  await expect(page).toHaveURL(/kpCheckpoint=factored/);
});

test("endpoint and material owners switch discretely without static-anchor crossfades", async ({ page }) => {
  await page.goto(`${route}?kpProgress=0&kpDirection=forward`, { waitUntil: "networkidle" });
  const stage = page.locator("[data-kp-distribution-stage]");
  const algebraMaterial = page.locator("[data-kp-algebra-material]");
  const widthMaterial = page.locator("[data-kp-area-width-material]");
  const factored = page.locator('[data-kp-native="factored"]');
  const expanded = page.locator('[data-kp-native="expanded"]');

  await expect(stage).toHaveAttribute("data-kp-algebra-owner", "factored-native");
  await expect(stage).toHaveAttribute("data-kp-width-owner", "combined-native");
  await expect(factored).toBeVisible();
  await expect(algebraMaterial).toBeHidden();

  await page.locator("[data-kp-distribution-scrubber]").fill("1");
  await expect(stage).toHaveAttribute("data-kp-algebra-owner", "material");
  await expect(stage).toHaveAttribute("data-kp-width-owner", "material");
  await expect(factored).toBeHidden();
  await expect(expanded).toBeHidden();
  await expect(algebraMaterial).toBeVisible();
  await expect(widthMaterial).toBeVisible();
  await expect(page.locator('[data-kp-area-label="combined-width"]')).toHaveCSS("opacity", "0");
  await expect(page.locator('[data-kp-area-label="x-width"]')).toHaveCSS("opacity", "0");

  await page.locator("[data-kp-distribution-scrubber]").fill("1000");
  await expect(stage).toHaveAttribute("data-kp-algebra-owner", "expanded-native");
  await expect(stage).toHaveAttribute("data-kp-width-owner", "components-native");
  await expect(expanded).toBeVisible();
  await expect(algebraMaterial).toBeHidden();
  await expect(widthMaterial).toBeHidden();
  await expect(page.locator('[data-kp-area-label="x-width"]')).toHaveCSS("opacity", "1");
});

test("factoring preserves the current frame and samples the same choreography backward", async ({ page }) => {
  await page.goto(`${route}?kpProgress=370&kpDirection=forward`, { waitUntil: "networkidle" });
  const capture = () => page.evaluate(() => {
    const selectors = [
      '[data-kp-material-token="left-three"]',
      '[data-kp-material-token="right-three"]',
      '[data-kp-material-token="x"]',
      '[data-kp-material-token="two"]',
      '[data-kp-area-width-token="x"]',
      '[data-kp-area-width-token="two"]'
    ];
    return {
      tokens: selectors.map((selector) => {
        const element = document.querySelector<HTMLElement>(selector)!;
        const rect = element.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, opacity: Number(getComputedStyle(element).opacity) };
      }),
      clock: getComputedStyle(document.querySelector<HTMLElement>("[data-kp-distribution-stage]")!)
        .getPropertyValue("--kp-partition-progress"),
      cue: document.querySelector<HTMLOutputElement>("[data-kp-distribution-status]")!.textContent
    };
  });
  const forward = await capture();
  await page.getByRole("button", { name: "Factor" }).click();
  const inverse = await capture();

  expect(inverse.tokens).toEqual(forward.tokens);
  expect(inverse.clock).toBe(forward.clock);
  expect(inverse.cue).not.toBe(forward.cue);
  await expect(page.locator("[data-kp-distribution-scrubber]")).toHaveValue("630");
  await expect(page).toHaveURL(/kpProgress=630/);
  await expect(page).toHaveURL(/kpDirection=inverse/);

  await page.locator("[data-kp-distribution-scrubber]").fill("700");
  const rewound = await capture();
  expect(rewound.tokens[2]!.x).not.toBe(forward.tokens[2]!.x);
});

test("material x follows measured KaTeX anchors instead of percentages", async ({ page }) => {
  await page.goto(`${route}?kpProgress=360&kpDirection=forward`, { waitUntil: "networkidle" });
  const centers = await page.evaluate(() => {
    const center = (selector: string) => {
      const rect = document.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };
    const factored = center('[data-kp-distribution-state$="state.factored"] [data-kp-distribution-anchor$="term.x"]');
    const distributed = center('[data-kp-distribution-state$="state.distributed"] [data-kp-distribution-anchor$="left.term.x"]');
    return { factored, distributed, material: center('[data-kp-material-token="x"]') };
  });
  expect(centers.material.x).toBeCloseTo((centers.factored.x + centers.distributed.x) / 2, 0);
  expect(centers.material.y).toBeCloseTo((centers.factored.y + centers.distributed.y) / 2, 0);
  await expect(page.locator("[data-kp-distribution-stage]")).toHaveAttribute(
    "data-kp-distribution-layout-revision",
    /[1-9]\d*/
  );
});

test("geometric width tokens travel from one measured KaTeX label into the partition labels", async ({ page }) => {
  await page.goto(`${route}?kpProgress=360&kpDirection=forward`, { waitUntil: "networkidle" });
  const positions = await page.evaluate(() => {
    const centerX = (selector: string) => {
      const rect = document.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
      return rect.left + rect.width / 2;
    };
    return {
      sourceX: centerX('[data-kp-area-width-anchor="source.x"]'),
      targetX: centerX('[data-kp-area-width-anchor="target.x"]'),
      materialX: centerX('[data-kp-area-width-token="x"]'),
      sourceTwo: centerX('[data-kp-area-width-anchor="source.two"]'),
      targetTwo: centerX('[data-kp-area-width-anchor="target.two"]'),
      materialTwo: centerX('[data-kp-area-width-token="two"]')
    };
  });
  expect(positions.materialX).toBeLessThan(positions.sourceX);
  expect(positions.materialX).toBeGreaterThan(positions.targetX);
  expect(positions.materialTwo).toBeGreaterThan(positions.sourceTwo);
  expect(positions.materialTwo).toBeLessThan(positions.targetTwo);
  await expect(page.locator("[data-kp-area-width-material]")).toBeVisible();
});

test("algebra and geometry sample one correspondence clock", async ({ page }) => {
  await page.goto(`${route}?kpProgress=360&kpDirection=forward`, { waitUntil: "networkidle" });
  const progress = await page.evaluate(() => {
    const centerX = (selector: string) => {
      const rect = document.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
      return rect.left + rect.width / 2;
    };
    const normalized = (value: number, from: number, to: number) => (value - from) / (to - from);
    const algebra = normalized(
      centerX('[data-kp-material-token="x"]'),
      centerX('[data-kp-distribution-state$="state.factored"] [data-kp-distribution-anchor$="term.x"]'),
      centerX('[data-kp-distribution-state$="state.distributed"] [data-kp-distribution-anchor$="left.term.x"]')
    );
    const geometry = normalized(
      centerX('[data-kp-area-width-token="x"]'),
      centerX('[data-kp-area-width-anchor="source.x"]'),
      centerX('[data-kp-area-width-anchor="target.x"]')
    );
    const cssClock = Number.parseFloat(getComputedStyle(
      document.querySelector<HTMLElement>("[data-kp-distribution-stage]")!
    ).getPropertyValue("--kp-partition-progress"));
    return { algebra, geometry, cssClock };
  });
  expect(progress.algebra).toBeCloseTo(progress.geometry, 3);
  expect(progress.algebra).toBeCloseTo(progress.cssClock, 3);
});

test("distribution share URL round trips an exact inverse moment", async ({ page }) => {
  await page.goto(`${route}?kpProgress=0&kpDirection=forward`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Factor" }).click();
  const scrubber = page.locator("[data-kp-distribution-scrubber]");
  await scrubber.fill("640");
  await scrubber.dispatchEvent("change");

  const shareHref = await page.locator("[data-kp-distribution-share]").getAttribute("href");
  expect(shareHref).not.toBeNull();
  const shared = new URL(shareHref!);
  expect(shared.searchParams.get("kpLesson")).toBe("lesson.algebra.distribution-area");
  expect(shared.searchParams.get("kpVersion")).toBe("1");
  expect(shared.searchParams.get("kpCheckpoint")).toBe("distributed");
  expect(shared.searchParams.get("kpProgress")).toBe("640");
  expect(shared.searchParams.get("kpDirection")).toBe("inverse");

  await page.goto(shared.toString(), { waitUntil: "networkidle" });
  await expect(page.locator("[data-kp-distribution-stage]")).toHaveAttribute(
    "data-kp-direction",
    "inverse"
  );
  await expect(scrubber).toHaveValue("640");
  await expect(page.locator("[data-kp-distribution-stage]")).toHaveAttribute(
    "data-kp-owner",
    "material"
  );
});

test("distribution URL restores the exact review moment and semantic cross-surface focus", async ({ page }) => {
  await page.goto(
    `${route}?kpLesson=lesson.algebra.distribution-area&kpVersion=1&kpCheckpoint=distributed&kpProgress=720&kpDirection=forward`,
    { waitUntil: "networkidle" }
  );
  const stage = page.locator("[data-kp-distribution-stage]");
  await expect(stage).toHaveAttribute("data-kp-owner", "material");
  await expect(stage).toHaveAttribute("data-kp-checkpoint", "distributed");
  await expect(page.locator("[data-kp-distribution-scrubber]")).toHaveValue("720");
  const toc = page.locator(".kp-lesson-toc");
  await expect(toc).toHaveAttribute("data-kp-toc-active-id", "beat.distribute");
  await expect(toc.locator('[data-kp-toc-active="true"]')).toHaveAttribute(
    "aria-current",
    "location"
  );
  await expect(page.locator('[data-kp-beat="beat.distribute"]')).toHaveAttribute(
    "aria-current",
    "step"
  );

  await page.getByRole("button", { name: "three" }).hover();
  await expect(page.locator('[data-kp-area-label="height"]')).toHaveAttribute(
    "data-kp-external-focus",
    "true"
  );
  await expect(page.locator('[data-kp-material-token="left-three"]')).toHaveAttribute(
    "data-kp-external-focus",
    "true"
  );
});

test("distribution reader remains searchable without JavaScript and contained on phone", async ({ browser }) => {
  const staticContext = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await staticContext.newPage();
  await staticPage.goto(route);
  await expect(staticPage.getByText("The same multiplication can be read as symbols")).toBeVisible();
  await expect(staticPage.locator("[data-kp-symbolic-transcript]")).toContainText(
    "3(x+2) → 3x+3·2 → 3x+6"
  );
  await expect(staticPage.locator('[data-kp-native="factored"]')).toBeVisible();
  await expect(staticPage.locator('[data-kp-native="expanded"]')).toBeHidden();
  await expect(staticPage.locator("svg text")).toHaveCount(0);
  await staticContext.close();

  const phone = await browser.newPage({ viewport: { width: 360, height: 640 } });
  await phone.goto(`${route}?kpProgress=720`, { waitUntil: "networkidle" });
  const overflow = await phone.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const stage = phone.locator("[data-kp-distribution-stage]");
  const algebra = phone.locator(".kp-distribution-algebra");
  const area = phone.locator(".kp-distribution-area");
  const [stageBox, algebraBox, areaBox] = await Promise.all([
    stage.boundingBox(), algebra.boundingBox(), area.boundingBox()
  ]);
  expect(stageBox).not.toBeNull();
  expect(algebraBox).not.toBeNull();
  expect(areaBox).not.toBeNull();
  expect(areaBox!.y).toBeGreaterThan(algebraBox!.y);
  expect(areaBox!.x).toBeGreaterThanOrEqual(stageBox!.x);
  expect(areaBox!.x + areaBox!.width).toBeLessThanOrEqual(stageBox!.x + stageBox!.width + 1);
  await phone.close();
});

test("distribution preserves its semantic moment through narrow resize without wrapping or overflow", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 760 });
  await page.goto(`${route}?kpProgress=430&kpDirection=forward`, { waitUntil: "networkidle" });
  const stage = page.locator("[data-kp-distribution-stage]");
  await expect(stage).toHaveAttribute("data-kp-fit-status", "contained");

  for (const width of [375, 320, 280]) {
    const previousRevision = Number(await stage.getAttribute("data-kp-distribution-layout-revision"));
    await page.setViewportSize({ width, height: 700 });
    await expect.poll(async () => Number(await stage.getAttribute("data-kp-distribution-layout-revision")))
      .toBeGreaterThan(previousRevision);
    const containment = await page.evaluate(() => {
      const stageRect = document.querySelector<HTMLElement>("[data-kp-distribution-stage]")!.getBoundingClientRect();
      const selectors = [
        '[data-kp-material-token="left-three"]',
        '[data-kp-material-token="right-three"]',
        '[data-kp-material-token="x"]',
        '[data-kp-material-token="two"]',
        '[data-kp-area-width-token="x"]',
        '[data-kp-area-width-token="two"]'
      ];
      return {
        documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
        allInside: selectors.every((selector) => {
          const rect = document.querySelector<HTMLElement>(selector)!.getBoundingClientRect();
          return rect.left >= stageRect.left - 1 && rect.right <= stageRect.right + 1;
        }),
        nowrap: [...document.querySelectorAll<HTMLElement>(".kp-distribution-algebra .katex, .kp-distribution-area .katex")]
          .every((element) => getComputedStyle(element).whiteSpace === "nowrap")
      };
    });
    expect(containment).toEqual({ documentOverflow: 0, allInside: true, nowrap: true });
    await expect(stage).toHaveAttribute("data-kp-fit-status", "contained");
    await expect(stage).toHaveAttribute("data-kp-owner", "material");
    await expect(page.locator("[data-kp-distribution-scrubber]")).toHaveValue("430");
    await expect(page).toHaveURL(/kpProgress=430/);
  }
});
