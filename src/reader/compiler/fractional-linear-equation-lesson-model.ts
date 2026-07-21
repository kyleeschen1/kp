import { compileKpAnimationAssetSemanticRefs } from "../../animation/asset.ts";
import {
  createFractionalLinearEquationAnimationAsset
} from "../../animation/fractional-linear-equation-adapter.ts";
import type { KpSemanticAssetObject } from "../../semantic/asset.ts";
import {
  emitKpReaderHydrationManifest
} from "./hydration-manifest.ts";
import { parseKpLessonMarkdown } from "./lesson-markdown-parser.ts";
import {
  defineKpReaderAssetCatalog,
  resolveKpLessonReferences
} from "./reference-resolver.ts";
import { compileKpStaticMathStates } from "./static-math-compiler.ts";
import { compileKpStaticLessonProse } from "./static-prose-compiler.ts";

export function compileKpFractionalLinearEquationLessonModel(markdown: string) {
  const animation = createFractionalLinearEquationAnimationAsset();
  const refs = compileKpAnimationAssetSemanticRefs(animation);
  if (refs.diagnostics.length > 0) {
    throw new Error(`fractional equation animation is invalid: ${refs.diagnostics[0]!.message}`);
  }
  const document = parseKpLessonMarkdown({
    sourceId: "content/lessons/solve-fractional-linear.md",
    id: "lesson.solve-x.fractional-linear",
    version: "1",
    title: "Solve x/2 + 3 = 7",
    language: "en",
    markdown
  });
  const objectRefs = animation.bundle.objects.flatMap((object) => [
    object.id,
    ...object.selectors.map((selector) => selector.id)
  ]);
  const catalog = defineKpReaderAssetCatalog({ entries: [{
    id: animation.id,
    version: "1",
    rendererId: "renderer.equation-dom",
    objectRefs
  }] });
  const resolved = resolveKpLessonReferences(document, catalog);
  const states = equationObjectSequence(animation.bundle.objects, animation.transformations);
  const staticMath = compileKpStaticMathStates(document, ({ progressPermille }) => {
    const index = Math.round((progressPermille / 1_000) * (states.length - 1));
    const state = states[index];
    if (state === undefined) throw new Error(`no fractional equation state at ${index}`);
    return { latex: latexValue(state), label: state.title };
  });
  const prose = compileKpStaticLessonProse(document, { staticMath });
  return {
    animation,
    document,
    resolved,
    staticMath,
    prose,
    hydration: emitKpReaderHydrationManifest(resolved, staticMath)
  } as const;
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
    if (object === undefined) throw new Error(`fractional equation object ${String(id)} is missing`);
    return object;
  });
}

function latexValue(object: KpSemanticAssetObject): string {
  const value = object.value;
  if (typeof value !== "object" || value === null || !("latex" in value)
    || typeof value.latex !== "string") {
    throw new Error(`fractional equation object ${object.id} has no LaTeX`);
  }
  return value.latex;
}
