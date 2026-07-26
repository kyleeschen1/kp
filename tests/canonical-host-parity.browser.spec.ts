import { expect, test } from "@playwright/test";

const route =
  "/glyph-reconciliation-experiment.html?hostParity=radical";

test("live parity surface drives both canonical hosts through one scrubber", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute(
    "data-kp-canonical-host-parity-ready",
    "true"
  );

  const reference = page.frameLocator("[data-kp-canonical-host-reference]");
  const reader = page.frameLocator("[data-kp-canonical-host-reader]");
  const shared = page.locator("[data-kp-canonical-host-progress]");
  const referenceStage = reference.locator("[data-radical-stage]");
  const readerSurface = reader.locator(
    '[data-kp-reader-transition-active="true"] [data-kp-reader-fit-surface]'
  );

  await expect(referenceStage).toHaveAttribute(
    "data-kp-canonical-native-katex-session-factory",
    "shared-v1"
  );
  await expect(readerSurface).toHaveAttribute(
    "data-kp-canonical-native-katex-session-factory",
    "shared-v1"
  );

  const referenceType = await reference.locator(
    "[data-radical-source]"
  ).evaluate((element) => getComputedStyle(element).fontSize);
  const readerType = await reader.locator(
    '[data-kp-reader-transition-active="true"] ' +
    "[data-kp-reader-equation-measurement]"
  ).evaluate((element) => getComputedStyle(element).fontSize);
  expect(referenceType).toBe(readerType);
  expect(Number.parseFloat(readerType)).toBeGreaterThanOrEqual(26);

  for (const value of [0, 250, 500, 750, 960, 999, 1000]) {
    await shared.evaluate((node, next) => {
      const input = node as HTMLInputElement;
      input.value = String(next);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, value);
    await expect(reference.locator("[data-radical-inventory]")).toHaveAttribute(
      "data-kp-radical-progress",
      String(value)
    );
    await expect(reader.locator("body")).toHaveAttribute(
      "data-kp-reader-progress",
      String(value)
    );
  }
});

test("persistent reader x is opaque and equivalent across native handoff", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute(
    "data-kp-canonical-host-parity-ready",
    "true"
  );
  const readerFrame = page.locator("[data-kp-canonical-host-reader]");
  const reader = page.frames().find((frame) =>
    frame.url().includes("/reader/radical-succession/")
  );
  expect(reader).toBeDefined();
  const shared = page.locator("[data-kp-canonical-host-progress]");

  const seek = async (value: number) => {
    await shared.evaluate((node, next) => {
      const input = node as HTMLInputElement;
      input.value = String(next);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, value);
    await expect(readerFrame).toBeVisible();
    await expect.poll(() =>
      reader!.locator("body").getAttribute("data-kp-reader-progress")
    ).toBe(String(value));
  };

  for (const value of [1, 25, 100, 250, 500, 750, 900, 960, 990, 999]) {
    await seek(value);
    const opacity = await reader!.locator(
      '[data-kp-reader-transition-active="true"] ' +
      '[data-kp-native-katex-scene-owner][data-kp-equation-material-fragment-role^="glyph:"]'
    ).evaluateAll((owners) => {
      const x = owners.find((owner) => owner.textContent?.trim() === "x");
      if (!(x instanceof HTMLElement)) return 0;
      return Number(getComputedStyle(x).opacity);
    });
    expect(opacity).toBe(1);
  }

  await seek(999);
  const material = await reader!.locator(
    '[data-kp-reader-transition-active="true"] [data-kp-reader-fit-surface]'
  ).evaluate((surface) => {
    const owner = [...surface.querySelectorAll<HTMLElement>(
      '[data-kp-native-katex-scene-owner]' +
      '[data-kp-equation-material-fragment-role^="glyph:"]'
    )].find((candidate) => candidate.textContent?.trim() === "x")!;
    const rect = owner.getBoundingClientRect();
    return {
      color: getComputedStyle(owner.firstElementChild!).color,
      rect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      }
    };
  });
  await seek(1000);
  const native = await reader!.locator(
    '[data-kp-reader-transition-active="true"] ' +
    '[data-kp-reader-native="target"] ' +
    '[data-kp-reader-selector-id$=".radicand"] .mathnormal'
  ).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      color: getComputedStyle(element).color,
      rect: {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      }
    };
  });
  expect(material.color).toBe(native.color);
  expect(Math.max(
    Math.abs(material.rect.left - native.rect.left),
    Math.abs(material.rect.top - native.rect.top),
    Math.abs(material.rect.width - native.rect.width),
    Math.abs(material.rect.height - native.rect.height)
  )).toBeLessThanOrEqual(0.75);
});

test("parity checkpoints remain synchronized at wide phone and DPR 1/2", async ({
  browser
}) => {
  const profiles = [
    { id: "wide-dpr1", width: 1280, height: 900, dpr: 1 },
    { id: "wide-dpr2", width: 1280, height: 900, dpr: 2 },
    { id: "phone-dpr1", width: 390, height: 844, dpr: 1 },
    { id: "phone-dpr2", width: 390, height: 844, dpr: 2 }
  ] as const;
  for (const profile of profiles) {
    const context = await browser.newContext({
      viewport: { width: profile.width, height: profile.height },
      deviceScaleFactor: profile.dpr
    });
    const page = await context.newPage();
    await page.goto(route, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute(
      "data-kp-canonical-host-parity-ready",
      "true"
    );
    const shared = page.locator("[data-kp-canonical-host-progress]");
    for (const value of [0, 250, 500, 750, 960, 999, 1000]) {
      await shared.evaluate((node, next) => {
        const input = node as HTMLInputElement;
        input.value = String(next);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }, value);
      await expect(page.locator("html")).toHaveAttribute(
        "data-kp-canonical-host-parity-progress",
        String(value)
      );
    }
    await shared.evaluate((node) => {
      const input = node as HTMLInputElement;
      input.value = "500";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    if (profile.dpr === 1) {
      await page.locator("section[data-kp-canonical-host-parity]").screenshot({
        path: `tmp/codex/canonical-host-parity-${profile.id}.png`
      });
    }
    await context.close();
  }
});
