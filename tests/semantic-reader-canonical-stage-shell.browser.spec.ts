import { expect, test } from "@playwright/test";
import {
  createKpFractionCompositionAnnotatedEndpoints
} from "../src/rendering/fraction-composition-selector-annotated-latex.ts";

test("fraction composition mounts the compiler-owned canonical stage shell", async ({
  page
}) => {
  await page.goto("/reader/fraction-composition/", {
    waitUntil: "domcontentloaded"
  });
  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(stage).toHaveCount(1);
  await expect(stage.locator("[data-kp-reader-equation-viewport]")).toHaveCount(1);
  await expect(stage.locator("[data-kp-reader-material-fit-surface]")).toHaveCount(1);
  await expect(stage.locator("[data-kp-reader-equation-material-layer]")).toHaveCount(1);
  await expect(stage.locator("[data-kp-reader-transition]")).toHaveCount(13);
  await expect(stage.locator(
    '[data-kp-reader-equation-measurement][aria-hidden="true"]'
  )).toHaveCount(13);
  await expect(stage.locator('[data-kp-reader-native="source"]')).toHaveCount(13);
  await expect(stage.locator('[data-kp-reader-native="target"]')).toHaveCount(13);
  await expect(stage.locator(
    "[data-kp-reader-accessible-equation][aria-live='polite'][aria-atomic='true']"
  )).toHaveCount(1);
  await expect(stage.locator(
    "[data-kp-reader-accessible-equation-state][aria-current='step']"
  )).toHaveCount(1);

  for (const endpoint of createKpFractionCompositionAnnotatedEndpoints()) {
    const states = stage.locator(
      `[data-kp-reader-equation-state="${endpoint.stateId}"]`
    );
    const stateCount = await states.count();
    expect(stateCount).toBeGreaterThan(0);
    for (let stateIndex = 0; stateIndex < stateCount; stateIndex += 1) {
      const state = states.nth(stateIndex);
      for (const anchor of endpoint.structuralAnchors) {
        await expect(state.locator(
          `[data-kp-reader-selector-id="${anchor.id}"]`
        )).toHaveCount(1);
      }
    }
  }
});

for (const viewport of [
  { name: "wide", width: 1280, height: 900, policy: "single-row" },
  {
    name: "phone",
    width: 390,
    height: 844,
    policy: "semantic-two-row-stage"
  }
] as const) {
  test(`canonical stage certifies every ${viewport.name} transition`, async ({
    page
  }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height
    });
    await page.goto("/reader/fraction-composition/", {
      waitUntil: "domcontentloaded"
    });
    await expect(page.locator("body")).toHaveAttribute(
      "data-kp-animation-host-status",
      "ready"
    );
    const stage = page.locator("[data-kp-reader-equation-stage]");
    const transitions = stage.locator("[data-kp-reader-transition]");
    await expect(transitions).toHaveCount(13);
    await expect(stage.locator(
      `[data-kp-reader-transition]` +
      `[data-kp-reader-stage-layout-policy="${viewport.policy}"]`
    )).toHaveCount(13);
    for (let index = 0; index < 13; index += 1) {
      const transition = transitions.nth(index);
      await expect(transition).toHaveAttribute(
        "data-kp-reader-stage-layout-applied",
        /.+/
      );
      await expect(transition).toHaveAttribute(
        "data-kp-reader-stage-layout-phase",
        /.+/
      );
    }
  });
}

test("canonical compositor retires stale paint ownership during handoff", async ({
  page
}) => {
  await page.goto("/reader/fraction-composition/", {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-animation-host-status",
    "ready"
  );
  const scrubber = page.locator("[data-kp-reader-attention-scrubber]");
  const activeSessions = page.locator(
    '[data-kp-reader-canonical-equation-session="active"]'
  );
  await expect(activeSessions).toHaveCount(1);
  const firstTransition = await activeSessions.evaluate((surface) =>
    surface.closest<HTMLElement>("[data-kp-reader-transition]")
      ?.dataset["kpReaderTransition"]
  );

  await scrubber.evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = "760";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    "760"
  );
  await expect(activeSessions).toHaveCount(1);
  await expect(page.locator(
    ".kp-reader-canonical-equation-session-material"
  )).toHaveCount(1);
  const nextTransition = await activeSessions.evaluate((surface) =>
    surface.closest<HTMLElement>("[data-kp-reader-transition]")
      ?.dataset["kpReaderTransition"]
  );
  expect(nextTransition).not.toBe(firstTransition);
});

test("native endpoints and accessible equation state settle together", async ({
  page
}) => {
  await page.goto("/reader/fraction-composition/", {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-animation-host-status",
    "ready"
  );
  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(stage).toHaveAttribute("data-kp-reader-native-endpoint", "source");
  await expect(stage).toHaveAttribute("data-kp-reader-native-endpoint-passed", "true");
  await expect(stage.locator(
    '[data-kp-reader-accessible-equation-state][aria-current="step"]'
  )).toHaveCount(1);

  const scrubber = page.locator("[data-kp-reader-attention-scrubber]");
  await scrubber.evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = "1000";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    "1000"
  );
  await expect(stage).toHaveAttribute("data-kp-reader-native-endpoint", "target");
  await expect(stage).toHaveAttribute("data-kp-reader-native-endpoint-passed", "true");
  await expect(stage.locator(
    '[data-kp-reader-accessible-equation-state][aria-current="step"]'
  )).toHaveCount(1);
  await expect(stage).toHaveAttribute(
    "data-kp-reader-accessible-equation-state",
    "fraction-solve.state.solved"
  );
});

test("chrome-free session mounts, seeks, publishes, invalidates, and disposes", async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/reader/fraction-composition/", {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-animation-host-status",
    "ready"
  );
  const evidence = await page.evaluate(async () => {
    dispatchEvent(new PageTransitionEvent("pagehide"));
    const shellModule = await import(
      "/src/reader/app/canonical-equation-stage-shell.ts"
    );
    const hostModule = await import(
      "/src/reader/app/chrome-free-canonical-equation-session.ts"
    );
    const descriptorModule = await import(
      "/src/reader/app/equation-lesson-descriptors/fraction-composition.ts"
    );
    const descriptorApi = await import(
      "/src/reader/app/equation-lesson-descriptor.ts"
    );
    const presentation = await import(
      "/src/reader/document/equation-presentation.ts"
    );
    const layout = await import(
      "/src/reader/runtime/fraction-composition-layout.ts"
    );
    const salience = await import(
      "/src/reader/app/fraction-composition-salience-adapter.ts"
    );
    const target = document.createElement("div");
    target.style.width = "900px";
    target.style.height = "600px";
    document.body.append(target);
    const template = document.querySelector<HTMLTemplateElement>(
      "template[data-kp-reader-exemplar-template]"
    );
    if (template === null) throw new Error("Missing canonical template.");
    const profile = presentation.resolveKpReaderEquationPresentationProfile(
      "standard"
    );
    const descriptor = descriptorModule.fractionCompositionDescriptor;
    const animation = descriptor.createAnimation(profile);
    const shell = shellModule.mountKpCanonicalEquationStageShell({
      target,
      template,
      bindStructuralAnchors: (root: HTMLElement) => {
        descriptorApi.bindKpReaderEquationLessonStructuralAnchors({
          root,
          animation,
          descriptor
        });
      }
    });
    const salienceCapability =
      salience.createKpFractionCompositionSalienceReaderCapability({
        root: target,
        href: location.href
      });
    const session = await hostModule.createKpChromeFreeCanonicalEquationSession({
      shell,
      animation,
      descriptor,
      equationPresentationProfile: profile,
      linkRoot: document,
      createStageLayoutIntent: layout.planKpFractionCompositionLayout,
      renderSalience: (frame) => salienceCapability.render(frame)
    });
    const published: string[] = [];
    const unsubscribe = session.subscribe((snapshot) => {
      published.push(snapshot.transitionId);
    });
    const source = session.seek(0);
    const middle = session.seek(0.5);
    session.invalidate();
    const targetFrame = session.seek(1);
    unsubscribe();
    session.dispose();
    const materialLayersAfterDispose = target.querySelectorAll(
      ".kp-reader-canonical-equation-session-material"
    ).length;
    target.remove();
    return {
      source,
      middle,
      targetFrame,
      published,
      materialLayersAfterDispose
    };
  });
  expect(evidence.source.nativeEndpoint).toBe("source");
  expect(evidence.source.nativeEndpointPassed).toBe(true);
  expect(evidence.middle.phaseProgressPermille).toBeGreaterThanOrEqual(0);
  expect(evidence.targetFrame.nativeEndpoint).toBe("target");
  expect(evidence.targetFrame.accessibleEquationState).toBe(
    "fraction-solve.state.solved"
  );
  expect(evidence.published).toHaveLength(3);
  expect(evidence.materialLayersAfterDispose).toBe(0);
});
