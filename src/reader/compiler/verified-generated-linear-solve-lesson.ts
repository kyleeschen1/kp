import {
  compileKpAnimationAssetSemanticRefs,
  type KpAnimationAsset
} from "../../animation/asset.ts";
import {
  createKpGeneratedLinearSolveSelectorAnnotatedLatex
} from "../../rendering/generated-linear-solve-selector-annotated-latex.ts";
import type { KpSemanticAssetObject } from "../../semantic/asset.ts";
import {
  createKpVerifiedGeneratedLinearSolveSession
} from "../../tutorial/verified-generated-linear-solve-session.ts";
import {
  createKpCompiledLessonArtifact,
  type KpReaderEquationPresentationCapability
} from "../document/public-api.ts";
import {
  emitKpReaderHydrationManifest,
  serializeKpReaderHydrationManifest
} from "./hydration-manifest.ts";
import { parseKpLessonMarkdown } from "./lesson-markdown-parser.ts";
import {
  defineKpReaderAssetCatalog,
  resolveKpLessonReferences
} from "./reference-resolver.ts";
import { compileKpStaticMathStates } from "./static-math-compiler.ts";
import { compileKpStaticLessonProse } from "./static-prose-compiler.ts";
import { compileKpEquationExemplarPage } from "./equation-exemplar-page.ts";

export function compileKpVerifiedGeneratedLinearSolveLesson(markdown: string) {
  const session = createKpVerifiedGeneratedLinearSolveSession();
  const animation = session.animation.animation;
  const refs = compileKpAnimationAssetSemanticRefs(animation);
  if (refs.diagnostics.length > 0) {
    throw new Error(
      `verified generated solve animation is invalid: ${refs.diagnostics[0]!.message}`
    );
  }
  const objectRefs = animation.bundle.objects.flatMap((object) => [
    object.id,
    ...object.selectors.map((selector) => selector.id)
  ]);
  const document = parseKpLessonMarkdown({
    sourceId: "content/lessons/generated-solve-x.md",
    id: "lesson.generated-solve-x.linear-68c15d41",
    version: "1",
    title: "Solve 2x + 3 = 8",
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
  const equationStates = equationObjectSequence(animation);
  const staticMath = compileKpStaticMathStates(
    document,
    ({ progressPermille }) => {
      const index = Math.round(
        (progressPermille / 1_000) * (equationStates.length - 1)
      );
      const state = equationStates[index];
      if (state === undefined) {
        throw new Error(`No generated equation state at index ${index}.`);
      }
      return { latex: latexValue(state), label: state.title };
    }
  );
  const prose = compileKpStaticLessonProse(document, { staticMath });
  const hydration = emitKpReaderHydrationManifest(resolved, staticMath);
  const html = compileKpEquationExemplarPage({
    animation,
    title: "Solve 2x + 3 = 8",
    description:
      "A verified generated equation moves through a compact, searchable explanation.",
    documentId: document.id,
    documentVersion: document.version,
    lessonVariant: "generated-linear-solve",
    modeLink: {
      href: `/?artifact=${encodeURIComponent(animation.id)}`,
      label: "Open in catalogue"
    },
    tocHtml: prose.tocHtml,
    articleHtml: prose.articleHtml,
    hydrationJson: serializeKpReaderHydrationManifest(hydration),
    equationPresentation: requireEquationPresentation(hydration.blocks[0]),
    annotateState: (state) =>
      createKpGeneratedLinearSolveSelectorAnnotatedLatex({
        objectId: state.id,
        selectors: state.selectors
      })
  });
  return createKpCompiledLessonArtifact({
    id: "compiled.lesson.generated-solve-x.linear-68c15d41",
    version: "1",
    document: {
      kind: "lesson-document",
      id: document.id,
      version: document.version
    },
    html,
    tocHtml: prose.tocHtml,
    hydration
  });
}

function equationObjectSequence(
  animation: KpAnimationAsset
): readonly KpSemanticAssetObject[] {
  const ids = [
    animation.transformations[0]?.sourceObjectIds[0],
    ...animation.transformations.map(({ targetObjectIds }) => targetObjectIds[0])
  ];
  return ids.map((id) => {
    const object = animation.bundle.objects.find(
      (candidate) => candidate.id === id
    );
    if (object === undefined) {
      throw new Error(`Generated equation object ${String(id)} is missing.`);
    }
    latexValue(object);
    return object;
  });
}

function latexValue(object: KpSemanticAssetObject): string {
  const value = object.value;
  if (
    typeof value !== "object" || value === null || !("latex" in value) ||
    typeof value.latex !== "string"
  ) {
    throw new Error(`Generated equation object ${object.id} has no LaTeX.`);
  }
  return value.latex;
}

function requireEquationPresentation(
  block: {
    readonly equationPresentation?:
      KpReaderEquationPresentationCapability | undefined;
  } | undefined
) {
  if (block?.equationPresentation === undefined) {
    throw new Error("Generated equation presentation capability is missing.");
  }
  return block.equationPresentation;
}
