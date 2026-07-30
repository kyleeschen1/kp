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
if (!compositorSource.includes("applyKpNativeKatexOperationChoreography")) {
  violations.push(
    `${canonicalCompositor} must apply certified operation choreography ` +
    "before generic protected transit."
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
