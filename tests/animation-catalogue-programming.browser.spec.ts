import { expect, test } from "@playwright/test";

const additionId = "animation.programming.add.execution-trace";
const comparisonId = "animation.comparison.linear-solve-programming";

test("addition trace paints exact source and synchronized verified state", async ({
  page
}) => {
  await page.goto(`/?artifact=${additionId}`);
  await waitForPaint(page, additionId);

  const player = page.locator("[data-kp-editor-animation-player]");
  const slot = player.locator(
    '[data-kp-editor-animation-surface-slot="programming"]'
  );
  const trace = slot.locator("[data-kp-editor-programming-trace]");
  await expect(page.locator("[data-kp-animation-catalogue]"))
    .toHaveAttribute("data-kp-svelte-catalogue-shell", "");
  await expect(page.locator("[data-kp-animation-catalogue] iframe"))
    .toHaveCount(0);
  await expect(slot).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.programming.trace"
  );
  await expect(slot).toHaveAttribute(
    "data-kp-editor-animation-adapter-status",
    "ready"
  );
  await expect(trace).toContainText("export function add(a: number, b: number)");
  await expect(trace).toHaveAttribute(
    "data-kp-editor-programming-step",
    "step.programming.add.call"
  );
  await expect(trace.locator(
    '[data-kp-editor-programming-channel="locals"]'
  )).toContainText("a = 2");
  await expect(trace.locator(
    '[data-kp-editor-programming-channel="output"]'
  )).not.toContainText("4");

  await seek(page, 0.75);
  await expect(trace).toHaveAttribute(
    "data-kp-editor-programming-step",
    "step.programming.add.return"
  );
  await expect(trace.locator(
    "[data-kp-editor-programming-source-focus]"
  )).toContainText("return a + b;");
  await expect(trace.locator(
    '[data-kp-editor-programming-channel="locals"]'
  )).toContainText("return = 4");

  await seek(page, 1);
  await expect(trace).toHaveAttribute(
    "data-kp-editor-programming-step",
    "step.programming.add.output"
  );
  await expect(trace.locator(
    '[data-kp-editor-programming-channel="output"]'
  )).toContainText("4");
});

test("rewind mirrors direct seek and reduced motion preserves trace state", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/?artifact=${additionId}`);
  await waitForPaint(page, additionId);
  const player = page.locator("[data-kp-editor-animation-player]");
  const trace = page.locator("[data-kp-editor-programming-trace]");

  await seek(page, 0.25);
  await expect(trace).toHaveAttribute(
    "data-kp-editor-programming-step",
    "step.programming.add.call"
  );
  await expect(trace).toHaveAttribute(
    "data-kp-editor-programming-mode",
    "reduced-motion"
  );
  await player.focus();
  await player.press("r");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-direction",
    "rewind"
  );
  await expect(trace).toHaveAttribute(
    "data-kp-editor-programming-step",
    "step.programming.add.call"
  );
});

test("the exact comparison caller closes both native slots on one clock", async ({
  page
}) => {
  await page.goto(`/?artifact=${comparisonId}`);
  await waitForPaint(page, comparisonId);
  const player = page.locator("[data-kp-editor-animation-player]");

  await expect(player.locator(
    '[data-kp-editor-animation-surface-slot="equation"]'
  )).toHaveAttribute("data-kp-editor-animation-adapter-status", "ready");
  await expect(player.locator(
    '[data-kp-editor-animation-surface-slot="programming"]'
  )).toHaveAttribute(
    "data-kp-editor-animation-adapter-id",
    "editor-animation-surface.programming.trace"
  );
  await expect(page.locator("[data-kp-animation-catalogue]"))
    .toHaveAttribute("data-kp-svelte-catalogue-shell", "");
  await seek(page, 1);
  await expect(player.locator(
    '[data-kp-editor-programming-channel="output"]'
  )).toContainText("4");
});

test("full editor static mode projects the exact settled accessible output", async ({
  page
}) => {
  await page.goto(
    "/?view=animation-library-host&" +
    "animation=editor-animation.animation.programming.add.execution-trace"
  );
  const player = page.locator("[data-kp-editor-animation-player]");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await player.locator(
    "[data-kp-editor-animation-accessibility-control]"
  ).selectOption("static");
  const trace = player.locator("[data-kp-editor-programming-trace]");

  await expect(trace).toHaveAttribute(
    "data-kp-editor-programming-mode",
    "static"
  );
  await expect(trace).toHaveAttribute(
    "data-kp-editor-programming-step",
    "step.programming.add.output"
  );
  await expect(trace.locator(
    '[data-kp-editor-programming-channel="output"]'
  )).toContainText("4");
  await expect(trace.locator(
    "[data-kp-editor-programming-accessible-state]"
  )).toContainText("Output: 4.");
});

async function seek(
  page: import("@playwright/test").Page,
  progress: number
): Promise<void> {
  await page.locator('[data-action="seek-editor-animation"]').evaluate(
    (input, value) => {
      const range = input as HTMLInputElement;
      range.value = String(value);
      range.dispatchEvent(new Event("input", { bubbles: true }));
    },
    progress
  );
}

async function waitForPaint(
  page: import("@playwright/test").Page,
  animationId: string
): Promise<void> {
  await page.waitForFunction((expectedAnimationId) => {
    const shell = document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue]"
    );
    return shell?.dataset["kpAnimationCatalogueSelection"] ===
      expectedAnimationId &&
      shell.dataset["kpAnimationCatalogueHostOutcome"] === "painted";
  }, animationId);
}
