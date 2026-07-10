export const SEMANTIC_OBJECT_CAPABILITY_IDS = [
  "render",
  "select",
  "derive",
  "execute",
  "transform",
  "compare",
  "diagnose",
  "animate",
  "link"
] as const;

export type SemanticObjectCapabilityId =
  typeof SEMANTIC_OBJECT_CAPABILITY_IDS[number];

export type SemanticObjectDefinitionStatus =
  | "active"
  | "planned"
  | "proposed";

export interface SemanticObjectDefinitionMetadata {
  readonly type: string;
  readonly title: string;
  readonly domain: string;
  readonly status: SemanticObjectDefinitionStatus;
  readonly summary: string;
  readonly tags: readonly string[];
  readonly capabilities: readonly SemanticObjectCapabilityId[];
}

export interface SemanticObjectRegistry {
  listDefinitions(): readonly SemanticObjectDefinitionMetadata[];
  getDefinition(type: string): SemanticObjectDefinitionMetadata | undefined;
  listTypesByCapability(
    capability: SemanticObjectCapabilityId
  ): readonly string[];
}

export function createSemanticObjectRegistry(
  definitions: readonly SemanticObjectDefinitionMetadata[]
): SemanticObjectRegistry {
  const definitionsByType = new Map<string, SemanticObjectDefinitionMetadata>();
  const orderedDefinitions: SemanticObjectDefinitionMetadata[] = [];

  for (const definition of definitions) {
    if (definitionsByType.has(definition.type)) {
      throw new Error(`Duplicate semantic object definition ${definition.type}.`);
    }

    definitionsByType.set(definition.type, definition);
    orderedDefinitions.push(definition);
  }

  return {
    listDefinitions: () => [...orderedDefinitions],
    getDefinition: (type) => definitionsByType.get(type),
    listTypesByCapability: (capability) =>
      orderedDefinitions
        .filter((definition) => definition.capabilities.includes(capability))
        .map((definition) => definition.type)
  };
}

export function createDefaultSemanticObjectRegistry(): SemanticObjectRegistry {
  return createSemanticObjectRegistry(defaultSemanticObjectDefinitions);
}

export const defaultSemanticObjectDefinitions:
  readonly SemanticObjectDefinitionMetadata[] = [
    {
      type: "expression",
      title: "Expression",
      domain: "math-core",
      status: "active",
      summary:
        "Symbolic expression tree with exact LaTeX, graph derivation, numeric evaluation, and selector metadata.",
      tags: ["math", "symbolic", "function"],
      capabilities: ["render", "select", "derive", "execute"]
    },
    {
      type: "equation",
      title: "Equation",
      domain: "math-core",
      status: "active",
      summary:
        "Left/right symbolic relation that can transform, render as KaTeX, and derive graph views when classifiable.",
      tags: ["math", "relation", "transform"],
      capabilities: ["render", "select", "derive", "transform", "animate"]
    },
    {
      type: "graph-2d",
      title: "Graph2D",
      domain: "graphs",
      status: "active",
      summary:
        "2D graph scene with axes, curves, render metadata, and optional symbolic provenance for exact LaTeX derivation.",
      tags: ["graph", "latex", "provenance"],
      capabilities: ["render", "select", "derive"]
    },
    {
      type: "matrix",
      title: "Matrix",
      domain: "linear-algebra",
      status: "active",
      summary:
        "Rectangular linear-algebra object with row, column, entry selectors, LaTeX rendering, execution, and linear-map derivation metadata.",
      tags: ["linear-algebra", "selectors", "grid"],
      capabilities: ["render", "select", "derive", "execute"]
    },
    {
      type: "graph-3d",
      title: "Graph3D",
      domain: "graphs",
      status: "active",
      summary:
        "3D graph scene with axes, surfaces, curves, camera, lighting, and WebGL/SVG render adapters.",
      tags: ["graph", "webgl", "surface"],
      capabilities: ["render", "select", "animate"]
    },
    {
      type: "latex-form",
      title: "LaTeX form",
      domain: "math-core",
      status: "active",
      summary:
        "Authored or derived LaTeX representation with provenance and comparison-card support.",
      tags: ["latex", "representation"],
      capabilities: ["render", "select", "link"]
    },
    {
      type: "animation-intent",
      title: "Animation intent",
      domain: "animation-runtime",
      status: "active",
      summary:
        "Semantic animation request that can compile to sampleable runtime frames.",
      tags: ["animation", "timeline"],
      capabilities: ["animate", "link"]
    }
  ];
