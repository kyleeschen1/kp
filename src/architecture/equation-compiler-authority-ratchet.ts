import type {
  KpEquationSurfaceAuthorityGraph
} from "./equation-surface-authority-graph.ts";
import type {
  KpEquationSurfaceDispositionLedger
} from "./equation-surface-disposition-ledger.ts";

export type KpEquationAuthorityRatchetCode =
  | "authority-source-missing"
  | "authority-node-unused"
  | "disposition-row-missing"
  | "private-clock"
  | "css-animation-authority"
  | "raw-motif-selection"
  | "local-timing-table"
  | "renderer-inference"
  | "direct-production-sampler"
  | "unclassified-fallback"
  | "parallel-manual-registry";

export interface KpEquationAuthoritySourceFile {
  readonly path: `src/${string}.ts`;
  readonly source: string;
}

export interface KpEquationAuthorityRatchetViolation {
  readonly code: KpEquationAuthorityRatchetCode;
  readonly path: string;
  readonly message: string;
}

const rawMotifPaths = paths([
  "src/editor/equation-stage-frame.ts",
  "src/editor/equation-transition-motifs.ts"
]);

const localTimingPaths = paths([
  "src/animation/counter-orbit-cancellation-timing.ts",
  "src/animation/distribution-motion-profile.ts",
  "src/animation/log-exponent-timeline.ts",
  "src/rendering/equation-visual-motif-timeline.ts",
  "src/semantic/foldable-distribution-fold-timeline.ts",
  "src/semantic/fraction-composition-fold-timeline.ts"
]);

const rendererInferencePaths = paths([
  "src/editor/equation-surface-adapter.ts",
  "src/rendering/equation-motion-dom.ts"
]);

const privateClockPaths = paths([
  "src/app-adapters/linear-equation-story-animation-stage.ts",
  "src/app-adapters/linear-equation-story-progress-controller.ts",
  "src/editor/animation-catalogue-interaction-host.ts",
  "src/editor/equation-motion-demo-controller.ts",
  "src/experiments/glyph-reconciliation-radical-inventory.ts",
  "src/reader/app/distribution-area-runtime.ts",
  "src/reader/app/reader-canonical-equation-session.ts",
  "src/rendering/katex-transition-controller.ts",
  "src/rendering/native-katex-fragment-observer.ts",
  "src/rendering/native-katex-rendered-scene.ts",
  "src/rendering/native-katex-structural-succession-renderer.ts"
]);

const directSamplerPaths = paths([
  "src/animation/distribution-area-exemplar-forward-motion.ts",
  "src/animation/distribution-area-exemplar-inverse-motion.ts",
  "src/animation/distribution-choreography.ts",
  "src/animation/distribution-motion-profile.ts",
  "src/animation/distribution-pressure-animation.ts",
  "src/animation/dot-product-traversal-choreography.ts",
  "src/animation/dot-product-traversal-progress.ts",
  "src/animation/exact-fraction-quantity-neutral-frame.ts",
  "src/animation/exact-fraction-quantity-presentation-plan.ts",
  "src/animation/exponent-law-choreography.ts",
  "src/animation/fraction-choreography.ts",
  "src/animation/function-wrap-choreography.ts",
  "src/animation/inequality-pivot-choreography.ts",
  "src/animation/linear-rearrangement-choreography.ts",
  "src/animation/log-exponent-timeline.ts",
  "src/animation/matrix-linear-map-frame.ts",
  "src/animation/matrix-matrix-composition-choreography.ts",
  "src/animation/matrix-matrix-composition-progress.ts",
  "src/animation/matrix-vector-composition-choreography.ts",
  "src/animation/matrix-vector-composition-progress.ts",
  "src/animation/radical-native-settlement.ts",
  "src/animation/radical-succession-choreography.ts",
  "src/rendering/equation-artifact-bundle-morph.ts",
  "src/rendering/equation-dot-product-traversal.ts",
  "src/rendering/equation-enclosure-choreography.ts",
  "src/rendering/equation-independent-zero-witness.ts",
  "src/rendering/equation-linear-rearrangement-owner-motion.ts",
  "src/rendering/equation-linear-rearrangement.ts",
  "src/rendering/equation-material-owner.ts",
  "src/rendering/equation-matrix-matrix-composition.ts",
  "src/rendering/equation-matrix-vector-composition.ts",
  "src/rendering/equation-motion-path-planner.ts",
  "src/rendering/equation-motion-quality.ts",
  "src/rendering/equation-motif-accessibility.ts",
  "src/rendering/equation-representational-succession.ts",
  "src/rendering/equation-semantic-depth.ts",
  "src/rendering/equation-visual-motif-timeline.ts",
  "src/rendering/equation-witnessed-annihilation.ts",
  "src/rendering/exact-fraction-quantity-bar-projection.ts",
  "src/rendering/exact-fraction-quantity-circle-projection.ts",
  "src/rendering/exact-fraction-quantity-concrete-motion.ts",
  "src/rendering/exact-fraction-quantity-number-line-projection.ts",
  "src/rendering/exact-fraction-quantity-runtime.ts",
  "src/rendering/exact-fraction-quantity-synchronized-projection.ts",
  "src/rendering/native-katex-copy-fan-out-motion.ts",
  "src/rendering/native-katex-factoring-choreography.ts",
  "src/rendering/native-katex-scene-compositor.ts",
  "src/rendering/native-katex-scene-track-sampling.ts",
  "src/rendering/native-katex-successor-synthesis.ts",
  "src/rendering/semantic-equation-token-renderer.ts"
]);

const fallbackPaths = paths([
  "src/animation/animation-design-diagnostics.ts",
  "src/reader/renderers/equation-symbol-motion.ts",
  "src/rendering/equation-motion-plan.ts",
  "src/rendering/semantic-equation-frame.ts"
]);

const manualRegistryPaths = paths([
  "src/animation/operation-evaluation-presentation-registry.ts",
  "src/animation/symbolic-manipulation-family-registry.ts",
  // This is the intended immutable declaration boundary; the older entries
  // remain inventoried only until their callers migrate and they can retire.
  "src/domain-ir/equation-extension-registry.ts",
  "src/semantic/generated-algebra-fixture-registry.ts",
  "src/semantic/generated-algebra-transform-definition-registry.ts"
]);

export function checkKpEquationCompilerAuthorityRatchets(input: {
  readonly files: readonly KpEquationAuthoritySourceFile[];
  readonly authority: KpEquationSurfaceAuthorityGraph;
  readonly disposition: KpEquationSurfaceDispositionLedger;
}): readonly KpEquationAuthorityRatchetViolation[] {
  const violations: KpEquationAuthorityRatchetViolation[] = [];
  const byPath = new Map(input.files.map((file) => [file.path, file.source]));
  const usedNodeIds = new Set(input.authority.rows.flatMap((row) => [
    ...row.compilerNodeIds,
    ...row.registryNodeIds,
    ...row.motifNodeIds,
    ...row.localTimingNodeIds,
    ...row.rendererInferenceNodeIds,
    row.sharedClockNodeId,
    ...row.fallbackNodeIds,
    ...row.directSamplerNodeIds
  ]));
  const dispositionIds = new Set(input.disposition.entries.map(
    ({ animationId }) => animationId
  ));

  for (const node of input.authority.nodes) {
    const source = byPath.get(node.sourcePath);
    if (source === undefined || !source.includes(node.sourceNeedle)) {
      add(violations, "authority-source-missing", node.sourcePath,
        `Authority ${node.id} lacks its inventoried source needle.`);
    }
    if (!usedNodeIds.has(node.id)) {
      add(violations, "authority-node-unused", node.sourcePath,
        `Authority ${node.id} is not assigned to an equation manifest row.`);
    }
  }
  for (const row of input.authority.rows) {
    if (!dispositionIds.has(row.animationId)) {
      add(violations, "disposition-row-missing", row.animationId,
        "Equation authority row has no migration disposition.");
    }
    if (row.privateClockAuthority !== "none") {
      add(violations, "private-clock", row.animationId,
        "Equation row declares private clock authority.");
    }
    if (row.cssAnimationAuthority !== "none") {
      add(violations, "css-animation-authority", row.animationId,
        "Equation row declares CSS animation authority.");
    }
  }

  for (const file of input.files) {
    if (file.path.startsWith("src/architecture/")) continue;
    detect(file, violations, {
      code: "raw-motif-selection",
      matches: file.source.includes("createKpEditorEquationTransitionMotifFrame("),
      allowed: rawMotifPaths
    });
    detect(file, violations, {
      code: "local-timing-table",
      matches: /(equation|log|distribution|cancellation|fraction|radical|exponent).*(timeline|timing|motion-profile)\.ts$/u.test(file.path),
      allowed: localTimingPaths
    });
    detect(file, violations, {
      code: "renderer-inference",
      matches: file.source.includes("measureKpEquationTransitionGeometry("),
      allowed: rendererInferencePaths
    });
    detect(file, violations, {
      code: "private-clock",
      matches: equationRelevant(file.path) &&
        /(?:requestAnimationFrame|setInterval|setTimeout)\(/u.test(file.source),
      allowed: privateClockPaths
    });
    detect(file, violations, {
      code: "direct-production-sampler",
      matches: (file.path.startsWith("src/animation/") ||
        file.path.startsWith("src/rendering/")) &&
        equationRelevant(file.path) &&
        /export function sampleKp[A-Za-z0-9_]*\s*\(/u.test(file.source),
      allowed: directSamplerPaths
    });
    detect(file, violations, {
      code: "unclassified-fallback",
      matches: /whole-equation-fallback|generic-fallback|function fallback(?:SemanticTimelineFrame|CorrespondenceMap)/u.test(file.source),
      allowed: fallbackPaths
    });
    detect(file, violations, {
      code: "parallel-manual-registry",
      matches: /(?:equation|symbolic|algebra|operation-evaluation).*registry\.ts$/u.test(file.path),
      allowed: manualRegistryPaths
    });
  }
  return Object.freeze(violations);
}

function equationRelevant(path: string): boolean {
  return /(equation|katex|log|distribution|cancellation|fraction|radical|exponent|inequality|matrix|dot-product|function-wrap|linear-rearrangement)/u.test(path);
}

function detect(
  file: KpEquationAuthoritySourceFile,
  violations: KpEquationAuthorityRatchetViolation[],
  rule: {
    readonly code: KpEquationAuthorityRatchetCode;
    readonly matches: boolean;
    readonly allowed: ReadonlySet<string>;
  }
): void {
  if (rule.matches && !rule.allowed.has(file.path)) {
    add(violations, rule.code, file.path,
      `Uninventoried ${rule.code.replaceAll("-", " ")} path.`);
  }
}

function add(
  violations: KpEquationAuthorityRatchetViolation[],
  code: KpEquationAuthorityRatchetCode,
  path: string,
  message: string
): void {
  violations.push(Object.freeze({ code, path, message }));
}

function paths(values: readonly string[]): ReadonlySet<string> {
  return new Set(values);
}
