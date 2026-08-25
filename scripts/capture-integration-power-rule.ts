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
    id: "template-scaffold",
    label: "Rule application · receiving structure opens",
    progress: 0.24,
    theme: "dark",
    viewport: desktopViewport
  },
  {
    id: "template-binding",
    label: "Rule application · source symbols enter their slots",
    progress: 0.34,
    theme: "dark",
    viewport: desktopViewport
  },
  {
    id: "template-syntax",
    label: "Rule application · fixed syntax resolves",
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
  readonly templateVacancyPresence: number;
  readonly templateVacancyCount: number;
  readonly templatePreviewPresence: number;
  readonly templateScaffoldPresence: number;
  readonly templateBindingProgress: number;
  readonly templateSyntaxPresence: number;
  readonly templateSyntaxResolutionProgress: number;
  readonly templateClosurePresence: number;
  readonly evaluationStatus: string;
  readonly evaluationCohortCount: number;
  readonly evaluationLegibility: string;
  readonly visibleMaterialOwnerCount: number;
  readonly visibleCohortIds: readonly string[];
  readonly accessibleEndpoint: string;
  readonly visibleText: string;
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
      schemaVersion: "kp.integration-power-rule-visual-checkpoint.v1",
      animationId,
      samples: evidence,
      reviewChecklist: [
        "attention order",
        "salience-only operator scope",
        "rule-template scaffold and source binding",
        "exponent provenance",
        "two ink-knot evaluations",
        "integration constant persistence",
        "timing and reverse meaning",
        "dark and light response",
        "narrow fit"
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
    const visibleOwners = [...root.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )].filter(visible);
    const templateReceiver = root.querySelector<HTMLElement>(
      "[data-kp-antiderivative-template-receiver]"
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
      templateVacancyPresence: Number(
        root.dataset["kpAntiderivativeTemplateVacancyPresence"] ?? 0
      ),
      templateVacancyCount: templateReceiver?.querySelectorAll(
        "[data-kp-antiderivative-template-vacancy]"
      ).length ?? 0,
      templatePreviewPresence: Number(
        root.dataset["kpAntiderivativeTemplatePreviewPresence"] ?? 0
      ),
      templateScaffoldPresence: Number(
        root.dataset["kpAntiderivativeTemplateScaffoldPresence"] ?? 0
      ),
      templateBindingProgress: Number(
        root.dataset["kpAntiderivativeTemplateBindingProgress"] ?? 0
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
      visibleText: [...root.querySelectorAll<HTMLElement>(
        "[data-kp-editor-equation-source], " +
        "[data-kp-editor-equation-target], " +
        "[data-kp-equation-material-owner-id]"
      )].filter(visible).map((element) => element.textContent ?? "")
        .join(" ").replace(/\s+/gu, " ").trim()
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

function assertReviewCoverage(evidence: readonly CaptureEvidence[]): void {
  const byId = new Map(evidence.map((sample) => [sample.id, sample]));
  const required = (id: string): CaptureEvidence => {
    const sample = byId.get(id);
    if (sample === undefined) throw new Error(`Missing review sample ${id}.`);
    return sample;
  };
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
  const scaffold = required("template-scaffold");
  if (
    scaffold.transitVisualOwner !== "material-scene" ||
    scaffold.templateProfileId !==
      "kp.rendering.native-katex.antiderivative-template-instantiation-profile.v3" ||
    scaffold.templateTraceRole !== "prospective" ||
    scaffold.templateLawRefId !==
      "law.calculus.integral.power-rule" ||
    scaffold.templateReceiverFocus !== 1 ||
    scaffold.templateVacancyPresence !== 1 ||
    scaffold.templateVacancyCount !== 3 ||
    scaffold.templatePreviewPresence !== 1 ||
    scaffold.templateScaffoldPresence <= 0 ||
    scaffold.templateSyntaxPresence <= 0 ||
    scaffold.templateClosurePresence <= 0 ||
    scaffold.templateBindingProgress !== 0 ||
    scaffold.templateSyntaxResolutionProgress !== 0 ||
    scaffold.visibleMaterialOwnerCount === 0
  ) {
    throw new Error(
      "Template scaffold frame must expose prospective Native KaTeX structure."
    );
  }
  const binding = required("template-binding");
  if (
    binding.templateTraceRole !== "prospective" ||
    binding.templateReceiverFocus !== 1 ||
    binding.templateVacancyCount !== 3 ||
    binding.templateVacancyPresence <= 0 ||
    binding.templateVacancyPresence >= 1 ||
    binding.templateBindingProgress <= 0 ||
    binding.templateBindingProgress >= 1 ||
    binding.templateSyntaxPresence <= 0 ||
    binding.templateSyntaxResolutionProgress !== 0
  ) {
    throw new Error(
      "Template binding frame must retain prospective grammar before live resolution."
    );
  }
  const syntax = required("template-syntax");
  if (
    syntax.templateBindingProgress !== 1 ||
    syntax.templateReceiverFocus !== 0 ||
    syntax.templateVacancyPresence !== 0 ||
    syntax.templateSyntaxPresence !== 1 ||
    syntax.templateClosurePresence !== 1 ||
    syntax.templateSyntaxResolutionProgress !== 1
  ) {
    throw new Error(
      "Template syntax frame must resolve the bound rule before evaluation."
    );
  }
  const expanded = required("expanded-rule");
  if (!expanded.visibleText.includes("C")) {
    throw new Error("Expanded review frame must retain the integration constant.");
  }
  for (const id of [
    "dual-evaluation-kernel",
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
