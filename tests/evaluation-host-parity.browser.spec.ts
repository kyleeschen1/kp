import { expect, test, type Locator } from "@playwright/test";

const standaloneAnimationId =
  "animation.operation-evaluation.five-plus-two";
const embeddedAnimationId =
  "animation.generated.calculus.derivative.power-rule-x-cubed";
const embeddedEvaluationId =
  "transform.generated.calculus.derivative.power-rule-x-cubed.evaluate-exponent-decrement";

test("standalone and embedded evaluation attest the same selected family", async ({
  page
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/?artifact=${standaloneAnimationId}`);
  const standalonePlayer = player(page.locator("body"), standaloneAnimationId);
  const standaloneStage = standalonePlayer.locator(
    "[data-kp-operation-evaluation-stage]"
  ).first();
  await expectEvaluationReady(standaloneStage);
  await standalonePlayer.locator(
    '[data-action="seek-editor-animation"]'
  ).fill("0.5");
  await expect(standaloneStage).toHaveAttribute(
    "data-kp-operation-evaluation-legibility-state",
    "kernel"
  );
  const standalone = await paintAttestation(standaloneStage);

  await page.goto(`/?artifact=${embeddedAnimationId}&playhead=0.75`);
  const embeddedPlayer = player(page.locator("body"), embeddedAnimationId);
  await expect(embeddedPlayer).toHaveAttribute(
    "data-kp-editor-animation-hydrated",
    "true",
    { timeout: 30_000 }
  );
  const embeddedStage = embeddedPlayer.locator(
    "[data-kp-editor-equation-stage]"
  );
  await expect(embeddedStage.locator(
    "[data-kp-editor-equation-transition-id]:not([hidden])"
  )).toHaveAttribute(
    "data-kp-editor-equation-transition-id",
    embeddedEvaluationId
  );
  const embedded = await paintAttestation(embeddedStage);

  expect(standalone).toEqual({
    family: "contributor-fusion",
    handoff: "compressed-ink-handoff",
    familyProfile: "kp.evaluation-family.contributor-fusion.v1",
    rendererProfile:
      "kp.rendering.native-katex.operation-evaluation.contributor-fusion.v1",
    primitive: "kp.rendering.native-katex.primitive.ink-knot.v1",
    legibility: "kernel"
  });
  expect(embedded).toEqual(standalone);
});

function player(root: Locator, animationId: string): Locator {
  return root.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
}

async function paintAttestation(stage: Locator) {
  await expect(stage).toHaveAttribute(
    "data-kp-operation-evaluation-realized-primitive-id",
    /.+/
  );
  return stage.evaluate((element) => ({
    family: element.dataset["kpOperationEvaluationFamily"],
    handoff: element.dataset["kpOperationEvaluationHandoff"],
    familyProfile: element.dataset["kpOperationEvaluationFamilyProfileId"],
    rendererProfile:
      element.dataset["kpOperationEvaluationRendererProfileId"],
    primitive: element.dataset["kpOperationEvaluationRealizedPrimitiveId"],
    legibility: element.dataset["kpOperationEvaluationLegibilityState"]
  }));
}

async function expectEvaluationReady(stage: Locator): Promise<void> {
  await expect.poll(async () => {
    const status = await stage.getAttribute(
      "data-kp-operation-evaluation-status"
    );
    if (status !== "error") return status;
    const message = await stage.getAttribute(
      "data-kp-operation-evaluation-error"
    );
    return `error: ${message ?? "unknown compilation failure"}`;
  }, { timeout: 30_000 }).toBe("ready");
}
