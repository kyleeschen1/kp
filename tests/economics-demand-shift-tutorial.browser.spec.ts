import { mkdir, readFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";

import {
  renderKpTutorialScrubBar
} from "../src/tutorial/kp-tutorial-scrub-bar-renderer.ts";
import {
  compileKpEconomicsDemandShiftPublication
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-publication.ts";

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
  const firstMotionBlock = root.locator(
    '[data-kp-tutorial-motion-block="demand-shift"]'
  );
  const secondMotionBlock = root.locator(
    '[data-kp-tutorial-motion-block="supply-movement"]'
  );
  const motionCue = firstMotionBlock.locator("kp-tutorial-scrub-bar");
  const supplyMotionCue = secondMotionBlock.locator("kp-tutorial-scrub-bar");
  const tutorialScrubber = motionCue.getByRole("slider", {
    name: "Scrub animation progress"
  });

  await expect(page.locator("#app")).toHaveAttribute(
    "data-kp-economics-demand-shift-tutorial-mounted",
    "true",
    { timeout: 30_000 }
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scroll-coordinator",
    "connected"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scroll-active-block",
    ""
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-attention-passage",
    ""
  );
  await expect(root.getByText(
    "Why does an increase in demand raise both equilibrium price and equilibrium quantity when supply remains fixed?"
  )).toBeVisible();
  await expect(root.getByRole("heading", { level: 3 })).toHaveCount(4);
  const toc = root.locator("kp-tutorial-toc");
  await expect(toc.getByRole("navigation", { name: "In this lesson" }))
    .toBeVisible();
  await expect(toc.locator('[data-kp-tutorial-toc-item="section"]'))
    .toHaveCount(4);
  await expect(toc.locator('[data-kp-tutorial-toc-item="block"]'))
    .toHaveCount(2);
  await expect(toc.locator('[data-kp-tutorial-toc-item="checkpoint"]'))
    .toHaveCount(0);
  const tocProjection = await toc.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const prose = document.querySelector<HTMLElement>(
      ".kp-economics-tutorial__prose"
    )!;
    const proseBounds = prose.getBoundingClientRect();
    return {
      position: getComputedStyle(element).position,
      top: bounds.top,
      right: bounds.right,
      center: bounds.top + bounds.height / 2,
      proseLeft: proseBounds.left,
      proseRight: proseBounds.right,
      stageLeft: document.querySelector<HTMLElement>(
        ".kp-economics-tutorial__stage"
      )!.getBoundingClientRect().left,
      stageTop: document.querySelector<HTMLElement>(
        ".kp-economics-tutorial__stage"
      )!.getBoundingClientRect().top,
      stageTransform: getComputedStyle(document.querySelector<HTMLElement>(
        ".kp-economics-tutorial__stage"
      )!).transform,
      proseLineHeight: Number.parseFloat(getComputedStyle(prose).lineHeight),
      proseFontSize: Number.parseFloat(getComputedStyle(prose).fontSize),
      viewportHeight: window.innerHeight,
      bottom: bounds.bottom
    };
  });
  expect(tocProjection.position).toBe("fixed");
  expect(tocProjection.right).toBeLessThanOrEqual(tocProjection.proseLeft - 20);
  expect(tocProjection.stageLeft - tocProjection.proseRight)
    .toBeGreaterThanOrEqual(56);
  expect(tocProjection.top).toBeGreaterThanOrEqual(0);
  expect(tocProjection.bottom).toBeLessThanOrEqual(tocProjection.viewportHeight);
  expect(tocProjection.center).toBeCloseTo(tocProjection.viewportHeight / 2, 1);
  expect(tocProjection.stageTop).toBeGreaterThanOrEqual(8);
  expect(tocProjection.stageTop).toBeLessThanOrEqual(32);
  expect(tocProjection.stageTransform).toBe("none");
  expect(tocProjection.proseLineHeight / tocProjection.proseFontSize)
    .toBeGreaterThanOrEqual(1.74);
  await expect(toc.locator(
    '[data-kp-tutorial-destination-id="supply-movement"]'
  )).toHaveAttribute(
    "href",
    "/tutorials/economics/demand-shift/#kp-block-supply-movement"
  );
  await expect(root.locator("#kp-checkpoint-movement-verified"))
    .toHaveAttribute("data-kp-tutorial-destination-block", "supply-movement");
  await expect(root.locator(".kp-economics-tutorial__prose .katex")).not.toHaveCount(0);
  await expect.poll(() => root.evaluate((element) => {
    const graphStage = element.querySelector<HTMLElement>(
      ".editor-graph-stage"
    );
    const graphLabel = element.querySelector<HTMLElement>(
      '[data-kp-economics-math-label="equilibrium-current"] ' +
      ".editor-graph-stage__economics-math-label"
    );
    const equationStrip = element.querySelector<HTMLElement>(
      ".editor-graph-stage__economics-explanation"
    );
    return {
      graph: graphStage === null
        ? null
        : getComputedStyle(graphStage).backgroundColor,
      label: graphLabel === null
        ? null
        : getComputedStyle(graphLabel).backgroundColor,
      equations: equationStrip === null
        ? null
        : getComputedStyle(equationStrip).backgroundColor
    };
  })).toEqual({
    graph: "rgba(0, 0, 0, 0)",
    label: "rgba(0, 0, 0, 0)",
    equations: "rgb(21, 23, 42)"
  });
  await expect.poll(() => root.locator(
    '[data-kp-economics-math-label="equilibrium-current"] ' +
    ".editor-graph-stage__economics-math-label"
  ).evaluate((element) => getComputedStyle(element).textShadow))
    .toContain("rgb(13, 14, 28)");
  await expect.poll(() => root.locator(".kp-economics-tutorial__math")
    .first()
    .evaluate((element) => ({
      wrapper: getComputedStyle(element).textIndent,
      katex: getComputedStyle(element.querySelector(".katex")!).textIndent,
      mathColor: getComputedStyle(element.querySelector(".katex")!).color,
      diagramMathColor: getComputedStyle(document.querySelector(
        '[data-kp-economics-math-label="equilibrium-current"] .katex'
      )!).color
    })))
    .toEqual({
      wrapper: "0px",
      katex: "0px",
      mathColor: "rgb(166, 169, 183)",
      diagramMathColor: "rgb(166, 169, 183)"
    });
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
  await expect(root.locator("kp-tutorial-scrub-bar")).toHaveCount(2);
  await expect(firstMotionBlock).toHaveAttribute(
    "aria-label",
    "Demand shifts animation step"
  );
  await expect(firstMotionBlock.locator("p")).toHaveCount(1);
  await expect(firstMotionBlock.locator("kp-tutorial-scrub-bar")).toHaveCount(1);
  await expect(secondMotionBlock).toHaveAttribute(
    "aria-label",
    "Supply did not shift animation step"
  );
  await expect(supplyMotionCue).toHaveAttribute("controls-disabled", "false");
  expect(await motionCue.evaluate((element) => ({
    tag: element.localName,
    registered: customElements.get(element.localName) === element.constructor,
    shadow: element.shadowRoot,
    staticBoundaryCount: element.querySelectorAll(
      "[data-kp-tutorial-scrub-static-boundary]"
    ).length
  }))).toEqual({
    tag: "kp-tutorial-scrub-bar",
    registered: true,
    shadow: null,
    staticBoundaryCount: 1
  });
  await expect(motionCue.getByRole("link", {
    name: "Previous semantic checkpoint"
  })).toBeVisible();
  await expect(motionCue.getByRole("link", {
    name: "Next semantic checkpoint"
  })).toBeVisible();
  await expect(root.locator("[data-kp-economics-tutorial-spotlight]"))
    .toHaveCount(0);
  await expect(root.locator("[data-kp-economics-tutorial-attention-bridge]"))
    .toHaveCount(0);
  await expect(root.locator("[data-kp-economics-tutorial-page-veil]"))
    .toHaveCount(0);
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
    .toBe("rgb(21, 23, 42)");
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
      (window.innerHeight * 0.38 - 1)
  }));
  const readingPointer = root.locator(
    "[data-kp-economics-tutorial-reading-band]"
  );
  await expect(readingPointer)
    .toHaveAttribute("data-kp-reading-band-state", "crossing");
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-attention-passage",
    "demand-change"
  );
  const attentionContainment = await root.evaluate((element) => {
    const activePassages = [...element.querySelectorAll<HTMLElement>(
      ".kp-economics-tutorial__passage--active"
    )];
    const pointer = element.querySelector<HTMLElement>(
      "[data-kp-economics-tutorial-reading-band]"
    );
    const passageBounds = activePassages[0]?.getBoundingClientRect();
    const pointerBounds = pointer?.getBoundingClientRect();
    const cursorY = pointerBounds === undefined
      ? Number.NaN
      : pointerBounds.top + pointerBounds.height / 2;
    return {
      activeCount: activePassages.length,
      passageOpacities: [...element.querySelectorAll<HTMLElement>(
        ".kp-economics-tutorial__passage"
      )].map((passage) => getComputedStyle(passage).opacity),
      cursorIsInsideActivePassage: passageBounds !== undefined &&
        cursorY >= passageBounds.top && cursorY <= passageBounds.bottom
    };
  });
  expect(attentionContainment).toEqual({
    activeCount: 1,
    passageOpacities: expect.arrayContaining(["1"]),
    cursorIsInsideActivePassage: true
  });
  expect(new Set(attentionContainment.passageOpacities)).toEqual(
    new Set(["1"])
  );
  const pointerProjection = await readingPointer.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      background: style.backgroundColor,
      clipPath: style.clipPath,
      filter: style.filter,
      opacity: style.opacity,
      pointerEvents: style.pointerEvents,
      zIndex: Number(style.zIndex),
      width: bounds.width,
      height: bounds.height,
      right: bounds.right,
      hitTargetIsPointer: document.elementFromPoint(
        bounds.left + bounds.width / 2,
        bounds.top + bounds.height / 2
      ) === element
    };
  });
  const demandTextBox = await demandChange.locator("p").first().boundingBox();
  expect(demandTextBox).not.toBeNull();
  expect(pointerProjection).toMatchObject({
    background: "rgb(7, 208, 216)",
    clipPath: "polygon(0px 0px, 100% 50%, 0px 100%)",
    opacity: "1",
    pointerEvents: "none",
    hitTargetIsPointer: false
  });
  expect(pointerProjection.filter).toContain("drop-shadow");
  expect(pointerProjection.zIndex).toBeGreaterThan(12);
  expect(pointerProjection.width).toBeGreaterThanOrEqual(16);
  expect(pointerProjection.height).toBeGreaterThanOrEqual(19);
  expect(pointerProjection.right).toBeLessThan(demandTextBox!.x);
  await expect.poll(() => toc.evaluate((element) =>
    element.getBoundingClientRect().top
  )).toBeCloseTo(tocProjection.top, 1);
  await expect.poll(() => toc.evaluate((element) => element.scrollLeft)).toBe(0);
  const tocLinkContainment = await toc.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return Array.from(element.querySelectorAll("a")).map((link) => {
      const linkBounds = link.getBoundingClientRect();
      return {
        label: link.textContent?.trim() ?? "",
        left: linkBounds.left,
        right: linkBounds.right,
        containerLeft: bounds.left,
        containerRight: bounds.right
      };
    });
  });
  for (const link of tocLinkContainment) {
    expect(link.left, link.label).toBeGreaterThanOrEqual(link.containerLeft);
    expect(link.right, link.label).toBeLessThanOrEqual(link.containerRight);
  }
  await expect.poll(() => demandChange.evaluate((element) => ({
    rail: getComputedStyle(element).borderLeftColor,
    pointer: getComputedStyle(document.querySelector(
      "[data-kp-economics-tutorial-reading-band]"
    )!).backgroundColor
  }))).toEqual({
    rail: "rgb(7, 208, 216)",
    pointer: "rgb(7, 208, 216)"
  });
  await expect.poll(() => graph.locator("[data-kp-economics-demand-line]")
    .evaluate((element) => getComputedStyle(element).filter))
    .toBe("none");
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
    heading: element.querySelector(".heading") !== null,
    status: element.querySelector("[data-status]") !== null
  }))).toEqual({ heading: false, status: false });
  await expect(motionCue.getByRole("button", { name: "Play" })).toBeVisible();
  // The split layout uses the scrub boundary itself as its scroll anchor.
  await motionCue.evaluate((element) => window.scrollTo({
    top: window.scrollY + element.getBoundingClientRect().top -
      window.innerHeight * 0.38
  }));
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-motion-owner",
    "scroll"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scroll-timeline",
    "seeking"
  );
  await expect.poll(() => motionCue.evaluate((element) => Math.abs(
    element.getBoundingClientRect().top - window.innerHeight * 0.38
  ))).toBeLessThanOrEqual(1);
  await expect.poll(() => motionCue.evaluate((element) => Math.abs(
    Number(element.getAttribute("data-kp-tutorial-scrub-anchor-top")) -
      Number(element.getAttribute("data-kp-tutorial-scrub-reading-band"))
  ))).toBeLessThanOrEqual(1);
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scroll-active-block",
    "demand-shift"
  );
  await expect.poll(async () => Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  )).toBeGreaterThan(0.55);
  expect(Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  )).toBeLessThan(0.85);
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
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-progress",
    "1"
  );
  await expect(player).toHaveAttribute("data-kp-economics-graph-progress", "1");
  await expect(beforeMotion).toHaveText(beforeMotionText ?? "");
  await expect(root.locator(".kp-economics-tutorial__stage-header"))
    .toHaveCount(0);
  const settledDividerBox = await motionCue.boundingBox();
  expect(settledDividerBox).not.toBeNull();
  expect(settledDividerBox!.width).toBeCloseTo(dividerBox!.width, 1);
  expect(settledDividerBox!.height).toBeCloseTo(dividerBox!.height, 1);

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
      window.innerHeight * 0.38
  }));
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scroll-timeline",
    "seeking"
  );
  await expect.poll(async () => Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  )).toBeCloseTo(0.72, 2);

  await supplyMotionCue.evaluate((element) => window.scrollTo({
    top: window.scrollY + element.getBoundingClientRect().top -
      window.innerHeight * 0.35
  }));
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scroll-active-block",
    "supply-movement"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-demand-progress",
    "1.000"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-supply-movement-progress",
    "0.580"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scene-presentation",
    "supply-trace"
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-progress",
    "0.58"
  );
  await expect(player).toHaveAttribute("data-kp-economics-graph-progress", "1");
  await expect(motionCue).toHaveAttribute("progress", "1");
  await expect(supplyMotionCue).toHaveAttribute("progress", "0.58");

  await supplyMotionCue.evaluate((element) => window.scrollTo({
    top: window.scrollY + element.getBoundingClientRect().top -
      window.innerHeight * 0.72
  }));
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-supply-movement-progress",
    "0.000"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-demand-progress",
    "1.000"
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-progress",
    "1"
  );
  await expect(player).toHaveAttribute("data-kp-economics-graph-progress", "1");

  await motionCue.evaluate((element) => window.scrollTo({
    top: window.scrollY + element.getBoundingClientRect().top -
      window.innerHeight * 0.38
  }));
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scroll-active-block",
    "demand-shift"
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
  await expect(beforeMotion).toHaveText(beforeMotionText ?? "");
  await page.screenshot({
    path: `${evidenceDirectory}/wide-motion-divider.png`,
    fullPage: false
  });
  await motionCue.getByRole("link", {
    name: "Next semantic checkpoint"
  }).click();
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-checkpoint",
    "handoff"
  );
  await motionCue.getByRole("link", {
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
  await expect(root.locator("[data-kp-economics-tutorial-attention-bridge]"))
    .toHaveCount(0);
  await expect.poll(() => graph.locator("[data-kp-economics-supply-line]")
    .evaluate((element) => getComputedStyle(element).filter))
    .toBe("none");
  await expect.poll(() => graph.locator("[data-kp-economics-demand-line]")
    .evaluate((element) => getComputedStyle(element).filter))
    .toBe("none");
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

test("manual demand scrub rebases into scroll without a jump", async ({
  page
}) => {
  await page.goto(route);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const player = root.locator("[data-kp-editor-animation-player]");
  const motionCue = root.locator(
    '[data-kp-tutorial-motion-block="demand-shift"] kp-tutorial-scrub-bar'
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );

  await motionCue.evaluate((element) => window.scrollTo({
    top: window.scrollY + element.getBoundingClientRect().top -
      window.innerHeight * 0.38
  }));
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-motion-owner",
    "scroll"
  );
  await expect.poll(async () => Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  )).toBeGreaterThan(0.55);
  expect(Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  )).toBeLessThan(0.8);
  const scrubber = motionCue.getByRole("slider", {
    name: "Scrub animation progress"
  });
  await scrubber.fill("0.35");
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-motion-owner",
    "manual"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scroll-timeline",
    "manual"
  );
  const manualProgress = Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  );

  await page.mouse.wheel(0, 1);
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-motion-owner",
    "scroll"
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-status",
    "paused"
  );
  await expect.poll(async () => Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  )).toBeCloseTo(manualProgress, 1);
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scroll-timeline",
    "seeking"
  );
  await expect(motionCue).toHaveAttribute(
    "data-kp-tutorial-scrub-manual",
    "false"
  );
  await page.evaluate(() => window.scrollBy(0, 120));
  await expect.poll(async () => Number(
    await player.getAttribute("data-kp-editor-animation-progress")
  )).toBeGreaterThan(manualProgress);
});

test("manual supply playback preserves the settled demand handoff", async ({
  page
}) => {
  await page.goto(route);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const player = root.locator("[data-kp-editor-animation-player]");
  const graph = player.locator("[data-kp-editor-graph-svg]");
  const supplyMotionCue = root.locator(
    '[data-kp-tutorial-motion-block="supply-movement"] kp-tutorial-scrub-bar'
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await supplyMotionCue.evaluate((element) => window.scrollTo({
    top: window.scrollY + element.getBoundingClientRect().top -
      window.innerHeight * 0.3
  }));
  const movement = graph.locator("[data-kp-economics-supply-movement]");
  const trace = movement.locator("[data-kp-economics-supply-movement-trace]");
  await expect(movement).toHaveAttribute(
    "data-kp-economics-supply-equation",
    "P=2+Q"
  );
  await expect(movement).toHaveAttribute(
    "data-kp-economics-movement-from-quantity",
    "6"
  );
  await expect(movement).toHaveAttribute(
    "data-kp-economics-movement-from-price",
    "8"
  );
  await expect(movement).toHaveAttribute(
    "data-kp-economics-movement-to-quantity",
    "8"
  );
  await expect(movement).toHaveAttribute(
    "data-kp-economics-movement-to-price",
    "10"
  );
  await expect.poll(() => trace.evaluate((element) => ({
    opacity: Number(getComputedStyle(element).opacity),
    traceProgress: Number(getComputedStyle(element.closest(
      ".kp-economics-tutorial__player-host"
    )!).getPropertyValue("--kp-tutorial-supply-trace"))
  }))).toEqual({
    opacity: expect.closeTo(1, 2),
    traceProgress: expect.closeTo(1, 2)
  });
  await page.screenshot({
    path: `${evidenceDirectory}/wide-supply-movement-trace.png`,
    fullPage: false
  });
  await page.keyboard.press("Alt+ArrowRight");
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-supply-movement-progress",
    "1.000"
  );
  await expect.poll(() => graph.locator(
    '[data-kp-economics-supply-movement-target="settled"]'
  ).evaluate((element) => Number(getComputedStyle(element).opacity)))
    .toBeCloseTo(1, 2);
  await page.screenshot({
    path: `${evidenceDirectory}/wide-supply-movement-verified.png`,
    fullPage: false
  });
  await page.keyboard.press("Alt+ArrowLeft");
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-supply-movement-progress",
    "0.580"
  );
  await supplyMotionCue.getByRole("slider", {
    name: "Scrub animation progress"
  }).fill("0.3");
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-supply-movement-progress",
    "0.300"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-motion-owner",
    "manual"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-manual-block",
    "supply-movement"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-demand-progress",
    "1.000"
  );
  await supplyMotionCue.getByRole("button", { name: "Play" }).click();
  await expect.poll(async () => Number(
    await root.getAttribute(
      "data-kp-economics-tutorial-supply-movement-progress"
    )
  )).toBeGreaterThan(0.3);
  const manualProgress = Number(await root.getAttribute(
    "data-kp-economics-tutorial-supply-movement-progress"
  ));
  await page.evaluate(() => window.scrollBy(0, 1));
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-motion-owner",
    "scroll"
  );
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-supply-movement-progress"
  ))).toBeCloseTo(manualProgress, 1);
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-demand-progress",
    "1.000"
  );
  await expect.poll(async () => Number(await player.getAttribute(
    "data-kp-editor-animation-progress"
  ))).toBeCloseTo(manualProgress, 1);
  await expect(player).toHaveAttribute("data-kp-economics-graph-progress", "1");
  await expect(supplyMotionCue).toHaveAttribute(
    "data-kp-tutorial-scrub-manual",
    "false"
  );
  await expect(supplyMotionCue).toHaveAttribute(
    "playback-status",
    "paused"
  );
});

test("verification surface enters and exits without changing outer stage geometry", async ({
  page
}) => {
  await page.goto(route);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const host = root.locator("[data-kp-economics-stage='economics-stage']");
  const graphSlot = host.locator(
    ".editor-animation-player__surface--graph"
  );
  const aperture = host.locator(
    "[data-kp-economics-stage-aperture='verification-aperture']"
  );
  const verificationSurface = aperture.locator(
    "[data-kp-economics-stage-surface='equilibrium-verification']"
  );
  const supplyMotionCue = root.locator(
    '[data-kp-tutorial-motion-block="supply-movement"] kp-tutorial-scrub-bar'
  );
  const supplyScrubber = supplyMotionCue.getByRole("slider", {
    name: "Scrub animation progress"
  });
  await supplyMotionCue.evaluate((element) => window.scrollTo({
    top: window.scrollY + element.getBoundingClientRect().top -
      window.innerHeight * 0.38
  }));
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scroll-active-block",
    "supply-movement"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-stage-composition-phase",
    "merged"
  );
  const outerBefore = await host.boundingBox();
  expect(outerBefore).not.toBeNull();

  await supplyScrubber.fill("0.71");
  await expect(root).toHaveAttribute(
    "data-kp-economics-stage-composition-phase",
    "composing"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-stage-composition-progress",
    "0.500"
  );
  await expect(aperture).toHaveAttribute(
    "data-kp-economics-stage-aperture-openness",
    "0.500"
  );
  await expect(verificationSurface).toHaveAttribute(
    "data-kp-economics-stage-surface-lifecycle",
    "transiting"
  );
  await expect.poll(() => aperture.evaluate((element) => ({
    clipPath: getComputedStyle(element).clipPath,
    travel: getComputedStyle(
      element.firstElementChild as HTMLElement
    ).transform
  }))).toEqual({
    clipPath: "inset(0px 0px 0px 50%)",
    travel: expect.not.stringMatching(/^none$/)
  });
  const midpointGeometry = await host.evaluate((element) => {
    const stage = element.getBoundingClientRect();
    const graph = element.querySelector<HTMLElement>(
      ".editor-animation-player__surface--graph"
    )!.getBoundingClientRect();
    const verification = element.querySelector<HTMLElement>(
      "[data-kp-economics-stage-aperture]"
    )!.getBoundingClientRect();
    const visibleVerificationLeft = verification.left + verification.width / 2;
    const envelopeLeft = Math.min(graph.left, visibleVerificationLeft);
    const envelopeRight = Math.max(graph.right, verification.right);
    return {
      stageCenter: stage.left + stage.width / 2,
      compositionCenter: (envelopeLeft + envelopeRight) / 2
    };
  });
  expect(Math.abs(
    midpointGeometry.compositionCenter - midpointGeometry.stageCenter
  )).toBeLessThan(3);
  await mkdir(evidenceDirectory, { recursive: true });
  await page.screenshot({
    path: `${evidenceDirectory}/wide-composition-midpoint.png`,
    fullPage: false
  });

  await supplyScrubber.fill("0.84");
  await expect(root).toHaveAttribute(
    "data-kp-economics-stage-composition-phase",
    "split"
  );
  await expect(verificationSurface).toHaveAttribute(
    "data-kp-economics-stage-surface-lifecycle",
    "settled"
  );
  const splitGeometry = await host.evaluate((element) => {
    const hostRect = element.getBoundingClientRect();
    const graph = element.querySelector<HTMLElement>(
      ".editor-animation-player__surface--graph"
    )!.getBoundingClientRect();
    const apertureRect = element.querySelector<HTMLElement>(
      "[data-kp-economics-stage-aperture]"
    )!.getBoundingClientRect();
    return {
      graph: {
        inline: (graph.left - hostRect.left) / hostRect.width,
        block: (graph.top - hostRect.top) / hostRect.height,
        inlineSize: graph.width / hostRect.width,
        blockSize: graph.height / hostRect.height
      },
      aperture: {
        inline: (apertureRect.left - hostRect.left) / hostRect.width,
        block: (apertureRect.top - hostRect.top) / hostRect.height,
        inlineSize: apertureRect.width / hostRect.width,
        blockSize: apertureRect.height / hostRect.height
      }
    };
  });
  expect(splitGeometry.graph.inline).toBeCloseTo(0.02, 2);
  expect(splitGeometry.graph.block).toBeCloseTo(0.03, 2);
  expect(splitGeometry.graph.inlineSize).toBeCloseTo(0.64, 2);
  expect(splitGeometry.graph.blockSize).toBeCloseTo(0.94, 2);
  expect(splitGeometry.aperture.inline).toBeCloseTo(0.7, 2);
  expect(splitGeometry.aperture.block).toBeCloseTo(0.14, 2);
  expect(splitGeometry.aperture.inlineSize).toBeCloseTo(0.28, 2);
  expect(splitGeometry.aperture.blockSize).toBeCloseTo(0.72, 2);

  await supplyScrubber.fill("0.93");
  await expect(root).toHaveAttribute(
    "data-kp-economics-verification-reveal",
    "changes"
  );
  await expect(host.locator("[data-kp-economics-verification-group]"))
    .toHaveCount(3);
  await expect(host.locator("[data-kp-math-renderer='static-katex-html'] .katex"))
    .toHaveCount(5);
  await expect(host.locator(
    '[data-kp-economics-verification-group="changes"]'
  )).toHaveCSS("opacity", "0.5");
  await expect.poll(() => host.locator(
    '[data-kp-economics-supply-movement-target="settled"]'
  ).evaluate((element) => Number(getComputedStyle(element).opacity)))
    .toBeCloseTo(1, 2);

  await supplyScrubber.fill("0.58");
  await expect(root).toHaveAttribute(
    "data-kp-economics-stage-composition-phase",
    "merged"
  );
  await expect(verificationSurface).toHaveAttribute(
    "data-kp-economics-stage-surface-lifecycle",
    "outside"
  );
  const outerAfter = await host.boundingBox();
  const graphAfter = await graphSlot.boundingBox();
  expect(outerAfter).not.toBeNull();
  expect(graphAfter).not.toBeNull();
  expect(outerAfter!.width).toBeCloseTo(outerBefore!.width, 1);
  expect(outerAfter!.height).toBeCloseTo(outerBefore!.height, 1);
  expect(graphAfter!.width).toBeCloseTo(outerBefore!.width, 1);
  expect(graphAfter!.height).toBeCloseTo(outerBefore!.height, 1);
});

test("tutorial TOC enhances light DOM and emits cancelable navigation intent", async ({
  page
}) => {
  await page.goto(route);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const toc = root.locator("kp-tutorial-toc");
  await expect(toc).toHaveAttribute(
    "data-kp-tutorial-toc-enhancement",
    "ready"
  );
  expect(await toc.evaluate((element) => ({
    registered: customElements.get(element.localName) === element.constructor,
    shadow: element.shadowRoot,
    navCount: element.querySelectorAll("nav").length,
    linkCount: element.querySelectorAll("a").length
  }))).toEqual({
    registered: true,
    shadow: null,
    navCount: 1,
    linkCount: 6
  });
  await expect(toc.locator(
    '[data-kp-tutorial-destination-id="equilibrium"]'
  )).toHaveAttribute("aria-current", "location");
  await expect(toc.locator("[aria-current]")).toHaveCount(1);

  await page.evaluate(() => {
    const target = document.querySelector("kp-tutorial-toc")!;
    target.addEventListener("kp:tutorial-toc-navigate", (event) => {
      event.preventDefault();
      const customEvent = event as CustomEvent;
      (window as unknown as { kpTocIntent: unknown }).kpTocIntent = {
        detail: customEvent.detail,
        bubbles: customEvent.bubbles,
        cancelable: customEvent.cancelable,
        composed: customEvent.composed
      };
    }, { once: true });
  });
  const urlBefore = page.url();
  await toc.locator(
    '[data-kp-tutorial-destination-id="supply-movement"]'
  ).click();
  expect(page.url()).toBe(urlBefore);
  expect(await page.evaluate(() =>
    (window as unknown as { kpTocIntent: unknown }).kpTocIntent
  )).toEqual({
    detail: {
      kind: "block",
      id: "supply-movement",
      href: `${new URL(route, page.url()).origin}${route}#kp-block-supply-movement`
    },
    bubbles: true,
    cancelable: true,
    composed: true
  });

  const supplyMotionCue = root.locator(
    '[data-kp-tutorial-motion-block="supply-movement"] kp-tutorial-scrub-bar'
  );
  await supplyMotionCue.evaluate((element) => window.scrollTo({
    top: window.scrollY + element.getBoundingClientRect().top -
      window.innerHeight * 0.38
  }));
  await expect(toc.locator(
    '[data-kp-tutorial-destination-id="supply-movement"]'
  )).toHaveAttribute("aria-current", "location");
  await expect(toc.locator("[aria-current]")).toHaveCount(1);
});

test("floating tutorial TOC reserves a non-overlapping narrow-desktop gutter", async ({
  page
}) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto(route);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const geometry = await root.evaluate((element) => {
    const toc = element.querySelector<HTMLElement>("kp-tutorial-toc")!;
    const prose = element.querySelector<HTMLElement>(
      ".kp-economics-tutorial__prose"
    )!;
    const stage = element.querySelector<HTMLElement>(
      ".kp-economics-tutorial__stage"
    )!;
    return {
      tocPosition: getComputedStyle(toc).position,
      tocRight: toc.getBoundingClientRect().right,
      proseLeft: prose.getBoundingClientRect().left,
      proseRight: prose.getBoundingClientRect().right,
      stageLeft: stage.getBoundingClientRect().left,
      stageRight: stage.getBoundingClientRect().right,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth
    };
  });
  expect(geometry.tocPosition).toBe("fixed");
  expect(geometry.tocRight).toBeLessThanOrEqual(geometry.proseLeft - 16);
  expect(geometry.stageLeft - geometry.proseRight).toBeGreaterThanOrEqual(24);
  expect(geometry.stageRight).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth);
});

test("direct semantic links restore complete cumulative state without replay", async ({
  page
}) => {
  await page.goto(`${route}?direct=handoff#kp-checkpoint-shift-handoff`);
  let root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  let player = root.locator("[data-kp-editor-animation-player]");
  let toc = root.locator("kp-tutorial-toc");
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-initial-destination",
    "checkpoint:shift-handoff"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-demand-progress",
    "0.720"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-supply-movement-progress",
    "0.000"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scene-market",
    "shifting"
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-progress",
    "0.72"
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-status",
    "idle"
  );
  await expect.poll(() => root.locator("[data-kp-economics-demand-line]")
    .evaluate((element) => ({
      color: getComputedStyle(element).stroke,
      opacity: getComputedStyle(element).opacity,
      width: getComputedStyle(element).strokeWidth
  }))).toEqual({
      color: "rgb(255, 138, 132)",
      opacity: "1",
      width: "1px"
    });
  await expect(toc.locator(
    '[data-kp-tutorial-destination-id="demand-shift"]'
  )).toHaveAttribute("aria-current", "location");
  await page.waitForTimeout(240);
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-progress",
    "0.72"
  );

  await page.goto(`${route}?direct=verified#kp-checkpoint-movement-verified`);
  root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  player = root.locator("[data-kp-editor-animation-player]");
  toc = root.locator("kp-tutorial-toc");
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-initial-destination",
    "checkpoint:movement-verified"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-demand-progress",
    "1.000"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-supply-movement-progress",
    "1.000"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scene-presentation",
    "comparison-verified"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-stage-composition-phase",
    "split"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-verification-reveal",
    "verified"
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-progress",
    "1"
  );
  await expect(toc.locator(
    '[data-kp-tutorial-destination-id="supply-movement"]'
  )).toHaveAttribute("aria-current", "location");
  await mkdir(evidenceDirectory, { recursive: true });
  await page.screenshot({
    path: `${evidenceDirectory}/deep-link-movement-verified.png`,
    fullPage: false
  });

  await page.goto(`${route}?direct=scope#kp-section-model-scope`);
  root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  toc = root.locator("kp-tutorial-toc");
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-initial-destination",
    "section:model-scope"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-checkpoint",
    "scope"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-demand-progress",
    "1.000"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-supply-movement-progress",
    "1.000"
  );
  await expect(toc.locator(
    '[data-kp-tutorial-destination-id="model-scope"]'
  )).toHaveAttribute("aria-current", "location");
  await expect(root.locator("#kp-section-model-scope")).toBeInViewport();
});

test("TOC transactions and history restore exact states without intermediate replay", async ({
  page
}) => {
  await page.goto(`${route}?keep=1`);
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const toc = root.locator("kp-tutorial-toc");
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scroll-coordinator",
    "connected"
  );
  await page.evaluate(() => {
    (window as unknown as { kpTutorialToken: string }).kpTutorialToken =
      "same-document";
    const root = document.querySelector<HTMLElement>(
      "[data-kp-economics-demand-shift-tutorial]"
    )!;
    const samples: string[] = [];
    const observer = new MutationObserver(() => samples.push(
      `${root.dataset["kpEconomicsTutorialDemandProgress"]}|` +
      `${root.dataset["kpEconomicsTutorialSupplyMovementProgress"]}`
    ));
    observer.observe(root, {
      attributes: true,
      attributeFilter: [
        "data-kp-economics-tutorial-demand-progress",
        "data-kp-economics-tutorial-supply-movement-progress"
      ]
    });
    (window as unknown as { kpNavigationSamples: string[] })
      .kpNavigationSamples = samples;
  });

  await toc.locator(
    '[data-kp-tutorial-destination-id="supply-movement"]'
  ).click();
  await expect(page).toHaveURL(
    `${route}?keep=1#kp-block-supply-movement`
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-initial-destination",
    "block:supply-movement"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-demand-progress",
    "1.000"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-supply-movement-progress",
    "0.000"
  );
  expect(await page.evaluate(() =>
    (window as unknown as { kpNavigationSamples: string[] })
      .kpNavigationSamples
  )).not.toContain("1.000|0.580");

  await toc.locator(
    '[data-kp-tutorial-destination-id="demand-shift"]'
  ).click();
  await expect(page).toHaveURL(`${route}?keep=1#kp-block-demand-shift`);
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-demand-progress",
    "0.000"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-supply-movement-progress",
    "0.000"
  );
  const beforeScroll = Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ));
  await page.evaluate(() => window.scrollBy(0, 1));
  await expect.poll(async () => Number(await root.getAttribute(
    "data-kp-economics-tutorial-demand-progress"
  ))).toBeCloseTo(beforeScroll, 2);

  await page.goBack();
  await expect(page).toHaveURL(
    `${route}?keep=1#kp-block-supply-movement`
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-supply-movement-progress",
    "0.000"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-stage-composition-phase",
    "merged"
  );

  await page.goForward();
  await expect(page).toHaveURL(`${route}?keep=1#kp-block-demand-shift`);
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-demand-progress",
    "0.000"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-supply-movement-progress",
    "0.000"
  );
  expect(await page.evaluate(() =>
    (window as unknown as { kpTutorialToken: string }).kpTutorialToken
  )).toBe("same-document");
});

test("reduced-motion readers retain the text-free divider without automatic seek", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route);

  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const player = root.locator("[data-kp-editor-animation-player]");
  const motionCue = root.locator(
    '[data-kp-tutorial-motion-block="demand-shift"] kp-tutorial-scrub-bar'
  );
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
  await expect.poll(() => root.locator("[data-kp-economics-demand-line]")
    .evaluate((element) => getComputedStyle(element).transitionDuration))
    .toBe("0s");
  await expect.poll(() => root.locator(".editor-graph-stage__economics-grid-line")
    .first().evaluate((element) => getComputedStyle(element).transitionDuration))
    .toBe("0s");
  expect(await motionCue.evaluate((element) =>
    element.querySelector(".heading")
  )).toBeNull();
  await motionCue.getByRole("link", {
    name: "Next semantic checkpoint"
  }).click();
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-demand-progress",
    "0.720"
  );
  await motionCue.getByRole("link", {
    name: "Previous semantic checkpoint"
  }).click();
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-demand-progress",
    "0.000"
  );
});

test("static publication controls remain useful with JavaScript disabled", async ({
  browser
}) => {
  const markdown = await readFile(
    "content/lessons/economics-demand-shift.md",
    "utf8"
  );
  const publication = compileKpEconomicsDemandShiftPublication(markdown);
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 820, height: 700 }
  });
  const page = await context.newPage();
  try {
    await page.setContent(`<!doctype html>
      <html>
        <head>
          <link rel="stylesheet" href="http://127.0.0.1:4173/src/tutorial/kp-tutorial-scrub-bar.css">
          <link rel="stylesheet" href="http://127.0.0.1:4173/src/tutorial/economics-demand-shift/economics-demand-shift-tutorial.css">
          <style>
            body { width: 780px; padding: 20px; }
            .kp-economics-tutorial__layout { display: block; width: 740px; padding: 0; }
          </style>
        </head>
        <body>
          <main class="kp-economics-tutorial">
            <article class="kp-economics-tutorial__prose">
              ${publication.tocHtml}
              <div class="kp-economics-tutorial__passage kp-economics-tutorial__motion-block">
                ${publication.motionScrubBarHtml["demand-shift"]}
              </div>
              <span id="kp-checkpoint-shift-ready">Before the shift</span>
              <span id="kp-checkpoint-shift-handoff">Equilibrium handoff</span>
              <span id="kp-checkpoint-shift-settled">New equilibrium</span>
            </article>
          </main>
        </body>
      </html>`);
    const toc = page.locator("kp-tutorial-toc");
    const scrub = page.locator("kp-tutorial-scrub-bar");
    await expect(toc).toHaveAttribute(
      "data-kp-tutorial-toc-enhancement",
      "pending"
    );
    await expect(scrub).toHaveAttribute(
      "data-kp-tutorial-scrub-enhancement",
      "pending"
    );
    await expect(toc.getByRole("navigation", { name: "In this lesson" }))
      .toBeVisible();
    await expect(scrub.getByRole("button", { name: "Play" })).toBeDisabled();
    await expect(scrub.getByRole("slider", {
      name: "Scrub animation progress"
    })).toBeDisabled();
    await expect(scrub.getByRole("link", {
      name: "Next semantic checkpoint"
    })).toHaveAttribute(
      "href",
      "/tutorials/economics/demand-shift/#kp-checkpoint-shift-handoff"
    );
    const geometry = await scrub.boundingBox();
    expect(geometry).not.toBeNull();
    expect(geometry!.width).toBeGreaterThan(600);
    expect(geometry!.height).toBeGreaterThan(30);
    await mkdir(evidenceDirectory, { recursive: true });
    await page.screenshot({
      path: `${evidenceDirectory}/no-js-controls.png`,
      fullPage: false
    });
  } finally {
    await context.close();
  }
});

test("static scrubber keeps native links and geometry when it upgrades", async ({
  page
}) => {
  await page.goto(route);
  const html = renderKpTutorialScrubBar({
    blockId: "fixture",
    checkpoints: [
      { id: "ready", label: "Ready", progress: 0, href: "#ready" },
      { id: "move", label: "Move", progress: 0.5, href: "#move" },
      { id: "done", label: "Done", progress: 1, href: "#done" }
    ]
  });
  await page.locator("body").evaluate((body, staticHtml) => {
    const frame = document.createElement("iframe");
    frame.dataset["kpScrubFixture"] = "true";
    frame.srcdoc = `<link rel="stylesheet" href="/src/tutorial/kp-tutorial-scrub-bar.css"><main style="width:640px">${staticHtml}</main>`;
    body.append(frame);
  }, html);
  const fixture = page.locator('iframe[data-kp-scrub-fixture="true"]');
  await expect(fixture).toBeAttached();
  const frame = page.frames().find((candidate) =>
    candidate !== page.mainFrame() && candidate.url() === "about:srcdoc"
  )!;
  await frame.waitForFunction(() => document.styleSheets.length > 0);
  const before = await frame.evaluate(() => {
    const host = document.querySelector("kp-tutorial-scrub-bar")!;
    const boundary = host.querySelector(
      "[data-kp-tutorial-scrub-static-boundary]"
    )!;
    const input = host.querySelector("input")!;
    (window as unknown as { kpScrubNodes: readonly Element[] }).kpScrubNodes = [
      boundary,
      input
    ];
    const rect = host.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      shadow: host.shadowRoot,
      nextHref: host.querySelector<HTMLAnchorElement>(
        '[data-action="next"]'
      )!.getAttribute("href"),
      toggleDisabled: host.querySelector<HTMLButtonElement>(
        '[data-action="toggle"]'
      )!.disabled
    };
  });
  expect(before).toEqual({
    width: 640,
    height: expect.any(Number),
    shadow: null,
    nextHref: "#move",
    toggleDisabled: true
  });
  expect(before.height).toBeGreaterThan(30);

  const after = await frame.evaluate(async () => {
    const moduleUrl = "/src/tutorial/kp-tutorial-scrub-bar.ts";
    const module = await import(/* @vite-ignore */ moduleUrl);
    module.defineKpTutorialScrubBar();
    await customElements.whenDefined("kp-tutorial-scrub-bar");
    const host = document.querySelector("kp-tutorial-scrub-bar")!;
    const stored = (window as unknown as {
      kpScrubNodes: readonly Element[];
    }).kpScrubNodes;
    const rect = host.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      sameBoundary: stored[0] === host.querySelector(
        "[data-kp-tutorial-scrub-static-boundary]"
      ),
      sameInput: stored[1] === host.querySelector("input"),
      enhancement: host.getAttribute("data-kp-tutorial-scrub-enhancement"),
      shadow: host.shadowRoot
    };
  });
  expect(after).toEqual({
    width: before.width,
    height: before.height,
    sameBoundary: true,
    sameInput: true,
    enhancement: "ready",
    shadow: null
  });
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
    .toHaveCount(0);
  await expect(root.locator("[data-kp-economics-tutorial-page-veil]"))
    .toHaveCount(0);
  await expect(root.locator("[data-kp-economics-tutorial-reading-band]"))
    .toBeHidden();
  await expect.poll(() => root.locator(".kp-economics-tutorial__prose")
    .evaluate((element) => {
      const style = getComputedStyle(element);
      return Number.parseFloat(style.lineHeight) /
        Number.parseFloat(style.fontSize);
    })).toBeGreaterThanOrEqual(1.71);
  await expect.poll(() => root.evaluate((element) => {
    const graphStage = element.querySelector<HTMLElement>(
      ".editor-graph-stage"
    );
    const graphLabel = element.querySelector<HTMLElement>(
      '[data-kp-economics-math-label="equilibrium-current"] ' +
      ".editor-graph-stage__economics-math-label"
    );
    return [graphStage, graphLabel].map((node) =>
      node === null ? null : getComputedStyle(node).backgroundColor
    );
  })).toEqual(["rgb(21, 23, 42)", "rgb(21, 23, 42)"]);
  await expect.poll(() => stageCard.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      borderBottom: style.borderBottomWidth,
      background: style.backgroundColor,
      shadow: style.boxShadow
    };
  })).toEqual({
    borderBottom: "1px",
    background: "rgb(21, 23, 42)",
    shadow: "rgba(0, 0, 0, 0.42) 0px 10px 32px 0px"
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

  await page.goto(`${route}#kp-checkpoint-movement-verified`);
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-demand-progress",
    "1.000"
  );
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-supply-movement-progress",
    "1.000"
  );
  await expect(root.locator("[data-kp-economics-stage-aperture]"))
    .toBeHidden();
  const graphSurface = root.locator(
    ".editor-animation-player__surface--graph"
  );
  const [phoneStageBox, phoneGraphBox] = await Promise.all([
    root.locator("[data-kp-economics-stage='economics-stage']").boundingBox(),
    graphSurface.boundingBox()
  ]);
  expect(phoneStageBox).not.toBeNull();
  expect(phoneGraphBox).not.toBeNull();
  expect(phoneGraphBox!.width).toBeCloseTo(phoneStageBox!.width, 0);
  expect(phoneGraphBox!.height).toBeCloseTo(phoneStageBox!.height, 0);

  await mkdir(evidenceDirectory, { recursive: true });
  await page.screenshot({
    path: `${evidenceDirectory}/phone.png`,
    fullPage: false
  });
});
