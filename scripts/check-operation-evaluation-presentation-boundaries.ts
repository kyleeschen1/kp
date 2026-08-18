import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const projectRoot = process.cwd();
const animationRoot = join(projectRoot, "src/animation");
const descriptorOwner =
  "src/animation/motifs/visual-motif.ts";
const canonicalCallers = [
  "src/animation/fraction-composition-visual-motifs.ts",
  "src/animation/foldable-distribution-equation-adapter.ts",
  "src/animation/motifs/equation-visual-motif-defaults.ts"
] as const;
const balancedSolveAdapter =
  "src/animation/fraction-composition-equation-adapter.ts";
const canonicalSceneAdapter =
  "src/reader/renderers/equation-scene-compositor-adapter.ts";
const canonicalCompositor =
  "src/rendering/native-katex-scene-compositor.ts";
const callerConformanceMint =
  "src/architecture/operation-evaluation-caller-conformance.ts";
const sharedContinuityRuntimeCallers = [
  "src/animation/operation-evaluation-presentation-registry.ts",
  "src/animation/operation-evaluation-presentation-types.ts",
  "src/animation/operation-evaluation-continuity-program.ts",
  "src/animation/successor-synthesis-presentation-plan.ts",
  "src/reader/renderers/executable-successor-motif-program-adapter.ts",
  "src/rendering/native-katex-successor-synthesis.ts"
] as const;
const continuityAuthoringModules = [
  "executable-motif-continuity-compiler.ts",
  "executable-successor-motif-program-validator.ts",
  "operation-evaluation-continuity-contract.ts",
  "operation-evaluation-continuity-topology.ts",
  "perceptual-continuity-contract-authority.ts",
  "perceptual-continuity-contract.ts"
] as const;
const continuityAuthorityCallers = new Map([
  [
    "registerKpVerifiedPerceptualContinuityContractAuthority",
    new Set([
      "src/animation/perceptual-continuity-contract-authority.ts",
      "src/animation/perceptual-continuity-contract.ts"
    ])
  ],
  [
    "registerKpExecutableMotifContinuityProgramAuthority",
    new Set([
      "src/animation/motifs/executable-motif-continuity-program.ts",
      "src/animation/motifs/executable-motif-continuity-compiler.ts",
      "src/animation/operation-evaluation-continuity-program.ts"
    ])
  ],
  [
    "registerKpVerifiedExecutableSuccessorMotifProgramAuthority",
    new Set([
      "src/animation/motifs/executable-successor-motif-program-authority.ts",
      "src/animation/motifs/executable-successor-motif-program-validator.ts",
      "src/animation/motifs/operation-evaluation-executable-program.ts"
    ])
  ]
] as const);
const readerPlanKinds = [
  "default-motion",
  "visual-motif",
  "distribution",
  "fraction-material",
  "factoring",
  "successor-synthesis",
  "operation-choreography",
  "structural-succession",
  "explicit-static-checkpoint"
] as const;
const violations: string[] = [];

for (const repositoryPath of sharedContinuityRuntimeCallers) {
  const source = readFileSync(join(projectRoot, repositoryPath), "utf8");
  for (const authoringModule of continuityAuthoringModules) {
    if (source.includes(authoringModule)) {
      violations.push(
        `${repositoryPath} imports continuity authoring module ` +
        `${authoringModule} into the shared reader closure.`
      );
    }
  }
}

for (const path of collectTypeScriptFiles(animationRoot)) {
  const repositoryPath = relative(projectRoot, path);
  const source = readFileSync(path, "utf8");
  for (const [authority, allowedCallers] of continuityAuthorityCallers) {
    if (source.includes(authority) && !allowedCallers.has(repositoryPath)) {
      violations.push(
        `${repositoryPath} uses closed continuity authority ${authority}.`
      );
    }
  }
}

for (const path of collectTypeScriptFiles(animationRoot)) {
  const repositoryPath = relative(projectRoot, path);
  if (repositoryPath === descriptorOwner) continue;
  const source = readFileSync(path, "utf8");
  if (/\bkind:\s*"successor-synthesis"/.test(source)) {
    violations.push(
      `${repositoryPath} authors a successor-synthesis descriptor outside ` +
      `${descriptorOwner}.`
    );
  }
}

for (const repositoryPath of canonicalCallers) {
  const source = readFileSync(join(projectRoot, repositoryPath), "utf8");
  if (!source.includes(
    "requireKpCanonicalOperationEvaluationPresentation"
  ) || !source.includes(
    "ruleFromKpResolvedOperationEvaluationPresentation"
  )) {
    violations.push(
      `${repositoryPath} must consume a nominally resolved ` +
      "operation-evaluation presentation."
    );
  }
}

const balancedSolveSource = readFileSync(
  join(projectRoot, balancedSolveAdapter),
  "utf8"
);
if (
  !balancedSolveSource.includes(
    "createKpCanonicalBalancedSolveAnimationAsset"
  ) ||
  balancedSolveSource.includes("createKpAnimationAsset(") ||
  balancedSolveSource.includes("presentationProfile:")
) {
  violations.push(
    `${balancedSolveAdapter} must receive its synchronized branch and ` +
    "cancellation profile only through the canonical balanced-solve factory."
  );
}

const sceneAdapterSource = readFileSync(
  join(projectRoot, canonicalSceneAdapter),
  "utf8"
);
const readerDispatchSource = sceneAdapterSource.slice(
  sceneAdapterSource.indexOf(
    "function dispatchReaderEquationPresentation("
  ),
  sceneAdapterSource.indexOf("type KpReaderEquationRoutingFields")
);
const dispatchedReaderPlanKinds = Array.from(
  readerDispatchSource.matchAll(/case "([^"]+)":/g),
  (match) => match[1]
);
if (
  sceneAdapterSource.includes(
    "projectKpReaderEquationTransitionPresentation("
  ) ||
  !sceneAdapterSource.includes(
    "function dispatchReaderEquationPresentation("
  ) ||
  !sceneAdapterSource.includes("switch (plan.planKind)") ||
  !readerDispatchSource.includes(
    "operationChoreography: plan.operationChoreography"
  ) ||
  !sceneAdapterSource.includes(
    "function unreachablePresentationPlan(plan: never)"
  ) ||
  dispatchedReaderPlanKinds.length !== readerPlanKinds.length ||
  readerPlanKinds.some((kind) => !dispatchedReaderPlanKinds.includes(kind))
) {
  violations.push(
    `${canonicalSceneAdapter} must exhaustively dispatch the closed reader ` +
    "presentation-plan union before constructing canonical compositor input."
  );
}

const compositorSource = readFileSync(
  join(projectRoot, canonicalCompositor),
  "utf8"
);
const basePlanSource = readFileSync(
  join(projectRoot, "src/rendering/native-katex-base-scene-plan.ts"),
  "utf8"
);
if (
  !compositorSource.includes("compileKpNativeKatexOperationTracks") ||
  !basePlanSource.includes("applyKpNativeKatexOperationChoreography") ||
  !basePlanSource.includes("compileKpNativeKatexOperationTracks")
) {
  violations.push(
    `${canonicalCompositor} must route certified operation choreography ` +
    "through the typed base-plan port before generic protected transit."
  );
}

const callerConformanceSource = readFileSync(
  join(projectRoot, callerConformanceMint),
  "utf8"
);
// A persistent boundary check keeps the conformance artifact source-derived;
// its behavioral tests then prove those imports execute instead of merely
// trusting a caller-name list or a previously generated snapshot.
for (const requiredSource of [
  "createKpOnePlusTwoEvaluationAnimationAsset",
  "createKpFivePlusTwoEvaluationAnimationAsset",
  "createKpThreeSixthsEvaluationAnimationAsset",
  "projectKpReaderEquationRenderPlan",
  "compileKpExecutableSuccessorMotifProgramAdapter",
  "resolveKpOperationEvaluationPresentationRoute",
  "verifiedCallerConformanceManifests"
]) {
  if (!callerConformanceSource.includes(requiredSource)) {
    violations.push(
      `${callerConformanceMint} must derive conformance through ` +
      `${requiredSource}, not names or snapshots.`
    );
  }
}

if (violations.length > 0) {
  violations.forEach((violation) => console.error(violation));
  process.exitCode = 1;
} else {
  console.log(
    "operation-evaluation presentation boundary passed " +
    `(${canonicalCallers.length} motif consumers; source-derived caller mint)`
  );
}

function collectTypeScriptFiles(root: string): readonly string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return collectTypeScriptFiles(path);
    return entry.isFile() && entry.name.endsWith(".ts") ? [path] : [];
  });
}
