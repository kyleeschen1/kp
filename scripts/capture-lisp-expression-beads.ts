import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

import {
  projectKpLispExpressionBeads,
  resolveKpLispExpressionBead
} from "../src/animation/lisp-s-expression-beads.ts";
import {
  kpLispExpressionBeadCss,
  renderKpLispExpressionBeadHtml
} from "../src/rendering/lisp-s-expression-bead-html.ts";
import { createKpLispLambdaApplicationFixture } from
  "../src/semantic/lisp-lambda-application-fixture.ts";

const outputRoot = path.resolve("tmp/codex/lisp-expression-beads");
const fixture = createKpLispLambdaApplicationFixture();
const beads = projectKpLispExpressionBeads(fixture.semantic);
const selected = ["expr.body", "expr.lambda", "expr.application"].map(
  (id) => resolveKpLispExpressionBead(beads, id)
);

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 960, height: 420 } });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    html, body { margin: 0; min-height: 100%; background: #f4f0e6; }
    body { align-items: center; box-sizing: border-box; display: flex; gap: 3rem; justify-content: center; padding: 3rem; }
    ${kpLispExpressionBeadCss}
  </style></head><body>${selected.map((bead) =>
    renderKpLispExpressionBeadHtml({ bead, detailed: true })).join("")}</body></html>`);
  await page.screenshot({
    path: path.join(outputRoot, "canonical-beads.png"),
    fullPage: false
  });
  await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify({
    schemaVersion: "kp.lisp-expression-beads-visual.v1",
    source: fixture.semantic.sourceText,
    beadIds: selected.map(({ id }) => id),
    capture: "canonical-beads.png"
  }, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    outputRoot: path.relative(process.cwd(), outputRoot),
    captures: 1,
    beads: selected.length
  }, null, 2));
} finally {
  await browser.close();
}
