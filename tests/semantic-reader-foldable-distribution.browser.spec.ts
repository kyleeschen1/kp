import { expect, test } from "@playwright/test";

const route = (
  progressPermille: number,
  additions: Record<string, string> = {}
) => {
  const parameters = new URLSearchParams({
    kpLesson: "lesson.algebra.foldable-distribution",
    kpVersion: "1",
    kpProgress: String(progressPermille),
    kpMotion: "full",
    kpProfile: "standard",
    ...additions
  });
  return `/reader/foldable-distribution/?${parameters}`;
};

test("fold controls preserve one semantic clock and stable URL state", async ({
  page
}) => {
  await page.setViewportSize({ width: 1_100, height: 800 });
  await page.goto(route(300), { waitUntil: "networkidle" });
  const body = page.locator("body");
  const stage = page.locator("[data-kp-reader-equation-stage]");
  const mode = page.getByLabel("Evaluation detail", { exact: true });

  await expect(body).toHaveAttribute("data-kp-reader-hydrated", "true");
  await expect(stage).toHaveAttribute("data-kp-reader-fold-mode", "automatic");
  await expect(stage).toHaveAttribute("data-kp-reader-fold-total-beats", "64");

  await mode.focus();
  await mode.selectOption("expanded");
  await expect(mode).toHaveValue("expanded");
  await mode.selectOption("collapsed");
  await expect(stage).toHaveAttribute("data-kp-reader-fold-mode", "collapsed");
  await expect(stage).toHaveAttribute("data-kp-reader-fold-total-beats", "46");
  await expect(mode).toHaveAttribute(
    "aria-describedby",
    "kp-reader-fold-status"
  );
  await expect(page.locator("#kp-reader-fold-status")).toContainText("Folded:");
  await expect(page.locator("#kp-reader-fold-status")).toContainText(
    "operations"
  );
  await expect.poll(() =>
    new URL(page.url()).searchParams.get("kpFoldMode")
  ).toBe("collapsed");
  expect(new URL(page.url()).searchParams.getAll("kpFold")).toHaveLength(2);

  const distribution = page.getByRole("button", { name: "Distribution" });
  await distribution.focus();
  await page.keyboard.press("Space");
  await expect(distribution).toHaveAttribute("aria-pressed", "true");
  await expect(mode).toHaveValue("pinned");
  await expect(stage).toHaveAttribute(
    "data-kp-reader-fold-pinned",
    "evaluation.foldable-distribution.distribute"
  );
  await expect(stage).toHaveAttribute("data-kp-reader-fold-total-beats", "55");
  await expect.poll(() =>
    new URL(page.url()).searchParams.get("kpPin")
  ).toBe("evaluation.foldable-distribution.distribute");
});

test("parallel distribution and product work each render as one complete cohort", async ({
  page
}) => {
  await page.setViewportSize({ width: 1_100, height: 800 });
  await page.goto(route(140, { kpFoldMode: "expanded" }), {
    waitUntil: "networkidle"
  });

  const body = page.locator("body");
  await expect(body).toHaveAttribute("data-kp-reader-hydrated", "true");
  await expect(body).toHaveAttribute("data-kp-reader-transition", /^cohort\./);
  await expect(
    page.locator(
      "[data-kp-reader-transition-active='true']" +
      "[data-kp-reader-cohort-transformations*=',']"
    )
  ).toHaveCount(1);
  const splitOwners = page.locator(
    '[data-kp-equation-material-owner-id*="factor-fans-out"]'
  );
  await expect.poll(() => splitOwners.count()).toBeGreaterThan(0);
  expect(await splitOwners.evaluateAll((owners) =>
    owners.every((owner) => getComputedStyle(owner).opacity === "1")
  )).toBe(true);

  await page.goto(route(400, { kpFoldMode: "expanded" }), {
    waitUntil: "networkidle"
  });
  await expect(body).toHaveAttribute("data-kp-reader-transition", /^cohort\./);
  await expect(
    page.locator(
      "[data-kp-reader-transition-active='true']" +
      "[data-kp-reader-cohort-transformations*=',']"
    )
  ).toHaveCount(1);
  const productOwners = page.locator(
    '[data-kp-equation-material-owner-id*="native-scene-owner.successor."]'
  );
  await expect.poll(() => productOwners.count()).toBeGreaterThan(0);
  await expect(
    page.locator(
      "[data-kp-reader-transition-active='true'] [data-kp-reader-fit-surface]"
    )
  ).toHaveAttribute(
    "data-kp-native-katex-successor-synthesis-count",
    "2"
  );
  expect(await productOwners.evaluateAll((owners) => {
    const roles = owners.map(
      (owner) => owner.getAttribute("data-kp-equation-material-fragment-role")
    );
    return roles.some((role) => role === "successor-source:material-input") &&
      roles.some((role) => role === "successor-source:catalyst") &&
      roles.some((role) => role === "successor-target:result");
  })).toBe(true);
  expect(await productOwners.evaluateAll((owners) =>
    owners
      .filter((owner) =>
        owner.getAttribute("data-kp-equation-material-fragment-role")
          ?.startsWith("successor-source:")
      )
      .every((owner) => getComputedStyle(owner).opacity === "1")
  )).toBe(true);
  expect(await page.locator(
    "[data-kp-equation-material-owner-id]"
  ).evaluateAll((owners) => {
    const claimed = new Set([
      "distribution.left.factor-3-constant",
      "distribution.left.constant-2",
      "expression.foldable-distribution.distributed.operator.three-times-two",
      "distribution.right.factor-2-constant",
      "distribution.right.negative-one",
      "expression.foldable-distribution.distributed.operator.two-times-negative-one",
      "distributed.constant-6",
      "distributed.negative-2"
    ]);
    return owners
      .filter((owner) => claimed.has(
        owner.getAttribute(
          "data-kp-equation-material-semantic-entity-id"
        ) ?? ""
      ))
      .every((owner) =>
        owner.getAttribute("data-kp-equation-material-fragment-role")
          ?.startsWith("successor-")
      );
  })).toBe(true);
});

test("successor ownership survives direct seek, rewind, phone, and reduced motion", async ({
  page
}) => {
  const cases = [
    {
      width: 1_100,
      progress: 340,
      additions: { kpFoldMode: "expanded" }
    },
    {
      width: 390,
      progress: 400,
      additions: { kpFoldMode: "expanded" }
    },
    {
      width: 1_100,
      progress: 400,
      additions: { kpFoldMode: "expanded", kpMotion: "reduced" }
    }
  ] as const;

  for (const candidate of cases) {
    await page.setViewportSize({ width: candidate.width, height: 800 });
    await page.goto(route(candidate.progress, candidate.additions), {
      waitUntil: "networkidle"
    });
    await expect(page.locator("body")).toHaveAttribute(
      "data-kp-reader-transition",
      /^cohort\./
    );
    await expect(
      page.locator(
        "[data-kp-reader-transition-active='true'] [data-kp-reader-fit-surface]"
      )
    ).toHaveAttribute(
      "data-kp-native-katex-successor-synthesis-count",
      "2"
    );
    const owners = page.locator(
      '[data-kp-equation-material-owner-id*="native-scene-owner.successor."]'
    );
    await expect.poll(() => owners.count()).toBeGreaterThan(0);
    expect(await owners.evaluateAll((elements) =>
      elements.every((element) =>
        element.getAttribute("data-kp-equation-material-fragment-role")
          ?.startsWith("successor-")
      )
    )).toBe(true);
    expect(await page.evaluate(async () => {
      const poolUrl = "/src/rendering/webgl-context-lease-pool.ts";
      const pool = await import(/* @vite-ignore */ poolUrl);
      return pool.inspectKpWebglContextLeasePool(document);
    })).toMatchObject({ active: 0, waiting: 0 });
    await expect(
      page.locator(
        "[data-kp-reader-transition-active='true'] " +
        "[data-kp-editor-equation-material-layer]"
      )
    ).toHaveCount(1);
    if (candidate.width === 390) {
      await expect(
        page.locator("[data-kp-reader-equation-stage]")
      ).toHaveAttribute(
        "data-kp-reader-fold-layout-policy",
        "semantic-two-row-stage"
      );
      expect(await page.evaluate(() =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth
      )).toBeLessThanOrEqual(1);
    }
  }

  await page.setViewportSize({ width: 1_100, height: 800 });
  await page.goto(route(400, { kpFoldMode: "expanded" }), {
    waitUntil: "networkidle"
  });
  const sampleSuccessors = () => page.locator(
    '[data-kp-equation-material-owner-id*="native-scene-owner.successor."]'
  ).evaluateAll((owners) => owners.map((owner) => {
    const element = owner as HTMLElement;
    return {
      semantic:
        element.dataset["kpEquationMaterialSemanticEntityId"],
      role: element.dataset["kpEquationMaterialFragmentRole"],
      text: element.textContent,
      left: element.style.left,
      top: element.style.top,
      width: element.style.width,
      height: element.style.height,
      opacity: element.style.opacity,
      transform: element.style.transform
    };
  }).sort((left, right) =>
    JSON.stringify(left).localeCompare(JSON.stringify(right))
  ));
  const forwardFrame = await sampleSuccessors();
  const scrubber = page.locator("[data-kp-reader-attention-scrubber]");
  const seek = (value: number) => scrubber.evaluate((node, nextValue) => {
    const input = node as HTMLInputElement;
    input.value = String(nextValue);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
  await seek(450);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    "450"
  );
  await seek(400);
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-playback-direction",
    "rewind"
  );
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-transition",
    /^cohort\./
  );
  await expect(
    page.locator(
      "[data-kp-reader-transition-active='true'] [data-kp-reader-fit-surface]"
    )
  ).toHaveAttribute(
    "data-kp-native-katex-successor-synthesis-count",
    "2"
  );
  expect(await sampleSuccessors()).toEqual(forwardFrame);
});

test("one native MathML owner reports settled equation truth", async ({ page }) => {
  await page.setViewportSize({ width: 1_100, height: 800 });
  await page.goto(route(140, { kpFoldMode: "expanded" }), {
    waitUntil: "networkidle"
  });

  const accessible = page.locator("[data-kp-reader-accessible-equation]");
  await expect(accessible).toHaveCount(1);
  await expect(
    accessible.locator("[data-kp-reader-accessible-equation-state]")
  ).toHaveCount(5);
  await expect(
    accessible.locator(
      "[data-kp-reader-accessible-equation-state]:not([hidden])"
    )
  ).toHaveCount(1);
  await expect(
    accessible.locator(
      "[data-kp-reader-accessible-equation-state]:not([hidden]) math"
    )
  ).toHaveCount(1);
  const measurements = page.locator("[data-kp-reader-equation-measurement]");
  await expect(measurements).toHaveCount(4);
  expect(await measurements.evaluateAll((elements) =>
    elements.every((element) => element.getAttribute("aria-hidden") === "true")
  )).toBe(true);
  await expect(page.locator("[data-kp-reader-equation-material-layer]")).toHaveAttribute(
    "aria-hidden",
    "true"
  );
  await expect(page.locator("[data-kp-reader-equation-stage]")).toHaveAttribute(
    "data-kp-reader-accessible-equation-state",
    "expression.foldable-distribution.factored"
  );

  await page.goto(route(1_000, { kpFoldMode: "collapsed" }), {
    waitUntil: "networkidle"
  });
  await expect(page.locator("[data-kp-reader-equation-stage]")).toHaveAttribute(
    "data-kp-reader-accessible-equation-state",
    "expression.foldable-distribution.collected"
  );
});

test("no-JavaScript document exposes all five native static checkpoints", async ({
  browser
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(route(0), { waitUntil: "networkidle" });

  await expect(page.locator("[data-kp-static-state]")).toHaveCount(5);
  await expect(page.locator("[data-kp-static-state] math")).toHaveCount(5);
  await expect(page.locator("[data-kp-reader-equation-stage]")).toHaveCount(0);
  await expect(page.locator("body")).toContainText("5x + 4");

  await context.close();
});
