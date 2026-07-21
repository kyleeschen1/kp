import { compileKpAnimationAssetSemanticRefs } from "../../animation/asset.ts";
import type { KpAnimationAsset } from "../../animation/asset.ts";
import {
  createLinearSolveAnimationAsset,
  createLinearSolveTeacherZeroAnimationAsset
} from "../../animation/linear-solve-adapter.ts";
import type { KpSemanticAssetObject } from "../../semantic/asset.ts";
import { createKpSolveXSelectorAnnotatedLatex } from "../../rendering/solve-x-selector-annotated-latex.ts";
import {
  createKpCompiledLessonArtifact,
  type KpReaderEquationPresentationCapability
} from "../document/public-api.ts";
import {
  emitKpReaderHydrationManifest,
  serializeKpReaderHydrationManifest
} from "./hydration-manifest.ts";
import { parseKpLessonMarkdown } from "./lesson-markdown-parser.ts";
import { defineKpReaderAssetCatalog, resolveKpLessonReferences } from "./reference-resolver.ts";
import { compileKpStaticMathStates } from "./static-math-compiler.ts";
import { compileKpStaticLessonProse } from "./static-prose-compiler.ts";
import { compileKpEquationExemplarPage } from "./equation-exemplar-page.ts";

export function compileKpXPlusThreeLesson(markdown: string) {
  return compileKpXPlusThreeLessonVariant(markdown, {
    animation: createLinearSolveAnimationAsset(),
    sourceId: "content/lessons/solve-x.md",
    documentId: "lesson.solve-x.x-plus-3",
    compiledId: "compiled.lesson.solve-x.x-plus-3",
    title: "Solve x + 3 = 7",
    variant: "streamlined"
  });
}

export function compileKpXPlusThreeTeacherZeroLesson(markdown: string) {
  return compileKpXPlusThreeLessonVariant(markdown, {
    animation: createLinearSolveTeacherZeroAnimationAsset(),
    sourceId: "content/lessons/solve-x-teacher-zero.md",
    documentId: "lesson.solve-x.x-plus-3.teacher-zero",
    compiledId: "compiled.lesson.solve-x.x-plus-3.teacher-zero",
    title: "Solve x + 3 = 7 with explicit zero",
    variant: "teacher-zero"
  });
}

function compileKpXPlusThreeLessonVariant(markdown: string, input: {
  readonly animation: KpAnimationAsset;
  readonly sourceId: string;
  readonly documentId: string;
  readonly compiledId: string;
  readonly title: string;
  readonly variant: "streamlined" | "teacher-zero";
}) {
  const animation = input.animation;
  const refs = compileKpAnimationAssetSemanticRefs(animation);
  if (refs.diagnostics.length > 0) {
    throw new Error(`canonical x-plus-3 animation is invalid: ${refs.diagnostics[0]!.message}`);
  }
  const objectRefs = animation.bundle.objects.flatMap((object) => [
    object.id,
    ...object.selectors.map((selector) => selector.id)
  ]);
  const document = parseKpLessonMarkdown({
    sourceId: input.sourceId,
    id: input.documentId,
    version: "1",
    title: input.title,
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
  const variantLink = input.variant === "streamlined"
    ? {
        href: "/reader/solve-x/teacher-zero/?kpLesson=lesson.solve-x.x-plus-3.teacher-zero&amp;kpVersion=1&amp;kpCheckpoint=beat.make-zero&amp;kpProgress=500",
        label: "Explain the zero"
      }
    : {
        href: "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&amp;kpVersion=1&amp;kpCheckpoint=beat.cancel&amp;kpProgress=667",
        label: "Skip the zero"
      };
  const html = compileKpEquationExemplarPage({
    animation,
    title: input.title,
    description: "See algebra move through a searchable, shareable explanation.",
    documentId: document.id,
    documentVersion: document.version,
    lessonVariant: input.variant,
    modeLink: variantLink,
    tocHtml: prose.tocHtml,
    articleHtml: prose.articleHtml,
    hydrationJson: serializeKpReaderHydrationManifest(hydration),
    equationPresentation: requireEquationPresentation(hydration.blocks[0]),
    annotateState: (state) => createKpSolveXSelectorAnnotatedLatex({
      objectId: state.id,
      selectorIds: state.selectors.map((selector) => selector.id)
    })
  });
  return createKpCompiledLessonArtifact({
    id: input.compiledId,
    version: "1",
    document: { kind: "lesson-document", id: document.id, version: document.version },
    html,
    tocHtml: prose.tocHtml,
    hydration
  });
}

function requireEquationPresentation(
  block: {
    readonly equationPresentation?: KpReaderEquationPresentationCapability | undefined;
  } | undefined
) {
  if (block?.equationPresentation === undefined) {
    throw new Error("linear equation presentation capability is missing");
  }
  return block.equationPresentation;
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
