import { compileKpAnimationAssetSemanticRefs } from "../../animation/asset.ts";
import { createLinearSolveAnimationAsset } from "../../animation/linear-solve-adapter.ts";
import type { KpSemanticAssetObject } from "../../semantic/asset.ts";
import { createKpCompiledLessonArtifact } from "../document/public-api.ts";
import {
  emitKpReaderHydrationManifest,
  serializeKpReaderHydrationManifest
} from "./hydration-manifest.ts";
import { parseKpLessonMarkdown } from "./lesson-markdown-parser.ts";
import { defineKpReaderAssetCatalog, resolveKpLessonReferences } from "./reference-resolver.ts";
import { compileKpStaticMathStates } from "./static-math-compiler.ts";
import { compileKpStaticLessonProse } from "./static-prose-compiler.ts";

export function compileKpXPlusThreeLesson(markdown: string) {
  const animation = createLinearSolveAnimationAsset();
  const refs = compileKpAnimationAssetSemanticRefs(animation);
  if (refs.diagnostics.length > 0) {
    throw new Error(`canonical x-plus-3 animation is invalid: ${refs.diagnostics[0]!.message}`);
  }
  const objectRefs = animation.bundle.objects.flatMap((object) => [
    object.id,
    ...object.selectors.map((selector) => selector.id)
  ]);
  const document = parseKpLessonMarkdown({
    sourceId: "content/lessons/solve-x.md",
    id: "lesson.solve-x.x-plus-3",
    version: "1",
    title: "Solve x + 3 = 7",
    language: "en",
    markdown
  });
  const catalog = defineKpReaderAssetCatalog({ entries: [{
    id: animation.id,
    version: "1",
    rendererId: "renderer.equation-dom",
    objectRefs
  }] });
  const resolved = resolveKpLessonReferences(document, catalog);
  const equationStates = equationObjectSequence(animation.bundle.objects, animation.transformations);
  const staticMath = compileKpStaticMathStates(document, ({ progressPermille }) => {
    const index = Math.round((progressPermille / 1_000) * (equationStates.length - 1));
    const state = equationStates[index];
    if (state === undefined) throw new Error(`no x-plus-3 equation state at index ${index}`);
    return { latex: latexValue(state), label: state.title };
  });
  const prose = compileKpStaticLessonProse(document, { staticMath });
  const hydration = emitKpReaderHydrationManifest(resolved, staticMath);
  const html = [
    "<!doctype html>",
    `<html lang="en">`,
    "<head>",
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>Solve x + 3 = 7</title>`,
    "</head>",
    `<body data-kp-reader="semantic-document">`,
    prose.tocHtml,
    prose.articleHtml,
    `<script type="application/json" data-kp-hydration>${serializeKpReaderHydrationManifest(hydration)}</script>`,
    "</body>",
    "</html>"
  ].join("\n");
  return createKpCompiledLessonArtifact({
    id: "compiled.lesson.solve-x.x-plus-3",
    version: "1",
    document: { kind: "lesson-document", id: document.id, version: document.version },
    html,
    tocHtml: prose.tocHtml,
    hydration
  });
}

function equationObjectSequence(
  objects: readonly KpSemanticAssetObject[],
  transformations: readonly {
    readonly sourceObjectIds: readonly string[];
    readonly targetObjectIds: readonly string[];
  }[]
): readonly KpSemanticAssetObject[] {
  const ids = [
    transformations[0]?.sourceObjectIds[0],
    ...transformations.map((transformation) => transformation.targetObjectIds[0])
  ];
  return ids.map((id) => {
    const object = objects.find((candidate) => candidate.id === id);
    if (object === undefined) throw new Error(`canonical equation object ${String(id)} is missing`);
    latexValue(object);
    return object;
  });
}

function latexValue(object: KpSemanticAssetObject): string {
  const value = object.value;
  if (typeof value !== "object" || value === null || !("latex" in value)
    || typeof value.latex !== "string") {
    throw new Error(`canonical equation object ${object.id} has no LaTeX value`);
  }
  return value.latex;
}
