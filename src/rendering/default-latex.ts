import type { KpSemanticObject } from "../semantic/document.ts";

type SemanticObjectType = KpSemanticObject["type"];

export interface DefaultLatexObjectRenderer<
  ObjectType extends KpSemanticObject = KpSemanticObject
> {
  type: ObjectType["type"];
  render: (object: ObjectType) => string;
}

export interface DefaultLatexRenderer {
  render(object: KpSemanticObject): string;
}

export function createDefaultLatexRenderer(
  renderers: readonly DefaultLatexObjectRenderer[]
): DefaultLatexRenderer {
  const renderersByType = new Map<SemanticObjectType, DefaultLatexObjectRenderer>(
    renderers.map((renderer) => [renderer.type, renderer])
  );

  return {
    render(object) {
      const renderer = renderersByType.get(object.type);

      if (renderer === undefined) {
        throw new Error(
          `No default LaTeX renderer registered for ${object.type}.`
        );
      }

      return renderer.render(object);
    }
  };
}
