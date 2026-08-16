export type KpManifestProjectionFactId =
  | "catalogue-membership"
  | "lazy-pack-ownership"
  | "equation-surface-membership"
  | "equation-surface-disposition"
  | "selected-surface-capability"
  | "semantic-compatibility-membership"
  | "renderer-neutral-sdk-selection";

export interface KpManifestProjectionAuthorityDeclaration {
  readonly factId: KpManifestProjectionFactId;
  readonly declarationOwnerPath: string;
  readonly projectionPaths: readonly string[];
  readonly policy: "derive-only" | "independent-compatibility-surface";
  readonly rationale: string;
}

// This table owns provenance, not membership. It prevents projections and
// generated counts from quietly becoming competing declarations of truth.
export const kpManifestProjectionAuthorityDeclarations:
readonly KpManifestProjectionAuthorityDeclaration[] = Object.freeze([
  authority({
    factId: "catalogue-membership",
    declarationOwnerPath: "src/animation/catalog.ts",
    projectionPaths: [
      "src/editor/animation-library-metadata.generated.json",
      "src/editor/animation-catalogue-loadable-registry.ts",
      "src/editor/animation-catalogue-projection.ts"
    ],
    policy: "derive-only",
    rationale:
      "Concrete assets declare membership; editor metadata and catalogue rows are compact runtime projections."
  }),
  authority({
    factId: "lazy-pack-ownership",
    declarationOwnerPath: "src/animation/catalog-loader.ts",
    projectionPaths: [
      "src/editor/animation-catalogue-loadable-registry.ts",
      "src/architecture/equation-surface-inventory.ts"
    ],
    policy: "derive-only",
    rationale:
      "Literal dynamic imports and ownership predicates must remain colocated at the build-visible chunk boundary."
  }),
  authority({
    factId: "equation-surface-membership",
    declarationOwnerPath: "src/architecture/equation-surface-inventory.ts",
    projectionPaths: [
      "src/architecture/equation-asset-manifest.ts",
      "src/architecture/equation-surface-disposition-ledger.ts",
      "src/architecture/post-convergence-infrastructure-inventory.ts"
    ],
    policy: "derive-only",
    rationale:
      "Equation membership is the catalogue subset with an equation render target; manifests and totals must preserve that exact set."
  }),
  authority({
    factId: "equation-surface-disposition",
    declarationOwnerPath:
      "src/domain-ir/equation-surface-family-declarations.ts",
    projectionPaths: [
      "src/architecture/equation-surface-disposition-ledger.ts",
      "src/architecture/equation-asset-manifest.ts"
    ],
    policy: "derive-only",
    rationale:
      "Family declarations own semantic classification; the ledger adds preservation and retirement evidence."
  }),
  authority({
    factId: "selected-surface-capability",
    declarationOwnerPath: "src/editor/selected-surface-capability.ts",
    projectionPaths: [
      "src/architecture/post-convergence-infrastructure-inventory.ts"
    ],
    policy: "derive-only",
    rationale:
      "The selector is the current compatibility owner until capability declarations replace its closed predicates."
  }),
  authority({
    factId: "semantic-compatibility-membership",
    declarationOwnerPath:
      "src/architecture/semantic-animation-compatibility-ledger.ts",
    projectionPaths: [
      "src/architecture/post-convergence-infrastructure-inventory.ts"
    ],
    policy: "derive-only",
    rationale:
      "Compatibility entries are explicit debt records; summaries may count them but cannot create or omit them."
  }),
  authority({
    factId: "renderer-neutral-sdk-selection",
    declarationOwnerPath: "src/editor/equation-animation-catalog.ts",
    projectionPaths: ["src/public/equation-animation-manifest.ts"],
    policy: "independent-compatibility-surface",
    rationale:
      "The six SDK selections use legacy EquationAnimationId identities and are not the 30 KpAnimationAsset equation surfaces."
  })
]);

export function findKpManifestProjectionAuthority(
  factId: KpManifestProjectionFactId
): KpManifestProjectionAuthorityDeclaration {
  const declaration = kpManifestProjectionAuthorityDeclarations.find(
    (candidate) => candidate.factId === factId
  );
  if (declaration === undefined) {
    throw new Error(`Unknown manifest/projection fact ${factId}.`);
  }
  return declaration;
}

function authority(
  declaration: KpManifestProjectionAuthorityDeclaration
): KpManifestProjectionAuthorityDeclaration {
  return Object.freeze({
    ...declaration,
    projectionPaths: Object.freeze([...declaration.projectionPaths])
  });
}
