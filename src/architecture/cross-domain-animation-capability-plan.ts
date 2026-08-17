import {
  KP_ANIMATION_CAPABILITY_PLAN_SCHEMA,
  defineKpAnimationCapabilityPlan,
  type KpAnimationCapabilityDomain,
  type KpAnimationCapabilityPlanEntry,
  type KpAnimationCapabilityRequirement
} from "./animation-capability-plan.ts";
import { kpEquationAnimationCapabilityPlan } from
  "./equation-animation-capability-plan.ts";

type CrossDomainCapabilityDraft = Omit<
  KpAnimationCapabilityPlanEntry,
  "order"
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

const crossDomainCapabilityDrafts = Object.freeze([
  capability(
    "capability.matrix.vector-composition",
    "matrix",
    "Matrix-vector composition",
    "family.matrix.vector-composition.v1",
    "frontend.matrix.semantic-composition.v1",
    [
      requirement("requirement.matrix.vector-composition.operation", "semantic-operation", "kp.semantic-motion.matrix-vector", "Matrix rows, vector components, contribution products, and result coordinates retain typed roles."),
      requirement("requirement.matrix.vector-composition.recipe", "canonical-recipe", "recipe.matrix.vector-composition.v1", "A matrix-owned recipe traverses rows and gathers products without equation-specific assumptions."),
      requirement("requirement.matrix.vector-composition.exemplar", "canonical-exemplar", "animation.generated.linear-algebra.matrix-vector.two-by-two", "The existing two-by-two animation is concrete evidence, not proof of arbitrary dimensions."),
      requirement("requirement.matrix.vector-composition.corpus", "generation-corpus", "corpus.matrix.vector-composition.v1", "Fixtures pressure rectangular dimensions, symbolic entries, sparse rows, and invalid shapes.")
    ]
  ),
  capability(
    "capability.matrix.matrix-composition",
    "matrix",
    "Matrix-matrix composition",
    "family.matrix.matrix-composition.v1",
    "frontend.matrix.semantic-composition.v1",
    [
      requirement("requirement.matrix.matrix-composition.operation", "semantic-operation", "operation.matrix.matrix-composition.v1", "A matrix-owned operation identifies row-column dot products and result cells."),
      requirement("requirement.matrix.matrix-composition.recipe", "canonical-recipe", "recipe.matrix.matrix-composition.v1", "A canonical matrix recipe owns cell order, intermediate products, and accumulation."),
      requirement("requirement.matrix.matrix-composition.exemplar", "canonical-exemplar", "animation.generated.linear-algebra.matrix-matrix.two-by-two", "The existing two-by-two product is exemplar evidence rather than a general authoring entrance."),
      requirement("requirement.matrix.matrix-composition.corpus", "generation-corpus", "corpus.matrix.matrix-composition.v1", "Fixtures pressure compatible and incompatible dimensions, symbolic entries, and traversal order.")
    ]
  ),
  capability(
    "capability.matrix.linear-map-geometry",
    "matrix",
    "Matrix and linear-map geometry",
    "family.matrix.linear-map-geometry.v1",
    "frontend.matrix.linear-map.v1",
    [
      requirement("requirement.matrix.linear-map.operation", "semantic-operation", "operation.matrix.apply-linear-map.v1", "A matrix-owned operation relates the symbolic matrix to basis images and geometric vectors."),
      requirement("requirement.matrix.linear-map.recipe", "canonical-recipe", "recipe.matrix.linear-map-geometry.v1", "A canonical recipe preserves identity across symbolic and geometric representations."),
      requirement("requirement.matrix.linear-map.exemplar", "canonical-exemplar", "animation.graph.vector.linear-map-scale", "The current vector-scale animation supplies bounded representation evidence."),
      requirement("requirement.matrix.linear-map.corpus", "generation-corpus", "corpus.matrix.linear-map-geometry.v1", "Fixtures cover scale, rotate, shear, projection, rank loss, and basis changes.")
    ]
  ),
  capability(
    "capability.code.typescript-refactoring",
    "code",
    "TypeScript refactoring",
    "family.code.typescript-refactoring.v1",
    "frontend.code.typescript-compiler.v1",
    [
      requirement("requirement.code.typescript-refactoring.operation", "semantic-operation", "operation.code.extract-typescript-helper.v1", "The TypeScript frontend owns syntax, bindings, source ranges, and refactor legality."),
      requirement("requirement.code.typescript-refactoring.recipe", "canonical-recipe", "recipe.code.extract-helper.v1", "A code recipe moves stable semantic entities rather than raw colored glyphs."),
      requirement("requirement.code.typescript-refactoring.exemplar", "canonical-exemplar", "animation.programming.typescript-free-shipping-refactor", "The approved free-shipping refactor is one concrete language caller."),
      requirement("requirement.code.typescript-refactoring.corpus", "generation-corpus", "corpus.code.typescript-refactoring.v1", "Fixtures pressure renaming, extraction, duplicated expressions, types, and compiler rejection.")
    ]
  ),
  capability(
    "capability.code.python-refactoring",
    "code",
    "Python refactoring",
    "family.code.python-refactoring.v1",
    "frontend.code.python-ast.v1",
    [
      requirement("requirement.code.python-refactoring.operation", "semantic-operation", "operation.code.extract-python-helper.v1", "The Python frontend owns syntax nodes, bindings, source ranges, and refactor legality."),
      requirement("requirement.code.python-refactoring.recipe", "canonical-recipe", "recipe.code.extract-helper.v1", "The shared causal recipe may be reused only after Python supplies authoritative entities and correspondence."),
      requirement("requirement.code.python-refactoring.exemplar", "canonical-exemplar", "animation.programming.python-free-shipping-refactor", "The Python free-shipping refactor is a separate language pressure caller."),
      requirement("requirement.code.python-refactoring.corpus", "generation-corpus", "corpus.code.python-refactoring.v1", "Fixtures pressure indentation, scopes, expressions, annotations, and invalid extraction.")
    ]
  ),
  capability(
    "capability.code.scheme-structural-evaluation",
    "code",
    "Scheme structural evaluation",
    "family.code.scheme-structural-evaluation.v1",
    "frontend.code.scheme-reader-evaluator.v1",
    [
      requirement("requirement.code.scheme-evaluation.operation", "semantic-operation", "operation.code.scheme-evaluation.v1", "The Scheme frontend owns s-expression structure, bindings, evaluator evidence, and pedagogical step selection."),
      requirement("requirement.code.scheme-evaluation.recipe", "canonical-recipe", "recipe.code.scheme-structural-evaluation.v1", "A Scheme recipe composes bloom/fold, binding, branch, primitive, and return motifs."),
      requirement("requirement.code.scheme-evaluation.exemplar", "canonical-exemplar", "animation.programming.scheme-factorial", "The factorial evaluation proves one interpreter-backed semantic sequence."),
      requirement("requirement.code.scheme-evaluation.corpus", "generation-corpus", "corpus.code.scheme-structural-evaluation.v1", "Fixtures pressure nested calls, lexical scope, recursion, predicates, values, and selected pedagogical traces.")
    ]
  ),
  capability(
    "capability.graph-2d.function-transformations",
    "graph-2d",
    "Graph2D function transformations",
    "family.graph-2d.function-transformation.v1",
    "frontend.graph-2d.function-model.v1",
    [
      requirement("requirement.graph-2d.function.operation", "semantic-operation", "operation.graph-2d.transform-function.v1", "A Graph2D frontend owns function parameters, curve identity, salient points, and coordinate semantics."),
      requirement("requirement.graph-2d.function.recipe", "canonical-recipe", "recipe.graph-2d.function-transformation.v1", "A graph recipe interpolates semantic curve states without resizing typography or inventing algebra."),
      requirement("requirement.graph-2d.function.exemplar", "canonical-exemplar", "exemplar.graph-2d.function-transformation.v1", "One reviewed translation/reflection/stretch exemplar must establish the family grammar."),
      requirement("requirement.graph-2d.function.corpus", "generation-corpus", "corpus.graph-2d.function-transformation.v1", "Fixtures cover translation, reflection, stretch, compression, domain, and discontinuity.")
    ]
  ),
  capability(
    "capability.graph-2d.model-transformations",
    "graph-2d",
    "Graph2D model transformations",
    "family.graph-2d.model-transformation.v1",
    "frontend.graph-2d.semantic-scene.v1",
    [
      requirement("requirement.graph-2d.model.operation", "semantic-operation", "operation.graph-2d.transform-model.v1", "A model frontend owns curve meaning, parameters, intersections, and domain-specific validity."),
      requirement("requirement.graph-2d.model.recipe", "canonical-recipe", "recipe.graph-2d.model-transformation.v1", "A Graph2D recipe preserves scene identity while caller-owned model semantics change."),
      requirement("requirement.graph-2d.model.exemplar", "canonical-exemplar", "animation.economics.supply-demand-equilibrium-shift", "The economics shift is one domain caller, not a universal graph operation."),
      requirement("requirement.graph-2d.model.corpus", "generation-corpus", "corpus.graph-2d.model-transformation.v1", "Fixtures pressure curve shifts, intersections, tangencies, parameter sweeps, and invalid models.")
    ]
  ),
  capability(
    "capability.graph-3d.scene-transformations",
    "graph-3d",
    "Graph3D scene transformations",
    "family.graph-3d.scene-transformation.v1",
    "frontend.graph-3d.semantic-scene.v1",
    [
      requirement("requirement.graph-3d.scene.operation", "semantic-operation", "operation.graph-3d.transform-scene.v1", "A Graph3D frontend owns surfaces, curves, camera semantics, topology, and transformation validity."),
      requirement("requirement.graph-3d.scene.recipe", "canonical-recipe", "recipe.graph-3d.scene-transformation.v1", "A Graph3D recipe samples one semantic scene transition while respecting resource leases."),
      requirement("requirement.graph-3d.scene.renderer", "renderer-capability", "renderer-capability.graph-3d.lazy-webgl-with-svg-fallback.v1", "Rendering remains lazy, bounded by the context lease pool, and paired with semantic SVG fallback."),
      requirement("requirement.graph-3d.scene.exemplar", "canonical-exemplar", "animation.graph.surface-mode.mesh-to-donut", "The internal mesh-to-donut animation is bounded host evidence, not general generation support."),
      requirement("requirement.graph-3d.scene.corpus", "generation-corpus", "corpus.graph-3d.scene-transformation.v1", "Fixtures pressure surfaces, curves, topology, camera, context loss, fallback parity, seek, and rewind.")
    ]
  )
] as const satisfies readonly CrossDomainCapabilityDraft[]);

export const kpAnimationCapabilityPlan = defineKpAnimationCapabilityPlan({
  schemaVersion: KP_ANIMATION_CAPABILITY_PLAN_SCHEMA,
  kind: "animation-capability-plan",
  id: "plan.kp.animation-capabilities.v1",
  title: "Kinetic Press animation capabilities",
  entries: [
    ...kpEquationAnimationCapabilityPlan.entries,
    ...crossDomainCapabilityDrafts.map((entry, index) => ({
      ...entry,
      order: kpEquationAnimationCapabilityPlan.entries.length + index + 1
    }))
  ]
});

function capability(
  id: string,
  domain: Exclude<KpAnimationCapabilityDomain, "equation">,
  title: string,
  authorityId: string,
  frontendAuthorityId: string,
  requirements: readonly RequirementDraft[]
): CrossDomainCapabilityDraft {
  return Object.freeze({
    id,
    domain,
    title,
    scope: Object.freeze({ kind: "transformation-family" as const, authorityId }),
    requirements: Object.freeze([
      requirement(
        `requirement.${domain}.domain-frontend.${id.split(".").at(-1)}`,
        "domain-frontend",
        frontendAuthorityId,
        `${title} must be normalized and verified by its domain-owned frontend.`
      ),
      ...requirements
    ])
  });
}
