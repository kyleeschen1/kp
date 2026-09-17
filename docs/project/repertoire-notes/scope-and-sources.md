# Curriculum scope and source cross-check

Reviewed 2026-09-16. This is a practical undergraduate working repertoire, not a
degree specification, lesson sequence, exam standard, or proof of exhaustive
coverage. The rows and small examples are original task decompositions; the
references below are scope checks, not copied lessons or exercise banks.

## Inclusion and depth

Include a move when an author might reasonably need to explain it independently:
an algebraic rewrite, a model assumption, an inference, a representation change,
a comparison, an algorithmic step, or a check of validity. Split direction and
structural cases when they change reasoning or visual ownership. Do not list
every numerical substitution, Cartesian product of syntax shapes, or entire
chapter as one implemented capability.

Algebra is deepest: signed arithmetic through fractions, powers, radicals,
polynomials, equations, inequalities, systems, functions, logarithms, trigonometry,
complex numbers, coordinates and sequences. Applied mathematics includes calculus,
linear algebra, probability/statistics, ODEs, optimization and numerical methods;
introductory PDE/Fourier ideas are boundary topics, not a full specialist course.
Economics covers introductory micro/macro with useful intermediate reasoning and
basic empirical interpretation. Mechanics extends Newtonian topics into an
introductory analytical-mechanics bridge. Programming covers major reasoning and
transformation patterns, not every language, framework or API.

Excluded from this pass: graduate measure theory, abstract algebra, rigorous
functional analysis, advanced PDE theory, stochastic calculus, advanced causal
identification, graduate equilibrium theory, relativity/quantum mechanics,
specialist continuum mechanics, full compiler construction and distributed-systems
curricula. Discrete probability/counting are included; a complete discrete-math
curriculum is not. Geometry supports practical coordinate/trigonometric reasoning,
not a complete synthetic-geometry course. These exclusions are visible scope
boundaries and candidates for future expansion, not claims of low importance.

## Curriculum references

| Inventory area | Cross-check source | Use in this pass |
| --- | --- | --- |
| Algebra | [OpenStax Algebra and Trigonometry 2e, scope](https://openstax.org/books/algebra-and-trigonometry-2e/pages/preface) | Check foundations, functions, equations, trigonometry, systems, coordinates and sequences; split the operations more finely than chapter headings. |
| Single-variable calculus | [OpenStax Calculus 1](https://openstax.org/books/calculus-volume-1/pages/preface), [Calculus 2](https://openstax.org/books/calculus-volume-2/pages/preface) | Check limits, differentiation, integration, applications, sequences and series. |
| Multivariable calculus | [OpenStax Calculus 3](https://openstax.org/books/calculus-volume-3/pages/preface) | Check vector functions, partial derivatives, multiple integrals and vector calculus. |
| Linear algebra | [MIT 18.06 syllabus](https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/pages/syllabus/) | Check systems, subspaces, projection, orthogonality, determinants and eigen-analysis. |
| Differential equations | [MIT 18.03 syllabus](https://ocw.mit.edu/courses/18-03-differential-equations-spring-2010/pages/syllabus/) | Check first-order equations, linear higher-order equations, forcing, transforms and systems. |
| Numerical methods | [MIT 18.330 syllabus](https://ocw.mit.edu/courses/18-330-introduction-to-numerical-analysis-spring-2004/pages/syllabus/) | Check approximation, nonlinear solving, integration, linear algebra and differential-equation computation. |
| Optimization | [Boyd and Vandenberghe, Convex Optimization](https://web.stanford.edu/~boyd/cvxbook/) | Cross-check convexity, constraints, duality and algorithmic descent; only introductory practical moves are included. |
| Probability | [MIT 6.041SC syllabus](https://ocw.mit.edu/courses/6-041sc-probabilistic-systems-analysis-and-applied-probability-fall-2013/pages/syllabus/) | Check conditioning, random variables, expectations, limit behavior and inference. |
| Statistics | [OpenStax Introductory Statistics 2e](https://openstax.org/books/introductory-statistics-2e/pages/preface) | Check sampling, descriptive statistics, intervals, tests and regression. |
| Economics | [OpenStax Principles of Economics 3e, scope](https://openstax.org/books/principles-economics-3e/pages/preface) | Cross-check micro/macro breadth, policy, money, growth and international economics. |
| Economic interpretation | [CORE teaching guide](https://www.core-econ.org/te2-0-micro-and-macro-guide/), [Doing Economics](https://www.core-econ.org/project/doing-economics/) | Cross-check incentives, institutions, distribution, evidence and data interpretation so the inventory is not only curve manipulation. |
| Newtonian mechanics | [OpenStax University Physics 1](https://openstax.org/books/university-physics-volume-1/pages/preface) | Check measurement, vectors, motion, forces, energy, momentum, rotation, gravitation, oscillation and waves. |
| Analytical mechanics bridge | [MIT 8.09 syllabus](https://ocw.mit.edu/courses/8-09-classical-mechanics-iii-fall-2014/pages/syllabus/) | Check variational, Lagrangian and Hamiltonian boundaries; do not imply complete advanced-course coverage. |
| Programming | [Composing Programs v2 contents](https://composingprograms.com/pages/), [MIT 6.006 syllabus](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/pages/syllabus/) | Check evaluation, abstraction, state, recursion, data organization and algorithmic reasoning. Refactoring and lifecycle moves additionally reflect actual KP authoring needs. The archived v2 outline is a scope reference, not a claim about the latest edition. |

References justify scope, not support checkmarks. There is no single canonical
“practical math curriculum”; the selection above is a reviewable synthesis.

## Coverage semantics

Each granular row has a stable ID, a bounded capability, an example/observable
case, and an audit note. Checkbox status is not inferred from a filename match.

- Checked: an inspected implementation reaches its stated semantic and
  presentation path. The evidence names its bounded caller. This does not imply
  general source authoring, approved aesthetics, supported-browser certification,
  or arbitrary composition with other moves.
- Unchecked, `unaudited`: support for this scope has not been investigated enough.
- Unchecked, `partial`: related semantics, a narrower implementation, or some
  presentation machinery exists; the row's full path is not established.
- Unchecked, `gap`: a named responsible boundary or explicit rejection establishes
  the missing capability. A search with no hits alone does not establish a gap.

Existing historical checks are reviewed against this stricter meaning. A check
may be narrowed or withdrawn with an audit explanation, without deleting the
underlying implementation. The audit is source inspection unless the evidence
explicitly records an executed command; do not describe all evidence tests as
rerun simply because their files were read.

An example illustrates the intended scope, not a certified fixture. Preserve
domain restrictions and distinguish equivalence, one-way implication, numerical
approximation and interpretation. A reverse playback is not automatically an
authored inverse reasoning operation. Cross-topic references are reuse pointers,
not prerequisite scheduling or proof that a complete lesson composes.
