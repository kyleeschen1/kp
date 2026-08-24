import {
  writeKpAnimationCatalogueRoute
} from "./animation-catalogue-route.ts";

interface KpCrossDomainGalleryCollectionCaseBase {
  readonly caseId: string;
  readonly title: string;
  readonly domainLabel: string;
  readonly teachingIntent: string;
  readonly verifiedByLabel: string;
  readonly frontendId: string;
  readonly capabilityLabel: string;
  readonly operationLabel: string;
  readonly explanation: string;
  readonly authorityClaimRefs: readonly string[];
}

export interface KpCrossDomainGalleryExecutableCase extends
KpCrossDomainGalleryCollectionCaseBase {
  readonly status: "executable";
  readonly animationId: string;
  readonly href: string;
}

export interface KpCrossDomainGalleryGapCase extends
KpCrossDomainGalleryCollectionCaseBase {
  readonly status: "repair-required";
  readonly diagnosticCode: string;
  readonly repair: string;
}

export type KpCrossDomainGalleryCollectionCase =
  | KpCrossDomainGalleryExecutableCase
  | KpCrossDomainGalleryGapCase;

export interface KpCrossDomainGalleryCollection {
  readonly schemaVersion: "kp.cross-domain-gallery-collection.v1";
  readonly id: "collection.cross-domain-generation-demo";
  readonly title: string;
  readonly summary: string;
  readonly cases: readonly KpCrossDomainGalleryCollectionCase[];
}

// Keep the browser projection editorial and compact. A conformance test binds
// every case back to the generated packet so its large request payloads do not
// become part of the Catalogue bundle merely to show this collection.
export const KP_CROSS_DOMAIN_GALLERY_COLLECTION = deepFreeze({
  schemaVersion: "kp.cross-domain-gallery-collection.v1" as const,
  id: "collection.cross-domain-generation-demo" as const,
  title: "Generated across domains",
  summary:
    "Four governed animations and one honest request that KP cannot animate yet.",
  cases: [
    executableCase({
      caseId: "conformance.gallery.equation.logarithmic-solve",
      title: "Solve an exponential equation",
      domainLabel: "Equation",
      teachingIntent: "Solve 2^x = 7 exactly by applying logarithms.",
      verifiedByLabel: "Verified equation transformation trace",
      frontendId: "frontend.equation.logarithmic-solve-exemplar.v1",
      capabilityLabel: "Balanced logarithmic transformations",
      operationLabel: "Apply logs · extract exponent · isolate x",
      explanation:
        "The same verified trace applies logarithms to both sides, extracts the exponent, and isolates x without inventing intermediate algebra.",
      authorityClaimRefs: [
        "claim.equation.logarithmic-solve.apply-log-both-sides",
        "claim.equation.logarithmic-solve.extract-exponent",
        "claim.equation.logarithmic-solve.isolate-x"
      ],
      animationId: "animation.algebra.log-exponent.solve-two-power-x"
    }),
    executableCase({
      caseId: "conformance.gallery.code.typescript-extract-helper",
      title: "Extract a TypeScript helper",
      domainLabel: "Code",
      teachingIntent:
        "Extract the duplicated free-shipping predicate into one helper.",
      verifiedByLabel: "TypeScript compiler frontend",
      frontendId: "frontend.code.typescript-compiler.v1",
      capabilityLabel: "Behavior-preserving TypeScript refactoring",
      operationLabel: "Extract helper · preserve call-site behavior",
      explanation:
        "The compiler identifies one repeated predicate, introduces a named helper, and preserves both observable branches at their original call sites.",
      authorityClaimRefs: [
        "claim.code.typescript.extract-helper.legality",
        "claim.code.typescript.extract-helper.causal-change",
        "claim.code.typescript.extract-helper.behavior-cases"
      ],
      animationId: "animation.programming.typescript-free-shipping-refactor"
    }),
    executableCase({
      caseId: "conformance.gallery.graph-2d.quadratic-translate-right-two",
      title: "Translate a parabola",
      domainLabel: "Graph2D",
      teachingIntent:
        "Translate y = x squared two units right while preserving curve and point identity.",
      verifiedByLabel: "Graph2D function frontend",
      frontendId: "frontend.graph-2d.function-model.v1",
      capabilityLabel: "Bounded function translation",
      operationLabel: "Horizontal translation · preserve correspondence",
      explanation:
        "One persistent curve and its three witness points move two units right while the axes remain fixed context.",
      authorityClaimRefs: [
        "claim.graph-2d.quadratic-translation.parameter",
        "claim.graph-2d.quadratic-translation.points"
      ],
      animationId: "animation.graph-2d.quadratic-translate-right-two"
    }),
    executableCase({
      caseId: "conformance.gallery.graph-3d.saddle-denominator-four-to-eight",
      title: "Flatten a saddle surface",
      domainLabel: "Graph3D",
      teachingIntent:
        "Increase the saddle denominator from four to eight while preserving the surface, domain, topology, axes, and fixed camera.",
      verifiedByLabel: "Graph3D scene frontend",
      frontendId: "frontend.graph-3d.semantic-scene.v1",
      capabilityLabel: "Bounded semantic scene transformation",
      operationLabel: "Parameter change · fixed camera and topology",
      explanation:
        "The denominator changes the surface height while semantic surface identity, topology, domain, axes, and camera remain fixed.",
      authorityClaimRefs: [
        "claim.graph-3d.saddle-denominator.parameter",
        "claim.graph-3d.saddle-denominator.camera"
      ],
      animationId: "animation.graph-3d.saddle-denominator-four-to-eight"
    }),
    {
      caseId: "conformance.gallery.gap.graph-3d-arbitrary-formula",
      status: "repair-required" as const,
      title: "Animate an arbitrary 3D formula",
      domainLabel: "Typed gap",
      teachingIntent: "Animate the caller-supplied surface z = sin(xy).",
      verifiedByLabel: "Graph3D scene frontend",
      frontendId: "frontend.graph-3d.semantic-scene.v1",
      capabilityLabel: "No arbitrary-formula authority",
      operationLabel: "Repair required",
      explanation:
        "KP refuses this request because formula text cannot supply unverified surface truth at the bounded scene boundary.",
      authorityClaimRefs: [],
      diagnosticCode: "graph-3d-scene.request.formula-forbidden",
      repair:
        "Choose a registered surface family and numeric parameters; the frontend owns the expression."
    }
  ]
} satisfies KpCrossDomainGalleryCollection);

export function findKpCrossDomainGalleryExecutableCase(
  animationId: string
): KpCrossDomainGalleryExecutableCase | undefined {
  return KP_CROSS_DOMAIN_GALLERY_COLLECTION.cases.find(
    (entry): entry is KpCrossDomainGalleryExecutableCase =>
      entry.status === "executable" && entry.animationId === animationId
  );
}

function executableCase(
  input: Omit<KpCrossDomainGalleryExecutableCase, "status" | "href">
): KpCrossDomainGalleryExecutableCase {
  return {
    ...input,
    status: "executable",
    href: `/${writeKpAnimationCatalogueRoute("", {
      artifactId: input.animationId
    })}`
  };
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
