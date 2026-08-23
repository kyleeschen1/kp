export type KpEquationGovernanceV2RatchetCode =
  | "v2-caller-owned-route"
  | "v2-caller-owned-timing"
  | "v2-uncontrolled-display-mode"
  | "v2-css-clock"
  | "v2-unregistered-evaluation"
  | "v2-adapter-bypass";

export interface KpEquationGovernanceV2SourceFile {
  readonly path: `src/${string}.ts`;
  readonly source: string;
}

export interface KpEquationGovernanceV2RatchetViolation {
  readonly code: KpEquationGovernanceV2RatchetCode;
  readonly path: string;
  readonly message: string;
}

const authority = Object.freeze({
  presentationCompiler: "src/domain-ir/equation-presentation-plan-v2.ts",
  evaluationRegistry:
    "src/domain-ir/equation-evaluation-authority-registry-v2.ts",
  transitCompiler: "src/domain-ir/equation-transit-obligations-v2.ts",
  routeCertifier: "src/rendering/equation-measured-route-certificate-v2.ts",
  endpointTypography:
    "src/rendering/native-katex-endpoint-typography-v2.ts"
});

const v2AuthorityPaths = new Set<string>([
  "src/domain-ir/equation-grammar-v2.ts",
  "src/domain-ir/equation-grammar-v2-operation-resolution.ts",
  authority.evaluationRegistry,
  "src/domain-ir/equation-projection-choreography-v2.ts",
  "src/domain-ir/equation-typography-policy-v2.ts",
  authority.transitCompiler,
  authority.presentationCompiler,
  authority.routeCertifier,
  authority.endpointTypography
]);

const routeProperty = /\b(?:motionPath|motionPathVariant|pathVariant|controlPoints?|pixelCoordinates?|coordinates?)\s*:/u;
const timingProperty = /\b(?:delayMs|durationMs|easing|endMs|keyframes?|progressRange|startMs|staggerMs|timing)\s*:/u;
const cssClock = /(?:@keyframes\b|\b(?:animation|transition)-(?:duration|delay)\s*:|\banimation\s*:\s*[A-Za-z_-]+\s+\d|\btransition\s*:\s*[A-Za-z_-]+\s+\d)/u;
const lowerLayerCompiler = /\b(?:compileKpEquationTransitObligationsV2|resolveKpEquationEvaluationAuthoritiesV2|resolveKpEquationGrammarV2Operations|resolveKpEquationProjectionChoreographiesV2|resolveKpEquationTypographyV2)\s*\(/u;

/**
 * Guards the closed v2 equation route without making equation-shaped policy a
 * prerequisite for graph, code, or 3D renderers. Legacy equation sources join
 * this closure only when a migration imports a v2 authority.
 */
export function checkKpEquationGovernanceV2Ratchets(
  files: readonly KpEquationGovernanceV2SourceFile[]
): readonly KpEquationGovernanceV2RatchetViolation[] {
  const violations: KpEquationGovernanceV2RatchetViolation[] = [];
  for (const file of files) {
    if (!participatesInV2(file) || file.path.startsWith("src/architecture/")) {
      continue;
    }
    const isAuthority = v2AuthorityPaths.has(file.path);
    if (!isAuthority && routeProperty.test(file.source)) {
      add(violations, "v2-caller-owned-route", file,
        "V2 equation callers express semantic transit intent; measured routes belong to the route certifier.");
    }
    if (!isAuthority && timingProperty.test(file.source)) {
      add(violations, "v2-caller-owned-timing", file,
        "V2 equation callers cannot own durations, easing, keyframes, or progress ranges.");
    }
    if (file.path !== authority.endpointTypography &&
        /\bdisplayMode\s*:/u.test(file.source)) {
      add(violations, "v2-uncontrolled-display-mode", file,
        "V2 KaTeX display mode must be compiled from the typography policy.");
    }
    if (cssClock.test(file.source)) {
      add(violations, "v2-css-clock", file,
        "CSS animation and transition clocks cannot drive governed equation motion.");
    }
    if (file.path !== authority.presentationCompiler &&
        file.path !== authority.evaluationRegistry &&
        /\bresolveKpEquationEvaluationAuthoritiesV2\s*\(/u.test(file.source)) {
      add(violations, "v2-unregistered-evaluation", file,
        "Evaluation authority is resolved only inside the compiled presentation plan.");
    }
    if (!isAuthority && lowerLayerCompiler.test(file.source)) {
      add(violations, "v2-adapter-bypass", file,
        "V2 adapters consume a nominal compiled presentation plan, not lower-layer compilers.");
    }
  }
  return Object.freeze(violations);
}

function participatesInV2(file: KpEquationGovernanceV2SourceFile): boolean {
  return v2AuthorityPaths.has(file.path) ||
    /(?:equation-(?:evaluation-authority-registry|grammar|presentation-plan|projection-choreography|transit-obligations|typography-policy)-v2|equation-measured-route-certificate-v2|native-katex-endpoint-typography-v2)/u.test(
      file.source
    );
}

function add(
  violations: KpEquationGovernanceV2RatchetViolation[],
  code: KpEquationGovernanceV2RatchetCode,
  file: KpEquationGovernanceV2SourceFile,
  message: string
): void {
  violations.push(Object.freeze({ code, path: file.path, message }));
}
