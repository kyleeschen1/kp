import type { KpAnimationAsset } from "../animation/asset.ts";
import { createKpAnimationAssets } from "../animation/catalog.ts";
import type { KpSemanticAssetObject } from "../semantic/asset.ts";
import type { KpSemanticTransformation } from
  "../semantic/asset-transformation.ts";
import {
  createKpEquationSurfaceAuthorityGraph,
  type KpEquationSurfaceAuthorityGraph,
  type KpEquationSurfaceAuthorityPathClass
} from "./equation-surface-authority-graph.ts";
import {
  createKpEquationSurfaceInventory,
  type KpEquationSurfaceInventory
} from "./equation-surface-inventory.ts";

export type KpEquationSurfaceFamilyId =
  | "calculus"
  | "cancellation"
  | "comparison"
  | "distribution-factoring"
  | "exponent-radical"
  | "fraction"
  | "function-wrap"
  | "inequality"
  | "linear-algebra"
  | "linear-solve"
  | "logarithm"
  | "operation-evaluation"
  | "substitution"
  | "transform-pair";

export interface KpEquationSurfaceEndpointRef {
  readonly objectId: string;
  readonly objectType: string;
  readonly title: string;
  readonly semanticFingerprint: string;
}

export interface KpEquationSurfaceTransformationEndpoint {
  readonly transformationId: string;
  readonly transformationType: string;
  readonly transformationFingerprint: string;
  readonly source: readonly KpEquationSurfaceEndpointRef[];
  readonly target: readonly KpEquationSurfaceEndpointRef[];
}

export interface KpEquationSurfacePreservationRow {
  readonly schemaVersion: "kp.equation-surface-preservation-row.v1";
  readonly animationId: string;
  readonly familyId: KpEquationSurfaceFamilyId;
  readonly pathClass: KpEquationSurfaceAuthorityPathClass;
  readonly semanticEndpoints: readonly KpEquationSurfaceTransformationEndpoint[];
  readonly route: {
    readonly href: string;
    readonly selectionParameter: "artifact";
  };
  readonly directSeek: {
    readonly controlSelector: '[data-action="seek-editor-animation"]';
    readonly progressAttribute: "data-kp-editor-animation-progress";
    readonly checkpoints: readonly [0, 1];
    readonly interpolationAuthority: "editor-animation-player";
  };
  readonly accessibility: {
    readonly playerLabel: "descriptor-title-animation-player";
    readonly mathSemantics: "katex-mathml" | "semantic-stage-aria-label";
    readonly reducedMotionAttribute:
      "data-kp-editor-animation-accessibility-mode";
    readonly reducedMotionValue: "reduced-motion";
  };
  readonly nativeSettlement: {
    readonly slotKind: "equation";
    readonly adapterId: string;
    readonly adapterStatus: "ready";
    readonly endpointAuthority:
      | "semantic-native-katex"
      | "labelled-semantic-stage";
  };
}

export interface KpEquationSurfaceFamilyEvidence {
  readonly familyId: KpEquationSurfaceFamilyId;
  readonly animationIds: readonly string[];
  readonly representativeAnimationId: string;
  readonly semanticVerificationCommand: string;
  readonly visualVerificationCommand: string;
  readonly uniformBrowserVerificationCommand:
    "npm run test:browser:equation-surface-preservation";
  readonly visualEvidencePolicy: "deterministic-current-render";
}

export interface KpEquationSurfacePreservationMatrix {
  readonly schemaVersion: "kp.equation-surface-preservation-matrix.v1";
  readonly kind: "equation-surface-preservation-matrix";
  readonly entries: readonly KpEquationSurfacePreservationRow[];
  readonly families: readonly KpEquationSurfaceFamilyEvidence[];
}

export class KpEquationSurfacePreservationMatrixError extends Error {
  override readonly name = "KpEquationSurfacePreservationMatrixError";
  readonly diagnostics: readonly string[];

  constructor(diagnostics: readonly string[]) {
    super(diagnostics.join("\n"));
    this.diagnostics = diagnostics;
  }
}

const familyEvidence = Object.freeze({
  calculus: evidence("npm run test:semantic-animation-convergence"),
  cancellation: evidence("npm run test:cancellation-pressure"),
  comparison: evidence("npm run test:equation-surface-preservation"),
  "distribution-factoring": evidence("npm run test:distribution-pressure"),
  "exponent-radical": evidence("npm run test:semantic-animation-convergence"),
  fraction: evidence("npm run test:operation-presentation-plans"),
  "function-wrap": evidence("npm run test:semantic-animation-convergence"),
  inequality: evidence("npm run test:operation-presentation-plans"),
  "linear-algebra": evidence("npm run test:matrix-linear-map"),
  "linear-solve": evidence("npm run test:semantic-animation-convergence"),
  logarithm: evidence(
    "npm run test:log-exponent && npm run test:log-quotient && npm run test:log-product"
  ),
  "operation-evaluation": evidence("npm run test:operation-presentation-plans"),
  substitution: evidence("npm run test:operation-presentation-plans"),
  "transform-pair": evidence("npm run test:equation-surface-preservation")
} as const satisfies Readonly<Record<KpEquationSurfaceFamilyId, {
  readonly semanticVerificationCommand: string;
  readonly visualVerificationCommand: string;
}>>);

export function createKpEquationSurfacePreservationMatrix():
KpEquationSurfacePreservationMatrix {
  return compileKpEquationSurfacePreservationMatrix({
    inventory: createKpEquationSurfaceInventory(),
    assets: createKpAnimationAssets()
  });
}

export function compileKpEquationSurfacePreservationMatrix(input: {
  readonly inventory: KpEquationSurfaceInventory;
  readonly assets: readonly KpAnimationAsset[];
  readonly authority?: KpEquationSurfaceAuthorityGraph | undefined;
}): KpEquationSurfacePreservationMatrix {
  const diagnostics: string[] = [];
  const assetById = uniqueAssets(input.assets, diagnostics);
  const authorityById = new Map(
    (input.authority ?? createKpEquationSurfaceAuthorityGraph()).rows.map((row) => [
      row.animationId,
      row
    ])
  );
  const entries = input.inventory.entries.flatMap((inventoryEntry) => {
    const asset = assetById.get(inventoryEntry.animationId);
    const authority = authorityById.get(inventoryEntry.animationId);
    if (asset === undefined) {
      diagnostics.push(`Missing preservation asset ${inventoryEntry.animationId}.`);
      return [];
    }
    if (authority === undefined) {
      diagnostics.push(`Missing authority row ${inventoryEntry.animationId}.`);
      return [];
    }
    return [preservationRow(asset, inventoryEntry.catalogueSurface.rendererAdapterId,
      authority.pathClass, diagnostics)];
  });

  if (diagnostics.length > 0) {
    throw new KpEquationSurfacePreservationMatrixError(
      Object.freeze(diagnostics)
    );
  }

  const entriesByFamily = new Map<KpEquationSurfaceFamilyId,
    KpEquationSurfacePreservationRow[]>();
  for (const entry of entries) {
    const familyEntries = entriesByFamily.get(entry.familyId) ?? [];
    familyEntries.push(entry);
    entriesByFamily.set(entry.familyId, familyEntries);
  }
  const families = (Object.keys(familyEvidence) as KpEquationSurfaceFamilyId[])
    .map((familyId) => {
      const familyEntries = entriesByFamily.get(familyId) ?? [];
      if (familyEntries.length === 0) {
        throw new KpEquationSurfacePreservationMatrixError([
          `Equation family ${familyId} has no preservation entries.`
        ]);
      }
      const commands = familyEvidence[familyId];
      return Object.freeze({
        familyId,
        animationIds: Object.freeze(familyEntries.map(({ animationId }) =>
          animationId)),
        representativeAnimationId: familyEntries[0]!.animationId,
        ...commands,
        uniformBrowserVerificationCommand:
          "npm run test:browser:equation-surface-preservation" as const,
        visualEvidencePolicy: "deterministic-current-render" as const
      });
    });

  return Object.freeze({
    schemaVersion: "kp.equation-surface-preservation-matrix.v1" as const,
    kind: "equation-surface-preservation-matrix" as const,
    entries: Object.freeze(entries),
    families: Object.freeze(families)
  });
}

function preservationRow(
  asset: KpAnimationAsset,
  adapterId: string,
  pathClass: KpEquationSurfaceAuthorityPathClass,
  diagnostics: string[]
): KpEquationSurfacePreservationRow {
  const objectById = new Map(asset.bundle.objects.map((object) => [
    object.id,
    object
  ]));
  const semanticEndpoints = asset.transformations.map((transformation) =>
    transformationEndpoint(asset.id, transformation, objectById, diagnostics));
  if (semanticEndpoints.length === 0) {
    diagnostics.push(`Equation asset ${asset.id} has no semantic endpoints.`);
  }

  return Object.freeze({
    schemaVersion: "kp.equation-surface-preservation-row.v1" as const,
    animationId: asset.id,
    familyId: familyForAnimation(asset.id),
    pathClass,
    semanticEndpoints: Object.freeze(semanticEndpoints),
    route: Object.freeze({
      href: `/?artifact=${encodeURIComponent(asset.id)}`,
      selectionParameter: "artifact" as const
    }),
    directSeek: Object.freeze({
      controlSelector: '[data-action="seek-editor-animation"]' as const,
      progressAttribute: "data-kp-editor-animation-progress" as const,
      checkpoints: Object.freeze([0, 1] as const),
      interpolationAuthority: "editor-animation-player" as const
    }),
    accessibility: Object.freeze({
      playerLabel: "descriptor-title-animation-player" as const,
      // The generic adapter currently emits visual KaTeX HTML and makes the
      // semantic transition its accessible unit. Operation evaluation labels
      // its native stage, while the two log adapters emit HTML+MathML. This
      // records the present split for a later accessibility migration.
      mathSemantics:
        pathClass === "log-exponent-specialized" ||
        pathClass === "log-quotient-specialized"
          ? "katex-mathml" as const
          : "semantic-stage-aria-label" as const,
      reducedMotionAttribute:
        "data-kp-editor-animation-accessibility-mode" as const,
      reducedMotionValue: "reduced-motion" as const
    }),
    nativeSettlement: Object.freeze({
      slotKind: "equation" as const,
      adapterId,
      adapterStatus: "ready" as const,
      endpointAuthority:
        pathClass === "log-exponent-specialized" ||
        pathClass === "log-quotient-specialized"
          ? "semantic-native-katex" as const
          : "labelled-semantic-stage" as const
    })
  });
}

function transformationEndpoint(
  animationId: string,
  transformation: KpSemanticTransformation,
  objectById: ReadonlyMap<string, KpSemanticAssetObject>,
  diagnostics: string[]
): KpEquationSurfaceTransformationEndpoint {
  return Object.freeze({
    transformationId: transformation.id,
    transformationType: transformation.transformType,
    transformationFingerprint: semanticFingerprint(transformation),
    source: endpointRefs(animationId, transformation.id,
      transformation.sourceObjectIds, objectById, diagnostics),
    target: endpointRefs(animationId, transformation.id,
      transformation.targetObjectIds, objectById, diagnostics)
  });
}

function endpointRefs(
  animationId: string,
  transformationId: string,
  objectIds: readonly string[],
  objectById: ReadonlyMap<string, KpSemanticAssetObject>,
  diagnostics: string[]
): readonly KpEquationSurfaceEndpointRef[] {
  return Object.freeze(objectIds.flatMap((objectId) => {
    const object = objectById.get(objectId);
    if (object === undefined) {
      diagnostics.push(
        `${animationId} transformation ${transformationId} references ` +
        `missing endpoint object ${objectId}.`
      );
      return [];
    }
    return [Object.freeze({
      objectId: object.id,
      objectType: object.objectType,
      title: object.title,
      // The compact fingerprint freezes value, selectors, provenance, and
      // metadata without copying large semantic payloads into this matrix.
      semanticFingerprint: semanticFingerprint(object)
    })];
  }));
}

function familyForAnimation(animationId: string): KpEquationSurfaceFamilyId {
  if (animationId.includes("log-")) return "logarithm";
  if (animationId.includes("operation-evaluation")) {
    return "operation-evaluation";
  }
  if (animationId.includes("jacobian-hessian") ||
      animationId.includes("linear-solve-programming")) return "comparison";
  if (animationId.includes("calculus") ||
      animationId.includes("derivative")) return "calculus";
  if (animationId.includes("cancellation")) return "cancellation";
  if (animationId.includes("distribution")) return "distribution-factoring";
  if (animationId.includes("exponent") ||
      animationId.includes("radical")) return "exponent-radical";
  if (animationId.includes("fraction")) return "fraction";
  if (animationId.includes("function-wrap")) return "function-wrap";
  if (animationId.includes("inequality")) return "inequality";
  if (animationId.includes("linear-algebra")) return "linear-algebra";
  if (animationId.includes("linear-solve")) return "linear-solve";
  if (animationId.includes("substitute")) return "substitution";
  if (animationId.includes("fourier") ||
      animationId.includes("fundamental-theorem")) return "transform-pair";
  if (animationId.includes("add-zero")) return "substitution";
  throw new KpEquationSurfacePreservationMatrixError([
    `Equation animation ${animationId} has no preservation family.`
  ]);
}

function evidence(
  semanticVerificationCommand: string
): {
  readonly semanticVerificationCommand: string;
  readonly visualVerificationCommand: string;
} {
  return Object.freeze({
    semanticVerificationCommand,
    visualVerificationCommand:
      "npm run visual:equation-surface-preservation"
  });
}

function uniqueAssets(
  assets: readonly KpAnimationAsset[],
  diagnostics: string[]
): ReadonlyMap<string, KpAnimationAsset> {
  const byId = new Map<string, KpAnimationAsset>();
  for (const asset of assets) {
    if (byId.has(asset.id)) {
      diagnostics.push(`Duplicate preservation asset id ${asset.id}.`);
    } else {
      byId.set(asset.id, asset);
    }
  }
  return byId;
}

function semanticFingerprint(value: unknown): string {
  const text = stableSerialize(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableSerialize).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const record = value as Readonly<Record<string, unknown>>;
    return `{${Object.keys(record).sort().map((key) =>
      `${JSON.stringify(key)}:${stableSerialize(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
