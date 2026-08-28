import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import type { Locator, Page } from "playwright";

import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "./capture-visual-contact-sheet.ts";
import { createKpVisualReviewHarness } from "./visual-review-harness.ts";

const animationId =
  "animation.generated.calculus.integral.power-rule-quadratic";
const outputRoot = path.resolve(
  process.env["KP_VISUAL_OUTPUT"] ??
    "tmp/codex/integration-power-rule-visual"
);
const desktopViewport = { width: 1_240, height: 760 } as const;
const narrowViewport = { width: 390, height: 844 } as const;
type RuleLensView = "abstract" | "concrete";
const samples = [
  {
    id: "source",
    label: "Source · native integral",
    progress: 0,
    theme: "dark",
    viewport: desktopViewport
  },
  {
    id: "scope-salience",
    label: "Operator scope · salience only",
    progress: 0.06,
    theme: "dark",
    viewport: desktopViewport
  },
  {
    id: "rule-preview",
    label: "Rule application · source abstracts into pattern",
    progress: 0.132,
    theme: "dark",
    viewport: desktopViewport
  },
  {
    id: "rule-approach",
    label: "Rule application · pattern owns the focal surface",
    progress: 0.203,
    theme: "dark",
    viewport: desktopViewport
  },
  {
    id: "rule-match",
    label: "Rule application · match u and n in place",
    progress: 0.259,
    theme: "dark",
    viewport: desktopViewport
  },
  {
    id: "rule-match-instance",
    label: "Rule Lens · matched concrete instance",
    progress: 0.259,
    theme: "dark",
    viewport: desktopViewport,
    lensView: "concrete"
  },
  {
    id: "rule-binding",
    label: "Rule application · bind u ↦ x and n ↦ 2",
    progress: 0.337,
    theme: "dark",
    viewport: desktopViewport
  },
  {
    id: "rule-turnover",
    label: "Rule application · pattern yields before rewrite",
    progress: 0.353,
    theme: "dark",
    viewport: desktopViewport
  },
  {
    id: "rule-template",
    label: "Rule application · replacement takes the focal surface",
    progress: 0.39,
    theme: "dark",
    viewport: desktopViewport
  },
  {
    id: "rule-template-bound",
    label: "Rule Lens · instantiated bound form",
    progress: 0.39,
    theme: "dark",
    viewport: desktopViewport,
    lensView: "concrete"
  },
  {
    id: "rule-propagation",
    label: "Rule application · one binding supplies both n occurrences",
    progress: 0.425,
    theme: "dark",
    viewport: desktopViewport
  },
  {
    id: "rule-instantiated",
    label: "Rule application · introduced constant explained",
    progress: 0.447,
    theme: "dark",
    viewport: desktopViewport
  },
  {
    id: "rule-rewriting",
    label: "Rule application · instantiated rewrite commits in place",
    progress: 0.471,
    theme: "dark",
    viewport: desktopViewport
  },
  {
    id: "rule-committed",
    label: "Rule application · rewrite committed",
    progress: 0.49,
    theme: "dark",
    viewport: desktopViewport
  },
  {
    id: "expanded-rule",
    label: "Expanded rule · exact fraction and +C",
    progress: 0.5,
    theme: "dark",
    viewport: desktopViewport
  },
  {
    id: "dual-evaluation-kernel",
    label: "Two evaluations · shared ink-knot kernel",
    progress: 0.75,
    theme: "dark",
    viewport: desktopViewport
  },
  {
    id: "fraction-reshape",
    label: "Two evaluations · structural line follows readable results",
    progress: 0.82,
    theme: "dark",
    viewport: desktopViewport
  },
  {
    id: "dual-evaluation-recognition",
    label: "Two evaluations · both results legible",
    progress: 0.87,
    theme: "dark",
    viewport: desktopViewport
  },
  {
    id: "target",
    label: "Target · exact native antiderivative",
    progress: 1,
    theme: "dark",
    viewport: desktopViewport
  },
  {
    id: "narrow-light-rule-preview",
    label: "Narrow light · source-to-pattern projection",
    progress: 0.132,
    theme: "light",
    viewport: narrowViewport
  },
  {
    id: "narrow-light-rule-match",
    label: "Narrow light · pattern and slots",
    progress: 0.259,
    theme: "light",
    viewport: narrowViewport
  },
  {
    id: "narrow-light-rule-template",
    label: "Narrow light · replacement template",
    progress: 0.39,
    theme: "light",
    viewport: narrowViewport
  },
  {
    id: "narrow-light-rule-instantiated",
    label: "Narrow light · instantiated template",
    progress: 0.447,
    theme: "light",
    viewport: narrowViewport
  },
  {
    id: "narrow-light-evaluation",
    label: "Narrow light · dual evaluation fit",
    progress: 0.75,
    theme: "light",
    viewport: narrowViewport
  }
] as const;

interface CaptureEvidence {
  readonly id: string;
  readonly label: string;
  readonly progress: number;
  readonly theme: "dark" | "light";
  readonly viewport: { readonly width: number; readonly height: number };
  readonly transitionId: string;
  readonly transitStatus: string;
  readonly transitVisualOwner: string;
  readonly operatorPresentation: string;
  readonly operatorSalienceStrength: number;
  readonly templateProfileId: string;
  readonly templateTraceRole: string;
  readonly templateLawRefId: string;
  readonly templateReceiverFocus: number;
  readonly ruleTemplatePanelPresence: number;
  readonly ruleMatchProgress: number;
  readonly ruleMatchPresence: number;
  readonly metavariableBindingsPresence: number;
  readonly rulePreviewPresence: number;
  readonly rulePreviewWithdrawalProgress: number;
  readonly patternProjectionPresence: number;
  readonly patternProjectionProgress: number;
  readonly fixedSyntaxOwner: string;
  readonly visibleIntegralOwnerCount: number;
  readonly patternFixedSyntaxVisibleCount: number;
  readonly rulePreviewFractionCount: number;
  readonly ruleInstantiationProgress: number;
  readonly ruleTemplateRevealProgress: number;
  readonly ruleTemplateSlotPresence: number;
  readonly ruleTemplateSlotCount: number;
  readonly ruleRewriteCommitProgress: number;
  readonly templateVacancyPresence: number;
  readonly templateVacancyCount: number;
  readonly instantiatedResultOwner: string;
  readonly templateScaffoldPresence: number;
  readonly templateBindingProgress: number;
  readonly templateReceiverSettlementProgress: number;
  readonly templateSyntaxPresence: number;
  readonly templateSyntaxResolutionProgress: number;
  readonly templateClosurePresence: number;
  readonly explanationBeat: string;
  readonly explanationGrounding: string;
  readonly explanationText: string;
  readonly ruleLensPhase: string;
  readonly ruleLensView: string;
  readonly ruleLensOverride: string;
  readonly ruleLensControlCount: number;
  readonly ruleLensControlLabel: string;
  readonly ruleLensPressed: string;
  readonly depthLens: string;
  readonly schemaPlanePresence: number;
  readonly correspondencePlanePresence: number;
  readonly prospectivePlaneDepth: number;
  readonly schemaProjection: string;
  readonly primaryRepresentation: string;
  readonly primaryRepresentationCount: number;
  readonly sourceInkOpacity: number;
  readonly patternInkOpacity: number;
  readonly targetInkOpacity: number;
  readonly patternSlotCount: number;
  readonly bindingRelationCount: number;
  readonly bindingRelationPresence: number;
  readonly registrationFrameCount: number;
  readonly evaluationStatus: string;
  readonly evaluationCohortCount: number;
  readonly evaluationLegibility: string;
  readonly visibleMaterialOwnerCount: number;
  readonly visibleCohortIds: readonly string[];
  readonly accessibleEndpoint: string;
  readonly instantiatedFractionOwnerCount: number;
  readonly visibleFractionRuleCount: number;
  readonly fractionReplicaEffectCount: number;
  readonly fractionOwner: string;
  readonly fractionMotion: string;
  readonly fractionReshapeProgress: number;
  readonly materialFractionOwnerCount: number;
  readonly visibleText: string;
  readonly ruleTemplateText: string;
  readonly rulePreviewText: string;
  readonly file: string;
}

async function capture(baseUrl?: string): Promise<void> {
  await mkdir(outputRoot, { recursive: true });
  const harness = createKpVisualReviewHarness(
    baseUrl === undefined ? {} : { baseUrl }
  );
  const items: KpVisualContactSheetItem[] = [];
  const evidence: CaptureEvidence[] = [];
  const browserErrors: string[] = [];

  try {
    for (const sample of samples) {
      const page = await harness.page({
        viewport: sample.viewport,
        colorScheme: sample.theme
      });
      page.on("console", (message) => {
        if (message.type() === "error") {
          browserErrors.push(`${sample.id}: ${message.text()}`);
        }
      });
      page.on("pageerror", (error) => {
        browserErrors.push(`${sample.id}: ${error.message}`);
      });
      const captured = await captureSample({
        page,
        baseUrl: harness.baseUrl,
        lensView: "lensView" in sample ? sample.lensView : undefined,
        ...sample
      });
      evidence.push(captured);
      const image = await readFile(path.resolve(captured.file));
      items.push({
        id: captured.id,
        label: captured.label,
        progress: captured.progress,
        viewport: captured.viewport,
        file: captured.file,
        dataUrl: `data:image/png;base64,${image.toString("base64")}`
      });
    }
    if (browserErrors.length > 0) {
      throw new Error(
        `Integration visual capture reported browser errors: ${browserErrors.join(" | ")}`
      );
    }
    assertReviewCoverage(evidence);

    const htmlSource = buildKpVisualContactSheetHtml(items, {
      title: "Integration power rule · human visual checkpoint",
      columns: 2,
      imageFit: "contain",
      imageHeightPx: 330
    });
    const sheetPage = await harness.page({
      viewport: { width: 1_440, height: 1_000 },
      colorScheme: "dark"
    });
    await sheetPage.setContent(htmlSource, { waitUntil: "load" });
    const sheet = path.join(outputRoot, "contact-sheet.png");
    await sheetPage.screenshot({
      path: sheet,
      fullPage: true,
      animations: "disabled"
    });
    const html = path.join(outputRoot, "index.html");
    await writeFile(html, htmlSource, "utf8");
    const manifest = path.join(outputRoot, "manifest.json");
    await writeFile(manifest, `${JSON.stringify({
      schemaVersion: "kp.integration-power-rule-visual-checkpoint.v10",
      animationId,
      samples: evidence,
      reviewChecklist: [
        "attention order",
        "salience-only operator scope",
        "one primary mathematical representation at every beat",
        "source-to-pattern abstraction in one stationary focal locus",
        "learner-controlled instance-pattern and template-bound comparisons without semantic-time advance",
        "full pattern face with accent metavariable slots",
        "grounded one-line explanation at every pedagogical beat",
        "pattern withdrawal before replacement-template appearance",
        "single native replacement owner with no fraction-rule paint replica",
        "single transform-only fraction-rule owner through evaluation",
        "exponent provenance",
        "two ink-knot evaluations",
        "integration constant persistence",
        "timing and reverse meaning",
        "dark and light response",
        "narrow rule application and evaluation fit"
      ],
      sheet: path.relative(process.cwd(), sheet),
      html: path.relative(process.cwd(), html)
    }, null, 2)}\n`, "utf8");
    console.log(
      `integration power-rule checkpoint: ${path.relative(process.cwd(), sheet)}`
    );
    console.log(`review sheet: ${path.relative(process.cwd(), html)}`);
    console.log(`manifest: ${path.relative(process.cwd(), manifest)}`);
  } finally {
    await harness.close();
  }
}

async function captureSample(input: {
  readonly page: Page;
  readonly baseUrl: string;
  readonly id: string;
  readonly label: string;
  readonly progress: number;
  readonly theme: "dark" | "light";
  readonly viewport: { readonly width: number; readonly height: number };
  readonly lensView?: RuleLensView | undefined;
}): Promise<CaptureEvidence> {
  const url = new URL("/", input.baseUrl);
  url.searchParams.set("artifact", animationId);
  url.searchParams.set("playhead", String(input.progress));
  url.searchParams.set("theme", input.theme);
  await input.page.goto(url.toString(), { waitUntil: "domcontentloaded" });
  const player = input.page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  await player.waitFor();
  await input.page.waitForFunction((expectedAnimationId) => {
    const host = document.querySelector<HTMLElement>(
      `[data-kp-editor-animation-player]` +
      `[data-kp-editor-animation-id="${expectedAnimationId}"]`
    );
    return host?.dataset["kpEditorAnimationHydrated"] === "true";
  }, animationId);
  const stage = player.locator("[data-kp-editor-equation-stage]");
  await stage.waitFor();
  await waitForGovernedFrame(stage, input.progress);
  if (input.lensView !== undefined) {
    const currentView = await stage.getAttribute(
      "data-kp-antiderivative-rule-lens-view"
    );
    if (currentView !== input.lensView) {
      await stage.locator(
        "[data-kp-antiderivative-rule-lens-toggle]"
      ).click();
    }
    await waitForRuleLensView(stage, input.lensView);
  }
  await settle(stage);
  const repairGap = await stage.getAttribute(
    "data-kp-antiderivative-power-repair-gap"
  );
  if (repairGap !== null) {
    throw new Error(
      `${input.id} reached ${repairGap}: ` +
      `${await stage.getAttribute("data-kp-antiderivative-power-repair-gap-reason")}`
    );
  }
  const file = path.join(outputRoot, `${input.id}.png`);
  await player.locator("[data-kp-editor-animation-stage]").screenshot({
    path: file,
    animations: "disabled"
  });
  const state = await stage.evaluate((root) => {
    const visible = (element: HTMLElement): boolean => {
      const style = getComputedStyle(element);
      return style.visibility !== "hidden" && Number(style.opacity) > 0.01;
    };
    const realized = (element: HTMLElement): boolean => {
      let opacity = 1;
      for (
        let current: HTMLElement | null = element;
        current !== null;
        current = current.parentElement
      ) {
        const style = getComputedStyle(current);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          style.contentVisibility === "hidden"
        ) return false;
        opacity *= Number(style.opacity);
        if (current === root) break;
      }
      return opacity > 0.01 && element.getClientRects().length > 0;
    };
    const visibleOwners = [...root.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )].filter(visible);
    const visibleFractionRules = [
      ...root.querySelectorAll<HTMLElement>(".frac-line")
    ].filter(realized);
    const fractionReplicaEffects = visibleFractionRules.flatMap((rule) => {
      const effects: string[] = [];
      for (
        let current: HTMLElement | null = rule;
        current !== null;
        current = current.parentElement
      ) {
        const style = getComputedStyle(current);
        if (style.filter.includes("drop-shadow")) {
          effects.push(`drop-shadow:${current.className}`);
        }
        if (current === rule && style.boxShadow !== "none") {
          effects.push(`box-shadow:${current.className}`);
        }
        if (current === root) break;
      }
      return effects;
    });
    const templateReceiver = root.querySelector<HTMLElement>(
      "[data-kp-antiderivative-template-receiver]"
    );
    const integralOwners = [
      root.querySelector<HTMLElement>(
        '[data-kp-motion-id$=".initial.operator"]'
      ),
      root.querySelector<HTMLElement>(
        '[data-kp-antiderivative-pattern-fixed="operator"]'
      )
    ].filter((candidate): candidate is HTMLElement => candidate !== null);
    const projectedFixedSyntax = [
      ...root.querySelectorAll<HTMLElement>(
        "[data-kp-antiderivative-pattern-fixed]"
      )
    ];
    const sourceRoot = root.querySelector<HTMLElement>(
      "[data-kp-editor-equation-source]"
    );
    const patternRoot = root.querySelector<HTMLElement>(
      "[data-kp-antiderivative-rule-pattern-projection]"
    );
    const targetRoot = root.querySelector<HTMLElement>(
      "[data-kp-editor-equation-target]"
    );
    return {
      transitionId: root.querySelector<HTMLElement>(
        "[data-kp-editor-equation-transition-id]"
      )?.dataset["kpEditorEquationTransitionId"] ?? "",
      transitStatus: root.dataset["kpAntiderivativePowerTransit"] ?? "inactive",
      transitVisualOwner:
        root.dataset["kpAntiderivativePowerVisualOwner"] ?? "inactive",
      operatorPresentation:
        root.dataset["kpAntiderivativeOperatorPresentation"] ?? "inactive",
      operatorSalienceStrength: Number(
        root.dataset["kpAntiderivativeOperatorSalienceStrength"] ?? 0
      ),
      templateProfileId:
        root.dataset["kpAntiderivativeTemplateProfileId"] ?? "inactive",
      templateTraceRole:
        root.dataset["kpAntiderivativeTemplateTraceRole"] ?? "inactive",
      templateLawRefId:
        root.dataset["kpAntiderivativeTemplateLawRefId"] ?? "inactive",
      templateReceiverFocus: Number(
        root.dataset["kpAntiderivativeTemplateReceiverFocus"] ?? 0
      ),
      ruleTemplatePanelPresence: Number(
        root.dataset["kpAntiderivativeRuleTemplatePanelPresence"] ?? 0
      ),
      ruleMatchProgress: Number(
        root.dataset["kpAntiderivativeRuleMatchProgress"] ?? 0
      ),
      ruleMatchPresence: Number(
        root.dataset["kpAntiderivativeRuleMatchPresence"] ?? 0
      ),
      metavariableBindingsPresence: Number(
        root.dataset["kpAntiderivativeMetavariableBindingsPresence"] ?? 0
      ),
      rulePreviewPresence: Number(
        root.dataset["kpAntiderivativeRulePreviewPresence"] ?? 0
      ),
      rulePreviewWithdrawalProgress: Number(
        root.dataset["kpAntiderivativeRulePreviewWithdrawalProgress"] ?? 0
      ),
      patternProjectionPresence: Number(
        root.dataset["kpAntiderivativePatternProjectionPresence"] ?? 0
      ),
      patternProjectionProgress: Number(
        root.dataset["kpAntiderivativePatternProjectionProgress"] ?? 0
      ),
      fixedSyntaxOwner:
        root.dataset["kpAntiderivativeFixedSyntaxOwner"] ?? "inactive",
      visibleIntegralOwnerCount: integralOwners.filter(realized).length,
      patternFixedSyntaxVisibleCount:
        projectedFixedSyntax.filter(realized).length,
      rulePreviewFractionCount: root.querySelectorAll(
        "[data-kp-antiderivative-rule-preview] .frac-line"
      ).length,
      ruleInstantiationProgress: Number(
        root.dataset["kpAntiderivativeRuleInstantiationProgress"] ?? 0
      ),
      ruleTemplateRevealProgress: Number(
        root.dataset["kpAntiderivativeRuleTemplateRevealProgress"] ?? 0
      ),
      ruleTemplateSlotPresence: Number(
        root.dataset["kpAntiderivativeRuleTemplateSlotPresence"] ?? 0
      ),
      ruleTemplateSlotCount: root.querySelectorAll(
        "[data-kp-antiderivative-rule-template-slot]"
      ).length,
      ruleRewriteCommitProgress: Number(
        root.dataset["kpAntiderivativeRuleRewriteCommitProgress"] ?? 0
      ),
      templateVacancyPresence: Number(
        root.dataset["kpAntiderivativeTemplateVacancyPresence"] ?? 0
      ),
      templateVacancyCount: templateReceiver?.querySelectorAll(
        "[data-kp-antiderivative-template-vacancy]"
      ).length ?? 0,
      instantiatedResultOwner:
        root.dataset["kpAntiderivativeInstantiatedResultOwner"] ?? "inactive",
      templateScaffoldPresence: Number(
        root.dataset["kpAntiderivativeTemplateScaffoldPresence"] ?? 0
      ),
      templateBindingProgress: Number(
        root.dataset["kpAntiderivativeTemplateBindingProgress"] ?? 0
      ),
      templateReceiverSettlementProgress: Number(
        root.dataset["kpAntiderivativeTemplateReceiverSettlementProgress"] ?? 0
      ),
      templateSyntaxPresence: Number(
        root.dataset["kpAntiderivativeTemplateSyntaxPresence"] ?? 0
      ),
      templateSyntaxResolutionProgress: Number(
        root.dataset["kpAntiderivativeTemplateSyntaxResolutionProgress"] ?? 0
      ),
      templateClosurePresence: Number(
        root.dataset["kpAntiderivativeTemplateClosurePresence"] ?? 0
      ),
      explanationBeat:
        root.dataset["kpAntiderivativeExplanationBeat"] ?? "inactive",
      explanationGrounding:
        root.dataset["kpAntiderivativeExplanationGrounding"] ?? "inactive",
      explanationText: root.querySelector<HTMLElement>(
        "[data-kp-antiderivative-explanation-rail]"
      )?.textContent?.replace(/\s+/gu, " ").trim() ?? "",
      ruleLensPhase:
        root.dataset["kpAntiderivativeRuleLensPhase"] ?? "inactive",
      ruleLensView:
        root.dataset["kpAntiderivativeRuleLensView"] ?? "inactive",
      ruleLensOverride:
        root.dataset["kpAntiderivativeRuleLensOverride"] ?? "inactive",
      ruleLensControlCount: root.querySelectorAll(
        "[data-kp-antiderivative-rule-lens-control]"
      ).length,
      ruleLensControlLabel: root.querySelector<HTMLElement>(
        "[data-kp-antiderivative-rule-lens-toggle]"
      )?.textContent?.trim() ?? "",
      ruleLensPressed: root.querySelector<HTMLElement>(
        "[data-kp-antiderivative-rule-lens-toggle]"
      )?.getAttribute("aria-pressed") ?? "inactive",
      depthLens:
        root.dataset["kpAntiderivativeDepthLens"] ?? "inactive",
      schemaPlanePresence: Number(
        root.dataset["kpAntiderivativeSchemaPlanePresence"] ?? 0
      ),
      correspondencePlanePresence: Number(
        root.dataset["kpAntiderivativeCorrespondencePlanePresence"] ?? 0
      ),
      prospectivePlaneDepth: Number(
        root.dataset["kpAntiderivativeProspectivePlaneDepth"] ?? 0
      ),
      schemaProjection:
        root.dataset["kpAntiderivativeSchemaProjection"] ?? "inactive",
      primaryRepresentation:
        root.dataset["kpAntiderivativePrimaryRepresentation"] ?? "inactive",
      primaryRepresentationCount: Number(
        root.dataset["kpAntiderivativePrimaryRepresentationCount"] ?? 0
      ),
      sourceInkOpacity: sourceRoot === null
        ? 0
        : Number(getComputedStyle(sourceRoot).opacity),
      patternInkOpacity: patternRoot === null
        ? 0
        : Number(getComputedStyle(patternRoot).opacity),
      targetInkOpacity: targetRoot === null
        ? 0
        : Number(getComputedStyle(targetRoot).opacity),
      patternSlotCount: root.querySelectorAll(
        "[data-kp-antiderivative-pattern-slot]"
      ).length,
      bindingRelationCount: Number(
        root.dataset["kpAntiderivativeBindingRelationCount"] ?? 0
      ),
      bindingRelationPresence: Number(
        root.dataset["kpAntiderivativeBindingRelationPresence"] ?? 0
      ),
      registrationFrameCount: Number(
        root.dataset["kpAntiderivativeRegistrationFrameCount"] ?? 0
      ),
      evaluationStatus:
        root.dataset["kpAntiderivativeEvaluationMount"] ?? "inactive",
      evaluationCohortCount: Number(
        root.dataset["kpOperationEvaluationCohortCount"] ?? 0
      ),
      evaluationLegibility:
        root.dataset["kpOperationEvaluationLegibilityState"] ?? "inactive",
      visibleMaterialOwnerCount: visibleOwners.length,
      visibleCohortIds: [...new Set(visibleOwners.flatMap((owner) => {
        const cohortId = owner.dataset[
          "kpEquationMaterialVerifiedOperationCohortId"
        ];
        return cohortId === undefined ? [] : [cohortId];
      }))],
      accessibleEndpoint:
        root.dataset["kpAntiderivativePowerAccessibleEndpoint"] ??
        root.dataset["kpAntiderivativeEvaluationNativeSettlement"] ??
        "material",
      instantiatedFractionOwnerCount: root.querySelectorAll(
        '[data-kp-antiderivative-instantiated-fraction-owner="canonical-target-native"]'
      ).length,
      visibleFractionRuleCount: visibleFractionRules.length,
      fractionReplicaEffectCount: fractionReplicaEffects.length,
      fractionOwner:
        root.dataset["kpAntiderivativeEvaluationFractionOwner"] ??
        root.dataset["kpAntiderivativePowerVisualOwner"] ?? "inactive",
      fractionMotion:
        root.dataset["kpAntiderivativeEvaluationFractionMotion"] ??
        "inactive",
      fractionReshapeProgress: Number(
        root.dataset["kpAntiderivativeEvaluationFractionReshapeProgress"] ?? 0
      ),
      materialFractionOwnerCount: root.querySelectorAll(
        '[data-kp-equation-material-fragment-role="rule:persistent-evaluation-fraction"]'
      ).length,
      visibleText: [...root.querySelectorAll<HTMLElement>(
        "[data-kp-editor-equation-source], " +
        "[data-kp-editor-equation-target], " +
        "[data-kp-equation-material-owner-id], " +
        "[data-kp-antiderivative-rule-template]"
      )].filter(visible).map((element) => element.textContent ?? "")
        .join(" ").replace(/\s+/gu, " ").trim(),
      ruleTemplateText: root.querySelector<HTMLElement>(
        "[data-kp-antiderivative-rule-template]"
      )?.textContent?.replace(/\s+/gu, " ").trim() ?? "",
      rulePreviewText: root.querySelector<HTMLElement>(
        "[data-kp-antiderivative-rule-preview]"
      )?.textContent?.replace(/\s+/gu, " ").trim() ?? ""
    };
  });
  return {
    id: input.id,
    label: input.label,
    progress: input.progress,
    theme: input.theme,
    viewport: input.viewport,
    ...state,
    file: path.relative(process.cwd(), file)
  };
}

async function waitForGovernedFrame(
  stage: Locator,
  progress: number
): Promise<void> {
  await stage.evaluate((root, requestedProgress) =>
    new Promise<void>((resolve, reject) => {
      const ready = (): boolean => requestedProgress < 0.5
        ? root.dataset["kpAntiderivativePowerTransit"] === "ready"
        : root.dataset["kpAntiderivativeEvaluationMount"] === "native-katex";
      if (ready()) {
        resolve();
        return;
      }
      const timeout = window.setTimeout(() => {
        observer.disconnect();
        reject(new Error(
          root.dataset["kpAntiderivativePowerRepairGapReason"] ??
          `Timed out preparing integration frame ${requestedProgress}.`
        ));
      }, 8_000);
      const observer = new MutationObserver(() => {
        if (!ready()) return;
        window.clearTimeout(timeout);
        observer.disconnect();
        resolve();
      });
      observer.observe(root, { attributes: true, subtree: false });
    }), progress);
}

async function settle(stage: Locator): Promise<void> {
  await stage.evaluate(async (root) => {
    await root.ownerDocument.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())
    ));
  });
}

async function waitForRuleLensView(
  stage: Locator,
  expectedView: RuleLensView
): Promise<void> {
  await stage.evaluate((root, expected) =>
    new Promise<void>((resolve, reject) => {
      const ready = (): boolean =>
        root.dataset["kpAntiderivativeRuleLensView"] === expected;
      if (ready()) {
        resolve();
        return;
      }
      const timeout = window.setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timed out selecting Rule Lens view ${expected}.`));
      }, 4_000);
      const observer = new MutationObserver(() => {
        if (!ready()) return;
        window.clearTimeout(timeout);
        observer.disconnect();
        resolve();
      });
      observer.observe(root, { attributes: true, subtree: false });
    }), expectedView);
}

function assertReviewCoverage(evidence: readonly CaptureEvidence[]): void {
  const byId = new Map(evidence.map((sample) => [sample.id, sample]));
  const required = (id: string): CaptureEvidence => {
    const sample = byId.get(id);
    if (sample === undefined) throw new Error(`Missing review sample ${id}.`);
    return sample;
  };
  const fractionlessFrames = new Set([
    "source",
    "scope-salience",
    "rule-preview",
    "rule-approach",
    "rule-match",
    "rule-match-instance",
    "rule-binding",
    "rule-turnover",
    "narrow-light-rule-preview",
    "narrow-light-rule-match"
  ]);
  for (const sample of evidence) {
    const expectedRuleCount = fractionlessFrames.has(sample.id) ? 0 : 1;
    if (
      sample.visibleFractionRuleCount !== expectedRuleCount ||
      sample.fractionReplicaEffectCount !== 0
    ) {
      throw new Error(
        `${sample.id} must realize ${expectedRuleCount} fraction rule with ` +
        `no shadow or other paint replica; received ` +
        `${sample.visibleFractionRuleCount} and ` +
        `${sample.fractionReplicaEffectCount} replica effects.`
      );
    }
  }
  for (const id of [
    "dual-evaluation-kernel",
    "fraction-reshape",
    "dual-evaluation-recognition",
    "narrow-light-evaluation"
  ]) {
    const sample = required(id);
    if (
      sample.fractionOwner !== "material" ||
      sample.materialFractionOwnerCount !== 1 ||
      sample.fractionMotion !== "transform-only"
    ) {
      throw new Error(
        `${id} must reshape one material fraction rule between native endpoints.`
      );
    }
  }
  if (required("source").transitVisualOwner !== "source-native") {
    throw new Error("Source review frame must retain native integral paint.");
  }
  const scope = required("scope-salience");
  if (
    scope.operatorPresentation !== "salience-only" ||
    scope.operatorSalienceStrength <= 0
  ) {
    throw new Error("Scope review frame must expose salience-only attention.");
  }
  const preview = required("rule-preview");
  if (
    preview.transitVisualOwner !== "rule-application-native" ||
    preview.rulePreviewPresence !== 1 ||
    preview.patternProjectionPresence !== 1 ||
    preview.ruleMatchPresence !== 0 ||
    preview.metavariableBindingsPresence !== 0 ||
    preview.rulePreviewFractionCount !== 0 ||
    preview.fixedSyntaxOwner !== "pattern-projection" ||
    preview.visibleIntegralOwnerCount !== 2 ||
    preview.patternFixedSyntaxVisibleCount !== 2 ||
    preview.explanationBeat !== "recognize-rule" ||
    preview.explanationGrounding !== "law.calculus.integral.power-rule" ||
    preview.depthLens !== "schema-projection" ||
    preview.schemaProjection !== "single-focal" ||
    preview.primaryRepresentation !== "schema-pattern" ||
    preview.primaryRepresentationCount !== 1 ||
    preview.registrationFrameCount !== 0 ||
    preview.sourceInkOpacity <= 0 ||
    preview.patternInkOpacity <= 0 ||
    Math.abs(
      preview.sourceInkOpacity + preview.patternInkOpacity - 1
    ) > 0.02 ||
    preview.targetInkOpacity !== 0
  ) {
    throw new Error(
      "Rule invocation must abstract source into one in-place schema surface."
    );
  }
  const match = required("rule-match");
  if (
    match.transitVisualOwner !== "rule-application-native" ||
    match.templateProfileId !==
      "kp.rendering.native-katex.antiderivative-rule-application-exemplar.v10" ||
    match.templateTraceRole !== "prospective" ||
    match.templateLawRefId !==
      "law.calculus.integral.power-rule" ||
    match.templateReceiverFocus !== 1 ||
    match.ruleTemplatePanelPresence !== 1 ||
    match.ruleMatchProgress !== 1 ||
    match.ruleMatchPresence !== 1 ||
    match.metavariableBindingsPresence !== 0 ||
    match.rulePreviewPresence !== 1 ||
    match.patternProjectionPresence !== 1 ||
    match.patternProjectionProgress !== 1 ||
    match.rulePreviewFractionCount !== 0 ||
    match.ruleInstantiationProgress !== 0 ||
    match.templateVacancyPresence !== 0 ||
    match.templateVacancyCount !== 0 ||
    match.instantiatedResultOwner !== "canonical-target-native" ||
    match.templateBindingProgress !== 0 ||
    match.templateReceiverSettlementProgress !== 0 ||
    match.instantiatedFractionOwnerCount !== 1 ||
    match.fixedSyntaxOwner !== "pattern-projection" ||
    match.visibleIntegralOwnerCount !== 1 ||
    match.patternFixedSyntaxVisibleCount !== 2 ||
    match.patternSlotCount !== 3 ||
    match.explanationBeat !== "match-structure" ||
    match.explanationGrounding !==
      "binding.u.source-base-and-integration-variable" ||
    !match.explanationText.includes("u↦x") ||
    match.depthLens !== "schema-projection" ||
    match.schemaProjection !== "single-focal" ||
    match.primaryRepresentation !== "schema-pattern" ||
    match.primaryRepresentationCount !== 1 ||
    match.schemaPlanePresence !== 1 ||
    match.correspondencePlanePresence !== 1 ||
    match.registrationFrameCount !== 0 ||
    match.sourceInkOpacity !== 0 ||
    match.patternInkOpacity !== 1 ||
    match.targetInkOpacity !== 0 ||
    match.bindingRelationCount !== 0 ||
    match.bindingRelationPresence !== 0 ||
    match.ruleLensPhase !== "match" ||
    match.ruleLensView !== "abstract" ||
    match.ruleLensOverride !== "automatic" ||
    match.ruleLensControlCount !== 1 ||
    match.ruleLensControlLabel !== "Show instance" ||
    match.ruleLensPressed !== "true"
  ) {
    throw new Error(
      "Rule-match beat must give the in-place pattern sole focal ownership."
    );
  }
  const matchedInstance = required("rule-match-instance");
  if (
    matchedInstance.ruleLensPhase !== "match" ||
    matchedInstance.ruleLensView !== "concrete" ||
    matchedInstance.ruleLensOverride !== "concrete" ||
    matchedInstance.ruleLensControlLabel !== "Show pattern" ||
    matchedInstance.ruleLensPressed !== "false" ||
    matchedInstance.primaryRepresentation !== "source" ||
    matchedInstance.sourceInkOpacity !== 1 ||
    matchedInstance.patternInkOpacity !== 0 ||
    matchedInstance.targetInkOpacity !== 0 ||
    matchedInstance.visibleFractionRuleCount !== 0
  ) {
    throw new Error(
      "Match inspection must restore the complete concrete instance in place."
    );
  }
  const returnedSubject = required("rule-approach");
  if (
    returnedSubject.rulePreviewPresence !== 1 ||
    returnedSubject.fixedSyntaxOwner !== "pattern-projection" ||
    returnedSubject.visibleIntegralOwnerCount !== 1 ||
    returnedSubject.patternFixedSyntaxVisibleCount !== 2 ||
    returnedSubject.registrationFrameCount !== 0 ||
    returnedSubject.sourceInkOpacity !== 0 ||
    returnedSubject.patternInkOpacity !== 1 ||
    returnedSubject.targetInkOpacity !== 0
  ) {
    throw new Error(
      "The pattern beat must retain one stationary abstract representation."
    );
  }
  const binding = required("rule-binding");
  if (
    binding.templateTraceRole !== "prospective" ||
    binding.templateReceiverFocus !== 1 ||
    binding.ruleTemplatePanelPresence !== 1 ||
    binding.ruleMatchPresence <= 0 ||
    binding.metavariableBindingsPresence !== 1 ||
    binding.rulePreviewPresence !== 1 ||
    binding.ruleInstantiationProgress !== 0 ||
    !binding.explanationText.includes("n↦2") ||
    binding.templateVacancyCount !== 0 ||
    binding.templateVacancyPresence !== 0 ||
    binding.templateBindingProgress !== 1 ||
    binding.templateReceiverSettlementProgress !== 0 ||
    binding.templateSyntaxPresence !== 0 ||
    binding.templateSyntaxResolutionProgress !== 0 ||
    binding.explanationBeat !== "bind-metavariables" ||
    binding.explanationGrounding !== "binding.n.source-exponent" ||
    binding.registrationFrameCount !== 0 ||
    binding.sourceInkOpacity !== 0 ||
    binding.patternInkOpacity <= 0 ||
    binding.targetInkOpacity !== 0
  ) {
    throw new Error(
      "Rule-binding frame must make metavariable acquisition explicit before instantiation."
    );
  }
  const turnover = required("rule-turnover");
  if (
    turnover.primaryRepresentation !== "turnover" ||
    turnover.primaryRepresentationCount !== 0 ||
    turnover.sourceInkOpacity !== 0 ||
    turnover.patternInkOpacity !== 0 ||
    turnover.targetInkOpacity !== 0 ||
    turnover.visibleFractionRuleCount !== 0 ||
    turnover.explanationBeat !== "instantiate-template"
  ) {
    throw new Error(
      "The turnover beat must clear the pattern before introducing replacement ink."
    );
  }
  const template = required("rule-template");
  if (
    template.templateBindingProgress !== 1 ||
    template.ruleTemplateRevealProgress <= 0 ||
    template.ruleInstantiationProgress !== 0 ||
    template.rulePreviewPresence !== 1 ||
    template.patternProjectionPresence !== 0 ||
    template.ruleTemplateSlotPresence <= 0 ||
    template.ruleTemplateSlotCount !== 3 ||
    template.transitVisualOwner !== "rule-application-native" ||
    template.instantiatedFractionOwnerCount !== 1 ||
    template.explanationBeat !== "instantiate-template" ||
    template.prospectivePlaneDepth <= 0 ||
    template.bindingRelationCount !== 0 ||
    template.bindingRelationPresence !== 0 ||
    template.registrationFrameCount !== 0 ||
    template.primaryRepresentation !== "replacement-template" ||
    template.primaryRepresentationCount !== 1 ||
    template.sourceInkOpacity !== 0 ||
    template.patternInkOpacity !== 0 ||
    template.targetInkOpacity <= 0
  ) {
    throw new Error(
      "Template frame must show one u and two n slots on the one native RHS."
    );
  }
  const boundTemplate = required("rule-template-bound");
  if (
    boundTemplate.ruleLensPhase !== "replacement" ||
    boundTemplate.ruleLensView !== "concrete" ||
    boundTemplate.ruleLensOverride !== "concrete" ||
    boundTemplate.ruleLensControlLabel !== "Show template" ||
    boundTemplate.ruleLensPressed !== "false" ||
    boundTemplate.primaryRepresentation !== "instantiated-rewrite" ||
    boundTemplate.ruleTemplateSlotPresence !== 0 ||
    boundTemplate.sourceInkOpacity !== 0 ||
    boundTemplate.patternInkOpacity !== 0 ||
    boundTemplate.targetInkOpacity !== 1 ||
    boundTemplate.visibleFractionRuleCount !== 1
  ) {
    throw new Error(
      "Instantiation inspection must reveal the bound form on the same owner."
    );
  }
  const bound = required("rule-instantiated");
  const propagation = required("rule-propagation");
  if (
    propagation.explanationBeat !== "propagate-binding" ||
    propagation.explanationGrounding !== "binding.n.fan-out" ||
    !propagation.explanationText.includes("supplies both exponent occurrences") ||
    propagation.ruleTemplateSlotCount !== 3 ||
    propagation.instantiatedFractionOwnerCount !== 1 ||
    propagation.bindingRelationCount !== 0 ||
    propagation.bindingRelationPresence !== 0 ||
    propagation.primaryRepresentation !== "replacement-template"
  ) {
    throw new Error(
      "Propagation frame must explain that one n binding supplies both uses."
    );
  }
  if (
    bound.templateBindingProgress !== 1 ||
    bound.templateReceiverSettlementProgress !== 0 ||
    bound.templateVacancyPresence !== 0 ||
    bound.templateTraceRole !== "prospective" ||
    bound.ruleTemplatePanelPresence !== 1 ||
    bound.metavariableBindingsPresence !== 0 ||
    bound.rulePreviewPresence !== 1 ||
    bound.patternProjectionPresence !== 0 ||
    bound.ruleInstantiationProgress !== 1 ||
    bound.ruleTemplateRevealProgress !== 1 ||
    bound.ruleTemplateSlotPresence !== 0 ||
    bound.ruleTemplateSlotCount !== 3 ||
    bound.transitVisualOwner !== "rule-application-native" ||
    bound.instantiatedFractionOwnerCount !== 1 ||
    !bound.visibleText.includes("2+1") ||
    bound.explanationBeat !== "explain-closure" ||
    !bound.explanationText.includes("family of antiderivatives") ||
    bound.primaryRepresentation !== "instantiated-rewrite"
  ) {
    throw new Error(
      "Instantiation frame must show one prospective canonical RHS before rewrite."
    );
  }
  const settling = required("rule-rewriting");
  if (
    settling.templateBindingProgress !== 1 ||
    settling.transitVisualOwner !== "rule-application-native" ||
    settling.templateReceiverSettlementProgress <= 0 ||
    settling.templateReceiverSettlementProgress >= 1 ||
    settling.templateTraceRole !== "prospective" ||
    settling.ruleRewriteCommitProgress <= 0 ||
    settling.ruleRewriteCommitProgress >= 1 ||
    settling.ruleTemplatePanelPresence <= 0 ||
    settling.ruleTemplatePanelPresence >= 1 ||
    settling.rulePreviewPresence <= 0 ||
    settling.rulePreviewPresence >= 1 ||
    settling.rulePreviewWithdrawalProgress <= 0 ||
    settling.rulePreviewWithdrawalProgress >= 1 ||
    settling.ruleInstantiationProgress !== 1 ||
    settling.instantiatedFractionOwnerCount !== 1 ||
    settling.visibleMaterialOwnerCount !== 0 ||
    settling.primaryRepresentation !== "instantiated-rewrite"
  ) {
    throw new Error(
      "Rewrite frame must commit the one stationary native RHS."
    );
  }
  const syntax = required("rule-committed");
  if (
    syntax.templateBindingProgress !== 1 ||
    syntax.templateReceiverSettlementProgress !== 1 ||
    syntax.templateReceiverFocus !== 0 ||
    syntax.templateVacancyPresence !== 0 ||
    syntax.templateSyntaxPresence !== 1 ||
    syntax.templateClosurePresence !== 1 ||
    syntax.templateSyntaxResolutionProgress !== 1 ||
    syntax.ruleTemplatePanelPresence !== 0 ||
    syntax.ruleInstantiationProgress !== 1 ||
    syntax.ruleRewriteCommitProgress !== 1 ||
    syntax.transitVisualOwner !== "target-native" ||
    syntax.instantiatedFractionOwnerCount !== 1 ||
    syntax.visibleMaterialOwnerCount !== 0 ||
    syntax.primaryRepresentation !== "committed-rewrite" ||
    syntax.primaryRepresentationCount !== 1 ||
    syntax.registrationFrameCount !== 0
  ) {
    throw new Error(
      "Committed rule frame must settle the same canonical RHS before evaluation."
    );
  }
  const expanded = required("expanded-rule");
  if (!expanded.visibleText.includes("C")) {
    throw new Error("Expanded review frame must retain the integration constant.");
  }
  for (const id of [
    "dual-evaluation-kernel",
    "fraction-reshape",
    "dual-evaluation-recognition",
    "narrow-light-evaluation"
  ]) {
    const sample = required(id);
    if (
      sample.evaluationStatus !== "native-katex" ||
      sample.evaluationCohortCount !== 2 ||
      sample.visibleCohortIds.length !== 2
    ) {
      throw new Error(`${id} must expose both certified evaluation cohorts.`);
    }
  }
  if (required("target").accessibleEndpoint !== "target") {
    throw new Error("Target review frame must settle exact native target paint.");
  }
}

const { values } = parseArgs({
  args: process.argv.slice(2),
  strict: true,
  options: {
    "base-url": { type: "string" }
  }
});

await capture(values["base-url"]);
