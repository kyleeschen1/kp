import {
  KP_ANIMATION_CAPABILITY_PLAN_SCHEMA,
  defineKpAnimationCapabilityPlan,
  type KpAnimationCapabilityPlanEntry,
  type KpAnimationCapabilityRequirement
} from "./animation-capability-plan.ts";

type EquationCapabilityDraft = Omit<
  KpAnimationCapabilityPlanEntry,
  "domain" | "order"
>;

type RequirementDraft = Readonly<{
  id: string;
  kind: KpAnimationCapabilityRequirement["kind"];
  authorityId: string;
  summary: string;
}>;

const requirement = (
  id: string,
  kind: RequirementDraft["kind"],
  authorityId: string,
  summary: string
): RequirementDraft => Object.freeze({ id, kind, authorityId, summary });

/**
 * This ordered source records desired equation coverage, including absences.
 * It deliberately names every authority a capability would need without
 * claiming that the authority exists; evidence projection owns that verdict.
 */
const equationCapabilityDrafts = Object.freeze([
  capability(
    "capability.equation.function-wrapping",
    "Function wrapping",
    "family.equation.structural-wrap.v1",
    [
      requirement("requirement.equation.function-wrapping.operation", "semantic-operation", "operation.wrap-function.v1", "A typed operation identifies content and the function application that receives it."),
      requirement("requirement.equation.function-wrapping.recipe", "canonical-recipe", "recipe.equation.function-application.v1", "The compiler selects the canonical wrapping recipe."),
      requirement("requirement.equation.function-wrapping.motif", "motion-motif", "motif.function-wrap.v1", "Parentheses receive and settle around their argument through the shared wrap motif."),
      requirement("requirement.equation.function-wrapping.exemplar", "canonical-exemplar", "animation.generated.function-wrap.apply-f", "A reviewed native-KaTeX exemplar proves the canonical visual language."),
      requirement("requirement.equation.function-wrapping.authoring", "authoring-surface", "compiler.equation.intent.function-wrap.v1", "The tool-neutral equation intent entrance resolves the operation without geometry input."),
      requirement("requirement.equation.function-wrapping.corpus", "generation-corpus", "pressure.equation.function-wrap", "A fixed pressure fixture proves direct selection and typed role closure.")
    ]
  ),
  capability(
    "capability.equation.distribution",
    "Distribution",
    "family.equation.distribution.v1",
    [
      requirement("requirement.equation.distribution.operation", "semantic-operation", "kp.algebra.distribute-multiplication", "A typed operation owns factor and addend correspondences."),
      requirement("requirement.equation.distribution.recipe", "canonical-recipe", "recipe.operation-plan.distribution.v1", "A canonical operation plan owns distribution instead of caller-local trajectories."),
      requirement("requirement.equation.distribution.exemplar", "canonical-exemplar", "animation.generated.distribution.expand-a-sum", "A concrete expansion exemplar preserves factor identity through the result."),
      requirement("requirement.equation.distribution.authoring", "authoring-surface", "compiler.equation.intent.distribution.v1", "The direct intent entrance compiles distribution from semantic roles."),
      requirement("requirement.equation.distribution.corpus", "generation-corpus", "pressure.equation.distribution-factoring", "A pressure fixture proves generated expansion without presentation fields.")
    ]
  ),
  capability(
    "capability.equation.additive-cancellation",
    "Additive cancellation",
    "family.equation.inverse-cancellation.v1",
    [
      requirement("requirement.equation.additive-cancellation.operation", "semantic-operation", "kp.algebra.cancel-additive-inverses", "A typed operation identifies inverse terms and their surviving context."),
      requirement("requirement.equation.additive-cancellation.recipe", "canonical-recipe", "recipe.operation-plan.inverse-cancellation.v1", "A canonical cancellation recipe owns the annihilation sequence."),
      requirement("requirement.equation.additive-cancellation.exemplar", "canonical-exemplar", "animation.generated.cancellation.additive-inverses", "A concrete exemplar proves inverse terms can meet and disappear without disturbing context."),
      requirement("requirement.equation.additive-cancellation.authoring", "authoring-surface", "compiler.equation.intent.additive-cancellation.v1", "The direct intent entrance resolves cancellation from named semantic roles."),
      requirement("requirement.equation.additive-cancellation.corpus", "generation-corpus", "pressure.equation.cancellation", "A fixed fixture proves direct selection and rejects malformed cardinality.")
    ]
  ),
  capability(
    "capability.equation.log-homomorphic-decomposition",
    "Logarithmic homomorphic decomposition",
    "family.equation.log-homomorphism.v1",
    [
      requirement("requirement.equation.log-homomorphism.product-operation", "semantic-operation", "law.logarithm.product", "The product law licenses ordered factor decomposition into a sum."),
      requirement("requirement.equation.log-homomorphism.quotient-operation", "semantic-operation", "law.logarithm.quotient", "The quotient law licenses a difference-to-quotient fusion."),
      requirement("requirement.equation.log-homomorphism.recipe", "canonical-recipe", "recipe.equation.homomorphic-decomposition.v1", "One causal recipe names shared operator-shell and connector phases without owning caller geometry."),
      requirement("requirement.equation.log-homomorphism.product-exemplar", "canonical-exemplar", "animation.algebra.log-product.xy-to-sum", "The approved product exemplar proves one-to-many application fission."),
      requirement("requirement.equation.log-homomorphism.quotient-exemplar", "canonical-exemplar", "animation.algebra.log-quotient.difference-to-quotient", "The approved quotient exemplar pressure-tests many-to-one application fusion."),
      requirement("requirement.equation.log-homomorphism.authoring", "authoring-surface", "authoring.equation.log-homomorphism.v1", "Governed authoring selects product or quotient behavior from semantic law and roles."),
      requirement("requirement.equation.log-homomorphism.corpus", "generation-corpus", "corpus.equation.log-homomorphism.v1", "Binary product, multi-factor product, and quotient fixtures pressure cardinality and direction.")
    ]
  ),
  capability(
    "capability.equation.transform-series",
    "Ordered transform series",
    "series.equation.transform.v1",
    [
      requirement("requirement.equation.transform-series.normalizer", "endpoint-normalizer", "normalizer.equation.native-latex.v1", "Supported native-LaTeX endpoints normalize into semantic shapes or typed syntax gaps."),
      requirement("requirement.equation.transform-series.runtime", "series-runtime", "runtime.equation.transform-series.v1", "One deterministic clock composes one accepted semantic operation per adjacency."),
      requirement("requirement.equation.transform-series.authoring", "authoring-surface", "authoring.equation.transform-series.v1", "Authors can supply ordered LaTeX states with explicit or proposed adjacency intents."),
      requirement("requirement.equation.transform-series.corpus", "generation-corpus", "corpus.equation.transform-series.v1", "Positive and repair fixtures cover seek, rewind, ambiguity, and unsupported syntax.")
    ]
  ),
  capability(
    "capability.equation.balanced-operations",
    "Balanced equation operations",
    "family.equation.balanced-operation.v1",
    [
      requirement("requirement.equation.balanced-operations.operation", "semantic-operation", "operation.equation.apply-both-sides.v1", "A typed operation applies one legal transformation to both sides of a relation."),
      requirement("requirement.equation.balanced-operations.recipe", "canonical-recipe", "recipe.equation.balanced-operation.v1", "A shared causal recipe keeps the applied group cohesive and the equality relation stable."),
      requirement("requirement.equation.balanced-operations.exemplar", "canonical-exemplar", "animation.algebra.log-exponent.solve-two-power-x", "The current logarithm/division example remains evidence for one shape, not the whole family."),
      requirement("requirement.equation.balanced-operations.authoring", "authoring-surface", "authoring.equation.balanced-operation.v1", "Governed authoring names the operation, operands, sides, and domain assumptions."),
      requirement("requirement.equation.balanced-operations.corpus", "generation-corpus", "corpus.equation.balanced-operation.v1", "Add, subtract, multiply, divide, apply-log, and divide-by-log-base cases pressure varied operands and invalid assumptions.")
    ]
  ),
  capability(
    "capability.equation.alternative-logarithm-bases",
    "Alternative logarithm bases and change of base",
    "family.equation.logarithm-base.v1",
    [
      requirement("requirement.equation.logarithm-base.normalizer", "endpoint-normalizer", "normalizer.equation.logarithm-base-syntax.v1", "The endpoint parser preserves explicit bases in forms such as log_b(x) and log_{10}(x)."),
      requirement("requirement.equation.logarithm-base.operation", "semantic-operation", "operation.equation.change-logarithm-base.v1", "A typed law relates source base, target base, numerator log, and denominator log under valid domain assumptions."),
      requirement("requirement.equation.logarithm-base.recipe", "canonical-recipe", "recipe.equation.change-logarithm-base.v1", "A canonical recipe owns base transfer and quotient construction without treating the base as decoration."),
      requirement("requirement.equation.logarithm-base.motif", "motion-motif", "motif.equation.logarithm-base-handoff.v1", "A distinct motif preserves base identity as notation moves between operator subscripts and the change-of-base quotient."),
      requirement("requirement.equation.logarithm-base.exemplar", "canonical-exemplar", "animation.equation.logarithm-change-of-base.v1", "One reviewed exemplar establishes syntax, identity, and attention choreography before promotion."),
      requirement("requirement.equation.logarithm-base.authoring", "authoring-surface", "authoring.equation.logarithm-base.v1", "Authors name source and target bases semantically; KP chooses notation and motion."),
      requirement("requirement.equation.logarithm-base.corpus", "generation-corpus", "corpus.equation.logarithm-base.v1", "Fixtures cover symbolic and numeric bases, omitted natural bases, and invalid base/domain cases.")
    ]
  ),
  capability(
    "capability.equation.fraction-equivalence",
    "Fraction equivalence and repartition",
    "family.equation.fraction-equivalence.v1",
    [
      requirement("requirement.equation.fraction-equivalence.operation", "semantic-operation", "operation.equation.fraction-equivalence.v1", "A typed equivalence owns numerator/denominator scaling and repartition."),
      requirement("requirement.equation.fraction-equivalence.recipe", "canonical-recipe", "recipe.equation.fraction-equivalence.v1", "A canonical recipe preserves fraction material and lineages through split, merge, and scale."),
      requirement("requirement.equation.fraction-equivalence.exemplar", "canonical-exemplar", "animation.fraction-composition.split-merge", "Existing split/merge behavior is recorded as exemplar evidence rather than general coverage."),
      requirement("requirement.equation.fraction-equivalence.corpus", "generation-corpus", "corpus.equation.fraction-equivalence.v1", "Fixtures vary term count, grouping, signs, and symbolic denominators.")
    ]
  ),
  capability(
    "capability.equation.common-denominator-construction",
    "Common-denominator construction",
    "family.equation.common-denominator.v1",
    [
      requirement("requirement.equation.common-denominator.operation", "semantic-operation", "operation.equation.construct-common-denominator.v1", "A typed operation identifies denominator factors and the legal multipliers for each term."),
      requirement("requirement.equation.common-denominator.recipe", "canonical-recipe", "recipe.equation.common-denominator.v1", "A recipe coordinates equivalent scaling before arithmetic begins."),
      requirement("requirement.equation.common-denominator.exemplar", "canonical-exemplar", "exemplar.equation.common-denominator.v1", "A reviewed exemplar must establish the visual grammar before generalization."),
      requirement("requirement.equation.common-denominator.corpus", "generation-corpus", "corpus.equation.common-denominator.v1", "Fixtures cover numeric, symbolic, already-shared, and partially shared denominators.")
    ]
  ),
  capability(
    "capability.equation.fraction-arithmetic",
    "Fraction addition and subtraction",
    "family.equation.fraction-arithmetic.v1",
    [
      requirement("requirement.equation.fraction-arithmetic.operation", "semantic-operation", "operation.equation.fraction-arithmetic.v1", "A typed operation distinguishes denominator preparation from numerator combination."),
      requirement("requirement.equation.fraction-arithmetic.recipe", "canonical-recipe", "recipe.equation.fraction-arithmetic.v1", "A canonical recipe sequences common-denominator construction, combination, and settlement."),
      requirement("requirement.equation.fraction-arithmetic.authoring", "authoring-surface", "authoring.equation.fraction-arithmetic.v1", "Governed authoring rejects arithmetic requests whose denominator equivalence is unproved."),
      requirement("requirement.equation.fraction-arithmetic.corpus", "generation-corpus", "corpus.equation.fraction-arithmetic.v1", "Fixtures cover signs, multiple terms, symbolic factors, and simplification opportunities.")
    ]
  ),
  capability(
    "capability.equation.fraction-factor-cancellation",
    "Fraction factor cancellation",
    "family.equation.fraction-factor-cancellation.v1",
    [
      requirement("requirement.equation.fraction-factor-cancellation.operation", "semantic-operation", "kp.algebra.cancel-multiplicative-inverses", "A typed operation proves matching nonzero factors may cancel across a fraction bar."),
      requirement("requirement.equation.fraction-factor-cancellation.recipe", "canonical-recipe", "recipe.equation.fraction-factor-cancellation.v1", "A canonical recipe owns opposed arcs, overlap, annihilation, and surviving material."),
      requirement("requirement.equation.fraction-factor-cancellation.exemplar", "canonical-exemplar", "animation.fraction-composition.multiplicative-cancellation", "Existing cancellation behavior is exemplar evidence until varied callers pass."),
      requirement("requirement.equation.fraction-factor-cancellation.corpus", "generation-corpus", "corpus.equation.fraction-factor-cancellation.v1", "Fixtures vary factor location, multiplicity, grouping, signs, and forbidden zero factors.")
    ]
  ),
  capability(
    "capability.equation.nested-fraction-normalization",
    "Nested-fraction normalization",
    "family.equation.nested-fraction.v1",
    [
      requirement("requirement.equation.nested-fraction.normalizer", "endpoint-normalizer", "normalizer.equation.nested-fraction.v1", "Nested numerator and denominator groups remain explicit semantic structures."),
      requirement("requirement.equation.nested-fraction.operation", "semantic-operation", "operation.equation.normalize-nested-fraction.v1", "A typed operation owns reciprocal multiplication and denominator clearing."),
      requirement("requirement.equation.nested-fraction.recipe", "canonical-recipe", "recipe.equation.nested-fraction.v1", "A recipe preserves group cohesion while the nested structure is rewritten."),
      requirement("requirement.equation.nested-fraction.corpus", "generation-corpus", "corpus.equation.nested-fraction.v1", "Fixtures cover numerator nesting, denominator nesting, compound terms, and signs.")
    ]
  ),
  capability(
    "capability.equation.power-and-exponent-transformations",
    "Power and exponent transformations",
    "family.equation.power-exponent.v1",
    [
      requirement("requirement.equation.power-exponent.operation", "semantic-operation", "operation.equation.power-exponent.v1", "Typed operations cover exponent absorption, lowering, expansion, and inverse relationships."),
      requirement("requirement.equation.power-exponent.recipe", "canonical-recipe", "recipe.equation.power-exponent.v1", "A canonical recipe preserves base/exponent roles through each supported rewrite."),
      requirement("requirement.equation.power-exponent.exemplar", "canonical-exemplar", "animation.algebra.log-exponent.solve-two-power-x", "The current solve example is one compound exemplar rather than family-wide proof."),
      requirement("requirement.equation.power-exponent.authoring", "authoring-surface", "authoring.equation.power-exponent.v1", "Governed authoring names the exact law and direction instead of inferring it from glyph resemblance."),
      requirement("requirement.equation.power-exponent.corpus", "generation-corpus", "corpus.equation.power-exponent.v1", "Fixtures pressure symbolic bases, nested powers, products, quotients, and invalid domain assumptions.")
    ]
  ),
  capability(
    "capability.equation.radical-inversion",
    "Root and radical inversion",
    "family.equation.radical-inversion.v1",
    [
      requirement("requirement.equation.radical-inversion.normalizer", "endpoint-normalizer", "normalizer.equation.radical.v1", "Root indices, radicands, and power equivalents normalize without losing grouping."),
      requirement("requirement.equation.radical-inversion.operation", "semantic-operation", "kp.algebra.rewrite-power-as-root", "A typed operation relates powers and roots under explicit parity and domain conditions."),
      requirement("requirement.equation.radical-inversion.recipe", "canonical-recipe", "recipe.equation.radical-inversion.v1", "A recipe owns exponent-to-index lineage and radical enclosure construction."),
      requirement("requirement.equation.radical-inversion.exemplar", "canonical-exemplar", "exemplar.equation.radical-succession.v1", "A reviewed exemplar establishes the visual grammar before broad promotion."),
      requirement("requirement.equation.radical-inversion.corpus", "generation-corpus", "corpus.equation.radical-inversion.v1", "Fixtures cover square, odd, symbolic, nested, and principal-root cases.")
    ]
  ),
  capability(
    "capability.equation.substitution-collection-factoring",
    "Substitution, collection, and factoring",
    "family.equation.substitution-collection-factoring.v1",
    [
      requirement("requirement.equation.substitution-collection-factoring.operation", "semantic-operation", "operation.equation.substitution-collection-factoring.v1", "Typed operations distinguish substitution, like-term collection, and common-factor extraction."),
      requirement("requirement.equation.substitution-collection-factoring.recipe", "canonical-recipe", "recipe.equation.substitution-collection-factoring.v1", "Recipes preserve semantic identity while terms enter, coalesce, or factor out."),
      requirement("requirement.equation.substitution-collection-factoring.exemplar", "canonical-exemplar", "animation.generated.distribution.factor-common-a", "The current factoring exemplar is one pressure case, not universal support."),
      requirement("requirement.equation.substitution-collection-factoring.corpus", "generation-corpus", "corpus.equation.substitution-collection-factoring.v1", "Fixtures vary repeated terms, coefficients, nesting, and replacement cardinality.")
    ]
  ),
  capability(
    "capability.equation.branching-and-domain-conditions",
    "Branching, domain conditions, and rejected solutions",
    "family.equation.branching-domain.v1",
    [
      requirement("requirement.equation.branching-domain.operation", "semantic-operation", "operation.equation.branching-domain.v1", "Typed operations own branch creation, assumptions, and rejection evidence."),
      requirement("requirement.equation.branching-domain.recipe", "canonical-recipe", "recipe.equation.branching-domain.v1", "A recipe keeps branches visibly related while allowing different outcomes."),
      requirement("requirement.equation.branching-domain.authoring", "authoring-surface", "authoring.equation.branching-domain.v1", "Authors must name branch conditions and verification steps; the compiler does not invent them."),
      requirement("requirement.equation.branching-domain.corpus", "generation-corpus", "corpus.equation.branching-domain.v1", "Fixtures include plus/minus roots, logs, denominators, absolute value, and extraneous solutions.")
    ]
  ),
  capability(
    "capability.equation.inequality-transformations",
    "Inequality and absolute-value transformations",
    "family.equation.inequality.v1",
    [
      requirement("requirement.equation.inequality.operation", "semantic-operation", "operation.equation.inequality-transform.v1", "Typed operations own order reversal, interval intersection, and absolute-value case splitting."),
      requirement("requirement.equation.inequality.recipe", "canonical-recipe", "recipe.equation.inequality-transform.v1", "A canonical recipe makes order reversal and branch creation causally visible."),
      requirement("requirement.equation.inequality.authoring", "authoring-surface", "authoring.equation.inequality.v1", "Governed authoring supplies sign knowledge and case conditions explicitly."),
      requirement("requirement.equation.inequality.corpus", "generation-corpus", "corpus.equation.inequality.v1", "Fixtures cover positive/negative multipliers, compound bounds, and absolute value.")
    ]
  ),
  capability(
    "capability.equation.binders-and-calculus-operators",
    "Binders, large operators, and calculus operators",
    "family.equation.binders-calculus.v1",
    [
      requirement("requirement.equation.binders-calculus.normalizer", "endpoint-normalizer", "normalizer.equation.binders-calculus.v1", "Bound variables, limits, bodies, differentials, and evaluation bounds retain semantic roles."),
      requirement("requirement.equation.binders-calculus.operation", "semantic-operation", "operation.equation.binders-calculus.v1", "Typed operations own scope-preserving substitution and operator laws."),
      requirement("requirement.equation.binders-calculus.recipe", "canonical-recipe", "recipe.equation.binders-calculus.v1", "Recipes preserve binding scope and prevent accidental variable capture."),
      requirement("requirement.equation.binders-calculus.corpus", "generation-corpus", "corpus.equation.binders-calculus.v1", "Fixtures cover sums, products, limits, derivatives, integrals, and nested binders.")
    ]
  ),
  capability(
    "capability.equation.multiline-derivation-continuity",
    "Multi-line derivation continuity",
    "series.equation.derivation.v1",
    [
      requirement("requirement.equation.derivation.runtime", "series-runtime", "runtime.equation.derivation.v1", "A deterministic series preserves object identity and checkpoints across multiple displayed lines."),
      requirement("requirement.equation.derivation.operation", "semantic-operation", "operation.equation.derivation-adjacency.v1", "Every adjacent line identifies one licensed semantic operation or requests segmentation."),
      requirement("requirement.equation.derivation.authoring", "authoring-surface", "authoring.equation.derivation.v1", "Authors provide ordered states, narration, and explicit intents without presentation coordinates."),
      requirement("requirement.equation.derivation.corpus", "generation-corpus", "corpus.equation.derivation.v1", "Fixtures pressure insertion, deletion, reordering, branch continuation, direct seek, and rewind.")
    ]
  )
] as const satisfies readonly EquationCapabilityDraft[]);

export const kpEquationAnimationCapabilityPlan =
  defineKpAnimationCapabilityPlan({
    schemaVersion: KP_ANIMATION_CAPABILITY_PLAN_SCHEMA,
    kind: "animation-capability-plan",
    id: "plan.equation.animation-capabilities.v1",
    title: "Equation animation capabilities",
    entries: equationCapabilityDrafts.map((entry, index) => ({
      ...entry,
      domain: "equation",
      order: index + 1
    }))
  });

function capability(
  id: string,
  title: string,
  authorityId: string,
  requirements: readonly RequirementDraft[]
): EquationCapabilityDraft {
  return Object.freeze({
    id,
    title,
    scope: Object.freeze({
      kind: id === "capability.equation.transform-series" ||
          id === "capability.equation.multiline-derivation-continuity"
        ? "transform-series" as const
        : "transformation-family" as const,
      authorityId
    }),
    requirements: Object.freeze([...requirements])
  });
}
