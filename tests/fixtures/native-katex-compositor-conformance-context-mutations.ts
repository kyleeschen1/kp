import {
  kpNativeKatexCompositorConformanceBudget
} from "../support/native-katex-compositor-conformance-budget.ts";
import {
  createKpNativeKatexConformanceCoverageManifest
} from "../support/native-katex-compositor-conformance-manifest.ts";
import {
  createKpNativeKatexContextMutationDescriptor,
  createKpNativeKatexContextMutationRegistry,
  type KpNativeKatexContextMutationDescriptor
} from "../support/native-katex-compositor-context-mutation.ts";
import {
  planKpNativeKatexPairwiseCoverage,
  type KpConformanceCoverageFactor
} from "../support/native-katex-compositor-pairwise-coverage.ts";

type ContextMutationDefinition = Omit<
  KpNativeKatexContextMutationDescriptor,
  "schemaVersion"
>;

const contextMutationDefinitions = Object.freeze([
  {
    id: "context.sibling.shorter",
    label: "shorter right sibling",
    mutationClass: "sibling-length",
    sourceLatex: "x+123",
    targetLatex: "x+1",
    persistentCarrierLatex: "x"
  },
  {
    id: "context.sibling.longer",
    label: "longer right sibling",
    mutationClass: "sibling-length",
    sourceLatex: "x+1",
    targetLatex: "x+123",
    persistentCarrierLatex: "x"
  },
  {
    id: "context.sibling.taller",
    label: "taller right sibling",
    mutationClass: "sibling-height",
    sourceLatex: "x+1",
    targetLatex: "x+\\frac{1}{2}",
    persistentCarrierLatex: "x"
  },
  {
    id: "context.grouping.parenthesized",
    label: "parenthesized right sibling",
    mutationClass: "grouping",
    sourceLatex: "x+y",
    targetLatex: "x+(y)",
    persistentCarrierLatex: "x"
  },
  {
    id: "context.math-style.display-to-script",
    label: "display to script style",
    mutationClass: "math-style",
    sourceLatex: "\\displaystyle x+y",
    targetLatex: "\\scriptstyle x+y",
    persistentCarrierLatex: "x"
  }
] as const satisfies readonly ContextMutationDefinition[]);

export const kpNativeKatexContextMutations = Object.freeze(
  contextMutationDefinitions.map((definition) =>
    createKpNativeKatexContextMutationDescriptor(definition))
);

export const kpNativeKatexContextMutationRegistry =
  createKpNativeKatexContextMutationRegistry(kpNativeKatexContextMutations);

const contextMutationCanaryFactors = Object.freeze([
  {
    id: "shapeRisk",
    values: ["glyph", "script", "vertical-list", "delimiter"]
  },
  {
    id: "contextMutation",
    values: kpNativeKatexContextMutations.map(({ id }) => id)
  },
  {
    id: "topology",
    values: ["one-to-one", "compound-owner"]
  },
  {
    id: "lifecycle",
    values: ["forward", "direct-seek"]
  },
  {
    id: "renderingMode",
    values: ["dark", "light"]
  }
] satisfies readonly KpConformanceCoverageFactor[]);

const scriptStyleCompoundOverride = Object.freeze({
  id: "risk.script-math-style-compound",
  riskFactorIds: ["shapeRisk", "contextMutation", "topology"] as const,
  assignments: Object.freeze({
    shapeRisk: "script",
    contextMutation: "context.math-style.display-to-script",
    topology: "compound-owner",
    lifecycle: "direct-seek",
    renderingMode: "dark"
  })
});

export const kpNativeKatexContextMutationCanaryPlan =
  planKpNativeKatexPairwiseCoverage({
    factors: contextMutationCanaryFactors,
    overrides: [scriptStyleCompoundOverride],
    maximumScenarios: kpNativeKatexCompositorConformanceBudget.hard
      .fastCanaryMaximumScenarios
  });

export const kpNativeKatexContextMutationCanaryManifest =
  createKpNativeKatexConformanceCoverageManifest(
    kpNativeKatexContextMutationCanaryPlan
  );
