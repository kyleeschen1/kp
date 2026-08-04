import { mkdir, writeFile } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

const evidenceDirectory = "tmp/codex/tutorial-lesson-comparison";

const callers = [
  {
    id: "economics",
    route: "/tutorials/economics/demand-shift/#kp-checkpoint-movement-verified",
    root: "[data-kp-economics-demand-shift-tutorial]",
    settled: async (page: Page): Promise<void> => {
      const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
      await expect(root).toHaveAttribute(
        "data-kp-economics-tutorial-demand-progress",
        "1.000"
      );
      await expect(root).toHaveAttribute(
        "data-kp-economics-tutorial-supply-movement-progress",
        "1.000"
      );
    }
  },
  {
    id: "lisp",
    route: "/tutorials/programming/lisp-function-application/#kp-checkpoint-result-settled",
    root: "[data-kp-lisp-function-application-tutorial]",
    settled: async (page: Page): Promise<void> => {
      await expect(page.locator("[data-kp-lisp-function-application-tutorial]"))
        .toHaveAttribute("data-kp-lisp-tutorial-progress", "1.0000");
      await expect(page.locator('[data-kp-lisp-native-code="result"]'))
        .toBeVisible();
    }
  }
] as const;

interface LessonGeometry {
  readonly id: string;
  readonly viewport: { readonly width: number; readonly height: number };
  readonly shell: { readonly left: number; readonly right: number };
  readonly layoutDisplay: string;
  readonly tocVisible: boolean;
  readonly toc: { readonly left: number; readonly right: number };
  readonly prose: {
    readonly left: number;
    readonly right: number;
    readonly lineHeightRatio: number;
  };
  readonly stage: {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly position: string;
  };
  readonly shellTokens: Readonly<Record<string, string>>;
  readonly headingCount: number;
  readonly motionBlockCount: number;
  readonly scrubBarCount: number;
}

test("economics and Lisp expose one shared lesson shell at review checkpoints", async ({
  page
}, testInfo) => {
  await mkdir(evidenceDirectory, { recursive: true });
  const comparison: LessonGeometry[] = [];

  for (const caller of callers) {
    await page.setViewportSize({ width: 1_440, height: 900 });
    await page.goto(caller.route);
    await caller.settled(page);
    await settleLayout(page);

    const geometry = await captureGeometry(page, caller.id, caller.root);
    comparison.push(geometry);
    expectSharedWideShell(geometry);
    await page.screenshot({
      path: `${evidenceDirectory}/${caller.id}-wide-settled.png`,
      fullPage: false
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(caller.route);
    await caller.settled(page);
    await settleLayout(page);
    const phone = await captureGeometry(page, `${caller.id}-phone`, caller.root);
    comparison.push(phone);
    expectSharedPhoneShell(phone);
    await page.screenshot({
      path: `${evidenceDirectory}/${caller.id}-phone-settled.png`,
      fullPage: false
    });
  }

  const evidence = JSON.stringify({ callers: comparison }, null, 2);
  await writeFile(`${evidenceDirectory}/comparison.json`, `${evidence}\n`, "utf8");
  await testInfo.attach("tutorial-lesson-comparison", {
    body: evidence,
    contentType: "application/json"
  });
});

async function settleLayout(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => {
      let remaining = 5;
      const next = (): void => {
        remaining -= 1;
        if (remaining === 0) resolve();
        else requestAnimationFrame(next);
      };
      requestAnimationFrame(next);
    });
  });
}

async function captureGeometry(
  page: Page,
  id: string,
  rootSelector: string
): Promise<LessonGeometry> {
  return page.locator(rootSelector).evaluate((root, callerId) => {
    const required = (selector: string): HTMLElement => {
      const element = root.querySelector<HTMLElement>(selector);
      if (element === null) throw new Error(`Missing ${selector}`);
      return element;
    };
    const bounds = (element: Element): { left: number; right: number; top: number } => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top };
    };
    const layout = required(".kp-tutorial-shell__layout");
    const toc = required("kp-tutorial-toc");
    const prose = required(".kp-tutorial-shell__prose");
    const stage = required(".kp-tutorial-shell__stage");
    const bodyParagraph = required(
      ".kp-economics-tutorial__passage p, .kp-lisp-tutorial__passage p"
    );
    const proseStyle = getComputedStyle(bodyParagraph);
    const rootStyle = getComputedStyle(root);
    return {
      id: callerId,
      viewport: { width: innerWidth, height: innerHeight },
      shell: bounds(root),
      layoutDisplay: getComputedStyle(layout).display,
      tocVisible: toc.getClientRects().length > 0,
      toc: bounds(toc),
      prose: {
        ...bounds(prose),
        lineHeightRatio: Number.parseFloat(proseStyle.lineHeight) /
          Number.parseFloat(proseStyle.fontSize)
      },
      stage: {
        ...bounds(stage),
        position: getComputedStyle(stage).position
      },
      shellTokens: {
        ink: rootStyle.getPropertyValue("--kp-lesson-ink").trim(),
        muted: rootStyle.getPropertyValue("--kp-lesson-muted").trim(),
        paper: rootStyle.getPropertyValue("--kp-lesson-paper").trim(),
        rail: rootStyle.getPropertyValue("--kp-lesson-reading-rail").trim()
      },
      headingCount: root.querySelectorAll("h3").length,
      motionBlockCount: root.querySelectorAll("[data-kp-tutorial-motion-block]").length,
      scrubBarCount: root.querySelectorAll("kp-tutorial-scrub-bar").length
    };
  }, id);
}

function expectSharedWideShell(geometry: LessonGeometry): void {
  expect(geometry.layoutDisplay).toBe("grid");
  expect(geometry.tocVisible).toBe(true);
  expect(geometry.stage.position).toBe("sticky");
  expect(geometry.toc.right).toBeLessThanOrEqual(geometry.prose.left - 24);
  expect(geometry.prose.right).toBeLessThanOrEqual(geometry.stage.left - 40);
  expect(geometry.prose.lineHeightRatio).toBeGreaterThanOrEqual(1.65);
  expect(geometry.headingCount).toBeGreaterThanOrEqual(3);
  expect(geometry.motionBlockCount).toBe(expectedMotionBlocks(geometry.id));
  expect(geometry.scrubBarCount).toBe(expectedMotionBlocks(geometry.id));
  expect(Object.values(geometry.shellTokens).every(Boolean)).toBe(true);
}

function expectSharedPhoneShell(geometry: LessonGeometry): void {
  expect(["block", "flex"]).toContain(geometry.layoutDisplay);
  if (geometry.tocVisible) {
    expect(geometry.toc.left).toBeGreaterThanOrEqual(0);
    expect(geometry.toc.right).toBeLessThanOrEqual(geometry.viewport.width);
  }
  expect(["fixed", "sticky"]).toContain(geometry.stage.position);
  expect(geometry.stage.top).toBeCloseTo(0, 0);
  expect(geometry.prose.lineHeightRatio).toBeGreaterThanOrEqual(1.65);
  expect(geometry.motionBlockCount).toBe(expectedMotionBlocks(geometry.id));
  expect(geometry.scrubBarCount).toBe(expectedMotionBlocks(geometry.id));
  expect(Object.values(geometry.shellTokens).every(Boolean)).toBe(true);
}

function expectedMotionBlocks(id: string): number {
  return id.startsWith("lisp") ? 3 : 2;
}
