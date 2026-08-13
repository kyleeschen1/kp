export type KpAnimationApiSurfaceTier =
  | "authoring-seam"
  | "semantic-core"
  | "integration-facade"
  | "reader-facade"
  | "renderer-facade"
  | "motif-facade"
  | "experimental-surface"
  | "compatibility-ledger"
  | "generated-metadata"
  | "generated-session-internal";

export type KpAnimationApiSurfaceDisposition =
  | "retain-public-boundary"
  | "retain-internal"
  | "retain-separate"
  | "defer";

export interface KpAnimationApiSurfaceAuditTarget {
  readonly id: string;
  readonly targetPath: `src/${string}`;
  readonly tier: KpAnimationApiSurfaceTier;
  readonly disposition: KpAnimationApiSurfaceDisposition;
  readonly authority: string;
  readonly preservationBoundary: string;
}

export interface KpAnimationApiCallerSourceFile {
  readonly path: string;
  readonly source: string;
}

export interface KpAnimationApiSurfaceCallerRecord {
  readonly id: string;
  readonly targetPath: `src/${string}`;
  readonly tier: KpAnimationApiSurfaceTier;
  readonly disposition: KpAnimationApiSurfaceDisposition;
  readonly sourceCallers: readonly string[];
  readonly testCallers: readonly string[];
  readonly scriptCallers: readonly string[];
  readonly otherCallers: readonly string[];
}

/**
 * The targets distinguish similarly named public files by actual authority.
 * In particular, concept publication, provider integration, reader internals,
 * and animation construction must not collapse into one convenience barrel.
 */
export const kpAnimationApiCallerAuditTargets = Object.freeze([
  target({
    id: "facade.canonical-animation-construction",
    targetPath: "src/authoring/canonical-animation-public-api.ts",
    tier: "authoring-seam",
    disposition: "retain-public-boundary",
    authority:
      "Expose the governed semantic construction request, compiler, bounded repair, composition, and projection contracts for new human or model-authored animation.",
    preservationBoundary:
      "The facade accepts verified references and pedagogical intent; it excludes renderer state, geometry, clocks, host lifecycle, and unverified mathematical truth."
  }),
  target({
    id: "facade.animation-authoring",
    targetPath: "src/animation/public-api.ts",
    tier: "authoring-seam",
    disposition: "retain-public-boundary",
    authority:
      "Expose the caller-proven balanced-solve KpAnimationAsset constructor, validation, and supporting types.",
    preservationBoundary:
      "The facade excludes builders, compilers, domain presenters, reader state, renderer state, and motif registries."
  }),
  target({
    id: "authoring.canonical-balanced-solve",
    targetPath: "src/animation/canonical-balanced-solve-animation.ts",
    tier: "authoring-seam",
    disposition: "retain-internal",
    authority:
      "Construct one validated KpAnimationAsset with the canonical balanced-solve presentation profile.",
    preservationBoundary:
      "The facade may expose asset construction and laws, but not renderer state, reader layout, or provider truth."
  }),
  target({
    id: "core.animation-asset",
    targetPath: "src/animation/asset.ts",
    tier: "semantic-core",
    disposition: "retain-internal",
    authority:
      "Own the complete KpAnimationAsset model, validation, laws, builder, and semantic reference compilation.",
    preservationBoundary:
      "A narrow public facade must not turn the entire internal asset module into a compatibility promise."
  }),
  target({
    id: "core.equation-presentation-policy",
    targetPath: "src/animation/equation-presentation-policy.ts",
    tier: "semantic-core",
    disposition: "retain-internal",
    authority:
      "Own the validated renderer-neutral view of each typed equation presentation profile.",
    preservationBoundary:
      "The policy may be consumed by choreography and rendering but cannot import renderer modules, decode legacy metadata, or infer a missing profile."
  }),
  target({
    id: "facade.concept-authoring",
    targetPath: "src/authoring/public-api.ts",
    tier: "integration-facade",
    disposition: "retain-separate",
    authority: "Publish concept manifests and publication-fitness contracts.",
    preservationBoundary:
      "Concept publication remains separate from animation-asset authoring."
  }),
  target({
    id: "facade.provider-integration",
    targetPath: "src/integrations/public-api.ts",
    tier: "integration-facade",
    disposition: "retain-separate",
    authority: "Map and verify external provider traces at the integration boundary.",
    preservationBoundary:
      "Provider clients and trace verification do not become animation timing, layout, or presentation APIs."
  }),
  target({
    id: "facade.reader-compiler",
    targetPath: "src/reader/compiler/public-api.ts",
    tier: "reader-facade",
    disposition: "retain-internal",
    authority: "Compile lesson documents, static math, manifests, and route shells.",
    preservationBoundary:
      "Build-time document compilation remains distinct from animation authoring."
  }),
  target({
    id: "facade.reader-runtime",
    targetPath: "src/reader/runtime/public-api.ts",
    tier: "reader-facade",
    disposition: "retain-internal",
    authority: "Own reader clocks, scheduling, controls, and session projections.",
    preservationBoundary:
      "Reader lifecycle and browser state are not authoring inputs."
  }),
  target({
    id: "facade.reader-runtime-learner",
    targetPath: "src/reader/runtime/learner-public-api.ts",
    tier: "reader-facade",
    disposition: "retain-internal",
    authority:
      "Expose only the shared runtime capabilities required by the initial learner-route closure.",
    preservationBoundary:
      "Variant-specific layout and URL capabilities remain lazy and the comprehensive internal facade remains available."
  }),
  target({
    id: "facade.reader-renderers",
    targetPath: "src/reader/renderers/public-api.ts",
    tier: "renderer-facade",
    disposition: "retain-internal",
    authority: "Own reader render plans and DOM-facing presentation contracts.",
    preservationBoundary:
      "DOM, material layers, layout, and compositor details stay out of the public authoring facade."
  }),
  target({
    id: "facade.reader-renderers-learner",
    targetPath: "src/reader/renderers/learner-public-api.ts",
    tier: "renderer-facade",
    disposition: "retain-internal",
    authority:
      "Expose the shared equation rendering capabilities required by the initial learner-route closure.",
    preservationBoundary:
      "Specialized route renderers remain lazy and renderer authority stays outside the public authoring facade."
  }),
  target({
    id: "facade.equation-motifs",
    targetPath: "src/animation/motifs/public-api.ts",
    tier: "motif-facade",
    disposition: "retain-separate",
    authority: "Expose the renderer-neutral equation motif vocabulary.",
    preservationBoundary:
      "Motif vocabulary is not a universal registry and does not own graph or programming presentation."
  }),
  target({
    id: "surface.editor-api-catalog",
    targetPath: "src/editor/api-catalog.ts",
    tier: "experimental-surface",
    disposition: "defer",
    authority: "Project editorial and diagnostic projection of possible APIs.",
    preservationBoundary:
      "Its labels and status fields are not executable authoring authority."
  }),
  target({
    id: "ledger.semantic-animation-compatibility",
    targetPath: "src/architecture/semantic-animation-compatibility-ledger.ts",
    tier: "compatibility-ledger",
    disposition: "retain-internal",
    authority: "Record compatibility ownership, consumers, and closure evidence.",
    preservationBoundary:
      "No compatibility entry is retired from naming similarity or a zero barrel-import count alone."
  }),
  target({
    id: "metadata.animation-library-display",
    targetPath: "src/editor/animation-library-display-catalog.generated.json",
    tier: "generated-metadata",
    disposition: "retain-internal",
    authority: "Materialize the editorial display projection consumed by the catalogue.",
    preservationBoundary:
      "Its live runtime consumer requires representation roles, availability, canonical-format, review, and promotion evidence absent from search metadata."
  }),
  target({
    id: "metadata.animation-library-search",
    targetPath: "src/editor/animation-library-metadata.generated.json",
    tier: "generated-metadata",
    disposition: "defer",
    authority: "Materialize searchable animation-library metadata.",
    preservationBoundary:
      "Do not merge it with display metadata until its sole runtime consumer has an exact replacement."
  }),
  target({
    id: "generated.animation-compiler",
    targetPath: "src/animation/verified-linear-problem-animation-compiler.ts",
    tier: "generated-session-internal",
    disposition: "retain-internal",
    authority: "Compile one verified provider contract into canonical semantic animation truth.",
    preservationBoundary:
      "The public facade may supply asset primitives; it must not expose this exemplar-specific provider compiler."
  }),
  target({
    id: "generated.explanation-compiler",
    targetPath: "src/tutorial/verified-linear-problem-explanation-compiler.ts",
    tier: "generated-session-internal",
    disposition: "retain-internal",
    authority: "Compile verified claims into the bounded ExplanationSpineV1 projection.",
    preservationBoundary:
      "Learner wording and provider claim authority remain outside animation-asset authoring."
  }),
  target({
    id: "generated.catalogue-reader",
    targetPath: "src/editor/verified-generated-linear-solve-reader.ts",
    tier: "generated-session-internal",
    disposition: "retain-internal",
    authority: "Render the generated exemplar's optional catalogue explanation.",
    preservationBoundary:
      "Catalogue HTML and KaTeX rendering remain host projection concerns."
  })
] as const satisfies readonly KpAnimationApiSurfaceAuditTarget[]);

export function deriveKpAnimationApiCallerLedger(
  files: readonly KpAnimationApiCallerSourceFile[]
): readonly KpAnimationApiSurfaceCallerRecord[] {
  const importsByTarget = new Map<string, string[]>();
  for (const file of files) {
    for (const specifier of importSpecifiers(file.source)) {
      if (!specifier.startsWith(".")) continue;
      const resolved = resolveRelativeModule(file.path, specifier);
      const callers = importsByTarget.get(resolved) ?? [];
      if (!callers.includes(file.path)) callers.push(file.path);
      importsByTarget.set(resolved, callers);
    }
  }

  return kpAnimationApiCallerAuditTargets.map((surface) => {
    const callers = [...(importsByTarget.get(surface.targetPath) ?? [])].sort();
    return Object.freeze({
      id: surface.id,
      targetPath: surface.targetPath,
      tier: surface.tier,
      disposition: surface.disposition,
      sourceCallers: Object.freeze(callers.filter((path) => path.startsWith("src/"))),
      testCallers: Object.freeze(callers.filter((path) => path.startsWith("tests/"))),
      scriptCallers: Object.freeze(callers.filter((path) => path.startsWith("scripts/"))),
      otherCallers: Object.freeze(callers.filter((path) =>
        !path.startsWith("src/") &&
        !path.startsWith("tests/") &&
        !path.startsWith("scripts/")
      ))
    });
  });
}

function target(
  value: KpAnimationApiSurfaceAuditTarget
): KpAnimationApiSurfaceAuditTarget {
  return Object.freeze({ ...value });
}

function importSpecifiers(source: string): readonly string[] {
  const patterns = [
    /\bfrom\s+["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\bimport\s+["']([^"']+)["']/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g
  ];
  const specifiers = new Set<string>();
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const specifier = match[1];
      if (specifier !== undefined) specifiers.add(specifier);
    }
  }
  return [...specifiers];
}

function resolveRelativeModule(sourceFile: string, specifier: string): string {
  const parts = sourceFile.split("/");
  parts.pop();
  for (const part of specifier.split("/")) {
    if (part === "" || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return parts.join("/");
}
