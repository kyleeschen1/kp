import { expect, test, type Page } from "@playwright/test";

const path = "/experiments/kinetic-figure/supply-tax/";

test("one route hosts graph, equation, 3D, and code cards through the same shell", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(path);

  const decks = page.locator("[data-kp-focus-deck]");
  const economics = page.locator("[data-kp-supply-tax-focus-deck]");
  const equation = page.locator("[data-kp-log-exponent-focus-card]");
  const surface = page.locator("[data-kp-surface-contour-deck]");
  const code = page.locator("[data-kp-typescript-focus-card]");
  await expect(decks).toHaveCount(4);
  await expect(economics).toHaveAttribute("data-kp-focus-deck-active-beat",
    "baseline-market");
  await expect(equation).toHaveAttribute("data-kp-focus-deck-active-beat",
    "locate-the-unknown");
  await expect(surface).toHaveAttribute("data-kp-focus-deck-active-beat",
    "read-the-surface");
  await expect(code).toHaveAttribute("data-kp-focus-deck-active-beat",
    "orient");

  const caption = economics.locator("[data-kp-supply-tax-stage-caption]");
  const captionBox = await caption.boundingBox();
  expect(captionBox).not.toBeNull();
  expect(captionBox!.width).toBeLessThanOrEqual(1);
  expect(captionBox!.height).toBeLessThanOrEqual(1);
  await expect(caption).toHaveCSS("position", "absolute");

  for (const deck of [economics, equation, surface, code]) {
    await expect(deck.locator("[data-kp-focus-deck-viewport]")).toHaveCount(1);
    await expect(deck.locator("[data-kp-focus-deck-scrubber]")).toHaveCount(1);
    await expect(deck.locator("[data-kp-focus-deck-previous]")).toHaveCount(1);
    await expect(deck.locator("[data-kp-focus-deck-next]")).toHaveCount(1);
  }

  const player = equation.locator("[data-kp-editor-animation-player]");
  const stage = player.locator("[data-kp-log-exponent-stage]");
  await expect(player).toHaveAttribute("data-kp-editor-animation-load-status",
    "ready");
  await expect(stage).toHaveAttribute("data-kp-log-exponent-stage", "ready");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-surface-readiness", "ready");
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-animation-status", "ready");
  await expect(player.locator(
    '[data-kp-log-exponent-endpoint-index="0"]'
  )).toHaveAttribute("aria-hidden", "false");
  await expect(code.locator("[data-kp-typescript-refactor-stage]"))
    .toHaveAttribute("data-kp-typescript-active-projection",
      "projection.typescript.before");
  expect(errors).toEqual([]);
});

test("semantic navigation changes only the card that owns the URL", async ({
  page
}) => {
  await page.goto(path);
  const economics = page.locator("[data-kp-supply-tax-focus-deck]");
  const equation = page.locator("[data-kp-log-exponent-focus-card]");
  const surface = page.locator("[data-kp-surface-contour-deck]");
  const code = page.locator("[data-kp-typescript-focus-card]");
  await expect(equation.locator("[data-kp-log-exponent-stage]"))
    .toHaveAttribute("data-kp-log-exponent-stage", "ready");

  await equation.locator("[data-kp-focus-deck-scrubber]").evaluate(
    (element) => {
      const input = element as HTMLInputElement;
      input.value = "2";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  );
  await expect(equation).toHaveAttribute(
    "data-kp-focus-deck-active-beat",
    "apply-logarithms"
  );
  await expect(code).toHaveAttribute(
    "data-kp-focus-deck-active-beat",
    "orient"
  );

  await surface.locator("[data-kp-focus-deck-next]").click();
  await expect(surface).toHaveAttribute(
    "data-kp-surface-contour-transition",
    "settled",
    { timeout: 4_000 }
  );
  await expect(surface).toHaveAttribute(
    "data-kp-focus-deck-active-beat",
    "choose-a-height"
  );
  await expect(equation).toHaveAttribute(
    "data-kp-focus-deck-active-beat",
    "apply-logarithms"
  );
  await expect(economics).toHaveAttribute(
    "data-kp-focus-deck-active-beat",
    "baseline-market"
  );

  await economics.locator("[data-kp-focus-deck-next]").click();
  await expect(economics).toHaveAttribute(
    "data-kp-focus-deck-active-beat",
    "tax-input"
  );
  await expect(surface).toHaveAttribute(
    "data-kp-focus-deck-active-beat",
    "choose-a-height"
  );
  await expect(equation).toHaveAttribute(
    "data-kp-focus-deck-active-beat",
    "apply-logarithms"
  );
  await expect(code).toHaveAttribute(
    "data-kp-focus-deck-active-beat",
    "orient"
  );
});

test("TypeScript card interrupts an active edit and advances exactly one beat", async ({
  page
}) => {
  await page.goto(path);
  const code = page.locator("[data-kp-typescript-focus-card]");
  const stage = code.locator("[data-kp-typescript-refactor-stage]");
  const next = code.locator("[data-kp-focus-deck-next]");
  const cursor = code.locator("[data-kp-typescript-focus-card-cursor]");

  await expect(stage).toHaveAttribute(
    "data-kp-typescript-active-projection",
    "projection.typescript.before"
  );
  await expect(stage.locator("canvas, svg")).toHaveCount(0);
  await expect(code.locator(
    'a[href="/learn/code/free-shipping/#refactor-stage"]'
  )).toHaveCount(1);

  await next.click();
  await expect(code).toHaveAttribute(
    "data-kp-focus-deck-active-beat",
    "compare-duplicates"
  );
  await expect(code).toHaveAttribute(
    "data-kp-typescript-focus-card-transition",
    "settled"
  );
  await expect(code).toHaveAttribute(
    "data-kp-typescript-focus-card-motion-reason",
    "attention-only-edge"
  );
  await expect(cursor).toHaveCSS("transition-duration", "0.18s");

  await next.click();
  await expect(code).toHaveAttribute(
    "data-kp-typescript-focus-card-transition",
    "active"
  );
  await expect(code).toHaveAttribute(
    "data-kp-focus-deck-active-beat",
    "introduce-helper"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-typescript-token-theater-active",
    "true"
  );

  await next.click();
  await expect(code).toHaveAttribute(
    "data-kp-focus-deck-active-beat",
    "move-shared-rule"
  );
  await expect(code).toHaveAttribute(
    "data-kp-typescript-focus-card-transition",
    "active"
  );
  await expect(code).toHaveAttribute(
    "data-kp-typescript-focus-card-timeline-progress",
    /0\.(?:3[5-9]|4\d|50)/u
  );
  await expect(code).toHaveAttribute(
    "data-kp-typescript-focus-card-transition",
    "settled",
    { timeout: 5_000 }
  );
  await expect(code).toHaveAttribute(
    "data-kp-typescript-focus-card-timeline-progress",
    "0.500000"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-typescript-active-projection",
    "projection.typescript.helper-introduced"
  );
  await page.waitForTimeout(500);
  await expect(code).toHaveAttribute(
    "data-kp-focus-deck-active-beat",
    "move-shared-rule"
  );
});

test("TypeScript slider and direct hash seek canonical code endpoints", async ({
  page
}) => {
  await page.goto(`${path}#beat.typescript.replace-cost-call`);
  const code = page.locator("[data-kp-typescript-focus-card]");
  const stage = code.locator("[data-kp-typescript-refactor-stage]");
  const scrubber = code.locator("[data-kp-focus-deck-scrubber]");

  await expect(code).toHaveAttribute(
    "data-kp-focus-deck-active-beat",
    "replace-cost-call"
  );
  await expect(code).toHaveAttribute(
    "data-kp-typescript-focus-card-timeline-progress",
    "0.680000"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-typescript-active-projection",
    "projection.typescript.cost-replaced"
  );

  await scrubber.evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = "5.5";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(code).toHaveAttribute(
    "data-kp-typescript-focus-card-transition",
    "scrubbing"
  );
  await expect(code).toHaveAttribute(
    "data-kp-typescript-focus-card-deck-position",
    "5.5000"
  );
  await expect(code).toHaveAttribute(
    "data-kp-typescript-focus-card-timeline-progress",
    "0.920000"
  );
  const passagePosition = await code.locator(
    "[data-kp-focus-deck-viewport]"
  ).evaluate((element) => element.scrollLeft / Math.max(1, element.clientWidth));
  expect(passagePosition).toBeCloseTo(6, 2);
  await expect(stage).toHaveAttribute(
    "data-kp-typescript-active-projection",
    "projection.typescript.final"
  );

  await scrubber.evaluate((element) => {
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(code).toHaveAttribute(
    "data-kp-focus-deck-active-beat",
    "verify-parity"
  );
  await expect(code).toHaveAttribute(
    "data-kp-typescript-focus-card-timeline-progress",
    "1.000000"
  );
});

test("equation beats separate attention stops from canonical rewrite motion", async ({
  page
}) => {
  await page.goto(path);
  const equation = page.locator("[data-kp-log-exponent-focus-card]");
  const player = equation.locator("[data-kp-editor-animation-player]");
  const stage = equation.locator("[data-kp-log-exponent-stage]");
  const next = equation.locator("[data-kp-focus-deck-next]");
  await expect(player).toHaveAttribute("data-kp-editor-animation-load-status",
    "ready");

  await next.click();
  await expect(equation).toHaveAttribute("data-kp-focus-deck-active-beat",
    "choose-logarithms");
  await expect(equation).toHaveAttribute("data-kp-log-exponent-transition",
    "settled");
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-motion-decision", "static");
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-motion-reason", "attention-only-edge");
  await expect(equation).toHaveAttribute("data-kp-log-exponent-timeline-progress",
    "0.000000");

  await next.click();
  await expect(equation).toHaveAttribute("data-kp-log-exponent-transition",
    "active");
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-motion-decision", "animate");
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-motion-reason",
    "motion-owning-adjacent-edge");
  await expect(equation).toHaveAttribute("data-kp-focus-deck-active-beat",
    "apply-logarithms");
  await expect(stage).toHaveAttribute("data-kp-log-exponent-visual-owner",
    "material-scene", { timeout: 4_000 });
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-playback-phase", "act");
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-playback-tempo", "0.85");
  const firstMaterialSample = await equation.evaluate((element) => {
    const stage = element.querySelector<HTMLElement>(
      "[data-kp-log-exponent-stage]"
    )!;
    const viewport = element.querySelector<HTMLElement>(
      "[data-kp-focus-deck-viewport]"
    )!;
    const scrubber = element.querySelector<HTMLInputElement>(
      "[data-kp-focus-deck-scrubber]"
    )!;
    const material = stage.querySelector<HTMLElement>(
      ".kp-log-exponent-stage__material-layer"
    )!;
    return {
      operationIndex: Number(stage.dataset["kpLogExponentOperationIndex"]),
      operationProgress: Number(stage.dataset[
        "kpLogExponentOperationProgress"
      ]),
      timelineProgress: Number((element as HTMLElement).dataset[
        "kpLogExponentTimelineProgress"
      ]),
      position: Number((element as HTMLElement).dataset[
        "kpLogExponentDeckPosition"
      ]),
      scrubber: Number(scrubber.value),
      passage: viewport.scrollLeft / Math.max(1, viewport.clientWidth),
      visibleMaterial: [...material.children].some((child) =>
        Number(getComputedStyle(child).opacity) > 0)
    };
  });
  expect(firstMaterialSample.operationProgress).toBeGreaterThan(0);
  expect(firstMaterialSample.operationProgress).toBeLessThan(1);
  expect(firstMaterialSample.visibleMaterial).toBe(true);
  expect(firstMaterialSample.position).toBe(2);
  expect(firstMaterialSample.scrubber).toBe(2);
  expect(firstMaterialSample.passage).toBeCloseTo(2, 2);
  await page.waitForTimeout(300);
  const laterMaterialSample = await equation.evaluate((element) => {
    const stage = element.querySelector<HTMLElement>(
      "[data-kp-log-exponent-stage]"
    )!;
    return {
      operationIndex: Number(stage.dataset["kpLogExponentOperationIndex"]),
      operationProgress: Number(stage.dataset[
        "kpLogExponentOperationProgress"
      ]),
      timelineProgress: Number((element as HTMLElement).dataset[
        "kpLogExponentTimelineProgress"
      ])
    };
  });
  expect(laterMaterialSample.timelineProgress).toBeGreaterThan(
    firstMaterialSample.timelineProgress
  );
  if (laterMaterialSample.operationIndex === firstMaterialSample.operationIndex) {
    expect(laterMaterialSample.operationProgress).toBeGreaterThan(
      firstMaterialSample.operationProgress
    );
  } else {
    expect(laterMaterialSample.operationIndex).toBe(
      firstMaterialSample.operationIndex + 1
    );
  }
  const synchronizedTransit = await equation.evaluate((element) => {
    const viewport = element.querySelector<HTMLElement>(
      "[data-kp-focus-deck-viewport]"
    )!;
    const scrubber = element.querySelector<HTMLInputElement>(
      "[data-kp-focus-deck-scrubber]"
    )!;
    return {
      position: Number((element as HTMLElement).dataset[
        "kpLogExponentDeckPosition"
      ]),
      scrubber: Number(scrubber.value),
      passage: viewport.scrollLeft / Math.max(1, viewport.clientWidth)
    };
  });
  expect(synchronizedTransit.position).toBe(2);
  expect(synchronizedTransit.scrubber).toBe(2);
  expect(synchronizedTransit.passage).toBeCloseTo(2, 2);
  await expect(equation).toHaveAttribute("data-kp-log-exponent-transition",
    "settled", { timeout: 8_000 });
  await expect(equation).toHaveAttribute("data-kp-log-exponent-deck-position",
    "2.0000");
  const firstProgress = Number(await equation.getAttribute(
    "data-kp-log-exponent-timeline-progress"
  ));
  expect(firstProgress).toBeGreaterThan(0);
  expect(firstProgress).toBeLessThan(1);

  await next.click();
  await expect(equation).toHaveAttribute("data-kp-focus-deck-active-beat",
    "match-the-power-law");
  await expect(equation).toHaveAttribute("data-kp-log-exponent-transition",
    "settled");
  expect(Number(await equation.getAttribute(
    "data-kp-log-exponent-timeline-progress"
  ))).toBeCloseTo(firstProgress, 5);

  await next.click();
  await expect(equation).toHaveAttribute("data-kp-focus-deck-active-beat",
    "extract-the-exponent");
  await expect(stage).toHaveAttribute(
    "data-kp-log-exponent-operation-choreography-id",
    "operation-choreography.transformation.log-exponent.extract-exponent.semantic-role-transfer.forward"
  );
  await expect(stage).toHaveAttribute("data-kp-log-exponent-visual-owner",
    "material-scene", { timeout: 4_000 });
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-playback-tempo", "0.85"
  );
  await expect(equation).toHaveAttribute("data-kp-log-exponent-transition",
    "settled", { timeout: 8_000 });
  const secondProgress = Number(await equation.getAttribute(
    "data-kp-log-exponent-timeline-progress"
  ));
  expect(secondProgress).toBeGreaterThan(firstProgress);

  await next.click();
  await expect(equation).toHaveAttribute("data-kp-focus-deck-active-beat",
    "isolate-x");
  await expect(stage).toHaveAttribute("data-kp-log-exponent-visual-owner",
    "material-scene", { timeout: 4_000 });
  await expect(equation).toHaveAttribute("data-kp-log-exponent-transition",
    "settled", { timeout: 8_000 });
  await expect(equation).toHaveAttribute("data-kp-log-exponent-timeline-progress",
    "1.000000");
  await expect(player.locator(
    '[data-kp-log-exponent-endpoint-index="3"]'
  )).toHaveAttribute("aria-hidden", "false");
});

test("attention-only navigation gives the visible cursor a transition", async ({
  page
}) => {
  await page.goto(path);
  const equation = page.locator("[data-kp-log-exponent-focus-card]");
  const next = equation.locator("[data-kp-focus-deck-next]");
  const cursor = equation.locator("[data-kp-log-exponent-cursor]");
  await expect(cursor).toHaveCount(1);

  const transition = cursor.evaluate((element) => new Promise<{
    property: string;
    elapsed: number;
    startLeft: number;
    endLeft: number;
  }>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error(
      "Cursor transition did not finish."
    )), 1_000);
    let startLeft = element.getBoundingClientRect().left;
    element.addEventListener("transitionstart", (event) => {
      const transitionEvent = event as TransitionEvent;
      if (transitionEvent.propertyName !== "left") return;
      startLeft = element.getBoundingClientRect().left;
    }, { once: true });
    element.addEventListener("transitionend", (event) => {
      const transitionEvent = event as TransitionEvent;
      if (transitionEvent.propertyName !== "left") return;
      window.clearTimeout(timeout);
      resolve({
        property: transitionEvent.propertyName,
        elapsed: transitionEvent.elapsedTime,
        startLeft,
        endLeft: element.getBoundingClientRect().left
      });
    }, { once: true });
  }));

  await next.click();
  await expect(equation).toHaveAttribute(
    "data-kp-focus-deck-active-beat", "choose-logarithms"
  );
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-transition", "settled"
  );
  const sample = await transition;
  expect(sample.property).toBe("left");
  expect(sample.elapsed).toBeGreaterThan(0.1);
  expect(sample.endLeft).toBeGreaterThan(sample.startLeft + 10);
});

test("the final equation rewrites realize visible Native KaTeX material", async ({
  page
}) => {
  await page.goto(path);
  const equation = page.locator("[data-kp-log-exponent-focus-card]");
  const stage = equation.locator("[data-kp-log-exponent-stage]");
  const scrubber = equation.locator("[data-kp-focus-deck-scrubber]");
  await expect(stage).toHaveAttribute("data-kp-log-exponent-stage", "ready");

  for (const sample of [
    { position: "3.5", operationIndex: "1" },
    { position: "4.5", operationIndex: "2" }
  ]) {
    await scrubber.evaluate((element, position) => {
      const input = element as HTMLInputElement;
      input.value = position;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, sample.position);
    await expect(stage).toHaveAttribute(
      "data-kp-log-exponent-operation-index",
      sample.operationIndex
    );
    await expect(stage).toHaveAttribute(
      "data-kp-log-exponent-visual-owner",
      "material-scene"
    );
    const material = await stage.evaluate((element) => {
      const layer = element.querySelector<HTMLElement>(
        ".kp-log-exponent-stage__material-layer"
      )!;
      const visible = [...layer.children].filter((child) => {
        const htmlChild = child as HTMLElement;
        const style = getComputedStyle(htmlChild);
        const bounds = htmlChild.getBoundingClientRect();
        return Number(style.opacity) > 0 && bounds.width > 0 && bounds.height > 0;
      });
      return {
        childCount: layer.childElementCount,
        visibleCount: visible.length
      };
    });
    expect(material.childCount).toBeGreaterThan(0);
    expect(material.visibleCount).toBeGreaterThan(0);
  }
});

test("automatic exponent extraction carries the same x into coefficient position", async ({
  page
}) => {
  await page.goto(`${path}#beat.log-exponent.match-the-power-law`);
  const equation = page.locator("[data-kp-log-exponent-focus-card]");
  const stage = equation.locator("[data-kp-log-exponent-stage]");
  const next = equation.locator("[data-kp-focus-deck-next]");
  await expect(stage).toHaveAttribute("data-kp-log-exponent-stage", "ready");
  await expect(stage).toHaveAttribute(
    "data-kp-log-exponent-paint-readiness", "ready"
  );
  await startExponentTravelSampling(page);

  await next.click();
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-transition",
    "active"
  );
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-transition",
    "settled",
    { timeout: 8_000 }
  );
  expectExponentTravel(await stopExponentTravelSampling(page));
});

test("automatic division visibly constructs numerator, denominator, and fraction rule", async ({
  page
}) => {
  await page.goto(`${path}#beat.log-exponent.extract-the-exponent`);
  const equation = page.locator("[data-kp-log-exponent-focus-card]");
  const stage = equation.locator("[data-kp-log-exponent-stage]");
  const next = equation.locator("[data-kp-focus-deck-next]");
  await expect(stage).toHaveAttribute("data-kp-log-exponent-stage", "ready");
  await expect(stage).toHaveAttribute(
    "data-kp-log-exponent-paint-readiness", "ready"
  );
  await startDivisionConstructionSampling(page);

  await next.click();
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-transition",
    "active"
  );
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-motion-reason",
    "motion-owning-adjacent-edge"
  );
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-transition",
    "settled",
    { timeout: 8_000 }
  );
  expectDivisionConstruction(await stopDivisionConstructionSampling(page));
});

test("disposing an active card and remounting in the same document preserves both final rewrites", async ({
  page
}) => {
  await page.goto(
    "/tests/fixtures/log-exponent-focus-card-remount-browser-host.html"
  );
  await page.evaluate(async () => {
    const modulePath =
      "/src/experiments/kinetic-figure-log-exponent-focus-card/" +
      "kinetic-figure-log-exponent-focus-card.ts";
    const module = await import(/* @vite-ignore */ modulePath) as typeof import(
      "../src/experiments/kinetic-figure-log-exponent-focus-card/kinetic-figure-log-exponent-focus-card.ts"
    );
    const root = document.querySelector<HTMLElement>("#app")!;
    const mount = () => {
      const authority = module.createKpLogExponentFocusCardAuthority();
      root.innerHTML = module.renderKpLogExponentFocusCard({
        authority,
        initialIndex: 0
      });
      return module.mountKpLogExponentFocusCard({ root, authority });
    };
    let session = mount();
    Object.assign(window, {
      __kpRemountLogExponentFocusCard() {
        const oldPlayer = root.querySelector<HTMLElement>(
          "[data-kp-editor-animation-player]"
        )!;
        session.dispose();
        Object.assign(window, { __kpDisposedLogExponentPlayer: oldPlayer });
        history.replaceState(null, "", location.pathname);
        session = mount();
      }
    });
  });

  let equation = page.locator("[data-kp-log-exponent-focus-card]");
  let stage = equation.locator("[data-kp-log-exponent-stage]");
  let next = equation.locator("[data-kp-focus-deck-next]");
  await expect(stage).toHaveAttribute("data-kp-log-exponent-stage", "ready");
  await next.click();
  await next.click();
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-transition", "active");

  await page.evaluate(() => {
    (window as unknown as {
      __kpRemountLogExponentFocusCard(): void;
    }).__kpRemountLogExponentFocusCard();
  });
  const lifecycle = await page.evaluate(() => {
    const oldPlayer = (window as unknown as {
      __kpDisposedLogExponentPlayer: HTMLElement;
    }).__kpDisposedLogExponentPlayer;
    return {
      oldConnected: oldPlayer.isConnected,
      oldDisposed: oldPlayer.dataset["kpEditorAnimationDisposed"],
      playerCount: document.querySelectorAll(
        "[data-kp-editor-animation-player]"
      ).length
    };
  });
  expect(lifecycle).toEqual({
    oldConnected: false,
    oldDisposed: "true",
    playerCount: 1
  });

  equation = page.locator("[data-kp-log-exponent-focus-card]");
  stage = equation.locator("[data-kp-log-exponent-stage]");
  next = equation.locator("[data-kp-focus-deck-next]");
  await expect(stage).toHaveAttribute("data-kp-log-exponent-stage", "ready");
  await next.click();
  await next.click();
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-transition", "settled", { timeout: 8_000 });
  await next.click();

  await startExponentTravelSampling(page);
  await next.click();
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-transition", "settled", { timeout: 8_000 });
  expectExponentTravel(await stopExponentTravelSampling(page));

  await startDivisionConstructionSampling(page);
  await next.click();
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-transition", "settled", { timeout: 8_000 });
  expectDivisionConstruction(await stopDivisionConstructionSampling(page));
});

test("an arrow interrupts an active rewrite and advances exactly one step", async ({
  page
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(path);
  const equation = page.locator("[data-kp-log-exponent-focus-card]");
  const stage = equation.locator("[data-kp-log-exponent-stage]");
  const next = equation.locator("[data-kp-focus-deck-next]");
  await expect(stage).toHaveAttribute("data-kp-log-exponent-stage", "ready");

  await next.click();
  await next.click();
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-transition", "active"
  );
  await expect(equation).toHaveAttribute(
    "data-kp-focus-deck-active-beat", "apply-logarithms"
  );

  // A second activation settles the visible rewrite and advances now; it must
  // not remain hidden until the old timer ends or schedule another step.
  await next.click();
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-transition", "settled"
  );
  await expect(equation).toHaveAttribute(
    "data-kp-focus-deck-active-beat", "match-the-power-law"
  );
  await page.waitForTimeout(500);
  await expect(equation).toHaveAttribute(
    "data-kp-focus-deck-active-beat", "match-the-power-law"
  );
  expect(errors).toEqual([]);
});

test("an equation edge waits for native readiness instead of losing playback", async ({
  page
}) => {
  await page.goto(path);
  const equation = page.locator("[data-kp-log-exponent-focus-card]");
  const player = equation.locator("[data-kp-editor-animation-player]");
  const stage = equation.locator("[data-kp-log-exponent-stage]");
  const next = equation.locator("[data-kp-focus-deck-next]");
  await expect(stage).toHaveAttribute("data-kp-log-exponent-stage", "ready");

  await next.click();
  await player.evaluate((element) => {
    element.dataset["kpEditorAnimationSurfaceReadiness"] = "preparing";
    element.dispatchEvent(new CustomEvent(
      "kp-editor-animation-surface-readiness",
      { bubbles: true, detail: { readiness: "preparing" } }
    ));
    element.closest("[data-kp-log-exponent-focus-card]")
      ?.querySelector<HTMLButtonElement>("[data-kp-focus-deck-next]")
      ?.click();
  });
  await expect(equation).toHaveAttribute(
    "data-kp-focus-deck-active-beat", "apply-logarithms"
  );
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-transition", "waiting"
  );
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-deck-position", "2.0000"
  );

  await player.evaluate((element) => {
    element.dataset["kpEditorAnimationSurfaceReadiness"] = "ready";
    element.dispatchEvent(new CustomEvent(
      "kp-editor-animation-surface-readiness",
      { bubbles: true, detail: { readiness: "ready" } }
    ));
  });
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-transition", "active"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-log-exponent-visual-owner", "material-scene",
    { timeout: 4_000 }
  );
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-transition", "settled",
    { timeout: 8_000 }
  );
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-deck-position", "2.0000"
  );
});

test("a runtime native failure becomes an observable static fallback", async ({
  page
}) => {
  await page.goto(path);
  const equation = page.locator("[data-kp-log-exponent-focus-card]");
  const player = equation.locator("[data-kp-editor-animation-player]");
  const stage = equation.locator("[data-kp-log-exponent-stage]");
  const next = equation.locator("[data-kp-focus-deck-next]");
  await expect(stage).toHaveAttribute("data-kp-log-exponent-stage", "ready");

  await next.click();
  await next.click();
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-transition", "active"
  );
  await player.evaluate((element) => {
    const nativeStage = element.querySelector<HTMLElement>(
      "[data-kp-log-exponent-stage]"
    )!;
    nativeStage.dataset["kpLogExponentStage"] = "failed";
    nativeStage.dataset["kpLogExponentError"] = "Synthetic native failure.";
    element.dataset["kpEditorAnimationSurfaceReadiness"] = "failed";
    element.dataset["kpEditorAnimationSurfaceError"] =
      "Synthetic native failure.";
    element.dispatchEvent(new CustomEvent(
      "kp-editor-animation-surface-readiness",
      { bubbles: true, detail: { readiness: "failed" } }
    ));
  });

  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-load-status", "failed"
  );
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-animation-status", "failed"
  );
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-animation-error", "Synthetic native failure."
  );
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-transition", "fallback"
  );
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-deck-position", "2.0000"
  );
});

test("previous replays the canonical rewrite backward without an endpoint jump", async ({
  page
}) => {
  await page.goto(`${path}#beat.log-exponent.apply-logarithms`);
  const equation = page.locator("[data-kp-log-exponent-focus-card]");
  const stage = equation.locator("[data-kp-log-exponent-stage]");
  const previous = equation.locator("[data-kp-focus-deck-previous]");
  await expect(stage).toHaveAttribute("data-kp-log-exponent-stage", "ready");

  await previous.click();
  await expect(equation).toHaveAttribute("data-kp-log-exponent-transition",
    "active");
  await expect(stage).toHaveAttribute("data-kp-log-exponent-visual-owner",
    "material-scene", { timeout: 4_000 });
  const progress = Number(await stage.getAttribute(
    "data-kp-log-exponent-operation-progress"
  ));
  expect(progress).toBeGreaterThan(0);
  expect(progress).toBeLessThan(1);
  await expect(equation).toHaveAttribute("data-kp-log-exponent-transition",
    "settled", { timeout: 8_000 });
  await expect(equation).toHaveAttribute("data-kp-focus-deck-active-beat",
    "choose-logarithms");
  await expect(equation).toHaveAttribute(
    "data-kp-log-exponent-deck-position", "1.0000");
});

test("slider and native passage travel seek the same equation playhead", async ({
  page
}) => {
  await page.goto(path);
  const equation = page.locator("[data-kp-log-exponent-focus-card]");
  const player = equation.locator("[data-kp-editor-animation-player]");
  const viewport = equation.locator("[data-kp-focus-deck-viewport]");
  const scrubber = equation.locator("[data-kp-focus-deck-scrubber]");
  await expect(player).toHaveAttribute("data-kp-editor-animation-load-status",
    "ready");

  await scrubber.evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = "1.5";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(equation).toHaveAttribute("data-kp-log-exponent-deck-position",
    "1.5000");
  await expect.poll(async () => viewport.evaluate((element) =>
    element.scrollLeft / Math.max(1, element.clientWidth)))
    .toBeCloseTo(1.5, 2);
  const halfwayFirstRewrite = Number(await equation.getAttribute(
    "data-kp-log-exponent-timeline-progress"
  ));
  expect(halfwayFirstRewrite).toBeGreaterThan(0);

  await scrubber.evaluate((element) => {
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(equation).toHaveAttribute("data-kp-focus-deck-active-beat",
    "apply-logarithms");
  await expect(equation).toHaveAttribute("data-kp-log-exponent-deck-position",
    "2.0000");
  const firstRewrite = Number(await equation.getAttribute(
    "data-kp-log-exponent-timeline-progress"
  ));
  expect(firstRewrite).toBeGreaterThan(halfwayFirstRewrite);

  await expect(viewport).not.toHaveAttribute("data-kp-focus-deck-snap-disabled");
  await viewport.evaluate((element) => {
    const htmlElement = element as HTMLElement;
    htmlElement.addEventListener("scrollend", (event) => {
      if (htmlElement.dataset["kpLogExponentHoldScrollEnd"] === "true") {
        event.stopImmediatePropagation();
      }
    }, { capture: true });
    htmlElement.dataset["kpLogExponentHoldScrollEnd"] = "true";
    htmlElement.dataset["kpFocusDeckSnapDisabled"] = "true";
    void htmlElement.offsetWidth;
    htmlElement.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true,
      isPrimary: true,
      pointerId: 1,
      pointerType: "touch"
    }));
    htmlElement.scrollLeft = htmlElement.clientWidth * 3.5;
    htmlElement.dispatchEvent(new Event("scroll"));
    htmlElement.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true,
      isPrimary: true,
      pointerId: 1,
      pointerType: "touch"
    }));
  });
  await expect(equation).toHaveAttribute("data-kp-log-exponent-deck-position",
    "3.5000");
  await expect.poll(async () => Number(await scrubber.inputValue()))
    .toBeCloseTo(3.5, 2);
  expect(Number(await equation.getAttribute(
    "data-kp-log-exponent-timeline-progress"
  ))).toBeGreaterThan(firstRewrite);

  await viewport.evaluate((element) => {
    delete element.dataset["kpLogExponentHoldScrollEnd"];
    element.dispatchEvent(new Event("scrollend"));
  });
  await expect(equation).toHaveAttribute("data-kp-focus-deck-active-beat",
    "extract-the-exponent");
  await expect(equation).toHaveAttribute("data-kp-log-exponent-deck-position",
    "4.0000");
});

test("a delayed Safari snap correction cannot reclaim the playhead", async ({
  page
}) => {
  await page.goto(path);
  const equation = page.locator("[data-kp-log-exponent-focus-card]");
  const player = equation.locator("[data-kp-editor-animation-player]");
  const viewport = equation.locator("[data-kp-focus-deck-viewport]");
  await expect(player).toHaveAttribute("data-kp-editor-animation-load-status",
    "ready");

  const settled = await viewport.evaluate(async (element) => {
    const deck = element.closest<HTMLElement>(
      "[data-kp-log-exponent-focus-card]"
    )!;
    deck.querySelector<HTMLButtonElement>(
      "[data-kp-focus-deck-next]"
    )!.click();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    element.scrollLeft = element.clientWidth * 0.65;
    element.dispatchEvent(new Event("scroll"));
    await new Promise<void>((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())));
    const scrubber = deck.querySelector<HTMLInputElement>(
      "[data-kp-focus-deck-scrubber]"
    )!;
    return {
      beat: deck.dataset["kpFocusDeckActiveBeat"],
      transition: deck.dataset["kpLogExponentTransition"],
      position: deck.dataset["kpLogExponentDeckPosition"],
      timeline: deck.dataset["kpLogExponentTimelineProgress"],
      scrubber: scrubber.value,
      passage: element.scrollLeft / Math.max(1, element.clientWidth)
    };
  });

  expect(settled.beat).toBe("choose-logarithms");
  expect(settled.transition).toBe("settled");
  expect(settled.position).toBe("1.0000");
  expect(settled.timeline).toBe("0.000000");
  expect(Number(settled.scrubber)).toBeCloseTo(1, 4);
  expect(settled.passage).toBeCloseTo(1, 2);
});

test("a direct semantic URL restores an equation endpoint without replay", async ({
  page
}) => {
  await page.goto(`${path}#beat.log-exponent.extract-the-exponent`);
  const equation = page.locator("[data-kp-log-exponent-focus-card]");
  await expect(equation).toHaveAttribute("data-kp-focus-deck-active-beat",
    "extract-the-exponent");
  await expect(equation).toHaveAttribute("data-kp-log-exponent-transition",
    "settled");
  await expect.poll(async () => Number(await equation.getAttribute(
    "data-kp-log-exponent-timeline-progress"
  ))).toBeGreaterThan(0.5);
});

test("compact equation paint stays inside the stage", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(path);
  const equation = page.locator("[data-kp-log-exponent-focus-card]");
  const stage = equation.locator("[data-kp-log-exponent-stage]");
  const scrubber = equation.locator("[data-kp-focus-deck-scrubber]");
  await expect(stage).toHaveAttribute("data-kp-log-exponent-stage", "ready");

  const paintBoundaries = await stage.evaluate((element) => {
    const focusStage = element.closest<HTMLElement>(
      ".kp-focus-deck__stage"
    )!;
    return {
      surfaceOverflow: getComputedStyle(element).overflow,
      hostOverflow: getComputedStyle(focusStage).overflow,
      hostContain: getComputedStyle(focusStage).contain
    };
  });
  expect(paintBoundaries).toEqual({
    surfaceOverflow: "visible",
    hostOverflow: "hidden",
    hostContain: "paint"
  });

  const samples = [];
  for (const position of [0, 1.5, 2, 3.2, 3.5, 3.8, 4, 4.5, 5]) {
    await scrubber.evaluate((element, requestedPosition) => {
      const input = element as HTMLInputElement;
      input.value = String(requestedPosition);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, position);
    await page.evaluate(() => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    }));
    samples.push(await stage.evaluate((element, requestedPosition) => {
      const stageRect = element.getBoundingClientRect();
      const visibleRects: DOMRect[] = [];
      element.querySelectorAll<HTMLElement>(
        ".kp-log-exponent-stage__endpoint"
      ).forEach((endpoint) => {
        const style = getComputedStyle(endpoint);
        const katex = endpoint.querySelector<HTMLElement>(".katex");
        if (katex !== null && style.visibility !== "hidden" &&
            Number(style.opacity) > 0.01) {
          visibleRects.push(katex.getBoundingClientRect());
        }
      });
      element.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-owner-id]"
      ).forEach((owner) => {
        const style = getComputedStyle(owner);
        if (style.visibility !== "hidden" && Number(style.opacity) > 0.01) {
          visibleRects.push(owner.getBoundingClientRect());
        }
      });
      const paint = visibleRects.reduce((union, rect) => ({
        left: Math.min(union.left, rect.left),
        top: Math.min(union.top, rect.top),
        right: Math.max(union.right, rect.right),
        bottom: Math.max(union.bottom, rect.bottom)
      }), {
        left: Number.POSITIVE_INFINITY,
        top: Number.POSITIVE_INFINITY,
        right: Number.NEGATIVE_INFINITY,
        bottom: Number.NEGATIVE_INFINITY
      });
      const endpoint = element.querySelector<HTMLElement>(
        ".kp-log-exponent-stage__endpoint"
      )!;
      const material = element.querySelector<HTMLElement>(
        ".kp-log-exponent-stage__material-layer"
      )!;
      return {
        position: requestedPosition,
        stage: {
          width: stageRect.width,
          height: stageRect.height
        },
        paint: {
          left: paint.left - stageRect.left,
          top: paint.top - stageRect.top,
          right: stageRect.right - paint.right,
          bottom: stageRect.bottom - paint.bottom,
          width: paint.right - paint.left,
          height: paint.bottom - paint.top
        },
        endpointFontSize: getComputedStyle(endpoint).fontSize,
        materialFontSize: getComputedStyle(material).fontSize,
        ownerCount: visibleRects.length
      };
    }, position));
  }
  for (const sample of samples) {
    expect(sample.ownerCount).toBeGreaterThan(0);
    expect(Number.parseFloat(sample.endpointFontSize))
      .toBeLessThanOrEqual(29);
    expect(sample.materialFontSize).toBe(sample.endpointFontSize);
    expect(sample.paint.left).toBeGreaterThanOrEqual(8);
    expect(sample.paint.top).toBeGreaterThanOrEqual(8);
    expect(sample.paint.right).toBeGreaterThanOrEqual(8);
    expect(sample.paint.bottom).toBeGreaterThanOrEqual(8);
    expect(sample.paint.width).toBeLessThan(sample.stage.width);
    expect(sample.paint.height).toBeLessThan(sample.stage.height);
  }

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.reload();
  await expect(stage).toHaveAttribute("data-kp-log-exponent-stage", "ready");
  const desktopFontSizes = await stage.evaluate((element) => [
    ".kp-log-exponent-stage__endpoint",
    ".kp-log-exponent-stage__material-layer"
  ].map((selector) => Number.parseFloat(getComputedStyle(
    element.querySelector<HTMLElement>(selector)!
  ).fontSize)));
  expect(desktopFontSizes.every((size) => size <= 45)).toBe(true);
});

test("visual checkpoint: all shared cards fit desktop and phone", async ({
  page
}, testInfo) => {
  await page.goto(path);
  await expect(page.locator("[data-kp-log-exponent-stage]")).toHaveAttribute(
    "data-kp-log-exponent-stage", "ready");
  await page.screenshot({
    path: testInfo.outputPath("focus-deck-multi-card-desktop.png"),
    fullPage: true
  });

  const equation = page.locator("[data-kp-log-exponent-focus-card]");
  await equation.locator("[data-kp-focus-deck-scrubber]").evaluate(
    (element) => {
      const input = element as HTMLInputElement;
      input.value = "1.5";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  );
  await expect(equation.locator(
    "[data-kp-log-exponent-stage]"
  )).toHaveAttribute("data-kp-log-exponent-visual-owner", "material-scene");
  await equation.screenshot({
    path: testInfo.outputPath("focus-deck-equation-material-transit.png")
  });

  for (const position of [3.2, 3.5, 3.8]) {
    await equation.locator("[data-kp-focus-deck-scrubber]").evaluate(
      (element, requestedPosition) => {
        const input = element as HTMLInputElement;
        input.value = String(requestedPosition);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      },
      position
    );
    await equation.screenshot({
      path: testInfo.outputPath(
        `focus-deck-exponent-travel-${position.toFixed(1)}.png`
      )
    });
  }

  const code = page.locator("[data-kp-typescript-focus-card]");
  const codeScrubberDesktop = code.locator("[data-kp-focus-deck-scrubber]");
  for (const position of [2.5, 4.5]) {
    await codeScrubberDesktop.evaluate((element, requestedPosition) => {
      const input = element as HTMLInputElement;
      input.value = String(requestedPosition);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, position);
    await expect(code.locator("[data-kp-typescript-refactor-stage]"))
      .toHaveAttribute("data-kp-typescript-token-theater-active", "true");
    await code.screenshot({
      path: testInfo.outputPath(
        `focus-deck-typescript-transit-${position.toFixed(1)}.png`
      )
    });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.locator("[data-kp-log-exponent-stage]")).toHaveAttribute(
    "data-kp-log-exponent-stage", "ready");
  const cards = page.locator("[data-kp-focus-deck]");
  for (let index = 0; index < await cards.count(); index += 1) {
    const box = await cards.nth(index).boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  }
  const introLeftEdges = await page.locator(
    ".kp-supply-tax-page__intro, .kp-surface-contour-page__intro"
  ).evaluateAll((elements) => elements.map((element) =>
    element.getBoundingClientRect().left));
  expect(Math.max(...introLeftEdges) - Math.min(...introLeftEdges))
    .toBeLessThanOrEqual(1);
  const surfaceStage = page.locator(
    "[data-kp-surface-contour-deck] [data-kp-surface-contour-stage]"
  );
  await expect.poll(async () => {
    const status = await surfaceStage.getAttribute("data-kp-stage-fit-status");
    if (status === "satisfied") return status;
    const gaps = await surfaceStage.getAttribute("data-kp-stage-fit-repair-gaps");
    const bounds = await surfaceStage.getAttribute(
      "data-kp-stage-fit-observed-bounds"
    );
    return `${status ?? "missing"}; gaps=${gaps ?? "missing"}; ` +
      `bounds=${bounds ?? "missing"}`;
  }).toBe("satisfied");
  const codeStage = page.locator(
    "[data-kp-typescript-focus-card] [data-kp-typescript-refactor-stage]"
  );
  await expect(codeStage).toHaveAttribute(
    "data-kp-typescript-active-projection",
    "projection.typescript.before"
  );
  const codeFit = await codeStage.evaluate((element) => {
    const stageRect = element.getBoundingClientRect();
    const source = element.querySelector<HTMLElement>(
      ".kp-typescript-refactor__source"
    )!;
    const sourceRect = source.getBoundingClientRect();
    return {
      stageWidth: stageRect.width,
      sourceWidth: sourceRect.width,
      sourceScrollWidth: source.scrollWidth,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth
    };
  });
  expect(codeFit.sourceWidth).toBeLessThanOrEqual(codeFit.stageWidth + 1);
  expect(codeFit.sourceScrollWidth).toBeLessThanOrEqual(
    codeFit.sourceWidth + 1
  );
  expect(codeFit.documentWidth).toBeLessThanOrEqual(codeFit.viewportWidth + 1);
  const codeDeck = page.locator("[data-kp-typescript-focus-card]");
  const codeScrubber = codeDeck.locator("[data-kp-focus-deck-scrubber]");
  for (let index = 0; index < 7; index += 1) {
    await codeScrubber.evaluate((element, position) => {
      const input = element as HTMLInputElement;
      input.value = String(position);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }, index);
    const activePassage = codeDeck.locator(
      '[data-kp-focus-deck-beat-active="true"]'
    );
    const passageFit = await activePassage.evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight
    }));
    expect(passageFit.scrollHeight).toBeLessThanOrEqual(
      passageFit.clientHeight + 1
    );
  }
  const finalSourceFit = await codeStage.locator(
    ".kp-typescript-refactor__source"
  ).evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight
  }));
  expect(finalSourceFit.scrollHeight).toBeLessThanOrEqual(
    finalSourceFit.clientHeight + 1
  );
  await codeScrubber.evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = "0";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.screenshot({
    path: testInfo.outputPath("focus-deck-multi-card-phone.png"),
    fullPage: true
  });
});

interface ExponentTravelSample {
  readonly ownerId: string;
  readonly sampledAtMs: number;
  readonly x: number;
  readonly y: number;
  readonly height: number;
  readonly operationProgress: number;
}

async function startExponentTravelSampling(page: Page): Promise<void> {
  await page.evaluate(() => {
    const samples: ExponentTravelSample[] = [];
    const state = { samples, stop: false };
    Object.assign(window, { __kpExponentTravel: state });
    const sample = () => {
      const stage = document.querySelector<HTMLElement>(
        "[data-kp-log-exponent-focus-card] [data-kp-log-exponent-stage]"
      );
      const owner = stage === null
        ? undefined
        : Array.from(stage.querySelectorAll<HTMLElement>(
            '[data-kp-equation-material-semantic-entity-id="logged.exponent"]'
          )).find((candidate) =>
            Number(getComputedStyle(candidate).opacity) > 0.01);
      if (owner !== undefined && stage !== null) {
        const rect = owner.getBoundingClientRect();
        samples.push({
          ownerId: owner.dataset["kpEquationMaterialOwnerId"] ?? "missing",
          sampledAtMs: performance.now(),
          x: rect.x,
          y: rect.y,
          height: rect.height,
          operationProgress: Number(
            stage.dataset["kpLogExponentOperationProgress"]
          )
        });
      }
      if (!state.stop) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
}

async function stopExponentTravelSampling(
  page: Page
): Promise<ExponentTravelSample[]> {
  return page.evaluate(() => {
    const state = (window as unknown as Window & {
      __kpExponentTravel: {
        samples: ExponentTravelSample[];
        stop: boolean;
      };
    }).__kpExponentTravel;
    state.stop = true;
    return state.samples;
  });
}

function expectExponentTravel(samples: ExponentTravelSample[]): void {
  expect(samples.length).toBeGreaterThan(12);
  const first = samples[0]!;
  const last = samples.at(-1)!;
  expect(new Set(samples.map(({ ownerId }) => ownerId)).size).toBe(1);
  expect(first.ownerId).not.toBe("missing");
  expect(Math.hypot(last.x - first.x, last.y - first.y))
    .toBeGreaterThan(first.height);
  expect(Math.max(...samples.map(({ operationProgress }) => operationProgress)))
    .toBeGreaterThan(0.9);
  expect(samples.some(({ operationProgress }) =>
    operationProgress > 0.3 && operationProgress < 0.7)).toBe(true);
  const largestSamplingGap = Math.max(...samples.slice(1).map(
    (sample, index) => sample.sampledAtMs - samples[index]!.sampledAtMs
  ));
  expect(largestSamplingGap).toBeLessThan(180);
  const totalTravel = Math.hypot(last.x - first.x, last.y - first.y);
  const largestSpatialStep = Math.max(...samples.slice(1).map(
    (sample, index) => Math.hypot(
      sample.x - samples[index]!.x,
      sample.y - samples[index]!.y
    )
  ));
  // Material continuity is not established merely by observing intermediate
  // clock values: a held source followed by one target jump also has those.
  expect(largestSpatialStep).toBeLessThan(Math.max(
    first.height * 0.8,
    totalTravel * 0.3
  ));
}

interface DivisionConstructionSample {
  readonly operationProgress: number;
  readonly sampledAtMs: number;
  readonly numeratorY?: number | undefined;
  readonly denominatorY?: number | undefined;
  readonly glyphHeight?: number | undefined;
  readonly ruleWidth?: number | undefined;
}

async function startDivisionConstructionSampling(page: Page): Promise<void> {
  await page.evaluate(() => {
    const samples: DivisionConstructionSample[] = [];
    const state = { samples, stop: false };
    Object.assign(window, { __kpDivisionConstruction: state });
    const visibleOwner = (entityId: string, fragmentRole?: string) =>
      Array.from(document.querySelectorAll<HTMLElement>(
        `[data-kp-log-exponent-focus-card] ` +
        `[data-kp-equation-material-semantic-entity-id="${entityId}"]`
      )).find((candidate) => {
        const role = candidate.dataset["kpEquationMaterialFragmentRole"];
        return Number(getComputedStyle(candidate).opacity) > 0.01 &&
          (fragmentRole === undefined || role?.startsWith(fragmentRole));
      });
    const sample = () => {
      const stage = document.querySelector<HTMLElement>(
        "[data-kp-log-exponent-focus-card] [data-kp-log-exponent-stage]"
      );
      if (stage !== null &&
          stage.dataset["kpLogExponentOperationId"] ===
            "operation.log-exponent.divide-by-log-base") {
        // Persisted material keeps its source identity while geometry travels
        // toward the solved numerator and denominator roles.
        const numerator = visibleOwner("extracted.right.log.operator");
        const denominator = visibleOwner("extracted.left.log.operator");
        const rule = visibleOwner("solved.right", "rule:");
        const numeratorRect = numerator?.getBoundingClientRect();
        const denominatorRect = denominator?.getBoundingClientRect();
        const ruleRect = rule?.getBoundingClientRect();
        samples.push({
          operationProgress: Number(
            stage.dataset["kpLogExponentOperationProgress"]
          ),
          sampledAtMs: performance.now(),
          ...(numeratorRect === undefined
            ? {}
            : {
                numeratorY: numeratorRect.y,
                glyphHeight: numeratorRect.height
              }),
          ...(denominatorRect === undefined
            ? {}
            : { denominatorY: denominatorRect.y }),
          ...(ruleRect === undefined ? {} : { ruleWidth: ruleRect.width })
        });
      }
      if (!state.stop) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
}

async function stopDivisionConstructionSampling(
  page: Page
): Promise<DivisionConstructionSample[]> {
  return page.evaluate(() => {
    const state = (window as unknown as Window & {
      __kpDivisionConstruction: {
        samples: DivisionConstructionSample[];
        stop: boolean;
      };
    }).__kpDivisionConstruction;
    state.stop = true;
    return state.samples;
  });
}

function expectDivisionConstruction(
  samples: DivisionConstructionSample[]
): void {
  expect(samples.length).toBeGreaterThan(10);
  expect(Math.max(...samples.map(({ operationProgress }) => operationProgress)))
    .toBeGreaterThan(0.9);
  const separated = samples.filter((sample) =>
    sample.numeratorY !== undefined && sample.denominatorY !== undefined
  );
  expect(separated.length).toBeGreaterThan(5);
  const maximumSeparation = Math.max(...separated.map((sample) =>
    sample.denominatorY! - sample.numeratorY!
  ));
  expect(maximumSeparation).toBeGreaterThan(separated[0]!.glyphHeight!);
  const ruleWidths = samples.flatMap(({ ruleWidth }) =>
    ruleWidth === undefined ? [] : [ruleWidth]
  );
  expect(ruleWidths.length).toBeGreaterThan(2);
  expect(Math.max(...ruleWidths)).toBeGreaterThan(
    Math.min(...ruleWidths) + 4
  );
  const ruleWidthSteps = samples.slice(1).flatMap((sample, index) => {
    const previous = samples[index]!;
    return sample.ruleWidth === undefined || previous.ruleWidth === undefined
      ? []
      : [Math.abs(sample.ruleWidth - previous.ruleWidth)];
  });
  expect(Math.max(...ruleWidthSteps)).toBeLessThan(
    Math.max(6, (Math.max(...ruleWidths) - Math.min(...ruleWidths)) * 0.5)
  );
  const largestSamplingGap = Math.max(...samples.slice(1).map(
    (sample, index) => sample.sampledAtMs - samples[index]!.sampledAtMs
  ));
  expect(largestSamplingGap).toBeLessThan(180);
}
