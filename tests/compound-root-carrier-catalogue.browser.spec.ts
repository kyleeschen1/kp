import { expect, test, type Locator } from "@playwright/test";

const animationId =
  "animation.algebra.radical.compound-carrier-normalization";

test("compound carrier seeks continuously, rewinds, and survives resize", async ({
  page
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`/?artifact=${animationId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-compound-root-carrier-stage]");
  const seek = player.locator('[data-action="seek-editor-animation"]');
  await expect(stage).toHaveAttribute(
    "data-kp-compound-root-carrier-stage",
    "ready",
    { timeout: 10_000 }
  );
  expect(Number(await stage.getAttribute(
    "data-kp-compound-root-carrier-dynamic-track-count"
  ))).toBeGreaterThan(0);
  await expect(stage).toHaveAttribute(
    "data-kp-compound-root-carrier-subtree-motion",
    /^(rigid|translation-with-local-residuals)$/u
  );

  await seek.fill("0");
  expect(await activeMath(stage)).toBe("\\sqrt{(x+1)^{2}}");
  await seek.fill("0.55");
  await expect(stage).toHaveAttribute(
    "data-kp-compound-root-carrier-progress",
    "0.55"
  );
  expect(await visibleMaterialOwnerCount(stage)).toBeGreaterThan(0);
  await stage.screenshot({
    path: "tmp/codex/compound-root-carrier-midpoint.png",
    animations: "disabled"
  });
  await seek.fill("1");
  expect(await activeMath(stage)).toBe("\\lvertx+1\\rvert");
  await seek.fill("0");
  expect(await activeMath(stage)).toBe("\\sqrt{(x+1)^{2}}");

  const revision = Number(await stage.getAttribute(
    "data-kp-compound-root-carrier-measurement-revision"
  ));
  await page.setViewportSize({ width: 390, height: 760 });
  await expect.poll(async () => Number(await stage.getAttribute(
    "data-kp-compound-root-carrier-measurement-revision"
  ))).toBeGreaterThan(revision);
  await expect(stage).toHaveAttribute(
    "data-kp-compound-root-carrier-stage",
    "ready"
  );
  await seek.fill("1");
  expect(await activeMath(stage)).toBe("\\lvertx+1\\rvert");
  expect(pageErrors).toEqual([]);
});

test("compound leaves settle at native target ink before handoff", async ({
  page
}) => {
  await page.goto(`/?artifact=${animationId}`);
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-compound-root-carrier-stage]");
  const seek = player.locator('[data-action="seek-editor-animation"]');
  await expect(stage).toHaveAttribute(
    "data-kp-compound-root-carrier-stage",
    "ready",
    { timeout: 10_000 }
  );

  await seek.fill("0.95");
  const before = await persistentLeafInk(stage);
  for (const leaf of before) {
    expect(Math.abs(leaf.material.centerX - leaf.target.centerX),
      `${leaf.entityId} horizontal handoff residual`).toBeLessThanOrEqual(0.5);
    expect(Math.abs(leaf.material.centerY - leaf.target.centerY),
      `${leaf.entityId} vertical handoff residual`).toBeLessThanOrEqual(0.5);
  }
  await seek.fill("0.35");
  await seek.fill("0.95");
  expect(await persistentLeafInk(stage)).toEqual(before);
  await seek.fill("1");
  expect(await activeMath(stage)).toBe("\\lvertx+1\\rvert");
});

test("reduced motion retains exact semantic endpoints", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/?artifact=${animationId}&playhead=1`);
  const stage = page.locator("[data-kp-compound-root-carrier-stage]");
  await expect(stage).toHaveAttribute(
    "data-kp-compound-root-carrier-stage",
    "ready",
    { timeout: 10_000 }
  );
  expect(await activeMath(stage)).toBe("\\lvertx+1\\rvert");
});

async function activeMath(stage: Locator) {
  return stage.locator(
    '[data-kp-compound-root-carrier-endpoint][aria-hidden="false"]'
  ).getAttribute("data-kp-compound-root-carrier-latex");
}

async function visibleMaterialOwnerCount(stage: Locator): Promise<number> {
  return stage.locator("[data-kp-equation-material-owner-id]").evaluateAll(
    (owners) => owners.filter((owner) => {
      const style = getComputedStyle(owner);
      return style.visibility !== "hidden" && Number(style.opacity) > 0;
    }).length
  );
}

async function persistentLeafInk(stage: Locator) {
  return stage.evaluate((root) => {
    const bounds = (element: Element) => {
      const range = element.ownerDocument.createRange();
      range.selectNodeContents(element);
      const rect = range.getBoundingClientRect();
      return {
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2
      };
    };
    return ["x", "plus", "one"].map((leaf) => {
      const sourceEntityId = `source.${leaf}`;
      const targetEntityId = `target.${leaf}`;
      const owner = [...root.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-owner-id]"
      )].find((candidate) =>
        candidate.dataset["kpEquationMaterialSemanticEntityId"] ===
          sourceEntityId
      );
      const target = root.querySelector<HTMLElement>(
        `[data-kp-semantic-entity-id="${targetEntityId}"]`
      );
      const material = owner?.firstElementChild;
      if (owner === undefined || material === null || target === null) {
        const availableOwners = [...root.querySelectorAll<HTMLElement>(
          "[data-kp-equation-material-owner-id]"
        )].map((candidate) => ({
          entity: candidate.dataset["kpEquationMaterialSemanticEntityId"],
          child: candidate.firstElementChild?.textContent
        }));
        throw new Error(
          `Missing persistent leaf paint for ${targetEntityId}; ` +
          `owner=${owner !== undefined}, material=${material !== null}, ` +
          `target=${target !== null}, available=${JSON.stringify(availableOwners)}.`
        );
      }
      return {
        entityId: targetEntityId,
        material: bounds(material),
        target: bounds(target)
      };
    });
  });
}
