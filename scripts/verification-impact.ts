export type KpVerificationRisk = "low" | "medium" | "high";

export interface KpVerificationCheck {
  readonly id: string;
  readonly command: readonly string[];
  readonly risk: KpVerificationRisk;
  readonly purpose: string;
}

export interface KpVerificationSelection {
  readonly risk: KpVerificationRisk;
  readonly checks: readonly KpVerificationCheck[];
  readonly reasons: readonly string[];
  readonly unmatchedPaths: readonly string[];
}

export interface KpVerificationSelectionOptions {
  readonly release?: boolean;
}

const checks = {
  theseus: check(
    "theseus-validate",
    ["npm", "run", "theseus", "--", "workspace", "validate"],
    "low",
    "Validate durable project state and run-contract evidence."
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
    "Exercise the visible review shell and submission counter."
  ),
  productionClosure: check(
    "dev-review-production-closure",
    ["npm", "run", "check:dev-review-production"],
    "high",
    "Prove development review tooling remains unreachable in production."
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
  focusedVisual: check(
    "focused-visual",
    ["npm", "run", "visual:linear-equation"],
    "high",
    "Capture the canonical motion exemplar at deterministic checkpoints."
  ),
  readerConformance: check(
    "reader-conformance",
    ["npm", "run", "test:browser:reader-conformance"],
    "high",
    "Exercise shared reader hydration, URL, TOC, review, narrow-fit, and searchability laws."
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
    "Exercise distribution motion, direction, URL, review, TOC, and responsive browser behavior."
  ),
  skill: check(
    "skill-validate",
    [
      "/Users/kyleeschen/.codex/skills/.system/skill-creator/scripts/quick_validate.py",
      "/Users/kyleeschen/.codex/skills/kp-review-logs"
    ],
    "low",
    "Validate personal skill structure and metadata."
  ),
  test: check(
    "test",
    ["npm", "test"],
    "high",
    "Run the complete deterministic unit and architecture suite."
  ),
  build: check(
    "build",
    ["npm", "run", "build"],
    "high",
    "Build the production application from clean type-checked sources."
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
    id: "reader-app",
    matches: (path) => path.startsWith("src/reader/app/"),
    // Reader entries own production-only closure as well as shared browser behavior.
    checks: [checks.typecheck, checks.readerConformance, checks.build, checks.productionClosure],
    reason: "A reader application entry changed."
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
      (path.startsWith("src/animation/") && path !== "src/animation/indexed-progress-schedule.ts") ||
      path.includes("equation") ||
      path.includes("visual"),
    checks: [checks.typecheck, checks.focusedVisual],
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
      path.startsWith("vite.config") ||
      path.startsWith("tsconfig"),
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
  checks.typecheck,
  checks.architecture,
  checks.test,
  checks.build
] as const;

/**
 * Maps touched paths to the smallest known-safe gate. Unknown paths deliberately
 * fail broad: saving a few minutes is not worth silently skipping a new subsystem.
 */
export function selectKpVerificationImpact(
  paths: readonly string[],
  options: KpVerificationSelectionOptions = {}
): KpVerificationSelection {
  if (options.release) {
    return {
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
  for (const path of normalizedPaths) {
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
  return {
    risk: maximumRisk(selectedChecks),
    checks: selectedChecks,
    reasons: [...new Set(reasons)],
    unmatchedPaths
  };
}

function check(
  id: string,
  command: readonly string[],
  risk: KpVerificationRisk,
  purpose: string
): KpVerificationCheck {
  return { id, command, risk, purpose };
}

function normalizePath(path: string): string {
  return path.trim().replaceAll("\\", "/").replace(/^\.\//, "");
}

function maximumRisk(selected: readonly KpVerificationCheck[]): KpVerificationRisk {
  if (selected.some((candidate) => candidate.risk === "high")) return "high";
  if (selected.some((candidate) => candidate.risk === "medium")) return "medium";
  return "low";
}
