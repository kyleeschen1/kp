import {
  compileKpAnimationAssetSemanticRefs,
  type KpAnimationAsset
} from "../../animation/asset.ts";
import type { KpSemanticAssetObject } from "../../semantic/asset.ts";
import { emitKpReaderHydrationManifest } from "./hydration-manifest.ts";
import { parseKpLessonMarkdown } from "./lesson-markdown-parser.ts";
import {
  defineKpReaderAssetCatalog,
  resolveKpLessonReferences
} from "./reference-resolver.ts";
import { compileKpStaticMathStates } from "./static-math-compiler.ts";
import { compileKpStaticLessonProse } from "./static-prose-compiler.ts";

export function compileKpEquationExemplarLessonModel(input: {
  readonly animation: KpAnimationAsset;
  readonly sourceId: string;
  readonly documentId: string;
  readonly version: string;
  readonly title: string;
  readonly language: string;
  readonly markdown: string;
  readonly diagnosticLabel: string;
}) {
  const refs = compileKpAnimationAssetSemanticRefs(input.animation);
  if (refs.diagnostics.length > 0) {
    throw new Error(`${input.diagnosticLabel} animation is invalid: ${refs.diagnostics[0]!.message}`);
  }
  const document = parseKpLessonMarkdown({
    sourceId: input.sourceId,
    id: input.documentId,
    version: input.version,
    title: input.title,
    language: input.language,
    markdown: input.markdown
  });
  const objectRefs = input.animation.bundle.objects.flatMap((object) => [
    object.id,
    ...object.selectors.map((selector) => selector.id)
  ]);
  const catalog = defineKpReaderAssetCatalog({ entries: [{
    id: input.animation.id,
    version: "1",
    rendererId: "renderer.equation-dom",
    objectRefs
  }] });
  const resolved = resolveKpLessonReferences(document, catalog);
  const states = equationObjectSequence(
    input.animation.bundle.objects,
    input.animation.transformations,
    input.diagnosticLabel
  );
  const staticMath = compileKpStaticMathStates(document, ({ progressPermille }) => {
    const index = Math.round((progressPermille / 1_000) * (states.length - 1));
    const state = states[index];
    if (state === undefined) throw new Error(`no ${input.diagnosticLabel} equation state at ${index}`);
    return {
      latex: latexValue(state),
      label: accessibleTextValue(state) ?? state.title
    };
  });
  const prose = compileKpStaticLessonProse(document, { staticMath });
  return {
    animation: input.animation,
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
  }[],
  diagnosticLabel: string
): readonly KpSemanticAssetObject[] {
  const ids = [
    transformations[0]?.sourceObjectIds[0],
    ...transformations.map((transformation) => transformation.targetObjectIds[0])
  ];
  return ids.map((id) => {
    const object = objects.find((candidate) => candidate.id === id);
    if (object === undefined) throw new Error(`${diagnosticLabel} equation object ${String(id)} is missing`);
    return object;
  });
}

function latexValue(object: KpSemanticAssetObject): string {
  const value = object.value;
  if (typeof value !== "object" || value === null || !("latex" in value)
    || typeof value.latex !== "string") {
    throw new Error(`equation object ${object.id} has no LaTeX`);
  }
  return value.latex;
}

function accessibleTextValue(
  object: KpSemanticAssetObject
): string | undefined {
  const value = object.value;
  return typeof value === "object" &&
      value !== null &&
      "accessibleText" in value &&
      typeof value.accessibleText === "string"
    ? value.accessibleText
    : undefined;
}
