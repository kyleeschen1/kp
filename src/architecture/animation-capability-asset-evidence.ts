import generatedEquationManifest from
  "./equation-asset-manifest.generated.json" with { type: "json" };

import { kpAnimationCapabilityPlan } from
  "./cross-domain-animation-capability-plan.ts";
import type {
  KpAnimationCapabilityPlan
} from "./animation-capability-plan.ts";
import type {
  KpEquationAssetManifest,
  KpEquationAssetManifestEntry
} from "./equation-asset-manifest.ts";
import {
  createKpAnimationLibraryDisplayCatalog,
  type KpAnimationLibraryDisplayEntry,
  type KpAnimationLibraryDisplayRepresentation
} from "../editor/animation-library-display-catalog.ts";

export const KP_ANIMATION_CAPABILITY_ASSET_EVIDENCE_SCHEMA =
  "kp.animation-capability-asset-evidence.v1" as const;

export interface KpAnimationCapabilityAssetEvidence {
  readonly schemaVersion:
    typeof KP_ANIMATION_CAPABILITY_ASSET_EVIDENCE_SCHEMA;
  readonly kind: "animation-capability-asset-evidence";
  readonly sources: readonly [
    "src/architecture/equation-asset-manifest.generated.json",
    "src/editor/animation-library-display-catalog.generated.json"
  ];
  readonly assets: readonly KpAnimationCapabilityAssetRecord[];
  readonly requirements:
    readonly KpAnimationCapabilityAssetRequirementEvidence[];
}

export interface KpAnimationCapabilityAssetRecord {
  readonly assetId: string;
  readonly title: string;
  readonly source:
    | "equation-asset-manifest"
    | "animation-library-display-catalog";
  readonly availability: KpAnimationLibraryDisplayEntry["availability"];
  readonly canonicalFormat: KpAnimationLibraryDisplayEntry["canonicalFormat"];
  readonly disposition?:
    KpEquationAssetManifestEntry["capabilities"]["disposition"] | undefined;
  readonly migrationWave?:
    KpEquationAssetManifestEntry["capabilities"]["migrationWave"] | undefined;
  readonly familyId?:
    KpEquationAssetManifestEntry["capabilities"]["familyId"] | undefined;
  readonly href?: string | undefined;
  readonly representations:
    readonly KpAnimationLibraryDisplayRepresentation[];
}

export type KpAnimationCapabilityAssetRequirementEvidence =
  | Readonly<{
      capabilityId: string;
      requirementId: string;
      assetId: string;
      status: "matched";
      asset: KpAnimationCapabilityAssetRecord;
    }>
  | Readonly<{
      capabilityId: string;
      requirementId: string;
      assetId: string;
      status: "missing";
      reason: "no-exact-generated-asset";
    }>;

export type KpAnimationCapabilityAssetEvidenceDiagnosticCode =
  | "asset-evidence.duplicate"
  | "asset-evidence.manifest-orphan"
  | "asset-evidence.source-conflict";

export interface KpAnimationCapabilityAssetEvidenceDiagnostic {
  readonly code: KpAnimationCapabilityAssetEvidenceDiagnosticCode;
  readonly assetId: string;
  readonly message: string;
}

export class KpAnimationCapabilityAssetEvidenceError extends Error {
  override readonly name = "KpAnimationCapabilityAssetEvidenceError";
  readonly diagnostics:
    readonly KpAnimationCapabilityAssetEvidenceDiagnostic[];

  constructor(
    diagnostics: readonly KpAnimationCapabilityAssetEvidenceDiagnostic[]
  ) {
    super(diagnostics.map(({ message }) => message).join("\n"));
    this.diagnostics = Object.freeze([...diagnostics]);
  }
}

/**
 * This join copies evidence from generated authorities. It never infers an
 * asset by title, family, tags, or a similar-looking identifier; an unmatched
 * exemplar requirement remains an explicit gap for the readiness projection.
 */
export function compileKpAnimationCapabilityAssetEvidence(input: {
  readonly plan: KpAnimationCapabilityPlan;
  readonly equationManifest: KpEquationAssetManifest;
  readonly displayCatalog: readonly KpAnimationLibraryDisplayEntry[];
}): KpAnimationCapabilityAssetEvidence {
  const diagnostics: KpAnimationCapabilityAssetEvidenceDiagnostic[] = [];
  const displayById = uniqueById(
    input.displayCatalog,
    ({ animationId }) => animationId,
    "display",
    diagnostics
  );
  const equationById = uniqueById(
    input.equationManifest.entries,
    ({ assetId }) => assetId,
    "equation manifest",
    diagnostics
  );

  for (const entry of equationById.values()) {
    const display = displayById.get(entry.assetId);
    if (display === undefined) {
      diagnostics.push(diagnostic(
        "asset-evidence.manifest-orphan",
        entry.assetId,
        `Equation manifest asset ${entry.assetId} has no generated display row.`
      ));
      continue;
    }
    if (!sameDisplayTruth(entry, display)) {
      diagnostics.push(diagnostic(
        "asset-evidence.source-conflict",
        entry.assetId,
        `Generated asset authorities disagree for ${entry.assetId}.`
      ));
    }
  }
  if (diagnostics.length > 0) {
    throw new KpAnimationCapabilityAssetEvidenceError(diagnostics);
  }

  const assets = Object.freeze(input.displayCatalog.map((display) =>
    assetRecord(display, equationById.get(display.animationId))
  ));
  const assetsById = new Map(assets.map((asset) => [asset.assetId, asset]));
  const requirements = Object.freeze(input.plan.entries.flatMap((entry) =>
    entry.requirements
      .filter(({ kind }) => kind === "canonical-exemplar")
      .map((requirement): KpAnimationCapabilityAssetRequirementEvidence => {
        const asset = assetsById.get(requirement.authorityId);
        return asset === undefined
          ? Object.freeze({
              capabilityId: entry.id,
              requirementId: requirement.id,
              assetId: requirement.authorityId,
              status: "missing" as const,
              reason: "no-exact-generated-asset" as const
            })
          : Object.freeze({
              capabilityId: entry.id,
              requirementId: requirement.id,
              assetId: requirement.authorityId,
              status: "matched" as const,
              asset
            });
      })
  ));

  return Object.freeze({
    schemaVersion: KP_ANIMATION_CAPABILITY_ASSET_EVIDENCE_SCHEMA,
    kind: "animation-capability-asset-evidence" as const,
    sources: Object.freeze([
      "src/architecture/equation-asset-manifest.generated.json",
      "src/editor/animation-library-display-catalog.generated.json"
    ] as const),
    assets,
    requirements
  });
}

export function createKpAnimationCapabilityAssetEvidence():
KpAnimationCapabilityAssetEvidence {
  return compileKpAnimationCapabilityAssetEvidence({
    plan: kpAnimationCapabilityPlan,
    equationManifest:
      generatedEquationManifest as unknown as KpEquationAssetManifest,
    displayCatalog: createKpAnimationLibraryDisplayCatalog()
  });
}

function assetRecord(
  display: KpAnimationLibraryDisplayEntry,
  equation: KpEquationAssetManifestEntry | undefined
): KpAnimationCapabilityAssetRecord {
  const representations = Object.freeze(display.representations.map(
    (representation) => Object.freeze({ ...representation })
  ));
  return Object.freeze({
    assetId: display.animationId,
    title: display.title,
    source: equation === undefined
      ? "animation-library-display-catalog" as const
      : "equation-asset-manifest" as const,
    availability: display.availability,
    canonicalFormat: display.canonicalFormat,
    ...(equation === undefined ? {} : {
      disposition: equation.capabilities.disposition,
      migrationWave: equation.capabilities.migrationWave,
      familyId: equation.capabilities.familyId
    }),
    ...href(display, equation),
    representations
  });
}

function href(
  display: KpAnimationLibraryDisplayEntry,
  equation: KpEquationAssetManifestEntry | undefined
): Readonly<{ href?: string | undefined }> {
  if (equation !== undefined) return { href: equation.staticTruth.route.href };
  const preferred = display.representations.find(({ id }) =>
    id === display.primaryRepresentationId
  ) ?? display.representations.find(({ role }) => role === "canonical-host")
    ?? display.representations[0];
  return preferred === undefined ? {} : { href: preferred.href };
}

function sameDisplayTruth(
  equation: KpEquationAssetManifestEntry,
  display: KpAnimationLibraryDisplayEntry
): boolean {
  return equation.title === display.title &&
    equation.catalogue.availability === display.availability &&
    equation.catalogue.canonicalFormat === display.canonicalFormat &&
    equation.catalogue.featured === display.featured &&
    equation.catalogue.primaryRepresentationId ===
      display.primaryRepresentationId &&
    JSON.stringify(equation.catalogue.representations) ===
      JSON.stringify(display.representations);
}

function uniqueById<T>(
  values: readonly T[],
  identify: (value: T) => string,
  label: string,
  diagnostics: KpAnimationCapabilityAssetEvidenceDiagnostic[]
): ReadonlyMap<string, T> {
  const byId = new Map<string, T>();
  for (const value of values) {
    const id = identify(value);
    if (byId.has(id)) {
      diagnostics.push(diagnostic(
        "asset-evidence.duplicate",
        id,
        `Duplicate ${label} asset ${id}.`
      ));
    } else byId.set(id, value);
  }
  return byId;
}

function diagnostic(
  code: KpAnimationCapabilityAssetEvidenceDiagnosticCode,
  assetId: string,
  message: string
): KpAnimationCapabilityAssetEvidenceDiagnostic {
  return Object.freeze({ code, assetId, message });
}
