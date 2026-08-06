import { expect, test } from "@playwright/test";

const cases = [
  { id: "light-wide", theme: "light", width: 1_100, height: 800 },
  { id: "dark-wide", theme: "dark", width: 1_100, height: 800 },
  { id: "light-phone", theme: "light", width: 390, height: 844 },
  { id: "dark-phone", theme: "dark", width: 390, height: 844 },
  {
    id: "forced-dark-wide",
    theme: "dark",
    width: 1_100,
    height: 800,
    forcedColors: true
  }
] as const;

for (const candidate of cases) {
  test(`fraction salience review ${candidate.id}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({
      width: candidate.width,
      height: candidate.height
    });
    if ("forcedColors" in candidate && candidate.forcedColors) {
      await page.emulateMedia({ forcedColors: "active" });
    }
    await page.goto(
      "/reader/fraction-composition/?" + new URLSearchParams({
        kpLesson: "lesson.algebra.fraction-composition",
        kpVersion: "1",
        kpProgress: "620",
        kpMotion: "full",
        kpProfile: "standard",
        kpFoldMode: "expanded",
        kpTheme: candidate.theme
      }),
      { waitUntil: "domcontentloaded" }
    );
    const body = page.locator("body");
    const stage = page.locator("[data-kp-reader-equation-stage]");
    await expect(body).toHaveAttribute("data-kp-reader-hydrated", "true");
    await expect(body).toHaveAttribute("data-kp-visual-theme", candidate.theme);
    await expect(stage).toHaveAttribute(
      "data-kp-reader-canonical-equation-session-active",
      "true"
    );
    await expect(stage).toHaveAttribute(
      "data-kp-reader-semantic-salience-scene",
      /phaseProgressPermille/
    );
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise<void>((resolve) => requestAnimationFrame(() =>
        requestAnimationFrame(() => resolve())
      ));
    });

    const evidence = await stage.evaluate((element) => {
      const active = element.querySelector<HTMLElement>(
        "[data-kp-reader-transition-active='true']"
      );
      if (active === null) throw new Error("Missing active fraction transition.");
      const levels = [...active.querySelectorAll<HTMLElement>(
        "[data-kp-fraction-salience-bound]"
      )].reduce<Record<string, number>>((counts, object) => {
        const level = object.dataset["kpSemanticSalienceLevel"] ?? "missing";
        counts[level] = (counts[level] ?? 0) + 1;
        return counts;
      }, {});
      const kicker = element.querySelector<HTMLElement>(
        "[data-kp-reader-stage-kicker]"
      )?.getBoundingClientRect();
      const controls = element.querySelector<HTMLElement>(
        ".kp-reader-equation-controls"
      )?.getBoundingClientRect();
      return {
        levels,
        stage: element.getBoundingClientRect().toJSON(),
        viewport: {
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth
        },
        headerOverlap: kicker !== undefined && controls !== undefined &&
          kicker.right > controls.left && kicker.left < controls.right &&
          kicker.bottom > controls.top && kicker.top < controls.bottom,
        contextOpacities: [...active.querySelectorAll<HTMLElement>(
          '[data-kp-semantic-salience-level="context"]'
        )].map((element) => getComputedStyle(element).opacity),
        focusedUnderlines: [...active.querySelectorAll<HTMLElement>(
          '[data-kp-semantic-salience-level="focus"]'
        )].filter((element) =>
          getComputedStyle(element).textDecorationLine.includes("underline")
        ).length,
        theme: element.ownerDocument.body.dataset["kpVisualTheme"]
      };
    });
    expect(evidence.levels["focus"]).toBeGreaterThan(0);
    expect(evidence.levels["context"]).toBeGreaterThan(0);
    expect(evidence.viewport.scrollWidth).toBeLessThanOrEqual(
      evidence.viewport.clientWidth + 1
    );
    expect(evidence.stage.width).toBeGreaterThan(0);
    expect(evidence.stage.height).toBeGreaterThan(0);
    expect(evidence.headerOverlap).toBe(false);
    if ("forcedColors" in candidate && candidate.forcedColors) {
      expect(evidence.contextOpacities.every((opacity) => opacity === "1"))
        .toBe(true);
      expect(evidence.focusedUnderlines).toBeGreaterThan(0);
    }
    expect(errors).toEqual([]);

    await stage.screenshot({
      path: `tmp/codex/fraction-composition-salience/${candidate.id}.png`,
      animations: "disabled"
    });
  });
}
