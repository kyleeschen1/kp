import { expect, test } from "@playwright/test";

const vectorId = "animation.dot-projection.basic";
const economicsId = "animation.economics.supply-demand-equilibrium-shift";

test("URL-backed catalogue settings and history restore without document reload", async ({
  page
}) => {
  const documentRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "document") {
      documentRequests.push(request.url());
    }
  });
  await page.goto(
    `/?artifact=${vectorId}` +
    "&theme=dark&style=restrained-editorial&focus=no-depth&playhead=0.41"
  );

  const shell = page.locator("[data-kp-svelte-catalogue-shell]");
  await expect(shell).toHaveAttribute(
    "data-kp-animation-catalogue-theme",
    "dark"
  );
  await expect(shell).toHaveAttribute(
    "data-kp-animation-catalogue-style",
    "restrained-editorial"
  );
  await expect(shell).toHaveAttribute(
    "data-kp-animation-catalogue-focus",
    "no-depth"
  );
  const vectorPlayer = shell.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${vectorId}"]`
  );
  await expect(vectorPlayer).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await expect(vectorPlayer).toHaveAttribute(
    "data-kp-editor-animation-progress",
    "0.41"
  );
  await expect(vectorPlayer).toHaveAttribute(
    "data-kp-editor-animation-gestalt-selected-style",
    "kp.restrained-editorial@1.0.0"
  );
  await expect(vectorPlayer).toHaveAttribute(
    "data-kp-editor-animation-focus-experiment",
    "no-depth"
  );

  await page.evaluate(() => {
    (window as Window & { __kpUrlStateIdentity?: string })
      .__kpUrlStateIdentity = "stable";
    const url = new URL(window.location.href);
    url.searchParams.set("view", "coverage");
    window.history.pushState(null, "", url);
    window.dispatchEvent(new CustomEvent(
      "kp-animation-development-location"
    ));
  });
  const coverage = page.getByRole("main", {
    name: "Transformation coverage"
  });
  await expect(coverage).toBeVisible();
  await expect(coverage).toHaveAttribute(
    "data-kp-animation-coverage-theme",
    "dark"
  );
  await page.goBack();
  await expect(shell).toHaveAttribute(
    "data-kp-animation-catalogue-selection",
    vectorId
  );
  await expect(shell.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${vectorId}"]`
  )).toHaveAttribute("data-kp-editor-animation-progress", "0.41");

  await shell.getByRole("combobox", { name: "Inspector view" })
    .selectOption("tuning");
  const style = shell.locator(
    '[data-kp-animation-catalogue-tuning="gestalt-style"]'
  );
  const focus = shell.locator(
    '[data-kp-animation-catalogue-tuning="focus-experiment"]'
  );
  await expect(style).toHaveValue("kp.restrained-editorial@1.0.0");
  await expect(focus).toHaveValue("no-depth");
  await style.selectOption("kp.organic-subtle@1.0.0");
  await focus.selectOption("elevated");
  await expect.poll(() => new URL(page.url()).searchParams.get("style"))
    .toBe("organic-subtle");
  await expect.poll(() => new URL(page.url()).searchParams.get("focus"))
    .toBe("elevated");
  expect(new URL(page.url()).searchParams.get("view"))
    .toBe("animation-catalogue");

  await vectorPlayer.locator('[data-action="seek-editor-animation"]')
    .fill("0.57");
  await expect.poll(() => new URL(page.url()).searchParams.get("playhead"))
    .toBe("0.57");
  await shell.locator(
    `[data-kp-animation-catalogue-row="${economicsId}"] a`
  ).click();
  await expect(shell).toHaveAttribute(
    "data-kp-animation-catalogue-selection",
    economicsId
  );
  expect(new URL(page.url()).searchParams.get("theme")).toBe("dark");
  expect(new URL(page.url()).searchParams.get("style"))
    .toBe("organic-subtle");
  expect(new URL(page.url()).searchParams.get("focus")).toBe("elevated");

  await page.goBack();
  await expect(shell).toHaveAttribute(
    "data-kp-animation-catalogue-selection",
    vectorId
  );
  await expect(shell.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${vectorId}"]`
  )).toHaveAttribute("data-kp-editor-animation-progress", "0.57");
  expect(await page.evaluate(() => (
    window as Window & { __kpUrlStateIdentity?: string }
  ).__kpUrlStateIdentity)).toBe("stable");
  expect(documentRequests).toHaveLength(1);
});

test("frame-rate playhead events produce a bounded coarse URL projection", async ({
  page
}) => {
  await page.addInitScript(() => {
    const original = window.history.replaceState.bind(window.history);
    (window as Window & { __kpReplaceStateCalls?: number })
      .__kpReplaceStateCalls = 0;
    window.history.replaceState = (state, unused, url) => {
      (window as Window & { __kpReplaceStateCalls?: number })
        .__kpReplaceStateCalls! += 1;
      original(state, unused, url);
    };
  });
  await page.goto(`/?artifact=${vectorId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${vectorId}"]`
  );
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await page.evaluate(() => {
    (window as Window & { __kpReplaceStateCalls?: number })
      .__kpReplaceStateCalls = 0;
  });

  await player.evaluate((element) => {
    const seek = element.querySelector<HTMLInputElement>(
      '[data-action="seek-editor-animation"]'
    );
    if (seek === null) throw new Error("Player has no seek control.");
    for (let index = 0; index <= 120; index += 1) {
      seek.value = String(index / 120);
      seek.dispatchEvent(new Event("input", { bubbles: true }));
    }
    seek.dispatchEvent(new Event("change", { bubbles: true }));
  });

  await expect.poll(() =>
    new URL(page.url()).searchParams.get("playhead")
  ).toBe("1");
  const replacements = await page.evaluate(() =>
    (window as Window & { __kpReplaceStateCalls?: number })
      .__kpReplaceStateCalls ?? 0
  );
  expect(replacements).toBeLessThanOrEqual(2);
});
