export type NotationTransformId =
  | "notation-inline-to-stacked-fraction"
  | "notation-radical-to-exponent"
  | "notation-implicit-to-explicit-multiply";

export type NotationTransformStatus = "active" | "planned" | "proposed";

export type NotationTransformGeometryFamily =
  | "fraction"
  | "multiplication"
  | "radical"
  | "script";

export type NotationTransformIdentityPolicy = "preserve-semantic-object";

export interface NotationTransformDefinition {
  readonly id: NotationTransformId;
  readonly title: string;
  readonly status: NotationTransformStatus;
  readonly geometryFamily: NotationTransformGeometryFamily;
  readonly identityPolicy: NotationTransformIdentityPolicy;
  readonly sourceNotation: string;
  readonly targetNotation: string;
  readonly summary: string;
  readonly renderArtifactRoles: readonly string[];
  readonly tags: readonly string[];
}

export const notationTransformDefinitions: readonly NotationTransformDefinition[] = [
  {
    id: "notation-inline-to-stacked-fraction",
    title: "inlineFractionToStackedFraction",
    status: "planned",
    geometryFamily: "fraction",
    identityPolicy: "preserve-semantic-object",
    sourceNotation: "inline-slash",
    targetNotation: "stacked-fraction",
    summary:
      "Preserves an expression's semantic identity while changing slash notation into a KaTeX fraction layout.",
    renderArtifactRoles: ["fraction-bar"],
    tags: ["katex", "fraction", "artifact"]
  },
  {
    id: "notation-radical-to-exponent",
    title: "radicalToExponent",
    status: "proposed",
    geometryFamily: "radical",
    identityPolicy: "preserve-semantic-object",
    sourceNotation: "radical",
    targetNotation: "power-one-half",
    summary:
      "Preserves the radicand value while switching between radical notation and exponent notation.",
    renderArtifactRoles: ["radical", "radical-line"],
    tags: ["katex", "radical", "script"]
  },
  {
    id: "notation-implicit-to-explicit-multiply",
    title: "implicitToExplicitMultiplication",
    status: "planned",
    geometryFamily: "multiplication",
    identityPolicy: "preserve-semantic-object",
    sourceNotation: "implicit-product",
    targetNotation: "explicit-operator",
    summary:
      "Preserves a product while adding or removing an explicit multiplication operator in the rendered notation.",
    renderArtifactRoles: ["explicit-operator"],
    tags: ["katex", "multiplication", "operator"]
  }
];

export function findNotationTransformDefinition(
  id: string
): NotationTransformDefinition {
  const definition = notationTransformDefinitions.find(
    (candidate) => candidate.id === id
  );

  if (definition === undefined) {
    throw new Error(`Unknown notation transform: ${id}`);
  }

  return definition;
}
