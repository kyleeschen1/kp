# Rule Application Visual Grammar

Status: accepted for exemplar discovery
Accepted: 2026-08-25
Active thread: `../threads/animation-catalogue.md`

## Decision

Treat application of a verified rule as a semantic sequence rather than as a
power-rule-specific animation:

```text
match -> bind -> instantiate -> rewrite -> reduce
```

These are pedagogical states, not renderer keyframes:

| Beat | Semantic event |
| --- | --- |
| Match | A subject is shown to satisfy the fixed structure and slots of a verified pattern. |
| Bind | Metavariables acquire values in an explicit environment such as `n -> 2`; this is not ordinary equality. |
| Instantiate | Every occurrence of a bound metavariable is propagated into the rule's replacement template before computation. |
| Rewrite | The instantiated replacement becomes the live expression through one exclusive paint-ownership handoff. |
| Reduce | Any remaining arithmetic delegates to its already selected evaluation motif; it is not part of rule instantiation. |

The semantic unit is therefore **Rule Application**, while a power rule, trig
identity, algebraic law, program rewrite, or proof rule supplies one verified
pattern and replacement template. Fixed structure, metavariable slots,
bindings, constraints, the prospective replacement, and the committed result
remain distinct entities or relations. A binding may propagate to several
paint occurrences without claiming that one glyph was cloned.

## Visual Invariants

- Keep the current subject stationary through match and bind.
- Do not paint fixed structure twice merely to prove that it matched.
- Make binding visible as acquisition and propagation, not as a color-only
  coincidence or an equality claim.
- Instantiate the replacement before evaluating it.
- Give prospective and live expressions distinct trace roles while preserving
  mathematical identity.
- Give every mathematical paint occurrence one owner. Structural rules such
  as fraction bars are introduced exactly once.
- Let the renderer choose how to depict slots. Boxes, outlines, colors, and
  callouts are presentation choices, not semantic truth.
- Delegate reduction to the compiler-selected evaluation family. For the
  integration exemplar, both `2 + 1 -> 3` reductions remain certified ink
  knots.

## Canonical Exemplar

Apply the candidate grammar only to
`animation.generated.calculus.integral.power-rule-quadratic` at the existing
Catalogue human checkpoint:

```text
integral x^2 dx
-> x^(2+1)/(2+1) + C
-> x^3/3 + C
```

The canonical artifact is the governed generated integration asset, the host
is the Catalogue equation session, the renderer is Native KaTeX, and the
verified three-state trace remains semantic authority.

For this exemplar, operator scope receives salience and the operator withdraws
without a distinct motion. The remaining `x^2` stays fixed while small
renderer-owned `u` and `n` callouts project the pattern onto its actual base
and exponent. The binding `u -> x, n -> 2` then appears. The canonical expanded
target becomes a prospective native RHS beside the subject, already containing
both bound exponent occurrences and `+C`. That same target owner moves into
the focal position as the source withdraws. There is no detached full-rule
panel, no template fraction clone, and no template-bar-to-target-bar handoff.

Observable acceptance criteria:

1. Match and bind do not displace the source `x^2`.
2. The binding environment is legible before the expanded RHS appears.
3. The instantiated RHS is visible before rewrite commitment and before either
   `2 + 1` reduction.
4. Exactly one canonical native fraction rule owns the expanded expression
   from instantiation through settlement.
5. The rewrite uses the same native RHS owner while it becomes focal.
6. The existing derivative exemplar, governed trace, `+C`, two ink knots,
   direct seek, rewind, accessibility, theme response, and narrow fit remain
   intact.

The independently reversible rollback unit is the integration exemplar's
rule-application choreography, mount presentation, and review evidence. It
does not include integration semantics, generated authority, evaluation
cohorts, the derivative, or other Catalogue callers.

## Consequences

The earlier detached general-rule panel and native template-source compositor
handoff are not the canonical presentation for this exemplar. They duplicated
attention and let two fraction rules participate in one perceived object.
Their lower-level compositor canary remains separate evidence; this decision
does not certify or promote that path as Rule Application.

This decision records a candidate standard grammar but does not create a
catalogue-wide renderer primitive, migrate callers, or claim every rule should
look identical. Promotion requires human approval of this exemplar and one
structurally different caller that demonstrates which authoring, compiler,
and renderer boundaries are actually shared. Prediction, application, and
mental-execution modes remain future projections of the same semantic states,
not part of this slice.

## Preserved Alternative: Abstraction By Skeletonization

Preserve **skeletonization** as a distinct presentation candidate, not as a
replacement for the semantic Rule Application grammar or as an approved
catalogue-wide motif. A successful match may progressively subordinate the
particulars of the subject until its fixed structure and metavariable slots
are perceived as the pattern itself:

```text
x * (y + 3)
-> [x] * ([y] + [3])
-> A * (B + C)
```

The reverse passage can express instantiation. For a compound subtree, the
renderer may first let that subtree behave as one object before replacing it
with a metavariable. The brackets above describe semantic grouping only; they
do not prescribe visible boxes.

This candidate offers four promising visual laws:

- successful matching removes perceptual detail while preserving structure;
- a metavariable binds one semantic object, including a whole subtree;
- completed correspondences settle out of focus instead of accumulating; and
- a failed match may collapse everything that succeeds so the unmatched
  operator, constraint, or shape remains as a residue.

The particulars are not semantically irrelevant or discarded. Their stable
identities and the binding environment remain recoverable, and repeated uses
of one metavariable must abstract or instantiate as one coupled event. For the
integration exemplar, both occurrences supplied by `n -> 2` must therefore
change together. Fixed syntax should remain stationary, color or fading cannot
be the only carrier of the distinction, and accessibility must expose the
concrete subject, abstract pattern, and bindings as separate instructional
states.

Skeletonization and the exemplar-local Rule Lens solve different problems and
may compose. Skeletonization is a candidate authored transition for learning
to perceive a schema; the Rule Lens is a learner-controlled inspection
affordance for recovering either side of a stable comparison without changing
semantic time. Neither changes the canonical beats
`match -> bind -> instantiate -> rewrite -> reduce`.

Before promotion, pressure one reversible exemplar for deterministic direct
seek and rewind, stable Native KaTeX ownership and metrics, repeated-variable
binding, a compound-subtree caller, and one failed-match residue. Do not add a
shared skeletonization type, Markdown effect syntax, or catalogue rollout from
the idea alone.

## Alternatives Considered

- **Show the full abstract rule beside the subject:** rejected for the
  exemplar because it splits attention and duplicates fixed structure.
- **Move a rendered template RHS into a second target RHS:** rejected because
  the fraction line acquires competing paint owners.
- **Use boxes as the universal slot language:** rejected because a slot is
  semantic while a box is provisional renderer styling.
- **Jump directly to the simplified answer:** rejected because it collapses
  instantiation and computation, hiding provenance and repeated binding use.

## Follow-up

Stop at the existing integration human checkpoint. After approval, freeze only
this treatment and its motif-specific regressions. A second caller and shared
Rule Application infrastructure require separate approval.
