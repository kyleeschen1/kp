import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

import {
  compileKpLispApplicationMotionProgram,
  sampleKpLispApplicationMotion
} from "../src/animation/lisp-application-motion.ts";
import { projectKpLispLambdaSourceMaterial } from
  "../src/animation/lisp-s-expression-material-projection.ts";
import {
  kpLispApplicationMotionCss,
  renderKpLispApplicationMotionHtml
} from "../src/rendering/lisp-application-motion-html.ts";
import { createKpLispLambdaApplicationFixture } from
  "../src/semantic/lisp-lambda-application-fixture.ts";

const outputRoot = path.resolve("tmp/codex/lisp-application-motion");
const fixture = createKpLispLambdaApplicationFixture();
const material = projectKpLispLambdaSourceMaterial(fixture);
const program = compileKpLispApplicationMotionProgram({
  fixture,
  material,
  availableWidthPx: 480
});
const progresses = [0.08, 0.21, 0.3, 0.37, 0.53, 0.75, 0.79, 0.83, 1] as const;
const frames = progresses.map((progress) =>
  sampleKpLispApplicationMotion(program, progress));

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    html, body { margin: 0; min-height: 100%; background: #f4f0e6; color: #3d454b; }
    body { box-sizing: border-box; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .8rem; padding: 1rem; }
    figure { background: #fffdf8; border: 1px solid #d8d1c2; margin: 0; min-width: 0; padding: .6rem; }
    figcaption { color: #667b74; font: 600 11px/1.3 ui-sans-serif, system-ui, sans-serif; letter-spacing: .04em; text-transform: uppercase; }
    ${kpLispApplicationMotionCss}
  </style></head><body>${frames.map((frame) =>
    `<figure><figcaption>${frame.checkpointId} · ${frame.phase} · ${frame.progress}</figcaption>${renderKpLispApplicationMotionHtml(frame)}</figure>`
  ).join("")}</body></html>`);
  await page.screenshot({
    path: path.join(outputRoot, "canonical-application-sequence.png"),
    fullPage: false
  });
  await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify({
    schemaVersion: "kp.lisp-application-motion-visual.v1",
    source: material.canonicalStates[0]!.nativeCode,
    endpoint: material.canonicalStates[1]!.nativeCode,
    progresses,
    checkpoints: frames.map(({ checkpointId, phase }) => ({ checkpointId, phase })),
    capture: "canonical-application-sequence.png"
  }, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    outputRoot: path.relative(process.cwd(), outputRoot),
    captures: 1,
    frames: frames.length
  }, null, 2));
} finally {
  await browser.close();
}
