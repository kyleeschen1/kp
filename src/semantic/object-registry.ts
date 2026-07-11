import type { SemanticComputationProtocolId } from "./computation-protocols.ts";
import type { SemanticDeriveCapabilityId } from "./derive-protocols.ts";

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
  readonly capabilityPackageIds?: readonly string[] | undefined;
  readonly capabilityAdvertisements?:
    readonly SemanticObjectCapabilityAdvertisement[];
}

export interface SemanticObjectCapabilityAdvertisement {
  readonly capability: SemanticObjectCapabilityId;
  readonly status: SemanticObjectDefinitionStatus;
  readonly summary: string;
  readonly descriptorIds?: readonly SemanticDeriveCapabilityId[];
  readonly targetTypes?: readonly string[];
  readonly protocolIds?: readonly SemanticComputationProtocolId[];
}

export interface SemanticObjectRegistry {
  listDefinitions(): readonly SemanticObjectDefinitionMetadata[];
  getDefinition(type: string): SemanticObjectDefinitionMetadata | undefined;
  listTypesByCapability(
    capability: SemanticObjectCapabilityId
  ): readonly string[];
  listCapabilityAdvertisementsForType(
    type: string
  ): readonly SemanticObjectCapabilityAdvertisement[];
  listCapabilityPackageIdsForType(type: string): readonly string[];
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
        .map((definition) => definition.type),
    listCapabilityAdvertisementsForType: (type) => {
      const definition = definitionsByType.get(type);

      if (definition === undefined) {
        return [];
      }

      return [
        ...(definition.capabilityAdvertisements ??
          createDefaultCapabilityAdvertisements(definition))
      ];
    },
    listCapabilityPackageIdsForType: (type) => {
      const definition = definitionsByType.get(type);

      return definition === undefined
        ? []
        : [...(definition.capabilityPackageIds ?? [])];
    }
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
      capabilities: ["render", "select", "derive", "execute"],
      capabilityAdvertisements: [
        capabilityAdvertisement(
          "render",
          "active",
          "Render expression trees as LaTeX, KaTeX, or inspector views."
        ),
        capabilityAdvertisement(
          "select",
          "active",
          "Expose stable selectors for expression terms and factors."
        ),
        capabilityAdvertisement(
          "derive",
          "active",
          "Derive exact semantic forms from expressions without loading renderers.",
          {
            descriptorIds: [
              "expression.latex",
              "expression.graph2d",
              "expression.graph3d"
            ],
            targetTypes: ["latex-form", "graph-2d", "graph-3d"]
          }
        ),
        capabilityAdvertisement(
          "execute",
          "active",
          "Evaluate, differentiate, or sample executable expression values.",
          {
            protocolIds: ["evaluate", "differentiate", "numericSample"]
          }
        )
      ]
    },
    {
      type: "equation",
      title: "Equation",
      domain: "math-core",
      status: "active",
      summary:
        "Left/right symbolic relation that can transform, render as KaTeX, and derive graph views when classifiable.",
      tags: ["math", "relation", "transform"],
      capabilities: ["render", "select", "derive", "transform", "animate"],
      capabilityPackageIds: ["package.kp.equation.render.katex"],
      capabilityAdvertisements: [
        capabilityAdvertisement(
          "render",
          "active",
          "Render equation relations as LaTeX or KaTeX."
        ),
        capabilityAdvertisement(
          "select",
          "active",
          "Expose selectors for sides, terms, operators, and tokens."
        ),
        capabilityAdvertisement(
          "derive",
          "planned",
          "Derive exact graph forms when the equation classifier proves a supported relation.",
          {
            descriptorIds: ["equation.graph2d"],
            targetTypes: ["graph-2d"]
          }
        ),
        capabilityAdvertisement(
          "transform",
          "active",
          "Apply semantic equation transformations with correspondence metadata."
        ),
        capabilityAdvertisement(
          "animate",
          "active",
          "Compile transformations into sampleable equation motion frames."
        )
      ]
    },
    {
      type: "graph-2d",
      title: "Graph2D",
      domain: "graphs",
      status: "active",
      summary:
        "2D graph scene with axes, curves, render metadata, and optional symbolic provenance for exact LaTeX derivation.",
      tags: ["graph", "latex", "provenance"],
      capabilities: ["render", "select", "derive"],
      capabilityAdvertisements: [
        capabilityAdvertisement(
          "render",
          "active",
          "Render graph scenes through SVG or WebGL-backed adapters."
        ),
        capabilityAdvertisement(
          "select",
          "active",
          "Expose selectors for axes, curves, samples, regions, and labels."
        ),
        capabilityAdvertisement(
          "derive",
          "planned",
          "Recover exact LaTeX only from symbolic provenance and mark samples as approximate.",
          {
            descriptorIds: ["graph2d.exact-latex", "graph2d.sampled-latex"],
            targetTypes: ["latex-form"]
          }
        )
      ]
    },
    {
      type: "matrix",
      title: "Matrix",
      domain: "linear-algebra",
      status: "active",
      summary:
        "Rectangular linear-algebra object with row, column, entry selectors, LaTeX rendering, execution, and linear-map derivation metadata.",
      tags: ["linear-algebra", "selectors", "grid"],
      capabilities: ["render", "select", "derive", "execute"],
      capabilityPackageIds: [
        "package.kp.matrix.render.katex",
        "package.kp.matrix.execute.facts"
      ],
      capabilityAdvertisements: [
        capabilityAdvertisement(
          "render",
          "active",
          "Render matrix entries as LaTeX, KaTeX, tables, or comparison views."
        ),
        capabilityAdvertisement(
          "select",
          "active",
          "Expose row, column, and entry selectors."
        ),
        capabilityAdvertisement(
          "derive",
          "planned",
          "Derive a linear-map representation with explicit basis provenance.",
          {
            descriptorIds: ["matrix.linear-map"],
            targetTypes: ["linear-map"]
          }
        ),
        capabilityAdvertisement(
          "execute",
          "active",
          "Compute matrix facts such as shape, square-ness, and determinant.",
          {
            protocolIds: ["evaluate", "matrixForm"]
          }
        )
      ]
    },
    {
      type: "graph-3d",
      title: "Graph3D",
      domain: "graphs",
      status: "active",
      summary:
        "3D graph scene with axes, surfaces, curves, camera, lighting, and WebGL/SVG render adapters.",
      tags: ["graph", "webgl", "surface"],
      capabilities: ["render", "select", "animate"],
      capabilityPackageIds: [
        "package.kp.graph3d.render.webgl.surface-mesh"
      ],
      capabilityAdvertisements: [
        capabilityAdvertisement(
          "render",
          "active",
          "Render 3D graph scenes through SVG fallback or WebGL/Three adapters."
        ),
        capabilityAdvertisement(
          "select",
          "active",
          "Expose selectors for axes, surfaces, curves, cameras, and render modes."
        ),
        capabilityAdvertisement(
          "animate",
          "active",
          "Sample surface morphs and camera/projection changes on the shared clock."
        )
      ]
    },
    {
      type: "latex-form",
      title: "LaTeX form",
      domain: "math-core",
      status: "active",
      summary:
        "Authored or derived LaTeX representation with provenance and comparison-card support.",
      tags: ["latex", "representation"],
      capabilities: ["render", "select", "link"],
      capabilityAdvertisements: [
        capabilityAdvertisement(
          "render",
          "active",
          "Render authored or derived LaTeX through the current KaTeX pipeline."
        ),
        capabilityAdvertisement(
          "select",
          "active",
          "Expose source and comparison selectors when authored metadata is available."
        ),
        capabilityAdvertisement(
          "link",
          "active",
          "Link a LaTeX form back to source objects or comparison cards."
        )
      ]
    },
    {
      type: "animation-intent",
      title: "Animation intent",
      domain: "animation-runtime",
      status: "active",
      summary:
        "Semantic animation request that can compile to sampleable runtime frames.",
      tags: ["animation", "timeline"],
      capabilities: ["animate", "link"],
      capabilityAdvertisements: [
        capabilityAdvertisement(
          "animate",
          "active",
          "Compile semantic animation intents into deterministic sampled frames."
        ),
        capabilityAdvertisement(
          "link",
          "active",
          "Link sampled frames back to source semantic objects and timelines."
        )
      ]
    }
  ];

function capabilityAdvertisement(
  capability: SemanticObjectCapabilityId,
  status: SemanticObjectDefinitionStatus,
  summary: string,
  extras: {
    readonly descriptorIds?: readonly SemanticDeriveCapabilityId[];
    readonly targetTypes?: readonly string[];
    readonly protocolIds?: readonly SemanticComputationProtocolId[];
  } = {}
): SemanticObjectCapabilityAdvertisement {
  return {
    capability,
    status,
    summary,
    ...extras
  };
}

function createDefaultCapabilityAdvertisements(
  definition: SemanticObjectDefinitionMetadata
): readonly SemanticObjectCapabilityAdvertisement[] {
  return definition.capabilities.map((capability) =>
    capabilityAdvertisement(
      capability,
      definition.status,
      `${definition.title} advertises the ${capability} capability.`
    )
  );
}
