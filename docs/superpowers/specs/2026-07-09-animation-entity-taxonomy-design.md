# Animation Entity Taxonomy Design

## Purpose

This document is a candidate catalog for the entities Kinetic Press should
learn to represent, render, and animate. It extends the existing object,
transformation, selector, render-node, and timeline protocol designs with a
working vocabulary for math, graphs, diagrams, and programming.

The goal is not to implement every item at once. The goal is to name the
objects and motion families clearly enough that we can promote them into
dashboard gallery cards, semantic object definitions, and tested animation
fixtures over time.

## Naming Model

Use `SemanticTransformation`, not `SemanticMapping`, for the category-level
term. It fits the category-theory intuition better: transformations are
structure-aware morphisms from source semantic objects to target semantic
objects, carrying correspondence data about what identity was preserved.

Use a separate lower layer for presentation-level motion:

```text
SemanticObject
  stable structured value with selectors and capabilities

SemanticTransformation
  semantic operation from source objects to target objects

CorrespondenceMap
  selector-to-selector relation produced by a transformation

View
  semantic lens plus render-mode choices for an object or transformation

MotionPrimitive
  reusable visual behavior such as vanish, reveal, wrap, focus, or morph

VisualMotif
  composed presentation style built from motion primitives
```

Examples:

- `cancelAdditiveInverse` is a `SemanticTransformation`.
- `cancelled-by` is a correspondence relation.
- `vanishAtMidpoint` is a `MotionPrimitive`.
- "tokens meet, shrink to 35%, rapidly fade, then survivors shift" is a
  `VisualMotif`.

## Semantic Objects

### Core Math

- `Expression`: tree of constants, variables, operators, functions, grouped
  terms, and annotations.
- `Equation`: left/right expressions, equality relation, domain assumptions,
  and solution metadata.
- `Inequality`: relation, domain, boundary behavior, and solution set.
- `Function`: name, arguments, expression/body, domain, codomain, parameters.
- `Variable`: symbol, binding scope, assumptions, units, display aliases.
- `Constant`: exact value, approximate value, unit, named identity.
- `Set`: roster, builder, interval, finite/infinite, membership predicate.
- `Interval`: open/closed endpoints, union/intersection support.
- `Sequence`: index variable, term expression, recurrence metadata.
- `Series`: summand, convergence metadata, partial sum view.
- `PiecewiseFunction`: branch conditions and branch expressions.

### Algebra And Trigonometry

- `Polynomial`: coefficients, degree, roots, factorization.
- `RationalExpression`: numerator, denominator, excluded domain.
- `PowerExpression`: base, exponent, branch/real-domain assumptions.
- `RadicalExpression`: radicand, index, simplification metadata.
- `LogExpression`: base, argument, domain restrictions.
- `TrigExpression`: function kind, argument, period, phase, amplitude.
- `ComplexNumber`: rectangular and polar forms.
- `RootSet`: exact roots, approximate roots, multiplicity.

### Linear Algebra

- `Scalar`: field-aware scalar value.
- `Vector`: components, coordinate system, basis, geometric anchor.
- `Point`: coordinate tuple with ambient space.
- `Matrix`: rows, columns, entries, shape, field, labels.
- `Tensor`: dimensions, index roles, contraction metadata.
- `LinearMap`: domain, codomain, matrix representation, basis metadata.
- `Basis`: ordered vectors and coordinate conversion rules.
- `Subspace`: span, basis, constraints, dimension.
- `LinearSystem`: equations, unknowns, augmented matrix, solution set.
- `Determinant`: source matrix, expansion strategy, orientation meaning.
- `EigenSystem`: eigenvalues, eigenspaces, multiplicities.
- `SingularValueDecomposition`: factors, singular values, approximation rank.
- `Projection`: source vector/subspace, target subspace, residual.
- `GramSchmidtProcess`: input vectors, orthogonalized vectors, normalized basis.

### Multivariable Calculus

Interpret "MVC" here as multivariable calculus.

- `ParametricCurve`: parameter, vector-valued expression, domain.
- `ParametricSurface`: parameters, vector-valued expression, domain patch.
- `ScalarField`: function from space to scalar values.
- `VectorField`: function from space to vectors.
- `Gradient`: source scalar field, vector field output, evaluation point.
- `Jacobian`: source vector-valued function, variables, matrix of partials.
- `Hessian`: source scalar function, variables, second-derivative matrix.
- `TangentLine`: curve and parameter point.
- `TangentPlane`: surface or graph plus evaluation point.
- `NormalVector`: source surface/level set and point.
- `LevelSet`: scalar field and value.
- `DirectionalDerivative`: scalar field, point, direction vector.
- `Differential`: local linear map around a point.
- `IntegralRegion`: bounds, orientation, coordinate chart.
- `FlowLine`: vector field, initial condition, time interval.
- `CriticalPoint`: function, point, classification evidence.

### Graphs, Geometry, And Diagrams

- `Graph2D`: axes, curves, regions, points, labels.
- `Graph3D`: axes, surfaces, curves, camera, lighting, render modes.
- `Axis`: dimension, scale, ticks, label, domain.
- `Curve`: sampled and exact representations.
- `Surface`: sampled mesh, exact expression, parameterization.
- `Region`: inequality-bounded 2D or 3D set.
- `CoordinateSystem`: basis vectors, origin, units, orientation.
- `GeometricConstruction`: points, lines, circles, constraints.
- `NetworkGraph`: nodes, edges, directedness, weights, layout hints.
- `CommutativeDiagram`: objects, morphisms, layout, commutativity claims.
- `CategoryTheoryObject`: named object in a category.
- `CategoryTheoryMorphism`: source, target, label, composition identity.
- `ProofGraph`: propositions and dependency edges.

### Data And Probability

- `Table`: rows, columns, cells, schema, computed columns.
- `Dataset`: records, schema, provenance, filters.
- `Distribution`: parameters, support, density/mass, moments.
- `RandomVariable`: distribution, transforms, expectation metadata.
- `Sample`: observed values and statistics.
- `Statistic`: estimator, sample relation, uncertainty.
- `Plot`: chart grammar object, scales, marks, encodings.

### Programming

- `SourceFile`: text, language, parse anchors, diagnostics.
- `Module`: files, exports, imports, dependencies.
- `FunctionDefinition`: signature, body, parameters, return type.
- `VariableBinding`: declaration, references, scope, lifetime.
- `ExpressionNode`: AST expression with source span.
- `StatementNode`: AST statement with source span.
- `Type`: language-specific or language-neutral type representation.
- `Diagnostic`: compiler/linter/test message, severity, source span.
- `ExecutionTrace`: ordered frames, events, stdout/stderr, time.
- `StackFrame`: function, locals, instruction pointer.
- `HeapGraph`: allocations, references, ownership or lifetime metadata.
- `TestCase`: inputs, expectations, result trace.
- `RefactorPlan`: source selectors, target selectors, operations.

## Semantic Transformations

### Algebraic Transformations

- `addBothSides(value)`
- `subtractBothSides(value)`
- `multiplyBothSides(value)`
- `divideBothSides(value)`
- `moveTermAcrossEquals(term, inverse)`
- `combineLikeTerms(selection)`
- `distribute(factor, overSum)`
- `factorCommonTerm(selection)`
- `expandProduct(selection)`
- `completeSquare(quadratic)`
- `applyIdentity(identityName, selection)`
- `substitute(variable, expression)`
- `evaluateConstantExpression(selection)`
- `cancelAdditiveInverse(selection)`
- `cancelMultiplicativeInverse(selection)`
- `wrapWithParentheses(selection)`
- `unwrapParentheses(selection)`
- `raiseBothSides(power)`
- `takeRootBothSides(root)`
- `applyLogBothSides(base)`
- `applyExpBothSides(base)`

### Geometry-Aware Text Transformations

- `makeFraction(numerator, denominator)`
- `splitFraction(fraction)`
- `combineFractions(commonDenominator)`
- `rationalizeDenominator(radical)`
- `moveToExponent(selection)`
- `lowerFromExponent(selection)`
- `moveToSubscript(selection)`
- `unwrapRadical(radical)`
- `introduceRadical(index, radicand)`
- `changeLogBase(logExpression)`
- `applyTrigIdentity(identityName)`
- `foldFunctionCall(functionName, argument)`
- `unfoldFunctionCall(selection)`

### Calculus Transformations

- `differentiate(expression, variable)`
- `differentiateBothSides(variable)`
- `integrate(expression, variable)`
- `applyChainRule(selection)`
- `applyProductRule(selection)`
- `applyQuotientRule(selection)`
- `computeGradient(scalarField)`
- `computeJacobian(vectorFunction)`
- `computeHessian(scalarFunction)`
- `linearizeAt(point)`
- `findCriticalPoints(function)`
- `classifyCriticalPoint(point)`
- `changeCoordinates(chart)`
- `parameterizeCurve(curve)`
- `parameterizeSurface(surface)`

### Linear Algebra Transformations

- `rowSwap(rowA, rowB)`
- `rowScale(row, scalar)`
- `rowReplace(targetRow, sourceRow, scalar)`
- `columnSwap(columnA, columnB)`
- `matrixMultiply(left, right)`
- `dotProduct(vectorA, vectorB)`
- `crossProduct(vectorA, vectorB)`
- `transpose(matrix)`
- `invertMatrix(matrix)`
- `computeDeterminant(matrix)`
- `diagonalize(matrix)`
- `changeBasis(vectorOrMap, basis)`
- `projectVector(vector, subspace)`
- `orthogonalize(vectors)`
- `solveLinearSystem(system)`
- `computeEigenSystem(matrix)`

### Graph And Visual Transformations

- `plotExpression(expression, axes)`
- `sampleCurve(curve, resolution)`
- `sampleSurface(surface, resolution)`
- `morphSurfaceMode(sourceMode, targetMode)`
- `rotateCamera(camera, targetPose)`
- `project3DTo2D(graph)`
- `sliceSurface(surface, plane)`
- `tracePointAlongCurve(point, curve)`
- `sweepVectorField(field, seedPoints)`
- `showLevelSet(field, value)`
- `showTangentPlane(surface, point)`
- `showJacobianLinearMap(function, point)`
- `showHessianQuadraticApproximation(function, point)`

### Programming Transformations

- `renameVariable(binding, newName)`
- `extractFunction(selection, name)`
- `inlineFunction(callSite)`
- `inlineTemporary(binding)`
- `introduceVariable(expression, name)`
- `moveStatement(selection, destination)`
- `wrapInCondition(selection, condition)`
- `unwrapBlock(block)`
- `fixDiagnostic(diagnostic, operation)`
- `addTestCase(behavior)`
- `stepExecution(trace, fromFrame, toFrame)`
- `expandMacro(callSite)`
- `desugarSyntax(selection)`

## Correspondence Relations

The current relation list should expand around identity preservation:

- `same`: selector persists unchanged.
- `introduced`: target selector is new.
- `removed`: source selector exits.
- `derived-from`: target selector is computed from source selector.
- `simplified-to`: source expression becomes a simpler target expression.
- `expanded-to`: compact source becomes multiple target selectors.
- `factored-to`: multiple source selectors become a structured factor target.
- `cancelled-by`: two or more selectors jointly remove each other.
- `inverted-to`: operation introduces an inverse relation.
- `wrapped`: source selector persists inside a new wrapper.
- `unwrapped`: wrapper exits while child selector persists.
- `reordered`: selector persists but index/order changes.
- `renamed`: selector identity persists under a new label.
- `projected-to`: higher-dimensional selector appears in lower-dimensional view.
- `sampled-as`: exact object becomes sampled visual geometry.
- `approximated-by`: target is approximation of source.
- `focuses`: visual state changes while semantic structure is preserved.
- `annotates`: added object describes or points to another selector.
- `executes-to`: code selector produces runtime state.
- `diagnoses`: diagnostic selector explains another selector.

## Views And Lenses

Each object type should define selectors first, then views on top.

### Shared View Modes

- `symbol`: compact inline expression or variable name.
- `latex`: display math render plan.
- `katex`: DOM-backed measured math render.
- `graph2d`: axes, points, curves, regions.
- `graph3d`: WebGL or SVG 3D surface/curve render.
- `table`: row/column/cell render.
- `matrix-grid`: matrix entries as selectable cells.
- `diagram`: node-edge or category-style layout.
- `code`: syntax-highlighted source ranges.
- `ast`: tree view of program structure.
- `trace`: execution timeline or stack/heap state.
- `inspector`: properties, capabilities, selectors, and metadata.
- `timeline`: transformation tracks and markers.
- `comparison`: before/after or source/target split.

### Lens Families

- `childLens`: structural children such as terms, factors, entries, rows.
- `roleLens`: sides, numerator, denominator, exponent, axis, domain.
- `metadataLens`: assumptions, units, validity, provenance.
- `computedLens`: determinant, inverse, derivative, eigenvectors, diagnostics.
- `viewLens`: current render mode, camera, style, focus state.
- `timeLens`: sampled frame, playhead, active transformation phase.
- `layoutLens`: row/column/stack membership and measured bounds.

## Motion Primitives And Visual Motifs

### Motion Primitives

- `persist`: same selector remains visible and may move or restyle.
- `enter`: new selector appears after layout has made room.
- `exit`: selector fades, shrinks, or moves out before layout closes.
- `shift`: existing selectors translate to new measured positions.
- `scale`: selector changes size without changing semantic structure.
- `fade`: opacity changes.
- `focus`: selector receives emphasis without changing semantic structure.
- `unfocus`: emphasis returns to normal.
- `vanish`: source selectors converge, shrink to a configured minimum, and fade.
- `reveal`: reverse of vanish for target selectors.
- `morph`: source visual geometry interpolates into target geometry.
- `wrap`: wrapper appears around persisted child selectors.
- `unwrap`: wrapper exits while children persist.
- `split`: one selector produces multiple visible selectors.
- `merge`: multiple selectors produce one visible selector.
- `trace`: marker moves along a curve, path, or execution sequence.
- `sweep`: region, surface, or field is revealed by a moving parameter.
- `project`: higher-dimensional geometry maps to a lower-dimensional view.
- `deproject`: lower-dimensional representation expands into a richer view.
- `occlude`: object passes behind or in front of another visual layer.

### Visual Motifs

- `cancelation`: inverse-related selectors meet, shrink to a minimum size, fade,
  then remaining selectors settle.
- `simplify-into`: source group vanishes while target group reveals from the
  same locus.
- `append-after-shift`: existing tokens shift first, then introduced tokens
  appear.
- `balance-scale`: same operation appears symmetrically on both sides of an
  equation.
- `move-across-equals`: visual metaphor for introducing the inverse term on the
  other side, backed by explicit operation semantics.
- `fraction-lift`: selected expression moves into numerator or denominator while
  a fraction bar and counterpart term appear.
- `exponent-pop`: selected expression moves into superscript geometry.
- `radical-wrap`: radical glyph grows around a persisted radicand.
- `matrix-row-operation`: source row highlights, target row updates cell by
  cell, and row identity is preserved.
- `dot-product-accumulate`: component pairs highlight, products appear, and
  partial sums accumulate.
- `linear-map-deform`: vectors, basis grid, and points move under a matrix.
- `jacobian-local-linearization`: nonlinear map freezes at a point and reveals
  the best local linear map.
- `hessian-quadratic-bowl`: scalar field near a critical point reveals its
  quadratic approximation and curvature directions.
- `vector-field-flow`: seed points trace flow lines with time.
- `code-rename`: all references preserve identity while their text labels
  update.
- `execution-step`: active source span, stack frame, locals, and heap edges move
  to the next trace state.

## Text And KaTeX Geometry Cases To Learn

These are high-value fixtures because their rendered geometry is not just a
flat row of tokens.

- Fractions: numerator, denominator, bar, nested fractions, common denominators,
  cancellation across numerator and denominator.
- Exponents: superscript baseline, tower powers, exponent wrapping/unwrapping.
- Subscripts: indexed variables, tensors, sums, sequences.
- Radicals: radical glyph, overbar, nested radicals, index roots.
- Logs and exponentials: function name persistence, base changes, inverse
  relation between `log` and `exp`.
- Trig functions: compact function-name tokens, identities, phase shifts,
  inverse trig notation.
- Large operators: sums, products, integrals, bounds moving above/below.
- Absolute value and norms: delimiters that act like wrappers.
- Parentheses and brackets: wrappers whose size depends on children.
- Matrices: large brackets, rows, columns, entries, augmented bars.
- Piecewise expressions: brace geometry, branch rows, condition columns.
- Vectors: column vectors, arrows over variables, bold symbols.
- Derivative notation: prime, Leibniz fractions, partial derivatives, gradients.
- Limits: approach annotation and expression body.
- Equality chains: multiple relation anchors and line breaks.
- Color/focus annotations: semantic emphasis layered over KaTeX.

## Graph And Vector Depictions To Learn

- 2D point, vector, arrowhead, label, and projection components.
- 2D curve sampling with tangent and normal overlays.
- Area under curve and signed area sweep.
- Region defined by inequalities.
- Coordinate transformation between bases.
- Basis grid deformation under a linear map.
- Vector addition as head-to-tail and component-wise views.
- Dot product as projection, component multiplication, and angle relation.
- Cross product as oriented area and normal vector.
- Matrix multiplication as composed linear maps and row-column dot products.
- Eigenvectors as directions preserved by a linear map.
- Determinant as signed area/volume scale.
- Row reduction as matrix grid plus solution-space graph.
- 3D surface mesh, shaded surface, contour projection, and slice plane.
- Tangent plane and normal vector at a surface point.
- Gradient as steepest-ascent arrow plus level-set normal.
- Jacobian as local grid deformation around a point.
- Hessian as curvature directions, quadratic patch, and critical-point test.
- Vector field arrows, streamline tracing, divergence and curl overlays.
- Parametric curve/surface point tracing over parameter time.
- 3D-to-2D projection with camera path and occlusion.
- Category theory diagram nodes and arrows with composition emphasis.
- Commutative square/triangle with path highlighting.

## Programming Depictions To Learn

- Source range focus and unfocus.
- Identifier rename across all references.
- AST tree expand/collapse linked to source spans.
- Desugaring from compact syntax to expanded form.
- Refactor before/after with preserved selectors.
- Execution step through source, stack, locals, heap, and output.
- Variable lifetime or ownership range.
- Type inference constraints as graph edges.
- Diagnostic-to-fix transformation.
- Test failure to passing result diff.
- Call graph expansion.
- Data-flow trace from input to output.

## Suggested Animation Fixture Backlog

### First Tier

- `x + 3 = 7`: subtract both sides, cancelation, simplify constant difference.
- `\frac{x}{3} = 4`: multiply both sides and remove denominator.
- `2(x + 3) = 10`: distribute, then simplify.
- `x^2 = 9`: take roots and introduce plus/minus branches.
- `\log(x) = 2`: apply exponential inverse.
- `\sin(x)^2 + \cos(x)^2 = 1`: apply trig identity.
- `A \vec{x} = \vec{b}`: matrix-vector multiply and solve view.
- `R2 <- R2 - 3R1`: row operation with cell-level provenance.
- Dot product of two 3D vectors: component products and accumulation.
- 3D saddle surface: morph surface modes through shared playhead.
- Static source file: register code spans and focus by selector.

### Second Tier

- Rational expression cancellation across numerator and denominator.
- Nested fraction simplification.
- Radical wrapping and unwrapping.
- Derivative by product rule.
- Chain rule with nested function identity.
- Matrix multiplication as many dot products composed in parallel and sequence.
- Determinant as area scale.
- Eigenvector/eigenvalue visual proof.
- Gradient and level set relation.
- Jacobian local linearization.
- Hessian critical-point classification.
- Vector field flow-line tracing.
- Rename variable in code.
- Extract function refactor.
- Execution trace with stack and locals.

### Third Tier

- Piecewise function transformation.
- Change of variables in an integral.
- SVD as rotation, scaling, and rotation.
- Gram-Schmidt process.
- Divergence and curl visual explanations.
- Category theory naturality square animation.
- Commutative diagram path equivalence.
- Type inference constraint solving.
- Ownership/lifetime transitions for Rust-style programming lessons.
- Test-driven coding trace from failing test to implementation.

## Dashboard Materialization

When this catalog moves into the project dashboard, use four card families:

- `semantic-object`: object definitions, selector inventory, capabilities,
  default views, and fixture examples.
- `semantic-transformation`: operation definitions, source/target contracts,
  correspondence relations, and validity checks.
- `animation`: visual motifs and motion primitives with scrubber test cases.
- `visual`: render surfaces such as KaTeX, graph, matrix grid, diagram, table,
  source code, stack/heap, and timeline.

Each card should expose:

- status: `planned`, `active`, `blocked`, or `done`;
- domains: math, linear algebra, multivariable calculus, graph, programming;
- selector examples;
- supported render modes;
- supported transformations;
- known blockers;
- fixture links;
- report-card evidence when implemented or reviewed.

## Near-Term Recommendation

The next durable implementation step should be a small registry-backed catalog
slice rather than more one-off demo code:

1. Add typed catalog data for `SemanticObject`, `SemanticTransformation`,
   `MotionPrimitive`, `VisualMotif`, and `Visual`.
2. Seed it with the first-tier objects and motifs from this document.
3. Render it in the project dashboard gallery with search and status.
4. Connect the existing equation cancelation and final simplify controls as
   live fixture previews.
5. Pick one graph fixture and one programming fixture to prove the taxonomy is
   not equation-specific.

## Open Questions

1. Should `MotionPrimitive` and `VisualMotif` be first-class object records, or
   typed registry entries referenced by transformations?
2. Should graph, diagram, and code views share one layout protocol immediately,
   or should each backend register its own layout adapters first?
3. How granular should KaTeX selectors be for hard geometry: individual visual
   glyphs, semantic groups, or both?
4. Should the dashboard catalog be edited through typed source data in V1, or
   moved directly to structured JSON once this taxonomy stabilizes?
