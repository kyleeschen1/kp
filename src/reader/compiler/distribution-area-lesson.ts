import { renderLatexToHtml, renderSelectorAnnotatedLatexToHtml } from "../../rendering/katex-adapter.ts";
import { createKpSelectorAnnotatedLatex } from "../../rendering/selector-annotated-latex.ts";
import {
  createKpDistributionAreaSelectorAnnotatedLatex,
  kpDistributionAreaLineageForSelectorId
} from "../../rendering/distribution-area-selector-annotated-latex.ts";
import { createKpDistributionAreaExemplarEndpoint } from "../../rendering/distribution-area-exemplar-endpoint.ts";
import { createKpDistributionAreaExemplarSvgScene } from "../../rendering/distribution-area-exemplar-svg.ts";
import { createKpCompiledLessonArtifact } from "../document/public-api.ts";
import { parseKpLessonMarkdown } from "./lesson-markdown-parser.ts";
import { compileKpStaticLessonProse } from "./static-prose-compiler.ts";
import { compileKpStaticMathStates } from "./static-math-compiler.ts";
import { compileKpReaderPageShell } from "./reader-page-shell.ts";
import { createKpDistributionAreaExemplarSemanticTrace } from "../../semantic/distribution-area-exemplar-trace.ts";

const documentId = "lesson.algebra.distribution-area";
const assetId = "exemplar.distribution-area.3-times-x-plus-2";

export function compileKpDistributionAreaLesson(markdown: string) {
  const document = parseKpLessonMarkdown({
    sourceId: "content/lessons/distribution-area.md",
    id: documentId,
    version: "1",
    title: "See distribution become area",
    language: "en",
    markdown
  });
  const story = document.blocks.find((block) => block.kind === "animation-story");
  if (story?.kind !== "animation-story" || story.asset.id !== assetId) {
    throw new Error(`Distribution area lesson must reference ${assetId}.`);
  }
  const staticMath = compileKpStaticMathStates(document, ({ progressPermille }) => ({
    latex: progressPermille === 0 ? "3(x+2)" : progressPermille < 1000 ? "3x+3\\cdot2" : "3x+6",
    label: progressPermille === 0 ? "Factored expression" : progressPermille < 1000 ? "Distributed expression" : "Expanded expression"
  }));
  const prose = compileKpStaticLessonProse(document, { staticMath });
  const html = compilePage(prose.tocHtml, prose.articleHtml);

  return createKpCompiledLessonArtifact({
    id: "compiled.lesson.algebra.distribution-area",
    version: "1",
    document: { kind: "lesson-document", id: documentId, version: "1" },
    html,
    tocHtml: prose.tocHtml,
    hydration: {
      schemaVersion: "kp.distribution-area-reader.v1",
      lesson: { id: documentId, version: "1" },
      checkpoints: story.beats.map((beat) => ({
        id: beat.checkpoint.id,
        beatId: beat.id,
        progressPermille: beat.checkpoint.progressPermille
      }))
    }
  });
}

function compilePage(tocHtml: string, articleHtml: string): string {
  const articleWithStage = articleHtml.replace(
      '<div class="kp-animation-static" data-kp-animation-static aria-label="Interactive explanation">',
      '<div class="kp-animation-static" data-kp-animation-static aria-label="Interactive explanation">'
    ).replace(
      /<div id="static\.story\.distribution-area[\s\S]*?<\/div>\n<div id="static\.story\.distribution-area[\s\S]*?<\/div>\n<div id="static\.story\.distribution-area[\s\S]*?<\/div>/,
      compileStage()
    );
  return compileKpReaderPageShell({
    title: "See distribution become area · Kinetic Press",
    description: "See algebraic distribution and geometric area change together.",
    stylesheetHref: "/src/reader/app/distribution-area.css",
    bodyAttributes: [
      { name: "data-kp-reader", value: "distribution-area" },
      { name: "data-kp-reader-document-id", value: documentId },
      { name: "data-kp-reader-document-version", value: "1" },
      { name: "data-kp-reader-font-ready", value: "false" }
    ],
    modeLink: {
      href: "/reader/divide-both-sides/",
      label: "See equation solving"
    },
    shareLink: {
      href: "/reader/distribution-area/",
      label: "Link this moment",
      dataAttribute: "data-kp-distribution-share"
    },
    tocHtml,
    articleHtml: articleWithStage,
    hydration: {
      dataAttribute: "data-kp-distribution-hydration",
      json: `{"lesson":"${documentId}","version":"1"}`
    },
    entryScriptSrc: "/src/reader/app/distribution-area-entry.ts"
  });
}

function compileStage(): string {
  const factored = createKpDistributionAreaExemplarEndpoint("factored");
  const expanded = createKpDistributionAreaExemplarEndpoint("expanded");
  const scene = createKpDistributionAreaExemplarSvgScene();
  const trace = createKpDistributionAreaExemplarSemanticTrace();
  return [
    '<section class="kp-distribution-stage" data-kp-distribution-stage data-kp-direction="forward" data-kp-owner="factored-native" style="--kp-partition-progress:0">',
    '<header class="kp-distribution-stage__header">',
    '<div><span>Algebra ↔ geometry</span><output data-kp-distribution-status aria-live="polite">Read one rectangle</output></div>',
    '<div class="kp-distribution-stage__directions" role="group" aria-label="Choose operation"><button type="button" data-kp-direction-button="forward" aria-pressed="true">Distribute</button><button type="button" data-kp-direction-button="inverse" aria-pressed="false">Factor</button></div>',
    "</header>",
    '<div class="kp-distribution-visual" data-kp-distribution-visual>',
    '<div class="kp-distribution-algebra" aria-label="Animated algebra">',
    `<div class="kp-distribution-algebra__native" data-kp-native="factored">${factored.algebra.html}</div>`,
    `<div class="kp-distribution-algebra__native" data-kp-native="expanded" hidden>${expanded.algebra.html}</div>`,
    `<div class="kp-distribution-algebra__material" data-kp-algebra-material hidden>${materialTokens()}</div>`,
    `<div class="kp-distribution-algebra__measurement" data-kp-distribution-measurement aria-hidden="true">${measurementStates(trace.bundle.objects)}</div>`,
    "</div>",
    '<div class="kp-distribution-area" aria-label="A rectangle of height 3 split into widths x and 2, with areas 3x and 6.">',
    `<svg viewBox="${scene.viewBox}" role="img" aria-hidden="true">`,
    `<rect class="kp-distribution-area__base" x="${scene.outline.x}" y="${scene.outline.y}" width="${scene.outline.width}" height="${scene.outline.height}" rx="3"/>`,
    ...scene.regions.map((region) => `<rect data-kp-concept="${conceptFromGeometry(region.semanticId)}" x="${region.x}" y="${region.y}" width="${region.width}" height="${region.height}" rx="2"/>`),
    `<line data-kp-area-divider x1="${scene.dividerX}" x2="${scene.dividerX}" y1="${scene.outline.y}" y2="${scene.outline.y + scene.outline.height}"/>`,
    `<rect class="kp-distribution-area__outline" x="${scene.outline.x}" y="${scene.outline.y}" width="${scene.outline.width}" height="${scene.outline.height}" rx="3"/>`,
    "</svg>",
    areaLabel("factor.3", "factor.3", "height", "3", 8, 50),
    combinedWidthLabel(),
    areaLabel("term.x", "term.x", "x-width", "x", 39.17, 10, "target.x"),
    areaLabel("term.2", "term.2", "two-width", "2", 75.83, 10, "target.two"),
    areaLabel("product.3x", "product.3x", "left-area", "3x", 39.17, 50),
    areaLabel("factor.3 term.2 product.6", "product.6", "right-pair", "3\\cdot2", 75.83, 50),
    areaLabel("product.6", "product.6", "right-area", "6", 75.83, 50),
    '<div class="kp-distribution-area__width-material" data-kp-area-width-material aria-hidden="true" hidden>',
    widthMaterialToken("x", "term.x", "term.x", "x"),
    widthMaterialToken("plus", "", "operator.plus", "+"),
    widthMaterialToken("two", "term.2", "term.2", "2"),
    "</div>",
    "</div>",
    "</div>",
    '<label class="kp-distribution-scrubber"><span>Move the concept</span><input type="range" min="0" max="1000" step="1" value="0" data-kp-distribution-scrubber><output data-kp-distribution-progress>0%</output></label>',
    '<p class="kp-distribution-stage__hint">Scroll to move. Drag to inspect. Reverse to see factoring.</p>',
    '<p class="kp-distribution-stage__transcript" data-kp-symbolic-transcript>Symbolic transcript: 3(x+2) → 3x+3·2 → 3x+6.</p>',
    "</section>"
  ].join("\n");
}

function materialTokens(): string {
  const tokens = [
    ["source-three", "factor.3", "factor.3", "3"], ["left-three", "factor.3 product.3x", "factor.3", "3"],
    ["left-paren", "", "grouping", "("], ["x", "term.x product.3x", "term.x", "x"], ["plus", "", "operator.plus", "+"],
    ["right-three", "factor.3 product.6", "factor.3", "3"], ["times", "product.6", "operator.times", "\\cdot"],
    ["two", "term.2 product.6", "term.2", "2"], ["right-paren", "", "grouping", ")"], ["six", "product.6", "product.6", "6"]
  ] as const;
  return tokens.map(([id, concepts, lineage, latex]) =>
    `<span data-kp-material-token="${id}" data-kp-lineage="${lineage}"${concepts === "" ? "" : ` data-kp-concept="${concepts}"`}>${renderLatexToHtml(latex, { displayMode: false })}</span>`
  ).join("");
}

function measurementStates(objects: readonly { readonly id: string; readonly selectors: readonly { readonly id: string; readonly label?: string | undefined }[] }[]): string {
  return objects.map((object) => {
    const annotated = createKpDistributionAreaSelectorAnnotatedLatex(object);
    let html = renderSelectorAnnotatedLatexToHtml(annotated, { displayMode: true });
    for (const annotation of annotated.annotations) {
      html = html.replaceAll(
        `data-kp-motion-id="${annotation.motionId}"`,
        `data-kp-distribution-anchor="${annotation.selectorId}" data-kp-lineage="${kpDistributionAreaLineageForSelectorId(annotation.selectorId)}"`
      );
    }
    return `<div data-kp-distribution-state="${object.id}">${html}</div>`;
  }).join("");
}

function combinedWidthLabel(): string {
  const selectorIds = ["source.x", "source.plus", "source.two"] as const;
  const annotated = createKpSelectorAnnotatedLatex({
    id: "distribution-area.width-source",
    expectedSelectorIds: selectorIds,
    segments: [
      { kind: "selector", selectorId: "source.x", latex: "x" },
      { kind: "selector", selectorId: "source.plus", latex: "+" },
      { kind: "selector", selectorId: "source.two", latex: "2" }
    ]
  });
  let html = renderSelectorAnnotatedLatexToHtml(annotated, { displayMode: false });
  for (const annotation of annotated.annotations) {
    const lineage = annotation.selectorId === "source.x"
      ? "term.x"
      : annotation.selectorId === "source.two" ? "term.2" : "operator.plus";
    html = html.replaceAll(
      `data-kp-motion-id="${annotation.motionId}"`,
      `data-kp-area-width-anchor="${annotation.selectorId}" data-kp-lineage="${lineage}"`
    );
  }
  return `<span class="kp-distribution-area__label" data-kp-area-label="combined-width" data-kp-lineage="sum.x-plus-2" data-kp-concept="term.x term.2" style="--kp-label-left:50%;--kp-label-top:10%">${html}</span>`;
}

function widthMaterialToken(id: string, concepts: string, lineage: string, latex: string): string {
  return `<span data-kp-area-width-token="${id}" data-kp-lineage="${lineage}"${concepts === "" ? "" : ` data-kp-concept="${concepts}"`}>${renderLatexToHtml(latex, { displayMode: false })}</span>`;
}

function areaLabel(concepts: string, lineage: string, role: string, latex: string, left: number, top: number, widthAnchor?: string): string {
  return `<span class="kp-distribution-area__label" data-kp-area-label="${role}" data-kp-lineage="${lineage}" data-kp-concept="${concepts}"${widthAnchor === undefined ? "" : ` data-kp-area-width-anchor="${widthAnchor}"`} style="--kp-label-left:${left}%;--kp-label-top:${top}%">${renderLatexToHtml(latex, { displayMode: false })}</span>`;
}

function conceptFromGeometry(semanticId: string): string {
  return semanticId.endsWith("region.product.3x") ? "product.3x" : "product.6";
}
