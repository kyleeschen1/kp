import { expect, test } from "@playwright/test";

const route =
  "/glyph-reconciliation-experiment.html?hostParity=radical";

test("live parity surface drives the oracle and both canonical hosts together", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "networkidle" });
  await expect(page.locator("html")).toHaveAttribute(
    "data-kp-canonical-host-parity-ready",
    "true"
  );

  const oracle = page.frameLocator("[data-kp-canonical-host-oracle]");
  const reference = page.frameLocator("[data-kp-canonical-host-reference]");
  const reader = page.frameLocator("[data-kp-canonical-host-reader]");
  const shared = page.locator("[data-kp-canonical-host-progress]");
  const oraclePlayer = oracle.locator("[data-kp-editor-animation-player]");
  const oracleStage = oracle.locator("[data-kp-editor-equation-stage]");
  const referenceStage = reference.locator("[data-radical-stage]");
  const readerSurface = reader.locator(
    '[data-kp-reader-transition-active="true"] [data-kp-reader-fit-surface]'
  );

  await expect(oraclePlayer).toHaveAttribute(
    "data-kp-editor-animation-id",
    "animation.generated.radical.square-root-as-power"
  );
  await expect(oracleStage).toHaveAttribute(
    "data-kp-editor-radical-morph-mode",
    "webgl-solid-mask"
  );
  await expect(oracleStage.locator(
    "[data-kp-editor-radical-webgl-morph]"
  )).toHaveAttribute(
    "data-kp-editor-radical-webgl-strategy",
    "signed-distance-field"
  );
  await expect(referenceStage).toHaveAttribute(
    "data-kp-canonical-native-katex-session-factory",
    "shared-v1"
  );
  await expect(readerSurface).toHaveAttribute(
    "data-kp-canonical-native-katex-session-factory",
    "shared-v1"
  );
  await expect(referenceStage).toHaveAttribute(
    "data-kp-native-katex-structural-succession-strategy",
    "solid-mask-succession"
  );
  await expect(readerSurface).toHaveAttribute(
    "data-kp-native-katex-structural-succession-strategy",
    "solid-mask-succession"
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

  await shared.evaluate((node) => {
    const input = node as HTMLInputElement;
    input.value = "500";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(reference.locator("[data-radical-inventory]")).toHaveAttribute(
    "data-kp-radical-progress",
    "500"
  );
  await expect(referenceStage.locator(
    "[data-kp-native-katex-structural-succession]"
  )).toHaveCSS("opacity", "1");
  await expect(readerSurface.locator(
    "[data-kp-native-katex-structural-succession]"
  )).toHaveCSS("opacity", "1");
  const measuredInk = [
    [
      "original editor oracle",
      await oracleStage.evaluate(async (element) => {
        const moduleUrl = "/src/rendering/radical-webgl-morph.ts";
        const measured = (
          await import(/* @vite-ignore */ moduleUrl)
        ).measureKpRadicalWebglInk(element as HTMLElement, "target");
        return {
          ink: measured?.renderedWebglInkRect,
          stage: {
            width: (element as HTMLElement).clientWidth,
            height: (element as HTMLElement).clientHeight
          }
        };
      })
    ],
    [
      "glyph reconciliation exemplar",
      await referenceStage.evaluate(async (element) => {
        const moduleUrl =
          "/src/rendering/native-katex-structural-succession-renderer.ts";
        const measured = (
          await import(/* @vite-ignore */ moduleUrl)
        ).measureKpNativeKatexStructuralSuccessionInk(
          element as HTMLElement
        );
        return {
          ink: measured?.renderedInkRect,
          stage: {
            width: (element as HTMLElement).clientWidth,
            height: (element as HTMLElement).clientHeight
          }
        };
      })
    ],
    [
      "reader integration",
      await readerSurface.evaluate(async (element) => {
        const moduleUrl =
          "/src/rendering/native-katex-structural-succession-renderer.ts";
        const measured = (
          await import(/* @vite-ignore */ moduleUrl)
        ).measureKpNativeKatexStructuralSuccessionInk(
          element as HTMLElement
        );
        return {
          ink: measured?.renderedInkRect,
          stage: {
            width: (element as HTMLElement).clientWidth,
            height: (element as HTMLElement).clientHeight
          }
        };
      })
    ]
  ] as const;
  for (const [label, measurement] of measuredInk) {
    const ink = measurement.ink;
    expect(ink, `${label} must render structural ink`).toBeDefined();
    expect(ink?.width, `${label} structural ink must have width`)
      .toBeGreaterThan(1);
    expect(ink?.height, `${label} structural ink must have height`)
      .toBeGreaterThan(1);
    expect(
      ink !== undefined &&
        ink.left < measurement.stage.width &&
        ink.top < measurement.stage.height &&
        ink.left + ink.width > 0 &&
        ink.top + ink.height > 0,
      `${label} structural ink must intersect its visible stage: ${
        JSON.stringify(measurement)
      }`
    ).toBe(true);
  }
  await page.evaluate(() =>
    new Promise<void>((resolve) =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => resolve())
      )
    )
  );
  for (const [label, canvas] of [
    [
      "original editor oracle",
      oracleStage.locator("[data-kp-editor-radical-webgl-morph]")
    ],
    [
      "glyph reconciliation exemplar",
      referenceStage.locator(
        "[data-kp-native-katex-structural-succession]"
      )
    ],
    [
      "reader integration",
      readerSurface.locator(
        "[data-kp-native-katex-structural-succession]"
      )
    ]
  ] as const) {
    const delayedInk = await canvas.evaluate((element) => {
      const surface = element as HTMLCanvasElement;
      const gl = surface.getContext("webgl");
      if (gl === null) return { count: 0, averageAlpha: 0, averageRgb: 255 };
      const pixels = new Uint8Array(surface.width * surface.height * 4);
      gl.readPixels(
        0,
        0,
        surface.width,
        surface.height,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixels
      );
      let count = 0;
      let alpha = 0;
      let rgb = 0;
      for (let index = 3; index < pixels.length; index += 4) {
        const pixelAlpha = pixels[index] ?? 0;
        if (pixelAlpha < 8) continue;
        count += 1;
        alpha += pixelAlpha;
        rgb +=
          (pixels[index - 3] ?? 0) +
          (pixels[index - 2] ?? 0) +
          (pixels[index - 1] ?? 0);
      }
      return {
        count,
        averageAlpha: count === 0 ? 0 : alpha / count,
        averageRgb: count === 0 ? 255 : rgb / (count * 3)
      };
    });
    expect(
      delayedInk.count,
      `${label} must retain paused structural ink`
    ).toBeGreaterThan(16);
    expect(
      delayedInk.averageAlpha,
      `${label} structural ink must remain visibly opaque`
    ).toBeGreaterThan(64);
    expect(
      delayedInk.averageRgb,
      `${label} structural ink must contrast with the paper`
    ).toBeLessThan(160);
  }

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
    await expect(oraclePlayer).toHaveAttribute(
      "data-kp-editor-animation-progress",
      String(value / 1_000)
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
    expect(opacity, `reader x opacity at ${value}/1000`).toBe(1);
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
    const oracleStage = page.frameLocator(
      "[data-kp-canonical-host-oracle]"
    ).locator("[data-kp-editor-equation-stage]");
    const referenceStage = page.frameLocator(
      "[data-kp-canonical-host-reference]"
    ).locator("[data-radical-stage]");
    const readerSurface = page.frameLocator(
      "[data-kp-canonical-host-reader]"
    ).locator(
      '[data-kp-reader-transition-active="true"] [data-kp-reader-fit-surface]'
    );
    await expect(oracleStage).toHaveAttribute(
      "data-kp-editor-radical-morph-ready",
      "true"
    );
    await expect(referenceStage.locator(
      "[data-kp-native-katex-structural-succession]"
    )).toHaveCSS("opacity", "1");
    await expect(readerSurface.locator(
      "[data-kp-native-katex-structural-succession]"
    )).toHaveCSS("opacity", "1");
    await oracleStage.evaluate(async (element) => {
      const moduleUrl = "/src/rendering/radical-webgl-morph.ts";
      (
        await import(/* @vite-ignore */ moduleUrl)
      ).measureKpRadicalWebglInk(element as HTMLElement, "target");
    });
    for (const stage of [referenceStage, readerSurface]) {
      await stage.evaluate(async (element) => {
        const moduleUrl =
          "/src/rendering/native-katex-structural-succession-renderer.ts";
        (
          await import(/* @vite-ignore */ moduleUrl)
        ).measureKpNativeKatexStructuralSuccessionInk(
          element as HTMLElement
        );
      });
    }
    if (profile.dpr === 1) {
      await page.locator("section[data-kp-canonical-host-parity]").screenshot({
        path: `tmp/codex/canonical-host-parity-${profile.id}.png`
      });
    }
    await context.close();
  }
});
