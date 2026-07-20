export const linearEquationSecondaryFeatureIds = [
  "geometric-proof",
  "playback",
  "scrubber",
  "projection-switcher",
  "mode-switcher",
  "harder-example",
  "verification"
] as const;

export const linearEquationStoryRouteParameter = "story" as const;

export type KpLinearEquationSecondaryFeatureId =
  typeof linearEquationSecondaryFeatureIds[number];

export interface KpLinearEquationExemplarPresentationShape {
  readonly id: string;
  readonly canonicalAnimation: {
    readonly selectionId: "linear-equation-solve-x";
    readonly runtimeId: "animation.linear-solve.solve-x";
    readonly presentationRecipe: "continuity-v1";
  };
  readonly opening: {
    readonly projection: "symbolic";
    readonly readingOrder: readonly ["explanation", "stage"];
    readonly autoPlay: false;
    readonly continuousScrollScrub: false;
  };
  readonly secondarySurface: {
    readonly kind: "disclosure";
    readonly label: string;
    readonly features: readonly KpLinearEquationSecondaryFeatureId[];
  };
}

export function defineLinearEquationExemplarPresentation<
  const Presentation extends KpLinearEquationExemplarPresentationShape
>(presentation: Presentation): Presentation {
  return deepFreeze(presentation);
}

// This policy stays route-local until the reviewed exemplar proves which defaults
// deserve promotion into a general concept-room authoring contract.
export const symbolicFirstLinearEquationPresentation =
  defineLinearEquationExemplarPresentation({
    id: "kp.linear-equation-exemplar.symbolic-scrollytelling.v1",
    canonicalAnimation: {
      selectionId: "linear-equation-solve-x",
      runtimeId: "animation.linear-solve.solve-x",
      presentationRecipe: "continuity-v1"
    },
    opening: {
      projection: "symbolic",
      readingOrder: ["explanation", "stage"],
      autoPlay: false,
      continuousScrollScrub: false
    },
    secondarySurface: {
      kind: "disclosure",
      label: "Explore more",
      features: linearEquationSecondaryFeatureIds
    }
  });

function deepFreeze<Value>(value: Value): Value {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}
