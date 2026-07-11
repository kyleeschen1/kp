import type {
  SemanticObjectCapabilityId,
  SemanticObjectDefinitionStatus
} from "./object-registry.ts";

export type KpCapabilityPackageTarget =
  | "authoring"
  | "browser"
  | "media"
  | "runtime"
  | "static";

export type KpCapabilityPackageLoadPhase =
  | "authoring"
  | "export"
  | "initial-render"
  | "interaction"
  | "preload";

export interface KpCapabilityPackageSourceRef {
  readonly label: string;
  readonly href: string;
}

export interface KpCapabilityPackageManifestInput {
  readonly id: string;
  readonly title: string;
  readonly library: string;
  readonly capability: string;
  readonly objectType: string;
  readonly mode: string;
  readonly status: SemanticObjectDefinitionStatus;
  readonly target: KpCapabilityPackageTarget;
  readonly loadPhase: KpCapabilityPackageLoadPhase;
  readonly summary: string;
  readonly semanticCapabilities: readonly SemanticObjectCapabilityId[];
  readonly protocols: readonly string[];
  readonly views: readonly string[];
  readonly tags: readonly string[];
  readonly sourceRefs: readonly KpCapabilityPackageSourceRef[];
}

export interface KpCapabilityPackageManifest
  extends KpCapabilityPackageManifestInput {
  readonly capabilityKey: string;
}

export interface KpCapabilityPackageCatalog {
  listManifests(): readonly KpCapabilityPackageManifest[];
  getManifest(id: string): KpCapabilityPackageManifest | undefined;
  listManifestsByCapabilityKey(
    capabilityKey: string
  ): readonly KpCapabilityPackageManifest[];
  listManifestsForObjectType(
    objectType: string
  ): readonly KpCapabilityPackageManifest[];
}

export function createKpCapabilityPackageManifest(
  input: KpCapabilityPackageManifestInput
): KpCapabilityPackageManifest {
  return {
    id: input.id,
    title: input.title,
    library: input.library,
    capability: input.capability,
    objectType: input.objectType,
    mode: input.mode,
    capabilityKey: capabilityPackageKey(input),
    status: input.status,
    target: input.target,
    loadPhase: input.loadPhase,
    summary: input.summary,
    semanticCapabilities: [...input.semanticCapabilities],
    protocols: [...input.protocols],
    views: [...input.views],
    tags: [...input.tags],
    sourceRefs: input.sourceRefs.map((sourceRef) => ({ ...sourceRef }))
  };
}

export function createKpCapabilityPackageCatalog(
  manifests: readonly KpCapabilityPackageManifestInput[]
): KpCapabilityPackageCatalog {
  const orderedManifests = manifests.map(createKpCapabilityPackageManifest);
  const manifestsById = new Map<string, KpCapabilityPackageManifest>();

  for (const manifest of orderedManifests) {
    if (manifestsById.has(manifest.id)) {
      throw new Error(`Duplicate capability package manifest ${manifest.id}.`);
    }

    manifestsById.set(manifest.id, manifest);
  }

  return {
    listManifests: () => cloneManifests(orderedManifests),
    getManifest: (id) => cloneManifest(manifestsById.get(id)),
    listManifestsByCapabilityKey: (capabilityKey) =>
      cloneManifests(
        orderedManifests.filter(
          (manifest) => manifest.capabilityKey === capabilityKey
        )
      ),
    listManifestsForObjectType: (objectType) =>
      cloneManifests(
        orderedManifests.filter(
          (manifest) => manifest.objectType === objectType
        )
      )
  };
}

export const defaultKpCapabilityPackageManifests:
  readonly KpCapabilityPackageManifestInput[] = [
    {
      id: "package.kp.equation.render.katex",
      title: "KaTeX Equation Renderer",
      library: "kp.equation",
      capability: "render.katex",
      objectType: "equation",
      mode: "*",
      status: "active",
      target: "browser",
      loadPhase: "initial-render",
      summary: "Render equation semantic objects through the KaTeX pipeline.",
      semanticCapabilities: ["render", "select"],
      protocols: ["renderEquationKatex"],
      views: ["katex"],
      tags: ["equation", "katex"],
      sourceRefs: [
        {
          label: "Equation motion sampler",
          href: "src/rendering/equation-motion-sampler.ts"
        }
      ]
    },
    {
      id: "package.kp.graph3d.render.webgl.surface-mesh",
      title: "WebGL Graph3D Surface Mesh Renderer",
      library: "kp.graph",
      capability: "render.webgl",
      objectType: "graph-3d",
      mode: "surface.mesh",
      status: "active",
      target: "browser",
      loadPhase: "interaction",
      summary: "Render Graph3D surface meshes through the WebGL graph adapter.",
      semanticCapabilities: ["render", "select", "animate"],
      protocols: ["renderGraphWebglSurfaceMesh"],
      views: ["webgl-surface"],
      tags: ["graph", "webgl", "surface"],
      sourceRefs: [
        {
          label: "Graph frame adapter",
          href: "src/tutorial/graph-frame-adapter.ts"
        }
      ]
    },
    {
      id: "package.kp.matrix.render.katex",
      title: "KaTeX Matrix Renderer",
      library: "kp.matrix",
      capability: "render.katex",
      objectType: "matrix",
      mode: "*",
      status: "active",
      target: "browser",
      loadPhase: "initial-render",
      summary: "Render matrix semantic objects as KaTeX or LaTeX forms.",
      semanticCapabilities: ["render", "select"],
      protocols: ["renderMatrixKatex"],
      views: ["katex", "matrix-grid"],
      tags: ["matrix", "katex", "linear-algebra"],
      sourceRefs: [
        {
          label: "Semantic object registry",
          href: "src/semantic/object-registry.ts"
        }
      ]
    },
    {
      id: "package.kp.matrix.execute.facts",
      title: "Matrix Facts Executor",
      library: "kp.matrix",
      capability: "execute.facts",
      objectType: "matrix",
      mode: "*",
      status: "active",
      target: "runtime",
      loadPhase: "interaction",
      summary: "Compute matrix facts such as shape and determinant metadata.",
      semanticCapabilities: ["execute"],
      protocols: ["matrixForm", "evaluate"],
      views: ["inspector"],
      tags: ["matrix", "execute", "linear-algebra"],
      sourceRefs: [
        {
          label: "Semantic computation protocols",
          href: "src/semantic/computation-protocols.ts"
        }
      ]
    },
    {
      id: "package.kp.export.encode.gif",
      title: "GIF Encoder Export Package",
      library: "kp.export",
      capability: "encode.gif",
      objectType: "*",
      mode: "*",
      status: "planned",
      target: "media",
      loadPhase: "export",
      summary: "Advertise GIF export encoding for frame-sequence artifacts.",
      semanticCapabilities: ["link"],
      protocols: ["encodeGifFromFrameSequence"],
      views: ["media-export"],
      tags: ["export", "gif", "frame-sequence"],
      sourceRefs: [
        {
          label: "Frame sequence artifact",
          href: "src/tutorial/frame-sequence-artifact.ts"
        }
      ]
    }
  ];

function capabilityPackageKey(input: {
  readonly library: string;
  readonly capability: string;
  readonly objectType: string;
  readonly mode: string;
}): string {
  return [
    input.library,
    input.capability,
    input.objectType,
    input.mode
  ].join(":");
}

function cloneManifest(
  manifest: KpCapabilityPackageManifest | undefined
): KpCapabilityPackageManifest | undefined {
  return manifest === undefined
    ? undefined
    : createKpCapabilityPackageManifest(manifest);
}

function cloneManifests(
  manifests: readonly KpCapabilityPackageManifest[]
): readonly KpCapabilityPackageManifest[] {
  return manifests.map((manifest) => createKpCapabilityPackageManifest(manifest));
}
