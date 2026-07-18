import { expect, test } from "@playwright/test";

const GRAPH_DESCRIPTOR_ID =
  "editor-animation.animation.graph.surface-mode.mesh-to-donut";

const ALGEBRA_COHORT = [
  {
    sampleId: "sample.animation.solve-x.both-sides",
    animationId: "animation.linear-solve.solve-x",
    familyId: "family.algebra.both-sides"
  },
  {
    sampleId: "sample.animation.solve-x.cancel-additive-inverses",
    animationId: "animation.linear-solve.solve-x",
    familyId: "family.algebra.cancel-combine"
  },
  {
    sampleId: "sample.animation.distribution.expand-a-sum",
    animationId: "animation.generated.distribution.expand-a-sum",
    familyId: "family.algebra.distribution-factoring"
  },
  {
    sampleId: "sample.animation.factoring.factor-common-a",
    animationId: "animation.generated.distribution.factor-common-a",
    familyId: "family.algebra.distribution-factoring"
  },
  {
    sampleId: "sample.animation.fraction-simplification.basic",
    animationId: "animation.generated.fraction-expression.two-fourths",
    familyId: "family.algebra.fraction-simplification"
  },
  {
    sampleId: "sample.animation.exponent-combine.square-as-product",
    animationId: "animation.generated.exponent.square-as-product",
    familyId: "family.algebra.exponent-log-laws"
  },
  {
    sampleId: "sample.animation.radical-rewrite.square-root-as-power",
    animationId: "animation.generated.radical.square-root-as-power",
    familyId: "family.algebra.exponent-log-laws"
  },
  {
    sampleId: "sample.animation.function-wrap.apply-f",
    animationId: "animation.generated.function-wrap.apply-f",
    familyId: "family.algebra.exponent-log-laws"
  },
  {
    sampleId: "sample.animation.inequality.sign-flip.basic",
    animationId: "animation.inequality.sign-flip.basic",
    familyId: "family.algebra.inequality"
  }
] as const;

test("editor animation library restores and persists concrete selections", async ({
  page
}) => {
  await page.goto(`/?animation=${GRAPH_DESCRIPTOR_ID}`);

  const library = page.locator("[data-kp-editor-animation-library]");
  const select = library.locator('[data-action="set-editor-animation"]');

  await expect(library).toHaveAttribute(
    "data-kp-editor-animation-descriptor-id",
    GRAPH_DESCRIPTOR_ID
  );
  await expect(library).toHaveAttribute(
    "data-kp-editor-animation-surface",
    "graph"
  );

  const equationDescriptorId =
    "editor-animation.animation.linear-solve.solve-x";
  await select.selectOption(equationDescriptorId);

  await expect(page).toHaveURL(
    new RegExp(`animation=${equationDescriptorId.replaceAll(".", "\\.")}`)
  );
  await expect(library).toHaveAttribute(
    "data-kp-editor-animation-descriptor-id",
    equationDescriptorId
  );
  const diagnostics = library.locator(
    "[data-kp-editor-animation-diagnostics]"
  );
  await expect(diagnostics).toHaveAttribute(
    "data-kp-editor-animation-diagnostics-status",
    "passed"
  );
  await diagnostics.locator("summary").click();
  await expect(diagnostics).toContainText("Render targets bound");
  await expect(diagnostics).toContainText("1/1");
  await expect(
    diagnostics.locator(
      "[data-kp-editor-animation-diagnostics-playback-laws]"
    )
  ).toHaveText("2/2");
  await page.evaluate(() => {
    const demo = document.querySelector<HTMLElement>(
      "[data-kp-equation-motion-demo]"
    );
    if (demo === null) throw new Error("Expected equation motion demo.");
    window.__kpEquationMotionSetProgress?.(demo, 0.5);
  });
  await expect(library).toHaveAttribute(
    "data-kp-editor-animation-live-visual-frame-id",
    "visual.live-equation-card.frame"
  );
  await expect(library).toHaveAttribute(
    "data-kp-editor-animation-live-visual-unbound-selector-count",
    "0"
  );
  await expect(
    diagnostics.locator("[data-kp-editor-animation-diagnostics-selectors]")
  ).toHaveText("12/12");
});

test("render quality persists independently and stays frozen during playback", async ({
  page
}) => {
  const descriptorId = "editor-animation.animation.linear-solve.solve-x";
  await page.goto(`/?animation=${descriptorId}`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const player = page.locator("[data-kp-editor-animation-player]");
  const quality = player.locator("[data-kp-editor-animation-quality-control]");
  const accessibility = player.locator(
    "[data-kp-editor-animation-accessibility-control]"
  );
  await expect(player).toHaveAttribute("data-kp-editor-animation-hydrated", "true");
  await expect(quality).toHaveValue("auto");

  await quality.selectOption("full");
  await expect(player).toHaveAttribute("data-kp-editor-animation-quality-tier", "full");
  await player.locator('[data-action="play-editor-animation"]').click();
  await expect(player).toHaveAttribute("data-kp-editor-animation-quality-frozen", "true");

  await quality.selectOption("efficient");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-quality-preference",
    "efficient"
  );
  await expect(player).toHaveAttribute("data-kp-editor-animation-quality-tier", "full");
  await expect(player).toHaveAttribute("data-kp-editor-animation-quality-pending", "true");

  await accessibility.selectOption("reduced-motion");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-accessibility-mode",
    "reduced-motion"
  );
  await expect(player).toHaveAttribute("data-kp-editor-animation-quality-tier", "full");

  await player.locator('[data-action="reset-editor-animation"]').click();
  await expect(player).toHaveAttribute("data-kp-editor-animation-quality-tier", "efficient");
  await expect(player).toHaveAttribute("data-kp-editor-animation-quality-frozen", "false");
  await expect(player).toHaveAttribute("data-kp-editor-animation-quality-pending", "false");

  await quality.selectOption("balanced");
  await page.reload();
  await expect(player).toHaveAttribute("data-kp-editor-animation-hydrated", "true");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-quality-preference",
    "balanced"
  );
  await expect(player).toHaveAttribute("data-kp-editor-animation-quality-tier", "balanced");
  await expect(quality).toHaveValue("balanced");
});

test("dashboard animation assets open their concrete editor selection", async ({
  page
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Project Dashboard" }).click();
  await page
    .locator('[data-kp-select-agenda-row="animation-linear-solve-solve-x"]')
    .click();
  await page
    .locator(
      '[data-kp-preview-link="editor-animation"]' +
      '[data-kp-preview-animation-asset="animation.linear-solve.solve-x"]'
    )
    .click();

  await expect(page.locator("[data-kp-project-dashboard]")).toHaveCount(0);
  await expect(
    page.locator("[data-kp-editor-animation-library]")
  ).toHaveAttribute(
    "data-kp-editor-animation-descriptor-id",
    "editor-animation.animation.linear-solve.solve-x"
  );
  await expect(page).toHaveURL(
    /animation=editor-animation\.animation\.linear-solve\.solve-x/
  );
});

test("fraction family descriptor opens as a concrete editor animation", async ({
  page
}) => {
  const descriptorId =
    "editor-animation.sample.animation.fraction-simplification.basic";
  await page.goto(`/?animation=${descriptorId}`);

  const library = page.locator("[data-kp-editor-animation-library]");
  await expect(library).toHaveAttribute(
    "data-kp-editor-animation-descriptor-id",
    descriptorId
  );
  await expect(library).toHaveAttribute(
    "data-kp-editor-animation-id",
    "animation.generated.fraction-expression.two-fourths"
  );
  await expect(library).toContainText(
    "family.algebra.fraction-simplification"
  );
});

test("algebra family cohort stays selectable and browser-safe", async ({
  page
}) => {
  test.setTimeout(60_000);

  for (const sample of ALGEBRA_COHORT) {
    const descriptorId = `editor-animation.${sample.sampleId}`;
    await page.goto(`/?animation=${descriptorId}`);

    const library = page.locator("[data-kp-editor-animation-library]");
    await expect(library).toHaveAttribute(
      "data-kp-editor-animation-descriptor-id",
      descriptorId
    );
    await expect(library).toHaveAttribute(
      "data-kp-editor-animation-id",
      sample.animationId
    );
    await expect(library).toHaveAttribute(
      "data-kp-editor-animation-surface",
      "equation"
    );
    await expect(library).toContainText(sample.familyId);
    await expect(
      library.locator("[data-kp-editor-animation-diagnostics]")
    ).toHaveAttribute(
      "data-kp-editor-animation-diagnostics-status",
      /^(passed|warning)$/
    );
    await expect(
      library.locator("[data-kp-editor-animation-diagnostics-counts]")
    ).toContainText("0 errors");
    await expect(
      library.locator(
        "[data-kp-editor-animation-diagnostics-playback-laws]"
      )
    ).toHaveText("2/2");
    await expect(
      library.locator('[data-action="set-editor-animation"]')
    ).toHaveValue(descriptorId);
  }

  await expect(
    page.locator(
      '[data-action="set-editor-animation"] optgroup[label="Algebra"] option'
    )
  ).toHaveCount(ALGEBRA_COHORT.length);
});

test("derivative tangent family sample opens on the graph surface", async ({
  page
}) => {
  const descriptorId =
    "editor-animation.sample.animation.derivative-rules.tangent-graph";
  await page.goto(`/?animation=${descriptorId}`);

  const library = page.locator("[data-kp-editor-animation-library]");
  await expect(library).toHaveAttribute(
    "data-kp-editor-animation-descriptor-id",
    descriptorId
  );
  await expect(library).toHaveAttribute(
    "data-kp-editor-animation-id",
    "animation.derivative-rules.tangent-graph"
  );
  await expect(library).toHaveAttribute(
    "data-kp-editor-animation-surface",
    "graph"
  );
  await expect(library).toContainText("family.calculus.derivative-rules");
  await expect(
    library.locator("[data-kp-editor-animation-diagnostics-counts]")
  ).toContainText("0 errors");
  await expect(
    library.locator("[data-kp-editor-animation-diagnostics-playback-laws]")
  ).toHaveText("2/2");
  await expect(
    library.locator(
      '[data-action="set-editor-animation"] optgroup[label="Calculus"] option'
    )
  ).toHaveCount(4);
});

test("FTC comparison opens through its calculus family selection", async ({
  page
}) => {
  const descriptorId =
    "editor-animation.sample.animation.integral-ftc.basic";
  await page.goto(`/?animation=${descriptorId}`);

  const library = page.locator("[data-kp-editor-animation-library]");
  await expect(library).toHaveAttribute(
    "data-kp-editor-animation-descriptor-id",
    descriptorId
  );
  await expect(library).toHaveAttribute(
    "data-kp-editor-animation-id",
    "animation.sample.fundamental-theorem-calculus"
  );
  await expect(library).toHaveAttribute(
    "data-kp-editor-animation-surface",
    "equation"
  );
  await expect(library).toContainText("family.calculus.integral-ftc");
  await expect(
    library.locator("[data-kp-editor-animation-diagnostics-counts]")
  ).toContainText("0 errors");
  await expect(
    library.locator("[data-kp-editor-animation-diagnostics-playback-laws]")
  ).toHaveText("2/2");
});

test("integral area sweep opens on the graph surface", async ({ page }) => {
  const descriptorId =
    "editor-animation.sample.animation.integral-ftc.area-sweep";
  await page.goto(`/?animation=${descriptorId}`);

  const library = page.locator("[data-kp-editor-animation-library]");
  await expect(library).toHaveAttribute(
    "data-kp-editor-animation-descriptor-id",
    descriptorId
  );
  await expect(library).toHaveAttribute(
    "data-kp-editor-animation-id",
    "animation.integral-ftc.area-sweep"
  );
  await expect(library).toHaveAttribute(
    "data-kp-editor-animation-surface",
    "graph"
  );
  await expect(library).toContainText("family.calculus.integral-ftc");
  await expect(
    library.locator("[data-kp-editor-animation-diagnostics-counts]")
  ).toContainText("0 errors");
  await expect(
    library.locator("[data-kp-editor-animation-diagnostics-playback-laws]")
  ).toHaveText("2/2");
});

test("linear-algebra concrete samples open on their supported surfaces", async ({
  page
}) => {
  const samples = [
    {
      descriptorId:
        "editor-animation.sample.animation.vector-add-scale.basic",
      animationId: "animation.graph.vector.linear-map-scale",
      familyId: "family.linear-algebra.vector-add-scale",
      surface: "graph"
    },
    {
      descriptorId: "editor-animation.sample.animation.dot-projection.basic",
      animationId: "animation.dot-projection.basic",
      familyId: "family.linear-algebra.dot-projection",
      surface: "graph"
    },
    {
      descriptorId: "editor-animation.sample.animation.matrix-vector.basic",
      animationId:
        "animation.generated.linear-algebra.matrix-vector.two-by-two",
      familyId: "family.linear-algebra.matrix-vector",
      surface: "equation"
    },
    {
      descriptorId: "editor-animation.sample.animation.matrix-matrix.basic",
      animationId:
        "animation.generated.linear-algebra.matrix-matrix.two-by-two",
      familyId: "family.linear-algebra.matrix-matrix-composition",
      surface: "equation"
    }
  ] as const;

  for (const sample of samples) {
    await page.goto(`/?animation=${sample.descriptorId}`);
    const library = page.locator("[data-kp-editor-animation-library]");

    await expect(library).toHaveAttribute(
      "data-kp-editor-animation-descriptor-id",
      sample.descriptorId
    );
    await expect(library).toHaveAttribute(
      "data-kp-editor-animation-id",
      sample.animationId
    );
    await expect(library).toHaveAttribute(
      "data-kp-editor-animation-surface",
      sample.surface
    );
    await expect(library).toContainText(sample.familyId);
    await expect(
      library.locator("[data-kp-editor-animation-diagnostics-counts]")
    ).toContainText("0 errors");
    await expect(
      library.locator("[data-kp-editor-animation-diagnostics-playback-laws]")
    ).toHaveText("2/2");
  }

  await expect(
    page.locator(
      '[data-action="set-editor-animation"] optgroup[label="Linear algebra"] option'
    )
  ).toHaveCount(samples.length);
});

test("each lazy capability pack hydrates through the shared player shell", async ({
  page
}) => {
  test.setTimeout(60_000);
  const representatives = [
    ["editor-animation.animation.linear-solve.solve-x", "algebra"],
    ["editor-animation.animation.generated.pipeline-diagram", "generated-drafts"],
    [
      "editor-animation.sample.animation.matrix-matrix.basic",
      "generated-problems"
    ],
    [GRAPH_DESCRIPTOR_ID, "graph"],
    ["editor-animation.animation.programming.add.execution-trace", "programming"],
    [
      "editor-animation.animation.comparison.linear-solve-programming",
      "comparison"
    ],
    ["editor-animation.animation.sample.fourier-transform-pair", "complex-katex"]
  ] as const;

  for (const [descriptorId, packId] of representatives) {
    await page.goto(`/?animation=${descriptorId}`);
    const library = page.locator("[data-kp-editor-animation-library]");
    const player = library.locator("[data-kp-editor-animation-player]");

    await expect(player).toHaveAttribute(
      "data-kp-editor-animation-pack-id",
      packId
    );
    await expect(player).toHaveAttribute(
      "data-kp-editor-animation-hydrated",
      "true"
    );
    await expect(
      library.locator("[data-kp-editor-animation-diagnostics-counts]")
    ).toContainText("0 errors");
  }
});

test("diagnostics stay below frame cadence and settle exactly on pause", async ({
  page
}) => {
  await page.goto("/?animation=editor-animation.animation.linear-solve.solve-x");
  const player = page.locator("[data-kp-editor-animation-player]");
  const diagnostics = page.locator("[data-kp-editor-animation-diagnostics]");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );

  await page.evaluate(() => {
    const playerElement = document.querySelector<HTMLElement>(
      "[data-kp-editor-animation-player]"
    );
    if (playerElement === null) throw new Error("Expected animation player.");
    playerElement.dataset["kpTestFrameCount"] = "0";
    playerElement.addEventListener("kp-editor-animation-frame", () => {
      playerElement.dataset["kpTestFrameCount"] = String(
        Number(playerElement.dataset["kpTestFrameCount"] ?? 0) + 1
      );
    });
  });

  await player.getByRole("button", { name: "Play animation" }).click();
  await page.waitForTimeout(750);
  await player.getByRole("button", { name: "Pause animation" }).click();

  const counts = await player.evaluate((element) => ({
    frames: Number(element.dataset["kpTestFrameCount"] ?? 0),
    diagnostics: Number(
      element.dataset["kpEditorAnimationDiagnosticsPublishCount"] ?? 0
    ),
    inspection: Number(
      element.dataset["kpEditorAnimationInspectionPublishCount"] ?? 0
    ),
    playerProgress: Number(element.dataset["kpEditorAnimationProgress"] ?? 0)
  }));
  const diagnosticsProgress = Number(
    await diagnostics.getAttribute("data-kp-editor-animation-progress")
  );

  expect(counts.frames).toBeGreaterThan(8);
  expect(counts.diagnostics).toBeLessThan(counts.frames);
  expect(counts.inspection).toBeLessThan(counts.frames);
  expect(counts.diagnostics).toBeLessThanOrEqual(15);
  expect(counts.inspection).toBeLessThanOrEqual(15);
  expect(diagnosticsProgress).toBe(counts.playerProgress);
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-diagnostics-publish-reason",
    "semantic-change"
  );
});

test("equation geometry stays cached until an explicit resize invalidates it", async ({
  page
}) => {
  await page.goto(
    "/?animation=editor-animation.sample.animation.matrix-matrix.basic"
  );
  const player = page.locator("[data-kp-editor-animation-player]");
  const stage = player.locator("[data-kp-editor-equation-stage]");
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true"
  );
  await expect(stage).toHaveAttribute("data-kp-editor-equation-cache-status", "ready");

  const initialBuilds = Number(
    await stage.getAttribute("data-kp-editor-equation-cache-build-count")
  );
  const initialMeasures = Number(
    await stage.getAttribute(
      "data-kp-editor-equation-overlay-geometry-measure-count"
    )
  );
  for (const progress of ["0.01", "0.02", "0.03", "0.04"]) {
    await scrubber.fill(progress);
  }
  await expect(stage).toHaveAttribute(
    "data-kp-editor-equation-cache-build-count",
    String(initialBuilds)
  );
  await expect(stage).toHaveAttribute(
    "data-kp-editor-equation-overlay-geometry-measure-count",
    String(initialMeasures)
  );

  await stage.evaluate((element) => {
    element.style.width = `${Math.max(320, element.clientWidth - 96)}px`;
  });
  await expect(stage).toHaveAttribute(
    "data-kp-editor-equation-cache-invalidation-reason",
    "resize"
  );
  await scrubber.fill("0.05");

  expect(Number(
    await stage.getAttribute("data-kp-editor-equation-cache-build-count")
  )).toBeGreaterThan(initialBuilds);
  expect(Number(
    await stage.getAttribute(
      "data-kp-editor-equation-overlay-geometry-measure-count"
    )
  )).toBeGreaterThan(initialMeasures);

  const buildsAfterResize = Number(
    await stage.getAttribute("data-kp-editor-equation-cache-build-count")
  );
  await page.evaluate(() => {
    document.fonts.dispatchEvent(new Event("loadingdone"));
  });
  await expect.poll(async () => Number(
    await stage.getAttribute("data-kp-editor-equation-cache-build-count")
  )).toBeGreaterThan(buildsAfterResize);
  await expect(stage).toHaveAttribute(
    "data-kp-editor-equation-cache-invalidation-reason",
    "fonts"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-editor-equation-cache-status",
    "ready"
  );
});
