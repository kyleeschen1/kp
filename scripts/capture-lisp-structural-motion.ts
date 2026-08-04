import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

import { projectKpLispLambdaSourceMaterial } from
  "../src/animation/lisp-s-expression-material-projection.ts";
import {
  compileKpLispStructuralMotionProgram,
  sampleKpLispStructuralMotion
} from "../src/animation/lisp-structural-motion.ts";
import {
  kpLispStructuralMotionCss,
  renderKpLispStructuralMotionHtml
} from "../src/rendering/lisp-structural-motion-html.ts";
import { createKpLispLambdaApplicationFixture } from
  "../src/semantic/lisp-lambda-application-fixture.ts";

const outputRoot = path.resolve("tmp/codex/lisp-structural-motion");
const fixture = createKpLispLambdaApplicationFixture();
const state = projectKpLispLambdaSourceMaterial(fixture).canonicalStates[0]!;
const program = compileKpLispStructuralMotionProgram({
  semantic: fixture.semantic,
  state,
  availableWidthPx: 560
});
const progresses = [0.08, 0.27, 0.45, 0.65, 0.79, 1] as const;
const frames = progresses.map((progress) =>
  sampleKpLispStructuralMotion(program, progress));

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1040 } });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    html, body { margin: 0; min-height: 100%; background: #f4f0e6; color: #3d454b; }
    body { box-sizing: border-box; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; padding: 1.5rem; }
    figure { background: #fffdf8; border: 1px solid #d8d1c2; margin: 0; min-width: 0; padding: .7rem; }
    figcaption { color: #667b74; font: 600 12px/1.3 ui-sans-serif, system-ui, sans-serif; letter-spacing: .04em; text-transform: uppercase; }
    ${kpLispStructuralMotionCss}
  </style></head><body>${frames.map((frame) =>
    `<figure><figcaption>${frame.checkpointId} · ${frame.phase} · ${frame.progress}</figcaption>${renderKpLispStructuralMotionHtml(frame)}</figure>`
  ).join("")}</body></html>`);
  await page.screenshot({
    path: path.join(outputRoot, "canonical-structural-sequence.png"),
    fullPage: false
  });
  await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify({
    schemaVersion: "kp.lisp-structural-motion-visual.v1",
    source: state.nativeCode,
    progresses,
    checkpoints: frames.map(({ checkpointId, phase }) => ({ checkpointId, phase })),
    capture: "canonical-structural-sequence.png"
  }, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    outputRoot: path.relative(process.cwd(), outputRoot),
    captures: 1,
    frames: frames.length
  }, null, 2));
} finally {
  await browser.close();
}
