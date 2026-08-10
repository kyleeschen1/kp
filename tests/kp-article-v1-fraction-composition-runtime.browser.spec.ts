import { expect, test } from "@playwright/test";

const route = "/tutorials/algebra/fraction-composition/";

test("algebra article mounts the canonical host for its first range over the static projection", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  const host = page.locator("[data-kp-algebra-stage-host]");
  await host.scrollIntoViewIfNeeded();

  await expect(page.locator("[data-kp-editor-animation-player]")).toHaveCount(0);
  await expect(page.locator("[data-kp-algebra-runtime-stage]")).toHaveCount(0);
  const canonical = host.locator(
    '[data-kp-canonical-equation-host="chrome-free-v1"]'
  );
  await expect(canonical).toHaveAttribute(
    "data-kp-reader-canonical-equation-session-active",
    "true"
  );
  await expect(host).toHaveAttribute(
    "data-kp-algebra-canonical-range",
    "distribute-and-normalize"
  );
  await expect(host).toHaveAttribute(
    "data-kp-algebra-canonical-global-progress",
    "0"
  );
  await expect(host).toHaveAttribute(
    "data-kp-algebra-canonical-local-progress",
    "0"
  );
  await expect(host).toHaveAttribute(
    "data-kp-algebra-canonical-range-status",
    "idle"
  );
  await expect(host.locator("[data-kp-algebra-range-transport]")).toHaveCount(1);
  await expect(canonical).toHaveAttribute(
    "data-kp-reader-native-endpoint",
    "source"
  );
  await expect(host.locator("[data-kp-algebra-stage-fallback]")).toBeHidden();
  await expect(page.locator(
    "[data-kp-algebra-fraction-composition-publication] svg[role='img']"
  )).toHaveCount(6);
});

test("one Article transport scrubs and plays the named range on the canonical full clock", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  const host = page.locator("[data-kp-algebra-stage-host]");
  await expect(host).toHaveAttribute(
    "data-kp-algebra-canonical-clock",
    "reader.article.distribute-and-normalize.canonical-full-timeline"
  );
  const scrubber = host.locator("[data-kp-algebra-range-scrubber]");
  await scrubber.fill("500");
  await expect(host).toHaveAttribute(
    "data-kp-algebra-canonical-local-progress",
    "500"
  );
  await expect(host).toHaveAttribute(
    "data-kp-algebra-canonical-global-progress",
    /^(?:7[67]|77)$/u
  );
  await host.locator('[data-kp-algebra-range-action="replay"]').click();
  await expect(host).toHaveAttribute(
    "data-kp-algebra-canonical-range-status",
    "playing"
  );
  await expect(host).toHaveAttribute(
    "data-kp-algebra-canonical-local-progress",
    "1000",
    { timeout: 4_000 }
  );
  const canonical = host.locator(
    '[data-kp-canonical-equation-host="chrome-free-v1"]'
  );
  await expect(canonical).toHaveAttribute(
    "data-kp-reader-accessible-equation-state",
    "fraction-solve.state.normalized"
  );
  await expect(canonical).toHaveAttribute(
    "data-kp-reader-native-endpoint-passed",
    "true"
  );
  await expect(page.locator("[data-kp-editor-animation-player]")).toHaveCount(0);
});

test("semantic links remain searchable and pinnable without becoming timeline controls", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  const publication = page.locator(
    "[data-kp-algebra-fraction-composition-publication]"
  );
  const factor = page.getByRole("link", { name: "factor", exact: true }).first();
  const host = page.locator("[data-kp-algebra-stage-host]");
  await host.locator("[data-kp-algebra-range-scrubber]").fill("500");
  await expect(host).toHaveAttribute(
    "data-kp-algebra-canonical-global-progress",
    /^(?:7[67]|77)$/u
  );

  await factor.hover();
  await expect(publication).toHaveAttribute(
    "data-kp-article-semantic-focus-source",
    "pointer"
  );
  await factor.click();
  await page.locator("h1").click();
  await expect(factor).toHaveAttribute("data-kp-article-semantic-pinned", "");
  await expect(publication).toHaveAttribute(
    "data-kp-article-semantic-focus-source",
    "url"
  );
  await expect(page.locator("[data-kp-editor-animation-player]")).toHaveCount(0);
  await expect(host).toHaveAttribute(
    "data-kp-algebra-canonical-global-progress",
    /^(?:7[67]|77)$/u
  );

  await page.keyboard.press("Escape");
  await expect(factor).not.toHaveAttribute("data-kp-article-semantic-pinned", "");
});

test("checkpoint URLs restore static navigation directly across browser history", async ({
  page
}) => {
  await page.goto(`${route}#kp-ref:solve/normalized`, {
    waitUntil: "domcontentloaded"
  });
  const host = page.locator("[data-kp-algebra-stage-host]");
  const normalized = page.locator(
    '[data-kp-algebra-checkpoint-link="normalized"]'
  );
  await expect(host).toHaveAttribute("data-kp-algebra-static-checkpoint", "normalized");
  await expect(normalized).toHaveAttribute("aria-current", "step");
  await expect(host).toHaveAttribute(
    "data-kp-algebra-canonical-global-progress",
    "154"
  );
  await expect(host).toHaveAttribute(
    "data-kp-algebra-canonical-clock-source",
    "url"
  );
  await expect(host.locator(
    '[data-kp-canonical-equation-host="chrome-free-v1"]'
  )).toHaveAttribute(
    "data-kp-reader-accessible-equation-state",
    "fraction-solve.state.normalized"
  );

  await page.locator('[data-kp-algebra-checkpoint-link="solved"]').click();
  await expect(page).toHaveURL(/#kp-ref:solve\/solved$/u);
  await expect(host).toHaveAttribute("data-kp-algebra-static-checkpoint", "solved");
  await expect(host).toHaveAttribute(
    "data-kp-algebra-canonical-global-progress",
    "1000"
  );
  await expect(host).toHaveAttribute(
    "data-kp-algebra-canonical-range-status",
    "paused"
  );
  await page.goBack();
  await expect(host).toHaveAttribute("data-kp-algebra-static-checkpoint", "normalized");
  await expect(host).toHaveAttribute(
    "data-kp-algebra-canonical-global-progress",
    "154"
  );
  await page.goForward();
  await expect(host).toHaveAttribute("data-kp-algebra-static-checkpoint", "solved");
  await expect(host).toHaveAttribute(
    "data-kp-algebra-canonical-global-progress",
    "1000"
  );
  await expect(page.locator("[data-kp-editor-animation-player]")).toHaveCount(0);
});

test("reduced motion preserves the same static checkpoint endpoint", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${route}#kp-ref:solve/difference-simplified`, {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator("[data-kp-algebra-stage-host]")).toHaveAttribute(
    "data-kp-algebra-static-checkpoint",
    "difference-simplified"
  );
  await expect(page.locator("[data-kp-algebra-stage-host]")).toHaveAttribute(
    "data-kp-algebra-canonical-clock-source",
    "url"
  );
  await expect(page.locator("[data-kp-editor-animation-player]")).toHaveCount(0);
});
