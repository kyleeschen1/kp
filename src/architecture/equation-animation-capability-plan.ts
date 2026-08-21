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
    "Common-denominator alignment",
    "family.equation.common-denominator.v1",
    [
      requirement("requirement.equation.common-denominator.operation", "semantic-operation", "operation.equation.common-denominator-alignment.v1", "A typed operation verifies caller-supplied denominator factors and legal multipliers for each term without becoming an LCM solver."),
      requirement("requirement.equation.common-denominator.recipe", "canonical-recipe", "recipe.equation.common-denominator.v1", "A recipe coordinates equivalent scaling before arithmetic begins."),
      requirement("requirement.equation.common-denominator.exemplar", "canonical-exemplar", "exemplar.equation.common-denominator.v1", "A reviewed exemplar must establish the visual grammar before generalization."),
      requirement("requirement.equation.common-denominator.corpus", "generation-corpus", "corpus.equation.fraction-denominator.v1", "Fixed fixtures prove one numeric alignment, explicit evaluation composition, alias normalization, and typed denominator repairs.")
    ]
  ),
  capability(
    "capability.equation.fraction-arithmetic",
    "Fraction addition and subtraction",
    "family.equation.fraction-arithmetic.v1",
    [
      requirement("requirement.equation.fraction-arithmetic.operation", "semantic-operation", "operation.equation.like-denominator-combination.v1", "A typed operation combines raw numerators only after exact shared-denominator authority is present."),
      requirement("requirement.equation.fraction-arithmetic.recipe", "canonical-recipe", "recipe.equation.fraction-arithmetic.v1", "A canonical recipe sequences common-denominator construction, combination, and settlement."),
      requirement("requirement.equation.fraction-arithmetic.authoring", "authoring-surface", "authoring.equation.like-denominator-combination.v1", "Governed authoring rejects mismatched denominators and hidden reduction while retaining exact contributor lineage."),
      requirement("requirement.equation.fraction-arithmetic.corpus", "generation-corpus", "corpus.equation.fraction-denominator.v1", "Fixed fixtures cover one valid combination plus denominator-mismatch and hidden-reduction repairs.")
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
    "capability.equation.exponential-homomorphism",
    "Exponential sum/product and difference/quotient duality",
    "family.equation.exponential-homomorphism.v1",
    [
      requirement("requirement.equation.exponential-homomorphism.product-operation", "semantic-operation", "operation.equation.exponential-sum-to-product.v1", "The sum law licenses one power application to derive an ordered product of successor applications."),
      requirement("requirement.equation.exponential-homomorphism.quotient-operation", "semantic-operation", "operation.equation.exponential-difference-to-quotient.v1", "The difference law licenses numerator and denominator successor applications without connector glyph identity."),
      requirement("requirement.equation.exponential-homomorphism.recipe", "canonical-recipe", "recipe.equation.exponential-homomorphism.v1", "One causal recipe owns the shared homomorphic phases while topology policies own safe paint order."),
      requirement("requirement.equation.exponential-homomorphism.motif", "motion-motif", "motif.exponential-power-crossover.v1", "The power crossover motif preserves payload identity and derives base successors."),
      requirement("requirement.equation.exponential-homomorphism.renderer", "renderer-capability", "renderer-capability.equation.exponential-power-crossover.v1", "Native KaTeX endpoints and measured compositor tracks realize both reviewed topologies."),
      requirement("requirement.equation.exponential-homomorphism.product-exemplar", "canonical-exemplar", "animation.algebra.exponential-homomorphism.sum-to-product", "The approved product exemplar proves lateral carrier fission."),
      requirement("requirement.equation.exponential-homomorphism.quotient-exemplar", "canonical-exemplar", "animation.algebra.exponential-homomorphism.difference-to-quotient", "The approved quotient exemplar proves collision-safe vertical construction."),
      requirement("requirement.equation.exponential-homomorphism.authoring", "authoring-surface", "authoring.equation.exponential-homomorphism.v1", "Governed authoring selects one exact law and never accepts presentation geometry."),
      requirement("requirement.equation.exponential-homomorphism.corpus", "generation-corpus", "corpus.equation.exponential-homomorphism.v1", "Natural-language and LaTeX fixtures accept the two reviewed laws while scalar transport and inverse cancellation remain typed gaps.")
    ]
  ),
  capability(
    "capability.equation.power-and-exponent-transformations",
    "Power and exponent transformations",
    "family.equation.power-exponent.v1",
    [
      requirement("requirement.equation.power-exponent.normalizer", "endpoint-normalizer", "normalizer.equation.power-application.v1", "Power bases, superscript regions, grouped exponent operands, and connector roles normalize while retaining authored spelling."),
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
    "capability.equation.trigonometric-transformations",
    "Trigonometric notation and transformations",
    "family.equation.trigonometric-transformation.v1",
    [
      requirement("requirement.equation.trigonometric.normalizer", "endpoint-normalizer", "normalizer.equation.trigonometric-notation.v1", "Function powers, inverse functions, reciprocal functions, arguments, and angle units retain distinct typed roles."),
      requirement("requirement.equation.trigonometric.operation", "semantic-operation", "operation.equation.trigonometric-transform.v1", "Typed operations name the exact identity, inverse relation, or argument transformation instead of guessing from superscripts."),
      requirement("requirement.equation.trigonometric.recipe", "canonical-recipe", "recipe.equation.trigonometric-transformation.v1", "Canonical recipes preserve function and argument identity through supported rewrites."),
      requirement("requirement.equation.trigonometric.authoring", "authoring-surface", "authoring.equation.trigonometric-transformation.v1", "Governed authoring requires an exact law and rejects ambiguous inverse or reciprocal syntax."),
      requirement("requirement.equation.trigonometric.corpus", "generation-corpus", "corpus.equation.trigonometric-transformation.v1", "Fixtures distinguish function powers, inverse functions, reciprocal functions, identities, and compositions.")
    ]
  ),
  capability(
    "capability.equation.piecewise-transformations",
    "Piecewise definitions and case transformations",
    "family.equation.piecewise-transformation.v1",
    [
      requirement("requirement.equation.piecewise.normalizer", "endpoint-normalizer", "normalizer.equation.piecewise.v1", "Branches, conditions, delimiters, and default cases remain explicit and ordered."),
      requirement("requirement.equation.piecewise.operation", "semantic-operation", "operation.equation.piecewise-transform.v1", "Typed operations preserve branch conditions while selecting, splitting, combining, or substituting cases."),
      requirement("requirement.equation.piecewise.recipe", "canonical-recipe", "recipe.equation.piecewise-transformation.v1", "A canonical recipe preserves case lineage and prevents branches from visually swapping meaning."),
      requirement("requirement.equation.piecewise.corpus", "generation-corpus", "corpus.equation.piecewise-transformation.v1", "Fixtures cover two and three cases, boundary conditions, absolute-value expansion, and undefined regions.")
    ]
  ),
  capability(
    "capability.equation.sequence-series-transformations",
    "Sequence and series transformations",
    "family.equation.sequence-series.v1",
    [
      requirement("requirement.equation.sequence-series.normalizer", "endpoint-normalizer", "normalizer.equation.sequence-series.v1", "Terms, indices, bounds, ellipses, recurrence references, and partial sums retain semantic roles."),
      requirement("requirement.equation.sequence-series.operation", "semantic-operation", "operation.equation.sequence-series-transform.v1", "Typed operations own index shifts, term expansion, recurrence substitution, and finite or infinite sum rewrites."),
      requirement("requirement.equation.sequence-series.recipe", "canonical-recipe", "recipe.equation.sequence-series.v1", "Recipes preserve binding scope and term lineage while a sequence or series changes form."),
      requirement("requirement.equation.sequence-series.corpus", "generation-corpus", "corpus.equation.sequence-series.v1", "Fixtures cover explicit and recursive sequences, partial sums, geometric series, convergence statements, and index shifts.")
    ]
  ),
  capability(
    "capability.equation.limit-transformations",
    "Limit notation and transformations",
    "family.equation.limit-transformation.v1",
    [
      requirement("requirement.equation.limit.normalizer", "endpoint-normalizer", "normalizer.equation.limit-notation.v1", "Bound variables, approach values, one-sided directions, infinity, and expression bodies remain distinct."),
      requirement("requirement.equation.limit.operation", "semantic-operation", "operation.equation.limit-transform.v1", "Typed operations name a licensed limit law, substitution, factor cancellation, squeeze argument, or unsupported gap."),
      requirement("requirement.equation.limit.recipe", "canonical-recipe", "recipe.equation.limit-transformation.v1", "A canonical recipe preserves the binder while the body changes and makes one-sided evidence visible when required."),
      requirement("requirement.equation.limit.corpus", "generation-corpus", "corpus.equation.limit-transformation.v1", "Fixtures cover finite, infinite, one-sided, indeterminate, and piecewise limits without inferring proofs.")
    ]
  ),
  capability(
    "capability.equation.differentiation-transformations",
    "Differentiation transformations",
    "family.equation.differentiation.v1",
    [
      requirement("requirement.equation.differentiation.normalizer", "endpoint-normalizer", "normalizer.equation.derivative-notation.v1", "Leibniz, prime, operator, and partial-derivative spellings normalize while retaining their source notation."),
      requirement("requirement.equation.differentiation.operation", "semantic-operation", "operation.equation.differentiate.v1", "Typed operations apply declared derivative rules with bound variable, assumptions, and contributor lineage."),
      requirement("requirement.equation.differentiation.recipe", "canonical-recipe", "recipe.equation.differentiation.v1", "Recipes expose rule structure without pretending that a visual rewrite proves differentiability."),
      requirement("requirement.equation.differentiation.authoring", "authoring-surface", "authoring.equation.differentiation.v1", "Governed authoring selects a derivative rule or supplies verified operation evidence."),
      requirement("requirement.equation.differentiation.corpus", "generation-corpus", "corpus.equation.differentiation.v1", "Fixtures cover constant, power, sum, product, quotient, chain, implicit, inverse, and parametric differentiation.")
    ]
  ),
  capability(
    "capability.equation.integration-transformations",
    "Integration transformations",
    "family.equation.integration.v1",
    [
      requirement("requirement.equation.integration.normalizer", "endpoint-normalizer", "normalizer.equation.integral-notation.v1", "Bounds, integrands, differentials, constants of integration, and evaluation bars retain semantic roles."),
      requirement("requirement.equation.integration.operation", "semantic-operation", "operation.equation.integrate.v1", "Typed operations apply declared antiderivative, substitution, parts, accumulation, or evaluation laws with assumptions."),
      requirement("requirement.equation.integration.recipe", "canonical-recipe", "recipe.equation.integration.v1", "Recipes preserve binder scope and show contributor correspondence through supported integral rewrites."),
      requirement("requirement.equation.integration.authoring", "authoring-surface", "authoring.equation.integration.v1", "Governed authoring distinguishes indefinite, definite, and accumulation forms before selecting a recipe."),
      requirement("requirement.equation.integration.corpus", "generation-corpus", "corpus.equation.integration.v1", "Fixtures cover antiderivatives, definite evaluation, substitution, parts, area, volume, and improper integrals.")
    ]
  ),
  capability(
    "capability.equation.polar-parametric-transformations",
    "Polar and parametric transformations",
    "family.equation.polar-parametric.v1",
    [
      requirement("requirement.equation.polar-parametric.normalizer", "endpoint-normalizer", "normalizer.equation.polar-parametric.v1", "Parameters, coordinate functions, polar radii, angles, and derivative roles remain explicit."),
      requirement("requirement.equation.polar-parametric.operation", "semantic-operation", "operation.equation.polar-parametric-transform.v1", "Typed operations own coordinate conversion, parameter elimination, slope, area, and arc-length rewrites."),
      requirement("requirement.equation.polar-parametric.recipe", "canonical-recipe", "recipe.equation.polar-parametric.v1", "Recipes preserve correspondence between symbolic coordinates and any later graph representation."),
      requirement("requirement.equation.polar-parametric.corpus", "generation-corpus", "corpus.equation.polar-parametric.v1", "Fixtures cover Cartesian conversion, parametric derivatives, polar derivatives, area, arc length, and ambiguous parameters.")
    ]
  ),
  capability(
    "capability.equation.differential-equation-transformations",
    "Differential-equation transformations",
    "family.equation.differential-equation.v1",
    [
      requirement("requirement.equation.differential-equation.normalizer", "endpoint-normalizer", "normalizer.equation.differential-equation.v1", "Dependent variables, independent variables, derivative terms, initial conditions, and solution families retain roles."),
      requirement("requirement.equation.differential-equation.operation", "semantic-operation", "operation.equation.differential-equation-transform.v1", "Typed operations own separation, initial-condition application, slope-field correspondence, and solution verification."),
      requirement("requirement.equation.differential-equation.recipe", "canonical-recipe", "recipe.equation.differential-equation.v1", "Recipes preserve differential grouping and distinguish equation manipulation from integration."),
      requirement("requirement.equation.differential-equation.corpus", "generation-corpus", "corpus.equation.differential-equation.v1", "Fixtures cover separable equations, exponential growth and decay, logistic models, initial values, and verification.")
    ]
  ),
  capability(
    "capability.equation.taylor-series-transformations",
    "Taylor polynomial and series transformations",
    "family.equation.taylor-series.v1",
    [
      requirement("requirement.equation.taylor-series.normalizer", "endpoint-normalizer", "normalizer.equation.taylor-series.v1", "Centers, derivative orders, factorial denominators, indices, remainders, and convergence conditions retain roles."),
      requirement("requirement.equation.taylor-series.operation", "semantic-operation", "operation.equation.taylor-series-transform.v1", "Typed operations own coefficient construction, finite approximation, series substitution, and error-bound rewrites."),
      requirement("requirement.equation.taylor-series.recipe", "canonical-recipe", "recipe.equation.taylor-series.v1", "Recipes preserve term lineage between derivatives, coefficients, polynomial terms, and the represented function."),
      requirement("requirement.equation.taylor-series.corpus", "generation-corpus", "corpus.equation.taylor-series.v1", "Fixtures cover Maclaurin and centered series, common expansions, products, substitutions, alternating error, and Lagrange remainder.")
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
