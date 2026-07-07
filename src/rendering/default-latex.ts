import type { KpSemanticObject } from "../semantic/document.ts";

type SemanticObjectType = KpSemanticObject["type"];
type DefaultLatexObjectRendererByType = {
  [ObjectType in KpSemanticObject as ObjectType["type"]]: DefaultLatexObjectRenderer<ObjectType>;
};
type AnyDefaultLatexObjectRenderer =
  DefaultLatexObjectRendererByType[SemanticObjectType];
type RegisteredLatexRenderer = {
  type: SemanticObjectType;
  render: (object: KpSemanticObject) => string;
};

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
  renderers: readonly AnyDefaultLatexObjectRenderer[]
): DefaultLatexRenderer {
  const renderersByType = new Map<SemanticObjectType, RegisteredLatexRenderer>(
    renderers.map((renderer) => [
      renderer.type,
      {
        type: renderer.type,
        render: (object) => renderer.render(object as never)
      }
    ])
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
