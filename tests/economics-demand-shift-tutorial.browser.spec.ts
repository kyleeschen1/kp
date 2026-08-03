import { mkdir } from "node:fs/promises";

import { expect, test } from "@playwright/test";

const route = "/tutorials/economics/demand-shift/";
const animationId =
  "animation.economics.supply-demand-equilibrium-shift";
const evidenceDirectory = "tmp/codex/economics-demand-shift-tutorial";

test("approved economics prose and semantic controls form one persistent tutorial", async ({
  page
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(route);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const player = root.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const graph = player.locator("[data-kp-editor-graph-svg]");
  const stageCard = root.locator(".kp-economics-tutorial__stage-card");
  const motionCue = root.locator("kp-tutorial-scrub-bar");
  const firstMotionBlock = root.locator(
    '[data-kp-tutorial-motion-block="demand-shift"]'
  );
  const tutorialScrubber = motionCue.getByRole("slider", {
    name: "Scrub animation progress"
  });

  await expect(page.locator("#app")).toHaveAttribute(
    "data-kp-economics-demand-shift-tutorial-mounted",
    "true"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scroll-coordinator",
    "connected"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scroll-active-block",
    "demand-shift"
  );
  await expect(root.getByText(
    "Why does an increase in demand raise both equilibrium price and equilibrium quantity when supply remains fixed?"
  )).toBeVisible();
  await expect(root.getByRole("heading", { level: 3 })).toHaveCount(4);
  await expect(root.locator(".kp-economics-tutorial__prose .katex")).not.toHaveCount(0);
  await expect.poll(() => root.locator(".kp-economics-tutorial__math")
    .first()
    .evaluate((element) => ({
      wrapper: getComputedStyle(element).textIndent,
      katex: getComputedStyle(element.querySelector(".katex")!).textIndent
    })))
    .toEqual({ wrapper: "0px", katex: "0px" });
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await expect(graph).toHaveAttribute(
    "data-kp-graph-presentation-profile",
    "kp.graph.dimensional-continuity.economics.v1"
  );
  await expect(player.locator(".editor-animation-player__controls")).toBeHidden();
  await expect(root.locator(".kp-economics-tutorial__controls")).toHaveCount(0);
  await expect(motionCue).toHaveCount(1);
  await expect(firstMotionBlock).toHaveAttribute(
    "aria-label",
    "Demand shifts animation step"
  );
  await expect(firstMotionBlock.locator("p")).toHaveCount(1);
  await expect(firstMotionBlock.locator("kp-tutorial-scrub-bar")).toHaveCount(1);
  await expect(root.locator('[data-kp-tutorial-motion-block="supply-movement"]'))
    .toHaveCount(0);
  expect(await motionCue.evaluate((element) => ({
    tag: element.localName,
    registered: customElements.get(element.localName) === element.constructor,
    shadow: element.shadowRoot?.mode
  }))).toEqual({
    tag: "kp-tutorial-scrub-bar",
    registered: true,
    shadow: "open"
  });
  await expect(root.getByRole("button", {
    name: "Previous semantic checkpoint"
  })).toBeVisible();
  await expect(root.getByRole("button", {
    name: "Next semantic checkpoint"
  })).toBeVisible();
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-focus-profile",
    "market"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-focus-target",
    "market"
  );
  await expect(root.locator("[data-kp-economics-tutorial-spotlight]"))
    .toHaveAttribute("data-kp-attention-spotlight-visible", "true");
  await expect(root.locator("[data-kp-economics-tutorial-attention-bridge]"))
    .toHaveCount(0);
  await expect(root.locator("[data-kp-economics-tutorial-page-veil]"))
    .toHaveAttribute("data-kp-attention-page-veil-visible", "true");
  await expect.poll(() => root.locator("[data-kp-attention-page-veil-passage]")
    .evaluate((element) => (element as SVGRectElement).width.baseVal.value))
    .toBeGreaterThan(300);
  await expect.poll(() => root.locator("[data-kp-attention-page-veil-stage]")
    .evaluate((element) => (element as SVGRectElement).width.baseVal.value))
    .toBeGreaterThan(400);
  await expect.poll(() => stageCard.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      border: style.borderTopWidth,
      radius: style.borderTopLeftRadius,
      background: style.backgroundColor,
      shadow: style.boxShadow
    };
  })).toEqual({
    border: "0px",
    radius: "0px",
    background: "rgba(0, 0, 0, 0)",
    shadow: "none"
  });
  await expect.poll(() => player.locator(".editor-animation-player__stage")
    .evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe("rgba(0, 0, 0, 0)");
  await expect.poll(() => player
    .evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe("rgba(0, 0, 0, 0)");
  await expect.poll(() => player.locator(".editor-animation-player__surface")
    .evaluate((element) => getComputedStyle(element).backgroundColor))
    .toBe("rgba(0, 0, 0, 0)");
  await expect.poll(() => graph.locator(".editor-graph-stage__plot-plane")
    .evaluate((element) => getComputedStyle(element).fill))
    .toBe("rgba(0, 0, 0, 0)");
  await expect.poll(() => root.locator(".kp-economics-tutorial__passage p")
    .first()
    .evaluate((element) => Number.parseFloat(getComputedStyle(element).textIndent)))
    .toBeGreaterThan(0);
  await mkdir(evidenceDirectory, { recursive: true });
  await page.screenshot({
    path: `${evidenceDirectory}/wide-start.png`,
    fullPage: false
  });

  const demandChange = root.locator(
    '[data-kp-economics-tutorial-passage="demand-change"]'
  );
  await demandChange.evaluate((element) => window.scrollTo({
    top: window.scrollY + element.getBoundingClientRect().top -
      window.innerHeight * 0.38
  }));
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-focus-profile",
    "demand"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-focus-target",
    "demand"
  );
  await expect(root.locator("[data-kp-economics-tutorial-reading-band]"))
    .toHaveAttribute("data-kp-reading-band-state", "crossing");
  await expect.poll(() => graph.locator("[data-kp-economics-demand-line]")
    .evaluate((element) => getComputedStyle(element).filter))
    .toContain("opacity(1)");
  await page.screenshot({
    path: `${evidenceDirectory}/wide-demand-focus.png`,
    fullPage: false
  });

  const beforeMotion = root.locator(
    '[data-kp-economics-tutorial-passage="follow-shift"] p'
  ).first();
  const afterMotion = root.locator(
    '[data-kp-economics-tutorial-passage="new-equilibrium"] p'
  ).first();
  const beforeMotionText = await beforeMotion.textContent();
  const [beforeBox, dividerBox, afterBox] = await Promise.all([
    beforeMotion.boundingBox(),
    motionCue.boundingBox(),
    afterMotion.boundingBox()
  ]);
  expect(beforeBox).not.toBeNull();
  expect(dividerBox).not.toBeNull();
  expect(afterBox).not.toBeNull();
  expect(beforeBox!.y + beforeBox!.height).toBeLessThan(dividerBox!.y);
  expect(dividerBox!.y + dividerBox!.height).toBeLessThan(afterBox!.y);
  await expect(motionCue).not.toHaveAttribute("label");
  await expect(motionCue).not.toHaveAttribute("retained-context");
  expect(await motionCue.evaluate((element) => ({
    heading: element.shadowRoot?.querySelector(".heading") !== null,
    status: element.shadowRoot?.querySelector("[data-status]") !== null
  }))).toEqual({ heading: false, status: false });
  await expect(motionCue.getByRole("button", { name: "Play" })).toBeVisible();
  await motionCue.evaluate((element) => window.scrollTo({
    top: window.scrollY + element.getBoundingClientRect().top -
      window.innerHeight * 0.38 + 4
  }));
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-motion-owner",
    "scroll"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scroll-timeline",
    "seeking"
  );
  await expect(motionCue).toHaveAttribute(
    "data-kp-tutorial-scrub-focus",
    "crossing"
  );
  await expect.poll(() => motionCue.evaluate((element) => {
    const button = element.shadowRoot?.querySelector<HTMLButtonElement>(
      "[data-action=toggle]"
    );
    const boundary = element.shadowRoot?.querySelector<HTMLElement>(
      ".boundary"
    );
    if (
      button === undefined ||
      button === null ||
      boundary === undefined ||
      boundary === null
    ) return null;
    return {
      transform: getComputedStyle(button).transform,
      shadowOpacity: Number(getComputedStyle(button, "::after").opacity),
      dividerOpacity: Number(getComputedStyle(boundary, "::after").opacity)
    };
  })).toEqual({
    transform: expect.not.stringMatching(/^none$|matrix\(1, 0, 0, 1, 0, 0\)$/),
    shadowOpacity: expect.closeTo(0.958, 1),
    dividerOpacity: expect.closeTo(0.958, 1)
  });
  await expect.poll(async () => Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  )).toBeCloseTo(0.72, 2);
  const stoppedProgress = Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  );
  await page.waitForTimeout(240);
  expect(Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  )).toBeCloseTo(stoppedProgress, 5);
  await page.screenshot({
    path: `${evidenceDirectory}/wide-motion-cue.png`,
    fullPage: false
  });
  await motionCue.evaluate((element) => window.scrollTo({
    top: window.scrollY + element.getBoundingClientRect().top -
      window.innerHeight * 0.16
  }));
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scroll-timeline",
    "complete"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-checkpoint",
    "settled"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-passage",
    "new-equilibrium"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-focus-target",
    "equilibrium"
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-progress",
    "1"
  );
  await expect(beforeMotion).toHaveText(beforeMotionText ?? "");
  await expect(root.locator(".kp-economics-tutorial__stage-header strong"))
    .toHaveText("New equilibrium");

  await demandChange.evaluate((element) => window.scrollTo({
    top: window.scrollY + element.getBoundingClientRect().top -
      window.innerHeight * 0.38
  }));
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scroll-timeline",
    "rewound"
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-progress",
    "0"
  );
  await expect(motionCue).toHaveAttribute("progress", "0");

  await motionCue.evaluate((element) => window.scrollTo({
    top: window.scrollY + element.getBoundingClientRect().top -
      window.innerHeight * 0.38 + 4
  }));
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scroll-timeline",
    "seeking"
  );
  await expect.poll(async () => Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  )).toBeCloseTo(0.72, 2);

  await page.evaluate(() => {
    (window as typeof window & { __kpTutorialDocumentToken?: string })
      .__kpTutorialDocumentToken = "persistent-economics-tutorial";
  });
  await tutorialScrubber.evaluate((input) => {
    if (!(input instanceof HTMLInputElement)) return;
    input.value = "0.72";
    input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
  });
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-progress",
    "0.72"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-checkpoint",
    "ready-to-shift"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-focus-target",
    "equilibrium"
  );
  await expect(beforeMotion).toHaveText(beforeMotionText ?? "");
  await page.screenshot({
    path: `${evidenceDirectory}/wide-motion-divider.png`,
    fullPage: false
  });
  await root.getByRole("button", {
    name: "Next semantic checkpoint"
  }).click();
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-checkpoint",
    "handoff"
  );
  await root.getByRole("button", {
    name: "Next semantic checkpoint"
  }).click();
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-checkpoint",
    "settled"
  );
  await expect(graph.locator("[data-kp-economics-equilibrium-point]"))
    .toHaveAttribute("data-kp-economics-equilibrium-quantity", "8");
  expect(await page.evaluate(() =>
    (window as typeof window & { __kpTutorialDocumentToken?: string })
      .__kpTutorialDocumentToken
  )).toBe("persistent-economics-tutorial");

  const synthesis = root.locator(
    '[data-kp-economics-tutorial-passage="synthesis"]'
  );
  await synthesis.evaluate((element) => window.scrollTo({
    top: window.scrollY + element.getBoundingClientRect().top -
      window.innerHeight * 0.38
  }));
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-checkpoint",
    "synthesis"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-focus-profile",
    "synthesis"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-focus-target",
    "supply"
  );
  await expect(root.locator("[data-kp-economics-tutorial-attention-bridge]"))
    .toHaveCount(0);
  await expect.poll(() => graph.locator("[data-kp-economics-supply-line]")
    .evaluate((element) => getComputedStyle(element).filter))
    .toContain("opacity(1)");
  await expect.poll(() => graph.locator("[data-kp-economics-demand-line]")
    .evaluate((element) => getComputedStyle(element).filter))
    .toContain("opacity(0.38)");
  await expect(player).not.toHaveAttribute(
    "data-kp-editor-animation-status",
    "playing"
  );
  await synthesis.getByText("Reveal the model explanation").click();
  await expect(synthesis).toContainText(
    "Quantity supplied rose because equilibrium selected a new point"
  );

  await root.getByText("Explore another demand shift", { exact: true }).click();
  const parameter = root.getByRole("slider", {
    name: "New demand intercept"
  });
  await parameter.fill("20");
  await expect(root).toHaveAttribute(
    "data-kp-economics-demand-intercept",
    "20"
  );
  await expect.poll(() => new URL(page.url()).searchParams.get("demandIntercept"))
    .toBe("20");
  await root.getByRole("button", {
    name: "Return to lesson example"
  }).click();
  await expect(root).toHaveAttribute(
    "data-kp-economics-demand-intercept",
    "18"
  );
  expect(new URL(page.url()).pathname).toBe(route);
  expect(pageErrors).toEqual([]);

  await page.screenshot({
    path: `${evidenceDirectory}/wide-synthesis.png`,
    fullPage: false
  });
});

test("manual playback retains timeline ownership during scroll", async ({
  page
}) => {
  await page.goto(route);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const player = root.locator("[data-kp-editor-animation-player]");
  const motionCue = root.locator("kp-tutorial-scrub-bar");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );

  await motionCue.evaluate((element) => {
    element.shadowRoot?.querySelector<HTMLButtonElement>(
      "[data-action=toggle]"
    )?.click();
  });
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-motion-owner",
    "manual"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scroll-timeline",
    "manual"
  );
  await expect.poll(async () => Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  )).toBeGreaterThan(0);
  await motionCue.evaluate((element) => {
    element.shadowRoot?.querySelector<HTMLButtonElement>(
      "[data-action=toggle]"
    )?.click();
  });
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-status",
    "paused"
  );
  const pausedProgress = Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  );

  const demandChange = root.locator(
    '[data-kp-economics-tutorial-passage="demand-change"]'
  );
  await demandChange.scrollIntoViewIfNeeded();
  await motionCue.evaluate((element) => window.scrollTo({
    top: window.scrollY + element.getBoundingClientRect().top -
      window.innerHeight * 0.38 + 4
  }));
  await page.waitForTimeout(800);
  expect(Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  )).toBeCloseTo(pausedProgress, 5);
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scroll-timeline",
    "manual"
  );
  await expect(motionCue).toHaveAttribute(
    "data-kp-tutorial-scrub-manual",
    "true"
  );
});

test("reduced-motion readers retain the text-free divider without automatic seek", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const player = root.locator("[data-kp-editor-animation-player]");
  const motionCue = root.locator("kp-tutorial-scrub-bar");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await motionCue.evaluate((element) => window.scrollTo({
    top: window.scrollY + element.getBoundingClientRect().top -
      window.innerHeight * 0.38 + 4
  }));
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scroll-timeline",
    "reduced-motion"
  );
  await page.waitForTimeout(800);
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-progress",
    "0"
  );
  await expect(motionCue).toHaveAttribute(
    "data-kp-tutorial-scrub-reduced-motion",
    "true"
  );
  await expect(motionCue).toHaveAttribute(
    "aria-label",
    "Animation timeline. Automatic scroll motion is disabled."
  );
  expect(await motionCue.evaluate((element) =>
    element.shadowRoot?.querySelector(".heading")
  )).toBeNull();
});

test("phone tutorial keeps a stable compact stage dock with optional expansion", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const stage = root.locator(".kp-economics-tutorial__stage");
  const stageCard = root.locator(".kp-economics-tutorial__stage-card");
  const player = root.locator("[data-kp-editor-animation-player]");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await expect(root.locator("[data-kp-economics-tutorial-attention-bridge]"))
    .toHaveCount(0);
  await expect(root.locator("[data-kp-economics-tutorial-spotlight]"))
    .toHaveAttribute("data-kp-attention-spotlight-visible", "true");
  await expect(root.locator("[data-kp-economics-tutorial-page-veil]"))
    .toHaveAttribute("data-kp-attention-page-veil-visible", "false");
  await expect(root.locator("[data-kp-economics-tutorial-reading-band]"))
    .toBeHidden();
  await expect.poll(() => stageCard.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      borderBottom: style.borderBottomWidth,
      background: style.backgroundColor,
      shadow: style.boxShadow
    };
  })).toEqual({
    borderBottom: "1px",
    background: "rgb(255, 253, 248)",
    shadow: "rgba(45, 61, 69, 0.18) 0px 10px 32px 0px"
  });
  const compact = await stage.boundingBox();
  expect(compact).not.toBeNull();
  expect(compact!.y).toBeCloseTo(0, 0);
  expect(compact!.height).toBeGreaterThan(280);
  expect(compact!.height).toBeLessThan(350);

  await root.getByRole("button", { name: "Expand stage" }).click();
  await expect(root).toHaveClass(/kp-economics-tutorial--stage-expanded/);
  await expect.poll(async () => (await stage.boundingBox())?.height ?? 0)
    .toBeGreaterThan(600);
  await root.getByRole("button", {
    name: "Return stage to compact size"
  }).click();
  await expect.poll(async () => (await stage.boundingBox())?.height ?? 0)
    .toBeLessThan(350);

  await mkdir(evidenceDirectory, { recursive: true });
  await page.screenshot({
    path: `${evidenceDirectory}/phone.png`,
    fullPage: false
  });
});
