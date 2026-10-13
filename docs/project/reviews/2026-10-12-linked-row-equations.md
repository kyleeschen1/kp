# Linked equations in the row workbench

Status: bounded experiment complete. User feedback: “this is fine, although I
don't see using this animation. proceed”. Accept technical adequacy, not product
adoption or a reusable presentation standard. Do not invest further in this
panel's appearance or promote it without a concrete explanatory use.

Outcome: make each matrix row readable as a complete equation, with selection
working in either representation. Both views derive from the same checked
current system; equality and independent RHS values remain explicit.

Canonical source is the accepted RowWorkbenchSource; host is the existing
rectangular-product `?view=row-operation` route; native KaTeX/SVG remains the
renderer. Linear-system row-operation checking and the transactional session
remain semantic authority. Reuse cross-view correspondence and reader semantic
focus owners; do not create a global state store, second solver or clock.

Two packages: exact equation/correspondence projection with focused tests; then
one compact same-host panel with bidirectional row selection and lifecycle
checks. Keep the matrix motion and geometry, authored examples, guided path,
manual operations and history intact. Rollback unit is the local equation
projection/panel adapter and its host hooks, not the mathematical authority.

The panel shows the committed system during previews and labels that status;
it updates atomically with commit, cancel, reset and Undo/Redo. Do not invent a
new equation morph or expose partly evaluated constraints as settled truth.
Selection refers to a row position in the current system, with correspondence
rebuilt from its current semantic entities. Include coefficient and unknown
references even when conventional equation notation omits zero/unit coefficients.

Acceptance: select either row from matrix or equation; both identify the same
constraint without changing layout. Negative/fractional coefficients, all-zero
rows, contradiction and row swaps read correctly. Equations remain accessible
and useful as static readings. Pending-operation labels prevent stale-state
confusion. Preserve native equation order b = Ax. Keyboard, cancellation,
reverse, reset, reduced motion and themes must not leave stale selections.

Checks: `npm run test:row-operation`, scoped `npm run visual:row-operation`, full
typecheck at integration, production build/cost gates and Theseus validation.
Small exemplar smoke first; do not create a broad aesthetic certification matrix.
Record measured cost and any justified bounded budget amendment. Commit checked
implementation and evidence and push before the review stop.

Stop at one human review of clarity and compactness before shared promotion.
No arbitrary shapes, solver, coefficient-level interaction, new choreography,
catalogue migration, or learner-outcome claim. Linked equations were approved;
all further expansion remains separate scope. No minimum duration: reserve time
for checks, documentation and backup once the candidate is reviewable.

## Candidate evidence and review

Implemented in `row-equations.ts` (pure exact projection and existing cross-view
attention compilation) and `row-equation-panel.ts` (local adapter using existing
reader semantic focus). The workbench source schema, session, math checker and
fusion sampler are unchanged. Matrix view changes add numbered row controls
outside its decorative accessibility subtree; its token geometry is unchanged.
The panel uses a shared scene selection, expressed as outlines in both views;
there is no new dimming, token motion or timing policy.

13 focused tests and 11 scoped Chromium tests pass. Evidence covers signed
fractional notation, zero/unit coefficient references, independent RHS, distinct
identities for equal zeros, permutation bindings, pointer/keyboard selection,
paint-only geometry preservation, cancel, direct reverse scrubbing, Undo/Redo,
reset, reduced motion, light narrow reading, static MathML and the guided path.
Full TypeScript/Svelte checks and production build pass. Existing source-only
variation runs through the same player, including the equation panel.

The semantic-cost gate initially failed the nearly full all-mode union ceiling;
module inventory showed local feature growth, with no unrelated import fanout.
The [bounded amendment](../decisions/2026-10-12-linked-equation-cost-boundary.md)
records +1848 JS / +239 CSS gzip and the explicit union-only policy change.
The complete cost gate then passed. Workbench, cold route and all other existing
activation ceilings remain unchanged. Static script-free exports succeed through
`npm run author:row-readings`; equations are included at every checked endpoint.

Review on the existing host, preferably `?view=row-operation&example=inconsistent`:
select either numbered row or equation; run the next step; confirm the unchanged
committed reference is clearly labeled during preview, then inspect `1 = 0`.
Undo and Redo should update both representations. Judge compactness, the outline
association and the usefulness of retaining a reference equation during motion.
The subsequent qualified acceptance closes this checkpoint; it does not establish
that the user wants this layout in explanations or justify shared promotion.

The generic impact selector had no focused rule for the local workbench and
suggested repository-wide tests/build. The approved discovery contract instead
uses the declared scoped semantic/browser checks, full types and complete
production closures; it does not claim the entire repository test suite ran.
