import { chromium, type Locator } from "playwright";

const animationId =
  "animation.algebra.exponential-homomorphism.difference-to-quotient";
const url = new URL("http://127.0.0.1:8000/");
url.searchParams.set("artifact", animationId);

const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ reducedMotion: "no-preference" });
  const page = await context.newPage();
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const response = await page.goto(url.toString(), {
    waitUntil: "domcontentloaded"
  });
  if (response === null || !response.ok()) {
    throw new Error(
      `Live catalogue returned ${response?.status() ?? "no response"}.`
    );
  }
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-exponential-homomorphism-stage]");
  await waitForReady(stage);
  const before = await sample(player, stage);
  await player.getByRole("button", { name: "Play animation" }).click();
  await page.waitForTimeout(1_200);
  const during = await sample(player, stage);
  await page.waitForTimeout(500);
  const after = await sample(player, stage);
  await page.waitForFunction(
    (selectedAnimationId) => document.querySelector<HTMLElement>(
      `[data-kp-editor-animation-player]` +
      `[data-kp-editor-animation-id="${selectedAnimationId}"]`
    )?.dataset["kpEditorAnimationStatus"] === "complete",
    animationId,
    { timeout: 7_000 }
  );
  const completed = await sample(player, stage);

  const report = Object.freeze({
    url: url.toString(),
    responseStatus: response.status(),
    before,
    during,
    after,
    completed,
    pageErrors
  });
  console.log(JSON.stringify(report, null, 2));
  if (
    before.stageProgress >= during.stageProgress ||
    during.stageProgress >= after.stageProgress ||
    JSON.stringify(before.paintSignature) ===
      JSON.stringify(during.paintSignature) ||
    completed.playerStatus !== "complete" ||
    completed.stageProgress !== 1 ||
    pageErrors.length > 0
  ) {
    throw new Error(
      "The live quotient did not advance through distinct painted frames."
    );
  }
  await context.close();
} finally {
  await browser.close();
}

async function sample(player: Locator, stage: Locator) {
  const stageRect = await stage.evaluate((root) => {
    const rect = root.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  return Object.freeze({
    playerStatus: await player.getAttribute("data-kp-editor-animation-status"),
    playerProgress: Number(await player.getAttribute(
      "data-kp-editor-animation-progress"
    )),
    stageStatus: await stage.getAttribute(
      "data-kp-exponential-homomorphism-stage"
    ),
    stageProgress: Number(await stage.getAttribute(
      "data-kp-exponential-homomorphism-progress"
    )),
    accessibilityPreference: await player.getAttribute(
      "data-kp-editor-animation-accessibility-preference"
    ),
    accessibilityMode: await player.getAttribute(
      "data-kp-editor-animation-accessibility-mode"
    ),
    measurementRevision: Number(await stage.getAttribute(
      "data-kp-exponential-homomorphism-measurement-revision"
    )),
    stageRect,
    paintSignature: await stage.evaluate((root) =>
      [...root.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-owner-id]"
      )].map((owner) => ({
        id: owner.dataset["kpEquationMaterialOwnerId"],
        opacity: owner.style.opacity,
        transform: owner.style.transform
      }))
    )
  });
}

async function waitForReady(stage: Locator): Promise<void> {
  await stage.waitFor();
  await stage.evaluate((root) => new Promise<void>((resolve, reject) => {
    const state = (): string | undefined =>
      root.dataset["kpExponentialHomomorphismStage"];
    if (state() === "ready") return resolve();
    const timeout = window.setTimeout(() => {
      observer.disconnect();
      reject(new Error(
        root.dataset["kpExponentialHomomorphismError"] ??
        "Timed out preparing the live exponential quotient."
      ));
    }, 8_000);
    const observer = new MutationObserver(() => {
      if (state() === "preparing") return;
      window.clearTimeout(timeout);
      observer.disconnect();
      if (state() === "ready") resolve();
      else reject(new Error(
        root.dataset["kpExponentialHomomorphismError"] ??
        "Live exponential quotient preparation failed."
      ));
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-kp-exponential-homomorphism-stage"]
    });
  }));
}
