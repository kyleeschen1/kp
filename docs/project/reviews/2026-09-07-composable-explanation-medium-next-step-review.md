# Next-step review: a composable explanation medium

Date: 2026-09-07
Status: PROPOSED — strategic brainstorm and implementation handoff, not an
accepted direction, executable run contract, or permission to resume work.

The user paused implementation to examine the most productive path toward a
medium for transmitting the salient structure of complex ideas: composable,
semantically rigorous, authorable by humans and LLMs, and useful across scales.

## 1. Resume boundary

Implementation is USER_PAUSED at commit `6a6f4385e`. The exact recovery packet is
[the canonical-tax resume point](../threads/2026-09-07-canonical-tax-resume-point.md).
The existing Theseus contract remains `run-contract.kp.structural-authoring-canonical-tax-v2`:
27/28 slices complete, G3 unaccepted. The shared slider keyboard repair is
verified; the specific remaining code-card complaint is not yet understood.
Do not treat this review as resolving that complaint, accepting G3, authorizing
a merge/deployment, or starting a successor loop.

The [roadmap](../roadmap.md), its active thread, and accepted decisions retain
authority. This review proposes a sharper acceptance target for their existing
authoring-first sequence, plus conditional later experiments. If accepted,
record that decision and derive one bounded run contract from this document;
do not maintain a second manually tracked slice table.

## 2. Recommendation

Make the next substantial milestone a **trustworthy explanation round trip**:
an author changes an explanation, sees what depends on that change, repairs
the affected material, previews the canonical Focus Card, and publishes a
coherent revision. Then prove that one difficult step can be expanded into its
reason and contracted back into the larger argument without losing context.

The product should help a reader acquire a useful way of seeing and reasoning,
not merely see the things an expert points at. Salience is the entrance to
comprehension, not a substitute for it. The strongest long-term ambition is:

> An explanation whose objects remain recognizable, whose reasons can be
> inspected, whose detail can recede, and whose ideas can be used again.

This is a synthesis of the existing strategy, not evidence that KP has already
demonstrated learning gains. Nor does it require a universal ontology, theorem
prover, editor rewrite, or new rendering framework.

The scarce resource is the marginal human effort required to produce a
trustworthy, genuinely useful explanation. Reduce that cost while preserving
the visual quality already earned. More supported animations alone do not
establish a medium; more schema alone does not establish usable authoring.

### What would make this recommendation wrong?

- If real authoring attempts fail mainly because essential operations are
  missing, a bounded operation-family investment should precede more tooling.
- If the coherent workflow already works without specialist assistance, move
  earlier to a longer explanation and learning evaluation.
- If readers cannot use the current controls or follow one scene, fix that
  representative experience before adding nested reasoning.
- If expansion reliably causes disorientation, favor explicit linked sections
  over a sophisticated recursive interface.

These are observable tests, not reasons to indefinitely postpone integration.

## 3. What the repository actually supports

This assessment uses current local code and canonical contracts. A successful
bounded path is not evidence of universal support.

| Area | Evidence already present | Boundary that remains |
| --- | --- | --- |
| Semantic authoring | Internal model/explanation assembly, revision-local queries, exact market facts, bounded math/state bridges | State composition does not itself compose arguments or prove arbitrary prose |
| Canonical adoption | The normal build ships the four-card supply-tax route; tax uses the authored source preparation path | G3 remains open; the other cards do not thereby share the same semantic authoring frontend |
| Author feedback | Local model/Article rebuild, transactional revision checks, retained valid preview, typed diagnostics | Not yet a general author-to-publication workflow or new browser write authority |
| Article authoring | Frozen Markdown-first Article v1, source editor, language service, import locks and publication contracts | Existing Article editing does not authorize editing arbitrary typed model files through the same endpoint |
| Attention | Semantic salience plans, reader focus precedence, cross-view correspondence, medium-specific projection | Supported mechanisms are bounded; one global salience store or universal phase grammar is not justified |
| Detail and reasoning | A bounded linear-algebra explanation spine and foldable distribution evaluation tree | Their domain-specific templates and node IDs are not a generic explanation grammar |
| Epistemic disclosure | Explicit hypothesis, misconception, invalidity and evidence-reference records | Shape validation and a status label are not proof of a claim |
| Publication | Build-time Article/KaTeX output, source/import identity and compiled-artifact contracts | Complete graphical static publication and reproducible reuse are not proven for every card family |
| Generation | Governed construction, typed repair gaps, accepted and rejected examples | No arbitrary-source universal animation generator; fixtures are not live-model benchmark results |

Relevant inspected owners:

- `src/semantic-state/authoring-explanation-assembly.ts`
- `src/semantic-state/authoring-diagnostics.ts`
- `src/tutorial/authoring-market/authoring-market-prepare.ts`
- `src/tutorial/authoring-market/authoring-market-companion-runtime.ts`
- `scripts/vite-authoring-market-preview.ts`
- `src/experiments/authoring-market/authoring-market-article-source.ts`
- `src/article/kp-article-source-authoring.ts` and `kp-article-source-editor.ts`
- `src/article/kp-article-language-service.ts` and `kp-article-import-lock.ts`
- `src/animation/salience-plan.ts`
- `src/reader/runtime/semantic-focus.ts` and `attention-projector.ts`
- `src/tutorial/cross-view-attention.ts`
- `src/tutorial/explanation-spine-v1.ts`
- `src/semantic/foldable-distribution-fold-intent.ts`
- `src/reader/compiler/foldable-distribution-lesson-model.ts`
- `src/semantic/epistemic-status.ts`
- `src/tutorial/kp-compiled-publication-artifact.ts`

Two particularly important limits are visible in code. The market companion
requires Article reference order to agree with the supported Scroll Score;
free rearrangement is not yet a general authoring capability. Its revision
check binds explicit facts, model and Article text, but cannot prove that
arbitrary sentences accurately interpret those facts. Preserve those guards
until an explicit replacement contract is demonstrated.

The current architecture is directionally strong. Its principal weakness is
integration economics: multiple successful, carefully guarded paths still
require specialist knowledge to assemble and explain. Current documents also
contain some historical wording that reads as live state; this is a concrete
risk for a model executing a later plan.

## 4. Product model: from guided attention to independent understanding

Treat the following as design questions, not a mandatory four-phase runtime:

1. **Notice:** What distinction should become visible here?
2. **Relate:** How do these objects, representations or changes correspond?
3. **Explain:** Why does the conclusion follow, and under which assumptions?
4. **Use:** Can the reader predict, reconstruct or apply it without the guide?

An animation can make a relationship perceptually legible. It cannot by itself
establish that the learner inferred the intended relationship. A slider can
support exploration, but merely operating it is not necessarily reasoning.
The ICAP framework distinguishes observable manipulation from activities such
as generating an explanation; its hierarchy is a research hypothesis with
qualifications, not a badge conferred by interactive UI.
[Chi and Wylie, 2014](https://education.asu.edu/sites/default/files/lcl/chiwylie2014icap_2.pdf).

Design the reader's eventual independence into the authoring brief. For a
passage, ask: “After this, what should the reader be able to distinguish,
explain or do?” This can initially be ordinary reviewable prose. Do not invent
a machine-readable learning-objective ontology before it helps a real author.

### Scale is several different problems

| Scale | Reader's question | Product mechanism to prove |
| --- | --- | --- |
| Object or symbol | What is this, and is it the same thing as before? | Stable local identity, names, semantic references and native-paint continuity |
| Relationship or beat | What changed, what stayed fixed, and why look here? | Governed operation plus target/context salience and explicit correspondence |
| Argument or procedure | Why is this step legitimate? | An addressable reason, assumptions, and an expandable supporting explanation |
| Whole explanation | Where am I, and what does this contribute? | A readable outline and recoverable parent context, not one giant timeline |
| Related explanations | Where else does this idea apply, and where does the analogy break? | Versioned reuse and explicit contextual bindings, not identity by matching labels |
| Learning over time | Can I recover and use the idea later? | Compact reference, reconstruction prompt and meaningful variation |

These scales must connect without being collapsed into a single graph. A
document outline, proof dependency, model dependency, concept association and
playback sequence answer different questions. Some conceptual links may be
cyclic; proof or evaluation dependencies may forbid cycles. A universal DAG
would erase meaningful distinctions.

### The essential multi-scale interaction

“Expand the reason without losing the argument” is the proposed first test.
The parent retains a recognizable claim and context. Opening its reason
reveals a bounded supporting explanation. Returning restores the parent's
address and inspection state. The child does not become a second competing
autoplaying scene.

Start with one level of expansion and ordinary links if necessary. Unlimited
recursive presentation, automatic lesson shortening and learner-model-driven
adaptation are not prerequisites.

The compact form must preserve the expanded form's boundary conclusion,
assumptions and referents. It need not preserve every sentence or animation.
Where these boundaries are not machine-checkable, retain explicit author
review rather than claiming semantic equivalence. This is stronger than a
generic text summary, but weaker than a universal proof of explanation quality.

Detailed guidance can become redundant as expertise increases. That supports
testing reader-controlled detail, not assuming that one permanent novice mode
is best for everyone, or inferring expertise from a few clicks.
[Kalyuga et al., 2003](https://www.davidlewisphd.com/courses/EDD8121/readings/2003-Kalyuga_et_al.pdf).

## 5. Architecture: connect the current layers, do not replace them

“One source of truth” should mean one explicit owner for each responsibility,
with checked bindings between owners. It should not mean one enormous file,
universal AST, shared mutable graph, or runtime that owns every domain.

| Responsibility | Authority to preserve | Explicit non-authority |
| --- | --- | --- |
| Domain objects, state and valid operations | Existing domain models, verified operations, semantic-state families and revision-local queries | Prose, salience and UI do not manufacture mathematical or execution truth |
| Claims, assumptions and evidence references | Domain evidence where available; otherwise identified, reviewable author assertions | A well-shaped record, source hash or `provider-verified` string is not a proof |
| Wording and document structure | Canonical Article source with sparse references | Generated HTML and renderer state are never replacement authoring sources |
| Teaching sequence, grouping and attention | Existing pedagogical score, scene, salience and correspondence seams | An instructional sequence does not establish causal truth |
| Detail, layout and navigation | Reader projection and existing host lifecycle | A Focus Card is the canonical acceptance projection, not the only permissible document structure |
| Paint and motion | Existing domain renderer, native compositor and registered motifs | No caller-specific timing or geometry silently fills a capability gap |
| Delivery and reproducibility | Existing build artifacts, exact import locks and explicit compiler/source identity | Readers do not import the authoring compiler or execute untrusted model source |

For execution, keep bounded active-stage lifecycles and deterministic local
playheads. Document navigation selects the active context; it does not require
one global animation clock spanning an entire book. Reader inspection is an
explicit input, not a mutation of the domain model. Preserve the current
keyboard/pointer/URL/story focus precedence unless a separate reviewed change
shows why it should differ.

For attention, resolve the relevant scene as a whole, then project through its
DOM, KaTeX, SVG, Canvas or WebGL owner. Identity, salience, presence and trace
role remain separate. Context required to interpret a claim must remain
available and legible. “Make everything else disappear” is not the default
meaning of focus.

### Semantic rigor should be local and honest

Complex ideas include definitions, exact calculations, formal derivations,
empirical findings, interpretations and contested hypotheses. They cannot all
be validated by one mechanism. Distinguish these warrants in authoring and
review without requiring every sentence to become a formal proposition.

Use rigorous semantic islands connected by explicit references and ordinary
prose. A domain provider may verify a result under named assumptions. An
empirical statement may require a citation and contextual review. An analogy
should identify its correspondence and limits. A deliberately incorrect
student model should retain its epistemic status rather than becoming a
trusted endpoint or being impossible to discuss.

Fail closed for an unsupported executable claim, operation or rendering path.
Do not confuse this with forbidding ordinary, clearly identified unverified
prose. Publication policy should require the evidence appropriate to each
declared kind of claim; it should not falsely label the entire article
“verified.”

### The smallest useful composition contract

Before designing another generic type family, write down what one reusable
explanation component needs from its caller:

- input objects, parameters and prerequisites;
- assumptions and supported domain;
- exposed referents and resulting claims or states;
- evidence/provenance and exact dependency selections;
- supported presentation, static and accessibility capabilities;
- the mapping from local identities to this particular use.

Only promote machine-readable fields that the first and second caller
actually need. Reuse existing entity, group, beat, correspondence and import
identities. Two things called “price” in different models are not automatically
the same semantic object. Rebinding must be explicit and scoped.

Sequence composition must check the relevant handoff, not just concatenate
steps. A child explanation must support the parent's claimed conclusion under
compatible assumptions. A variation must re-evaluate affected facts and
bindings, not just replace displayed numerals. A cross-view link declares a
relationship; it is not automatically an equivalence proof.

Article v1 is frozen. Do not add an unrecognized directive to implement this
proposal. First use its existing references, claims bindings and ordinary
structure, with bounded authoring-side records where appropriate. If actual
runtime needs exceed v1, stop for an explicit schema decision and migration.
Runtime prose transclusion is not an existing capability to assume.

## 6. The authoring experience to optimize

Support both entry points: a human or model can begin with a prose explanation
or with a domain example. They should converge on the same governed bindings;
neither route should require authoring DOM, keyframes or a parallel clock.

The everyday workflow should become:

1. Start from one accepted example and a small explanation brief: intended
   reader, desired distinction, assumptions, and one check of understanding.
2. Select existing domain capabilities and stable referents. See unsupported
   requests as named gaps before investing in elaborate prose or presentation.
3. Edit ordinary prose, explicit fact bindings and bounded pedagogical intent.
4. Build a candidate revision. Resolve references, evidence dependencies,
   score bindings and presentation capabilities together.
5. Report the affected material: changed facts, stale reviewed assertions,
   invalid references, unavailable operations, and unaffected reusable parts.
6. Keep the last-valid preview while the candidate is invalid. Identify which
   revision is visible; never let an old valid scene masquerade as the draft.
7. Preview the actual canonical Focus Card and inspect its source locations.
8. Publish a pinned build, with meaningful static/accessibility output and
   no authoring-service dependency in the reader.

Much of this exists in separate owners. The task is to connect it and remove
unnecessary specialist handoffs, not build every item anew.

Initially, file editing plus the existing preview/editor is sufficient. New
HTTP write authority, a visual node editor, collaborative editing and a
framework migration would expand the problem before proving the workflow.

### Change impact must distinguish kinds of work

- A wording-only edit need not recompute unrelated domain truth, but its
  editorial approval cannot be inferred from a successful parse.
- A parameter edit must recompute dependent values and invalidate claims
  whose declared dependencies changed. Undeclared free prose cannot honestly
  be guaranteed current.
- A pedagogical regrouping changes explanation structure, not domain truth.
  Its supported score/projection still needs validation.
- A new operation or ownership mechanism needs its own bounded executable
  evidence; a matching asset name does not inherit certification.
- A shared form/theme change should propagate through the next build of all
  applicable cards, while retained published editions remain reproducible.

There is no contradiction between centralized form and static publishing:
share the source owner, rebuild affected publications deliberately, and record
the presentation/compiler version. Do not promise that already-distributed
immutable HTML will update itself.

### LLM authoring is a repairable process, not a giant prompt

Use the [canonical generation entrance](../authoring/llm-generation-entrypoint.md).
Give a model an accepted minimal example, exact available capabilities, a
useful rejected example, and source-located diagnostics. Ask for intent and
ordinary source edits, then compile and repair through the existing boundary.

Measure first-pass validity, one-repair success, semantic accuracy, editorial
quality, caller-specific glue and silent fallbacks separately. The last must
remain zero. A live-model run must identify its actual input, output and
repair history; a handcrafted fixture proves the compiler, not model ability.

Improving diagnostics and removing redundant declarations are likely to help
both human authors and smaller implementing models. More elaborate inference
types are not automatically the best ergonomic investment. Preserve current
consumer inference and bundle budgets; use explicit ordinary data and runtime
validation when they give a clearer bounded contract.

## 7. One exemplar that would prove a meaningful advance

Use the current economic tax/welfare explanation as the first integration
specimen, with the question **“Which lost private surplus is transferred,
and which is no longer created?”** Its facts, graph, equations and prose
already exist. Do not sell another replay of that animation as the milestone.

The new proof is an authoring and comprehension journey:

- The author makes a wording edit, a supported parameter variation, and an
  explicit change in explanation detail. Distinguish which already works
  from which requires new integration.
- The guided Focus Card retains the approved visual behavior.
- The reader can inspect the supporting welfare accounting and the model's
  assumptions, then return to the parent claim without losing position.
- A compact reference retains the important distinction and offers a route
  back to its reason.
- A prediction or reconstruction prompt asks the reader to use the relation;
  a supported variation supplies a check rather than a different decorative
  scene.
- A static build carries the same bound facts and references without the
  authoring runtime.

The first variant must stay within currently supported exact market inputs
and settled demand history. Do not weaken the canonical original-Article
guard or imply support for animated demand. Begin with the opt-in authoring
path; canonical promotion is a separate, explicit acceptance step.

Acceptance reference: the reviewed canonical tax Focus Card, its production
host and existing SVG/equation renderers. Semantic authority: the exact
authored market source and revision-bound facts, not DOM geometry. Preserve
motion, keyboard/pointer behavior, timing and reader import budgets.

The smallest rollback unit for the new visible behavior is the opt-in
detail/prompt projection and its bindings; removing it must leave the current
canonical route and all domain models intact. Review one representative
expanded/returned state before broadening the behavior.

Pressure-test the proposed composition boundary with the existing TypeScript
extract-helper example only after its current reported behavior is clarified.
This tests procedures, source identity and scoped invariants instead of market
geometry. Reuse its language-owned frontend and bounded evidence; do not
declare arbitrary program equivalence or create a new language frontend.

Later, test a partly nonformal explanation with citations and an explicitly
limited analogy. This is an important test of the medium's breadth, but not
permission for a universal knowledge graph or an immediate new renderer.

## 8. Proposed ordering and changes to the roadmap

Scores are engineering judgments, not measurements: 5 is high benefit for
Authoring/Reliability/Reuse, and high cost or uncertainty for Risk.

| Candidate | Authoring | Reliability | Reuse | Risk | Recommendation |
| --- | ---: | ---: | ---: | ---: | --- |
| Resolve the existing G3/code feedback | 2 | 5 | 3 | 1 | Finish the current commitment when implementation resumes |
| Coherent authoring/revision/publication round trip | 5 | 5 | 5 | 2 | Main next milestone |
| One expandable reason plus compact return | 4 | 3 | 5 | 3 | Next visible exemplar after the round trip is sound |
| Bounded live-model authoring/repair trial | 5 | 4 | 4 | 2 | Attach to that workflow, not a separate platform |
| More domain/rendering breadth | 3 | 3 | 3 | 4 | Only when a named explanation exposes a blocking capability |
| Universal explanation graph or public facade now | 2 | 2 | 3 | 5 | Defer until two callers earn the boundary |
| Full editor/framework rewrite | 2 | 2 | 3 | 5 | Defer; reuse existing clients and lifecycle owners |
| Accounts, adaptive curriculum and scheduled repetition | 2 | 2 | 3 | 5 | Defer; use manual comprehension/return probes first |

This keeps the accepted authoring-first direction. It changes the definition
of “integration complete” and brings a small comprehension check earlier.
External educator discovery does not become an architecture prerequisite.

### A. Finish and make the current path legible

Resolve G3, clarify current versus historical documentation, and inventory
the exact authoring handoffs for three representative edits. Do not broaden
the current loop to implement the rest of this proposal.

### B. Prove everyday authoring and coherent delivery

Connect source navigation, revision-aware diagnostics, last-valid preview and
an explicit publication build for one bounded explanation. Reuse existing
save and publication seams within their current authority. Include a minimum
reproducible static artifact here; do not defer all publication until after
building a general knowledge layer.

**Gate:** another author/model can perform the agreed edits using the bounded
packet, with no handwritten renderer glue, no stale displayed facts and no
silent capability substitutions. Record remaining human interventions rather
than hiding them behind a passing build.

### C. Prove useful composition at two scales

Add one supporting explanation and return path, a compact representation,
and a prediction/reconstruction task using existing capabilities. Hold the
canonical visual checkpoint before generalization. The exact interaction
style is provisional until reviewed.

**Gate:** the reader can identify the parent claim, inspect why it holds and
return without losing context; references and assumptions remain consistent.
Small observations establish usability findings, not statistical learning
superiority.

### D. Earn reuse and bounded generation

Apply the same necessary authoring/composition seam to the code caller.
Retain domain-specific truth and renderers. Run a real generation-and-repair
trial. Only then consider a public convenience layer, broader dependency
records, transclusion, or another domain.

**Gate:** the second caller uses the proposed seam without lying about its
semantics or introducing a parallel state/clock/paint owner. If it does not,
keep the seam internal or split the responsibility instead of adding switches
until everything fits.

## 9. Implementation handoff for a bounded executing model

These are proposed work packets, not approved Theseus slices or live status.
Only the early packets are implementation-ready in scope; later ones have
decision gates because committing to their exact types now would be false
precision. At activation, put live order/status/evidence in Theseus alone.

Every packet should carry: named owners to read, requested edit, preservation
boundary, a positive fixture, a negative fixture, a focused command, and an
explicit stop condition. A model should not repair a failing test by widening
budgets, dropping guards, inventing new authority, or replacing a renderer.

### P0 — Complete the current commitment

Use the resume packet, not this strategic review, as execution authority.
Clarify and reproduce the remaining code complaint, preserve the verified
keyboard fix, and obtain G3. No successor work starts from an assumed approval.

### P1 — Establish an authoring baseline and accurate entry packet

Read the active thread, generation entrance, market source/companion and
Article v1 contract. Record the exact steps for: a wording edit, a currently
supported parameter change, and a requested detail change. Measure files
edited, duplicated declarations, compile/preview latency, diagnostic repair
steps and specialist assistance. Separate already-supported behavior from
new work. Correct stale routing statements using landed source evidence;
do not announce internal APIs as public.

Done: one minimal reproducible authoring packet, including one valid and one
rejected edit, and no conflicting “current source” instructions. This is not
a new schema or a new runtime subsystem.

### P2 — Make revision and repair feedback coherent

Start with `authoring-diagnostics.ts`, the market preview protocol/build,
`scripts/vite-authoring-market-preview.ts`, and the current host. Reuse the
existing transactional lifecycle; add only demonstrated missing diagnostics
or source navigation. A stale preview must identify its last-valid revision.

Negative cases: invalid source after a valid preview; two edits whose builds
finish out of order; mismatched model/Article revision; unknown fact/reference;
unsupported animated demand. Recovery must not discard the last valid view
or publish a mixed revision. Stop if the solution needs a new browser write
endpoint or execution of untrusted author source.

Existing test starting points: `tests/authoring-integration-revisions.test.ts`,
`tests/authoring-integration-diagnostics.test.ts`,
`tests/authoring-integration-host.test.ts` and
`npm run visual:authoring-market`. Extend the established scoped harness,
not a changing scratch browser script.

### P3 — Trace a claim to its facts and assumptions

Start with market facts, the Article author function and companion runtime.
Choose one welfare claim. Expose its existing exact dependencies, source
locations and explicit assumptions; show which prose is still author-reviewed.
Prefer a bounded binding over a general claim language.

Negative cases: changed dependency with an old claim binding; a source span
from another revision; a fabricated evidence ID; arbitrary prose presented as
machine-proved. Reference validation must not masquerade as truth validation.
If a formal or empirical warrant is unavailable, retain the honest status.

Existing test starting points: `tests/authoring-integration-facts.test.ts`,
`tests/authoring-integration-companion.test.ts`,
`tests/authoring-integration-canonical-instruction.test.ts` and
`tests/kp-article-v1-language-service.test.ts`.

### P4 — Publish the bounded explanation reproducibly

Read Article import locks, compiled publication artifacts, canonical source
compilation and existing publication tests. Reuse exact dependency resolution
and build-time rendering; do not create a second packaging format merely to
group the files. Make the supported source/model/Article/presentation identity
and unsupported outputs explicit.

Negative cases: stale generated artifact; wrong import selection; missing
required accessible/static content; accidental authoring import in the reader;
an artifact whose digest has only the correct shape but does not match its
payload. Hash validation belongs to the actual build/verification path, not
just the artifact interface. Stop for explicit authority if publishing would
mean deployment or new write targets.

Starting commands: `npm run check:canonical-tax-source`,
`npm run test:compiled-publication-artifact`, `npm run test:kp-article-v1`,
and the existing scope-specific production/budget checks. Select the smallest
relevant set per edit; a complete release matrix belongs at promotion.

### P5 — Review one nested-reason design before generalizing

Write the explanation brief and bounded parent/child binding using existing
references. Inspect the explanation spine and foldable evaluation tree for
reusable responsibilities, not reusable hardcoded algebra IDs. Implement one
opt-in tax detail/return exemplar only after this proposal is approved.

Acceptance: parent position survives return; keyboard focus has a deliberate
destination; direct links restore the same state; the child cannot activate
an unrelated clock or mutate the model; a static explanation remains useful.
Do not broaden Article v1 or create a universal `ExplanationNode` type to make
this spike compile. Stop for its human visual checkpoint before promotion.

### P6 — Add one meaningful prediction and compact reference

After the exemplar checkpoint, author one question that distinguishes the
intended relation from a plausible misconception. Use exact model facts for
its bounded check and an authored rubric for interpretation. Keep answer
state separate from canonical semantic truth. Do not claim that an LLM's
grading is a formal guarantee or require accounts to try the exercise.

Acceptance: compact and expanded paths retain the same boundary claims and
assumptions; the question asks for reasoning rather than locating highlighted
ink; replay and variation are available after the response. The visual form
remains subject to its named exemplar gate.

### P7 — Pressure with the existing code caller

After P0 and P5, identify a source-level procedure/invariant in the approved
extract-helper example. Map its inputs, outputs and supporting explanation
through only the seam earned by the tax caller. Keep the current language
frontend, correspondence authority and renderer. Reject unknown source spans,
foreign revisions, unsupported transforms and unproved equivalence claims.

Done: document which responsibilities genuinely shared and which remained
domain-specific. A special-case switch for every domain is evidence against
promotion, not a successful universal abstraction.

### P8 — Run a small live authoring-and-repair benchmark

Use accepted cases and negative cases from P1–P7. Give the executing model the
small packet, not the repository history. Retain its first output, diagnostics,
one repair, final artifact and human findings. Separate content authoring
from infrastructure implementation performance.

Done: measured first-pass/repair outcomes and human intervention cost with no
silent fallback. If new architecture judgment is necessary, return a gap for
review rather than rewarding the model for making the benchmark green.

### P9 — Promote only what the evidence earns

After visual approval and the second caller, add mechanism-specific regression
coverage, the supported-browser cohort and existing release budgets. Decide
whether a small internal helper, a public authoring surface, or no new shared
abstraction is warranted. Record one accepted example and one useful repair
example. Propose subsequent work from observed author/reader failures.

### Handoff stop rules

An executing model should stop and report when it would need to change a
semantic authority, broaden a frozen schema, add an execution/write surface,
replace a canonical renderer, introduce a new choreography, or raise a fixed
cost budget. Routine exact fixes within an approved contract remain covered
by the user's standing nonvisual continuation rule. Neither that rule nor
this review waives visual checkpoints or grants a new implementation scope.

## 10. Verification: five separate questions

Do not compress these into a single “verified explanation” status:

1. **Source integrity:** references resolve, revisions agree, imports are pinned.
2. **Domain correctness:** the claimed computation/operation is justified by
   its actual domain authority and assumptions.
3. **Presentation correctness:** paint ownership, native endpoints, seek,
   interruption, accessibility and lifecycle laws hold on the real host.
4. **Pedagogical quality:** the explanation makes the intended distinction
   legible, gives an intelligible reason and avoids unnecessary competition.
5. **Learning outcome:** a reader can explain, reconstruct or transfer the idea.

Tests can establish much of the first three. Author and visual review inform
the fourth. The fifth needs reader evidence; neither test count nor smoothness
establishes it.

For composition, include metamorphic checks: expanding then returning preserves
the parent address; direct seek and replay reach equivalent semantic state;
a supported parameter change updates all declared dependents; changing a
projection does not change the underlying claim; invalid edits preserve the
last-valid artifact. These are candidate laws to implement where the actual
contract supports them, not assertions of existing coverage.

For delivery, distinguish initial payload, later activation, fonts/images,
frame cost and memory/lifecycle behavior. Do not hide a regression by moving
it to an unmeasured bucket. The current canonical JS/CSS closure and consumer
typecheck budgets are meaningful constraints, not temporary obstacles to waive.

### A small learning investigation, not a platform project

Start with observed sessions and explicit rubrics. Ask what changed, why the
claim holds, what happens in a new supported case, and what can be reconstructed
after a delay. A few sessions can expose confusion; they cannot establish a
general effect size or prove KP outperforms other media.

If a comparative study becomes worthwhile, compare an excellent static
explanation, the guided interactive explanation, and interaction with a
prediction/reconstruction task. Match content, consider time-on-task and
prior knowledge, and counterbalance equivalent items rather than teaching the
same learner the same answer repeatedly. Record assistance and guessing.

Research on multiple representations warns that their benefit depends on
design, their instructional function and the learner's translation tasks.
This motivates testing cross-view correspondence and reducing unnecessary
panel competition; it does not establish that more simultaneous views help.
[Ainsworth, 2006](https://www.researchgate.net/profile/Shaaron-Ainsworth/publication/222410911_DeFT_A_conceptual_framework_for_learning_with_multiple_representations_Learning_and_Instruction_16_183-198/links/5ea69ecb45851553fab2dd69/DeFT-A-conceptual-framework-for-learning-with-multiple-representations-Learning-and-Instruction-16-183-198.pdf).

Retrieval experiments with science texts found advantages on comprehension
and inference measures relative to the particular elaborative-study
conditions tested. This supports trying reconstruction and delayed return,
not claiming that a flashcard or every retrieval task always beats a diagram.
[Karpicke and Blunt, 2011](https://learninglab.psych.purdue.edu/downloads/2011/2011_Karpicke_Blunt_Science.pdf).

The learning probes should accompany the authoring milestone without
subordinating architecture work to market discovery. Use the already recorded
proof-memory ideas as later lifecycle context, not authority to reactivate
the parked normal-matrix work or build an account/scheduling system.

## 11. Guard against the most likely strategic failures

- **Permanent exemplar polishing:** fix correctness and perceptual regressions,
  but require a named mechanism and acceptance boundary for further polish.
  Once the exemplar is accepted, shift effort to authoring/reuse until a new
  observed failure warrants repair.
- **Infrastructure mistaken for integration:** require a real author edit
  reaching a real published explanation, not only isolated API examples.
- **A universal abstraction too early:** two structurally different callers
  should determine the shared boundary. Ordinary prose remains welcome.
- **Narrative drift after model edits:** track declared dependencies and retain
  honest editorial uncertainty for prose that is not mechanically bound.
- **Control inconsistency hidden by semantic tests:** preserve a small shared
  host-interaction contract. The recent slider failure is evidence that domain
  correctness and many tests do not automatically cover common controls.
- **Documentation/verification overhead becoming the product:** keep one
  reviewed proposal and one execution record. Turn recurring failure checks
  into scoped executable mechanisms instead of expanding a prose checklist
  or running the largest matrix for every small edit.
- **Visual fluency mistaken for understanding:** ask the learner to explain
  and use the relation, not just rate the animation or operate the control.

## 12. Decisions worth discussing next

Recommended defaults, not silently accepted decisions:

1. Keep Focus Cards as the canonical interaction/visual acceptance surface,
   while Article remains the document source and domain models retain truth.
2. Make the next substantial deliverable one coherent authored explanation,
   then one expandable reason, rather than a larger animation catalogue.
3. Use economics to minimize integration novelty and code to pressure the
   boundary; choose the first longer, genuinely complex explanation after
   those capabilities are demonstrated.
4. Build explicit author-controlled levels before automatic personalization.
5. Measure both author effort and reader reasoning, without requiring a new
   research, analytics or account platform before progress can continue.

The most consequential unresolved product choice is the first longer
explanation to serve as the medium's end-to-end test. It should contain
dependent reasoning and at least one tempting misconception, and justify
multiple representations without requiring a new renderer. The choice should
be driven by what the user most wants to teach and what would expose current
limits, not merely by which existing animation is easiest to reuse.
