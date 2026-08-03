import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

import { createKpLispBotanicalPresentationPlan } from "../src/animation/lisp-botanical-presentation-plan.ts";
import { sampleKpLispLambdaApplicationRuntimeFrame } from "../src/animation/lisp-lambda-application-runtime-frame.ts";
import {
  kpLispBotanicalStageCss,
  renderKpLispBotanicalStageHtml
} from "../src/rendering/lisp-botanical-stage-html.ts";
import { createKpLispLambdaApplicationAsset } from "../src/semantic/lisp-lambda-application-asset.ts";
import { projectKpLispLessonSalience } from "../src/tutorial/lisp-function-application/lisp-function-application-salience.ts";

const outputRoot = path.resolve("tmp/codex/botanical-lisp-asset");
const checkpoints = [
  ["application", 0],
  ["binding", 0.34],
  ["substitution", 0.7],
  ["evaluation", 0.84],
  ["result", 1]
] as const;
const asset = createKpLispLambdaApplicationAsset();
const plan = createKpLispBotanicalPresentationPlan(asset);

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1100, height: 720 },
  colorScheme: "light"
});
const captures: string[] = [];

try {
  for (const [id, progress] of checkpoints) {
    const frame = sampleKpLispLambdaApplicationRuntimeFrame({ asset, progress });
    const salience = projectKpLispLessonSalience({
      frame,
      plan,
      activeBlockId: progress < 0.74
        ? "bind-and-reconstruct"
        : "evaluate-and-gather"
    });
    const stage = renderKpLispBotanicalStageHtml({ frame, plan, salience });
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
      html, body { margin: 0; min-height: 100%; background: #f4f0e6; }
      body { display: grid; place-items: center; padding: 2rem; box-sizing: border-box; }
      ${kpLispBotanicalStageCss}
      .kp-lisp-botanical { width: min(100%, 58rem); border-radius: 1.5rem; background: #f4f0e6; }
    </style></head><body>${stage}</body></html>`);
    const filename = `${id}.png`;
    await page.locator("[data-kp-lisp-botanical-stage]").screenshot({
      path: path.join(outputRoot, filename)
    });
    captures.push(filename);
  }
  await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify({
    schemaVersion: "kp.botanical-lisp-asset-visual.v2",
    animationId: asset.id,
    presentationStatus: plan.status,
    salience: "semantic-target-context-attenuation",
    captures
  }, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    outputRoot: path.relative(process.cwd(), outputRoot),
    captures: captures.length,
    presentationStatus: plan.status
  }, null, 2));
} finally {
  await browser.close();
}
