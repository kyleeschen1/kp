import { kpReaderRouteManifest } from "../src/reader/compiler/reader-route-manifest.ts";

export type KpVerificationRisk = "low" | "medium" | "high";
export type KpVerificationMode =
  | "discovery"
  | "contract"
  | "promotion"
  | "release";

export interface KpVerificationCheck {
  readonly id: string;
  readonly command: readonly string[];
  readonly risk: KpVerificationRisk;
  readonly purpose: string;
  readonly minimumMode: Exclude<KpVerificationMode, "release">;
}

export interface KpVerificationSelection {
  readonly mode: KpVerificationMode;
  readonly risk: KpVerificationRisk;
  readonly checks: readonly KpVerificationCheck[];
  readonly reasons: readonly string[];
  readonly unmatchedPaths: readonly string[];
}

export interface KpVerificationSelectionOptions {
  readonly mode?: KpVerificationMode;
  readonly release?: boolean;
}

const checks = {
  theseus: check(
    "theseus-validate",
    ["npm", "run", "theseus", "--", "workspace", "validate"],
    "low",
    "Validate durable project state and run-contract evidence.",
    "discovery"
  ),
  protocol: check(
    "protocol-typecheck",
    ["npm", "run", "typecheck:protocols"],
    "medium",
    "Type-check public protocol contracts in isolation."
  ),
  reviewUnit: check(
    "dev-review-unit",
    [
      "node", "--disable-warning=ExperimentalWarning", "--test",
      "server/dev-review-config.test.ts",
      "server/dev-review-derived-index.test.ts",
      "server/dev-review-http-adapter.test.ts",
      "server/dev-review-inbox.test.ts",
      "server/dev-review-legacy-round-migration.test.ts",
      "server/dev-review-lifecycle.test.ts",
      "server/dev-review-query.test.ts",
      "server/dev-review-round-inbox.test.ts",
      "server/dev-review-store.test.ts",
      "scripts/dev-review-cli.test.ts",
      "tests/dev-review-acceptance.test.ts",
      "tests/dev-review-client.test.ts",
      "tests/dev-review-protocol.test.ts",
      "tests/dev-review-v2-protocol.test.ts"
    ],
    "medium",
    "Exercise the append-only review protocol, store, transport, query, and CLI seams."
  ),
  reviewBrowser: check(
    "dev-review-browser",
    ["npx", "playwright", "test", "tests/dev-review-shell.browser.spec.ts", "--project=chromium"],
    "medium",
    "Exercise the visible review shell and submission counter.",
    "promotion"
  ),
  productionClosure: check(
    "dev-review-production-closure",
    ["npm", "run", "check:dev-review-production"],
    "high",
    "Prove development review tooling remains unreachable in production.",
    "promotion"
  ),
  readerProductionClosure: check(
    "reader-production-closure",
    ["npm", "run", "check:reader-production"],
    "high",
    "Prove the route manifest and deployed reader pages form an exact build-only closure.",
    "promotion"
  ),
  readerBudgets: check(
    "reader-route-budgets",
    ["npm", "run", "check:reader-budgets"],
    "high",
    "Enforce each manifest route's compiled HTML and transitive runtime payload baseline.",
    "promotion"
  ),
  typecheck: check(
    "typecheck",
    ["npm", "run", "typecheck"],
    "medium",
    "Check repository-wide TypeScript boundaries."
  ),
  architecture: check(
    "architecture",
    ["npm", "run", "check:architecture"],
    "high",
    "Check domain and reader import boundaries."
  ),
  animationConvergence: check(
    "semantic-animation-convergence",
    ["npm", "run", "test:semantic-animation-convergence"],
    "high",
    "Exercise typed profiles, sampled frames, clocks, projections, and canonical animation laws."
  ),
  equationMotionProtocol: check(
    "equation-motion-protocol",
    [
      "node", "--disable-warning=ExperimentalWarning", "--test",
      "tests/equation-motion-vocabulary.test.ts",
      "tests/equation-motif-invocation.test.ts",
      "tests/semantic-motion-compiler-contract.test.ts"
    ],
    "medium",
    "Exercise nominal equation vocabulary and renderer-neutral motion compiler contracts."
  ),
  catalogueUnit: check(
    "svelte-catalogue-unit",
    ["npm", "run", "test:svelte-catalogue-shell"],
    "medium",
    "Exercise catalogue selection, lazy capabilities, stage hosting, and navigation."
  ),
  catalogueCapabilityBrowser: check(
    "catalogue-capability-browser",
    ["npm", "run", "test:browser:animation-equation-capability"],
    "high",
    "Prove lazy equation and graph capability loading retains stable stage geometry.",
    "promotion"
  ),
  catalogueBundle: check(
    "catalogue-bundle-boundary",
    ["npm", "run", "check:animation-library-bundle-boundary"],
    "high",
    "Enforce lazy catalogue and specialized capability payload ceilings.",
    "promotion"
  ),
  publication: check(
    "economics-publication",
    ["npm", "run", "check:economics-demand-shift-publication"],
    "medium",
    "Prove the checked-in economics publication matches its Article source."
  ),
  focusedVisual: check(
    "focused-visual",
    ["npm", "run", "visual:linear-equation"],
    "high",
    "Capture the canonical motion exemplar at deterministic checkpoints.",
    "discovery"
  ),
  functionWrapVisual: check(
    "function-wrap-visual",
    ["npm", "run", "visual:function-wrap"],
    "medium",
    "Capture the function-wrap exemplar through its current catalogue route.",
    "discovery"
  ),
  equationPreservation: check(
    "equation-surface-preservation",
    ["npm", "run", "test:equation-surface-preservation"],
    "medium",
    "Protect equation semantics, endpoints, clocks, renderers, and sampled-frame obligations.",
    "discovery"
  ),
  readerConformance: check(
    "reader-conformance",
    ["npm", "run", "test:browser:reader-conformance"],
    "high",
    "Exercise shared reader hydration, URL, TOC, review, narrow-fit, and searchability laws.",
    "promotion"
  ),
  distributionUnit: check(
    "distribution-motion-laws",
    [
      "node", "--test",
      "tests/distribution-area-layout.test.ts",
      "tests/distribution-area-motion-plan.test.ts",
      "tests/distribution-area-width-motion-plan.test.ts",
      "tests/distribution-area-temporal-laws.test.ts",
      "tests/indexed-progress-schedule.test.ts"
    ],
    "medium",
    "Exercise distribution topology, measured layout, scheduling, continuity, and reverse laws."
  ),
  distributionVisual: check(
    "distribution-visual",
    ["npm", "run", "visual:distribution-area"],
    "high",
    "Exercise distribution motion, direction, URL, review, TOC, and responsive browser behavior.",
    "discovery"
  ),
  publicTypeScript: check(
    "public-typescript",
    ["npm", "run", "verify:public-typescript"],
    "high",
    "Type-check, test, build, budget, and browser-check the bounded public TypeScript route.",
    "promotion"
  ),
  publicFractionComposition: check(
    "public-fraction-composition",
    ["npm", "run", "verify:public-fraction-composition"],
    "high",
    "Type-check, test, build, and browser-check the bounded public symbolic route.",
    "promotion"
  ),
  publicTypeScriptInfrastructure: check(
    "public-typescript-infrastructure",
    [
      "node", "--disable-warning=ExperimentalWarning", "--test",
      "scripts/verification-impact.test.ts",
      "scripts/verify-impact.test.ts",
      "tests/pre-expansion-health-commands.test.ts"
    ],
    "medium",
    "Exercise focused verification selection and release-command composition."
  ),
  typeScriptRefactor: check(
    "typescript-refactor",
    ["npm", "run", "test:typescript-refactor"],
    "medium",
    "Exercise the canonical TypeScript refactor semantics, motion, rendering, and public projection."
  ),
  skill: check(
    "skill-validate",
    [
      "/Users/kyleeschen/.codex/skills/.system/skill-creator/scripts/quick_validate.py",
      "/Users/kyleeschen/.codex/skills/kp-review-logs"
    ],
    "low",
    "Validate personal skill structure and metadata.",
    "discovery"
  ),
  test: check(
    "test",
    ["npm", "test"],
    "high",
    "Run the complete deterministic unit and architecture suite."
  ),
  build: check(
    "build",
    ["npm", "run", "build:bundle"],
    "high",
    "Build the production application after the separately selected typecheck.",
    "promotion"
  )
} as const;

interface KpVerificationRule {
  readonly id: string;
  readonly matches: (path: string) => boolean;
  readonly checks: readonly KpVerificationCheck[];
  readonly reason: string;
}

const rules: readonly KpVerificationRule[] = [
  {
    id: "equation-motion-protocol",
    matches: (path) => path.startsWith("src/domain-ir/"),
    checks: [
      checks.equationPreservation,
      checks.equationMotionProtocol,
      checks.typecheck,
      checks.architecture
    ],
    reason: "Renderer-neutral equation motion protocol or compiler authority changed."
  },
  {
    id: "function-wrap-presentation",
    matches: isFunctionWrapPath,
    checks: [
      checks.equationPreservation,
      checks.typecheck,
      checks.architecture,
      checks.functionWrapVisual
    ],
    reason: "Function-wrap authority, rendering, or checkpoint coverage changed."
  },
  {
    id: "public-typescript-infrastructure",
    matches: (path) =>
      path === "scripts/verification-impact.ts" ||
      path === "scripts/verification-impact.test.ts" ||
      path === "scripts/verify-impact.test.ts" ||
      path === "tests/pre-expansion-health-commands.test.ts",
    checks: [checks.publicTypeScriptInfrastructure],
    reason: "Focused verification routing or explicit release composition changed."
  },
  {
    id: "public-fraction-composition",
    matches: isPublicFractionCompositionPath,
    checks: [checks.publicFractionComposition],
    reason: "The bounded public symbolic projection changed."
  },
  {
    id: "public-typescript",
    matches: isPublicTypeScriptPath,
    checks: [checks.publicTypeScript],
    reason: "The bounded public TypeScript projection or its focused verification lane changed."
  },
  {
    id: "typescript-refactor",
    matches: isTypeScriptRefactorPath,
    checks: [checks.typeScriptRefactor, checks.publicTypeScript],
    reason: "The canonical TypeScript refactor that powers the public projection changed."
  },
  {
    id: "theseus-state",
    matches: (path) => path === "theseus.config.json" || path.startsWith("docs/theseus/"),
    checks: [checks.theseus],
    reason: "Theseus state changed."
  },
  {
    id: "protocol-contract",
    matches: (path) => path.startsWith("protocols/"),
    checks: [checks.protocol, checks.reviewUnit, checks.typecheck],
    reason: "A public protocol contract changed."
  },
  {
    id: "review-service",
    matches: (path) => path.startsWith("server/dev-review-") || path.startsWith("scripts/dev-review-cli"),
    checks: [checks.reviewUnit, checks.typecheck, checks.productionClosure],
    reason: "The review persistence, transport, or operator surface changed."
  },
  {
    id: "review-client",
    matches: (path) => path.startsWith("src/dev-review/") || path.startsWith("tests/dev-review-"),
    checks: [checks.reviewUnit, checks.reviewBrowser, checks.typecheck, checks.productionClosure],
    reason: "The visible review experience or browser contract changed."
  },
  {
    id: "reader-system",
    matches: (path) =>
      path.startsWith("src/reader/") ||
      readerLessonSourcePaths.has(path) ||
      path === "vite.config.ts",
    checks: [
      checks.typecheck,
      checks.architecture,
      checks.readerConformance,
      checks.build,
      checks.readerProductionClosure,
      checks.readerBudgets,
      checks.productionClosure
    ],
    reason: "A manifest reader source, compiler, runtime, renderer, or build route changed."
  },
  {
    id: "equation-presentation-profile",
    matches: (path) =>
      path.includes("equation-presentation-profile") ||
      path.includes("equation-presentation-policy"),
    checks: [checks.typecheck, checks.architecture, checks.animationConvergence],
    reason: "Typed equation presentation policy or profiles changed."
  },
  {
    id: "catalogue-capability",
    matches: (path) =>
      path.startsWith("src/animation/catalog-packs/") ||
      path.includes("catalog-loader") ||
      path.includes("selected-surface-capability") ||
      path.includes("animation-catalogue-selection-preparation"),
    checks: [
      checks.typecheck,
      checks.architecture,
      checks.catalogueUnit,
      checks.catalogueCapabilityBrowser,
      checks.catalogueBundle
    ],
    reason: "A lazy catalogue data or renderer capability boundary changed."
  },
  {
    id: "catalogue-stage-reservation",
    matches: (path) =>
      path.includes("animation-catalogue-font-reservation") ||
      path.includes("animation-catalogue-shell.css") ||
      path.includes("KpSvelteCatalogueExemplar.svelte"),
    checks: [
      checks.typecheck,
      checks.catalogueUnit,
      checks.catalogueCapabilityBrowser,
      checks.catalogueBundle
    ],
    reason: "Catalogue reservation, typography, or persistent stage geometry changed."
  },
  {
    id: "animation-ownership-seam",
    matches: (path) =>
      path.startsWith("src/architecture/") ||
      path.startsWith("scripts/check-semantic-animation-boundaries"),
    checks: [checks.typecheck, checks.architecture],
    reason: "An executable animation ownership or compatibility seam changed."
  },
  {
    id: "compiled-publication",
    matches: (path) =>
      (path.endsWith(".kp.md") && !isPublicTypeScriptPath(path)) ||
      path.includes("publication.generated.json") ||
      path.includes("compile-economics-demand-shift-publication"),
    checks: [checks.publication, checks.typecheck],
    reason: "Article source or a checked-in compiled publication changed."
  },
  {
    id: "distribution-exemplar",
    matches: (path) =>
      path.includes("distribution-area") ||
      path === "src/animation/indexed-progress-schedule.ts",
    checks: [checks.typecheck, checks.distributionUnit, checks.distributionVisual],
    reason: "The distribution exemplar or its compositional schedule changed."
  },
  {
    id: "visual-runtime",
    matches: (path) =>
      path.startsWith("src/semantic-reader/") ||
      (path.startsWith("src/animation/") &&
        path !== "src/animation/indexed-progress-schedule.ts" &&
        !isTypeScriptRefactorPath(path) &&
        !isFunctionWrapPath(path)) ||
      (!path.startsWith("src/domain-ir/") &&
        !isFunctionWrapPath(path) &&
        (path.includes("equation") || path.includes("visual"))),
    checks: [
      checks.equationPreservation,
      checks.typecheck,
      checks.focusedVisual
    ],
    reason: "A motion, equation, or visual-rendering path changed."
  },
  {
    id: "architecture",
    matches: (path) => path.startsWith("domains/") || path.startsWith("providers/"),
    checks: [checks.typecheck, checks.architecture],
    reason: "A domain or provider boundary changed."
  },
  {
    id: "personal-skill",
    matches: (path) => path.includes("/.codex/skills/") || path.startsWith("skill:"),
    checks: [checks.skill],
    reason: "A personal Codex skill changed."
  },
  {
    id: "build-surface",
    matches: (path) =>
      path === "package.json" ||
      path === "package-lock.json" ||
      (path.startsWith("vite.config") && !isFocusedPublicPath(path)) ||
      (path.startsWith("tsconfig") && !isFocusedPublicPath(path)),
    checks: [checks.typecheck, checks.test, checks.build],
    reason: "A package, compiler, or build surface changed."
  }
];

const releaseChecks = [
  checks.theseus,
  checks.protocol,
  checks.reviewUnit,
  checks.reviewBrowser,
  checks.productionClosure,
  checks.readerProductionClosure,
  checks.readerBudgets,
  checks.typecheck,
  checks.architecture,
  checks.test,
  checks.build
] as const;

const readerLessonSourcePaths = new Set<string>(
  kpReaderRouteManifest.map((descriptor) => descriptor.sourcePath)
);

function isPublicTypeScriptPath(path: string): boolean {
  return path.startsWith("src/public-web/typescript-free-shipping-") ||
    path === "content/lessons/typescript-free-shipping.kp.md" ||
    path === "content/lessons/typescript-free-shipping.kp.lock.json" ||
    path === "learn/code/free-shipping/index.html" ||
    path === "tests/typescript-free-shipping-publication.test.ts" ||
    path === "tests/typescript-free-shipping-public.browser.spec.ts" ||
    path === "scripts/check-public-typescript-budgets.ts" ||
    path === "vite.public-typescript.config.ts" ||
    path === "playwright.public-typescript.config.ts" ||
    path === "tsconfig.public-typescript.json";
}

function isPublicFractionCompositionPath(path: string): boolean {
  return path.startsWith("src/public-web/fraction-composition-public") ||
    path === "learn/math/fraction-composition/index.html" ||
    path === "tests/fraction-composition-publication.test.ts" ||
    path === "tests/fraction-composition-public.browser.spec.ts" ||
    path === "vite.public-fraction-composition.config.ts" ||
    path === "playwright.public-fraction-composition.config.ts" ||
    path === "tsconfig.public-fraction-composition.json";
}

function isFocusedPublicPath(path: string): boolean {
  return isPublicTypeScriptPath(path) ||
    isPublicFractionCompositionPath(path);
}

function isTypeScriptRefactorPath(path: string): boolean {
  return path.startsWith("src/animation/typescript-refactor-") ||
    path.startsWith("src/rendering/typescript-refactor-") ||
    path.startsWith("src/semantic/typescript-refactor-") ||
    path.startsWith("src/semantic/typescript-free-shipping-") ||
    (path.startsWith("tests/typescript-") &&
      !isPublicTypeScriptPath(path));
}

function isFunctionWrapPath(path: string): boolean {
  return path.includes("function-wrap");
}

/**
 * Maps touched paths to the smallest known-safe gate. Unknown paths deliberately
 * fail broad: saving a few minutes is not worth silently skipping a new subsystem.
 */
export function selectKpVerificationImpact(
  paths: readonly string[],
  options: KpVerificationSelectionOptions = {}
): KpVerificationSelection {
  const mode = options.release ? "release" : options.mode ?? "promotion";
  if (mode === "release") {
    return {
      mode,
      risk: "high",
      checks: releaseChecks,
      reasons: ["Release verification explicitly requests the broad repository gate."],
      unmatchedPaths: []
    };
  }

  const normalizedPaths = [...new Set(paths.map(normalizePath).filter(Boolean))].sort();
  const selected = new Map<string, KpVerificationCheck>();
  const reasons: string[] = [];
  const unmatchedPaths: string[] = [];
  const boundedPackageJson = normalizedPaths.includes("package.json") &&
    normalizedPaths.some((path) => isPublicTypeScriptPath(path) ||
      path === "scripts/verification-impact.ts" ||
      path === "tests/pre-expansion-health-commands.test.ts");
  for (const path of normalizedPaths) {
    if (path === "package.json" && boundedPackageJson) {
      reasons.push(
        "package.json is covered by the bounded public TypeScript and verification-infrastructure gates."
      );
      continue;
    }
    const matchingRules = rules.filter((rule) => rule.matches(path));
    if (matchingRules.length === 0) {
      unmatchedPaths.push(path);
      continue;
    }
    for (const rule of matchingRules) {
      reasons.push(`${rule.id}: ${rule.reason}`);
      for (const candidate of rule.checks) selected.set(candidate.id, candidate);
    }
  }
  if (unmatchedPaths.length > 0 || normalizedPaths.length === 0) {
    selected.set(checks.typecheck.id, checks.typecheck);
    selected.set(checks.test.id, checks.test);
    selected.set(checks.build.id, checks.build);
    reasons.push(
      normalizedPaths.length === 0
        ? "No changed paths were supplied, so the selector chose the broad safe gate."
        : "At least one path has no focused rule, so the selector chose the broad safe gate."
    );
  }
  const selectedChecks = [...selected.values()];
  const checksForMode = unmatchedPaths.length > 0 || normalizedPaths.length === 0
    ? selectedChecks
    : selectedChecks.filter((candidate) =>
      modeRank[candidate.minimumMode] <= modeRank[mode]
    );
  return {
    mode,
    risk: maximumRisk(checksForMode),
    checks: checksForMode,
    reasons: [...new Set(reasons)],
    unmatchedPaths
  };
}

function check(
  id: string,
  command: readonly string[],
  risk: KpVerificationRisk,
  purpose: string,
  minimumMode: Exclude<KpVerificationMode, "release"> = "contract"
): KpVerificationCheck {
  return { id, command, risk, purpose, minimumMode };
}

const modeRank: Readonly<Record<KpVerificationMode, number>> = Object.freeze({
  discovery: 0,
  contract: 1,
  promotion: 2,
  release: 3
});

function normalizePath(path: string): string {
  return path.trim().replaceAll("\\", "/").replace(/^\.\//, "");
}

function maximumRisk(selected: readonly KpVerificationCheck[]): KpVerificationRisk {
  if (selected.some((candidate) => candidate.risk === "high")) return "high";
  if (selected.some((candidate) => candidate.risk === "medium")) return "medium";
  return "low";
}
