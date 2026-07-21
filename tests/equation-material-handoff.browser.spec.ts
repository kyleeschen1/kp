import { expect, test } from "@playwright/test";

test("native and material CSS authority closes every persistent seam", async ({ page }) => {
  await page.goto("/");
  const modulePath = "/src/rendering/equation-material-owner.ts";
  const seams = await page.evaluate(async ({ modulePath }) => {
    const owner = await import(modulePath);
    document.body.innerHTML = `
      <span data-source>x</span>
      <span data-material>x</span>
      <span data-target>x</span>
    `;
    return [0, 0.001, 0.04, 0.08, 0.5, 0.92, 0.96, 0.999, 1].map(
      (progress) => {
        const frame = owner.sampleKpEquationMaterialOwnerHandoff({
          ownerId: "owner.x",
          progress,
          sourcePresent: true,
          targetPresent: true
        });
        const source = document.querySelector<HTMLElement>("[data-source]")!;
        const material = document.querySelector<HTMLElement>("[data-material]")!;
        const target = document.querySelector<HTMLElement>("[data-target]")!;
        source.style.opacity = String(frame.sourceNativeOpacity);
        material.style.opacity = String(frame.materialOpacity);
        target.style.opacity = String(frame.targetNativeOpacity);
        return {
          progress,
          source: Number(getComputedStyle(source).opacity),
          material: Number(getComputedStyle(material).opacity),
          target: Number(getComputedStyle(target).opacity)
        };
      }
    );
  }, { modulePath });

  for (const seam of seams) {
    expect(seam.source + seam.material + seam.target).toBeCloseTo(1, 6);
  }
  expect(seams[0]).toMatchObject({ source: 1, material: 0, target: 0 });
  expect(seams.at(-1)).toMatchObject({ source: 0, material: 0, target: 1 });
});

test("atomic CSS authority never blends native and moving material", async ({ page }) => {
  await page.goto("/");
  const modulePath = "/src/rendering/equation-material-owner.ts";
  const seams = await page.evaluate(async ({ modulePath }) => {
    const owner = await import(modulePath);
    return [0, 0.001, 0.04, 0.5, 0.96, 0.999, 1].map((progress) =>
      owner.sampleKpEquationMaterialOwnerHandoff({
        ownerId: "owner.x",
        progress,
        sourcePresent: true,
        targetPresent: true,
        handoffMode: "atomic-v1"
      })
    );
  }, { modulePath });

  for (const seam of seams) {
    const opacities = [
      seam.sourceNativeOpacity,
      seam.materialOpacity,
      seam.targetNativeOpacity
    ];
    expect(opacities.reduce((sum, opacity) => sum + opacity, 0)).toBe(1);
    expect(opacities.every((opacity) => opacity === 0 || opacity === 1)).toBe(true);
  }
});
