import { expect, test } from "@playwright/test";

const conceptPath = "/concepts/mathematics/linear-equations/solve-with-balance";

test("opening story keeps searchable prose before its canonical animation stage", async ({ page }) => {
  await page.goto(conceptPath);
  const story = page.locator("[data-kp-symbolic-story]");
  await expect(story.getByRole("heading", { name: "Solve x + 3 = 7" })).toBeVisible();
  await expect(story).toContainText("Subtract 3 from both sides");
  await expect(story.locator("[data-kp-symbolic-story-beat]")).toHaveCount(4);
  await expect(story.locator("[data-kp-symbolic-story-player]"))
    .toHaveAttribute("data-kp-editor-animation-id", "animation.linear-solve.solve-x");
  await expect(story.locator(".editor-animation-player__controls")).toBeHidden();
  await expect(page.locator("[data-kp-concept-viewport] [data-kp-linear-equation-coordinated-stage]"))
    .toHaveCount(1);

  const ordered = await story.evaluate((element) => {
    const explanation = element.querySelector("[data-kp-symbolic-story-explanation]");
    const visual = element.querySelector("[data-kp-symbolic-story-visual]");
    return Boolean(
      (explanation?.compareDocumentPosition(visual!) ?? 0) & Node.DOCUMENT_POSITION_FOLLOWING
    );
  });
  expect(ordered).toBe(true);
  expect(await page.evaluate(() => (
    window as typeof window & { find(text: string): boolean }
  ).find("The two −3 terms enter together"))).toBe(true);
});

test("desktop story uses ordinary document scroll with left prose and a sticky right stage", async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(conceptPath);
  await page.locator("[data-kp-symbolic-story-player]").waitFor();

  const layout = await page.locator("[data-kp-symbolic-story]").evaluate((story) => {
    const explanation = story.querySelector<HTMLElement>("[data-kp-symbolic-story-explanation]")!;
    const visual = story.querySelector<HTMLElement>("[data-kp-symbolic-story-visual]")!;
    const firstBeat = story.querySelector<HTMLElement>("[data-kp-symbolic-story-beat]")!;
    const secondary = document.querySelector<HTMLElement>("[data-kp-concept-secondary-surface]")!;
    return {
      columns: getComputedStyle(story).gridTemplateColumns.split(" ").length,
      explanationLeft: explanation.getBoundingClientRect().left,
      visualLeft: visual.getBoundingClientRect().left,
      visualPosition: getComputedStyle(visual).position,
      explanationOverflow: getComputedStyle(explanation).overflowY,
      firstBeatHeight: firstBeat.getBoundingClientRect().height,
      storyBottom: story.getBoundingClientRect().bottom,
      secondaryTop: secondary.getBoundingClientRect().top,
      documentScrolls: document.documentElement.scrollHeight > innerHeight
    };
  });

  expect(layout.columns).toBe(2);
  expect(layout.explanationLeft).toBeLessThan(layout.visualLeft);
  expect(layout.visualPosition).toBe("sticky");
  expect(layout.explanationOverflow).toBe("visible");
  expect(layout.firstBeatHeight).toBeGreaterThan(250);
  expect(layout.secondaryTop).toBeGreaterThan(layout.storyBottom);
  expect(layout.documentScrolls).toBe(true);
  await expect(page.getByRole("heading", { name: "Explore the harder example" })).toBeVisible();
});

test("scrolling selects discrete story beats without changing the harder example timeline", async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(conceptPath);
  const player = page.locator("[data-kp-symbolic-story-player]");
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "0");

  await page.locator('[data-kp-symbolic-story-beat="subtract-both-sides"]').evaluate((beat) => {
    beat.scrollIntoView({ block: "center" });
  });

  await expect(page).toHaveURL(/p\.story=subtract-both-sides/);
  await expect(page.locator('[data-kp-symbolic-story-beat="subtract-both-sides"]'))
    .toHaveAttribute("aria-current", "step");
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "0.333");
  expect(new URL(page.url()).searchParams.get("checkpoint")).toBe("start");
  expect(new URL(page.url()).searchParams.get("t")).toBe("0");

  const salience = await player.evaluate((element) => {
    const visual = element.closest("[data-kp-symbolic-story-visual]")!.getBoundingClientRect();
    const owners = [...element.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )].filter((owner) => Number.parseFloat(getComputedStyle(owner).opacity) > 0.05);
    const owner = (id: string) => element.querySelector<HTMLElement>(
      `[data-kp-equation-material-owner-id="${id}"] .editor-equation-stage__material-visual`
    )!;
    const ink = (id: string) => {
      const visualOwner = owner(id);
      const glyph = visualOwner.querySelector<HTMLElement>(".mord,.mbin,.mrel,.mathnormal");
      return getComputedStyle(glyph ?? visualOwner).color;
    };
    return {
      operation: ink("linear-solve.lhs.minus3"),
      persistent: ink("linear-solve.lhs.x"),
      equality: ink("linear-solve.equals"),
      left: Math.min(...owners.map((item) => item.getBoundingClientRect().left)),
      right: Math.max(...owners.map((item) => item.getBoundingClientRect().right)),
      visualLeft: visual.left,
      visualRight: visual.right
    };
  });
  expect(salience.operation).toBe("rgb(223, 112, 71)");
  expect(salience.persistent).toBe("rgb(31, 99, 113)");
  expect(salience.equality).toBe("rgb(22, 35, 29)");
  expect(salience.left).toBeGreaterThanOrEqual(salience.visualLeft);
  expect(salience.right).toBeLessThanOrEqual(salience.visualRight);

  await page.evaluate(() => window.scrollBy({ top: 60 }));
  await page.waitForTimeout(100);
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "0.333");
});

test("a story URL restores its prose beat and kinetic frame", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(conceptPath);
  await expect(page).toHaveURL(/route=1/);
  const direct = new URL(page.url());
  direct.searchParams.set("p.story", "cancel-opposites");
  await page.goto(direct.href);

  const activeBeat = page.locator('[data-kp-symbolic-story-beat="cancel-opposites"]');
  await expect(activeBeat).toHaveAttribute("aria-current", "step");
  await expect(page.locator("[data-kp-symbolic-story-player]"))
    .toHaveAttribute("data-kp-editor-animation-progress", "0.667");
  await expect(activeBeat).toBeInViewport();
  await expect(page.locator("[data-kp-concept-secondary-surface]"))
    .not.toBeInViewport();
});
