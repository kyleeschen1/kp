import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

for (const viewport of [
  { name: "wide", width: 1280, height: 900 },
  { name: "phone", width: 390, height: 844 }
] as const) {
  test(`governed compound remains bounded at ${viewport.name}`, async ({
    page
  }) => {
    await page.setViewportSize(viewport);
    await openCompound(page, 371);
    const panel = page.locator(
      '[data-compound-trace][data-governed-compound-ready="true"]'
    );
    const slider = panel.locator("[data-compound-progress]");

    await expect(panel.locator("[data-governed-compound-lane]")).toHaveCount(3);
    await expect(panel.locator("[data-trace-operation]")).toHaveCount(4);
    const first = await snapshot(panel);
    expect(first).toMatchObject({
      progress: "371",
      visualOwner: "material-scene",
      laneCount: 3,
      activeMaterialLaneCount: 1,
      materialOwnersInert: true,
      contained: true
    });
    expect(first.visibleMaterialOwnerCount).toBeGreaterThan(0);
    await mkdir("tmp/codex/governed-canonical-compound", {
      recursive: true
    });
    await panel.screenshot({
      path: `tmp/codex/governed-canonical-compound/${viewport.name}.png`
    });
    expect(first.pageOverflow).toBeLessThanOrEqual(1);
    expect(first.stageOverflow).toBeLessThanOrEqual(1);
    expect(
      first.crossLaneOverlap,
      JSON.stringify(first.crossLanePairs)
    ).toBe(false);

    await slider.fill("437");
    await slider.dispatchEvent("input");
    const direct = await snapshot(panel);
    await slider.fill("800");
    await slider.dispatchEvent("input");
    await slider.fill("437");
    await slider.dispatchEvent("input");
    expect(await snapshot(panel)).toEqual(direct);

    await slider.fill("0");
    await slider.dispatchEvent("input");
    await expect(panel).toHaveAttribute(
      "data-governed-compound-visual-owner",
      "source-native"
    );
    expect((await snapshot(panel)).visibleMaterialOwnerCount).toBe(0);

    await slider.fill("1000");
    await slider.dispatchEvent("input");
    await expect(panel).toHaveAttribute(
      "data-governed-compound-visual-owner",
      "target-native"
    );
    const target = await snapshot(panel);
    expect(target.visibleMaterialOwnerCount).toBe(0);
    expect(target.pageOverflow).toBeLessThanOrEqual(1);
    expect(target.stageOverflow).toBeLessThanOrEqual(1);
  });
}

test("governed compound reduced motion settles and rewinds", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openCompound(page, 0);
  const panel = page.locator(
    '[data-compound-trace][data-governed-compound-ready="true"]'
  );
  const play = panel.locator("[data-trace-play]");

  await play.click();
  await expect(panel).toHaveAttribute("data-governed-compound-progress", "1000");
  await expect(panel).toHaveAttribute(
    "data-governed-compound-visual-owner",
    "target-native"
  );
  await play.click();
  await expect(panel).toHaveAttribute("data-governed-compound-progress", "0");
  await expect(panel).toHaveAttribute(
    "data-governed-compound-visual-owner",
    "source-native"
  );
});

async function openCompound(page: Page, progress: number): Promise<void> {
  await page.goto(
    "/glyph-reconciliation-experiment.html" +
    `?governedCompound=1&compoundProgress=${progress}`
  );
  await page.locator(
    '[data-compound-trace][data-governed-compound-ready="true"]'
  ).waitFor();
}

async function snapshot(panel: ReturnType<Page["locator"]>) {
  return panel.evaluate((element) => {
    const containsRect = (container: DOMRect, child: DOMRect): boolean =>
      child.left >= container.left - 1 &&
      child.right <= container.right + 1 &&
      child.top >= container.top - 1 &&
      child.bottom <= container.bottom + 1;
    const overlapArea = (left: DOMRect, right: DOMRect): number =>
      Math.max(
        0,
        Math.min(left.right, right.right) - Math.max(left.left, right.left)
      ) * Math.max(
        0,
        Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top)
      );
    const stage = element.querySelector<HTMLElement>(
      "[data-compound-stage]"
    )!;
    const stageRect = stage.getBoundingClientRect();
    const lanes = [...stage.querySelectorAll<HTMLElement>(
      "[data-governed-compound-lane]"
    )];
    const owners = [...stage.querySelectorAll<HTMLElement>(
      "[data-kp-native-katex-scene-owner]"
    )];
    const visibleOwners = owners.filter((owner) =>
      Number(owner.style.opacity) > 0
    );
    const visibleRects = [
      ...visibleOwners.map((owner, index) => ({
        id: `material.${index}`,
        rect: owner.getBoundingClientRect()
      })),
      ...stage.querySelectorAll<HTMLElement>(
        '[data-compound-state-id]:not([aria-hidden="true"])'
      )
    ].map((root) => root instanceof HTMLElement
      ? {
          id: root.dataset["compoundStateId"] ?? "native",
          rect: root.getBoundingClientRect()
        }
      : root
    ).filter(({ rect }) => rect.width > 0 && rect.height > 0);
    const crossLanePairs = visibleRects.flatMap((left, leftIndex) =>
      visibleRects.flatMap((right, rightIndex) =>
        rightIndex > leftIndex &&
        overlapArea(left.rect, right.rect) > 1 &&
        !lanes.some((lane) => {
          const laneRect = lane.getBoundingClientRect();
          return containsRect(laneRect, left.rect) &&
            containsRect(laneRect, right.rect);
        })
          ? [[left.id, right.id]]
          : []
      )
    );
    const crossLaneOverlap = crossLanePairs.length > 0;
    const activeMaterialLaneCount = lanes.filter((lane) => {
      const laneRect = lane.getBoundingClientRect();
      return visibleOwners.some((owner) => {
        const rect = owner.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        return centerX >= laneRect.left &&
          centerX <= laneRect.right &&
          centerY >= laneRect.top &&
          centerY <= laneRect.bottom;
      });
    }).length;
    return {
      progress: element.getAttribute("data-governed-compound-progress"),
      visualOwner: element.getAttribute(
        "data-governed-compound-visual-owner"
      ),
      laneCount: lanes.length,
      visibleMaterialOwnerCount: visibleOwners.length,
      activeMaterialLaneCount,
      materialOwnersInert: owners.every((owner) =>
        owner.hasAttribute("inert") &&
        owner.getAttribute("aria-hidden") === "true"
      ),
      contained: visibleOwners.every((owner) =>
        containsRect(stageRect, owner.getBoundingClientRect())
      ),
      pageOverflow:
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
      stageOverflow: stage.scrollWidth - stage.clientWidth,
      crossLaneOverlap,
      crossLanePairs
    };
  });
}
