# Workbench integration and exposition-study baseline

Date: 2026-10-28
Status: source inspection and read-only evidence review; no new UI implemented
Intake: `capture.kp.co-creative-workbench-20261028` in [capture](../capture.md)
Plan owner: [co-creative practice proposal](2026-10-28-next-step-review.md)

## Existing owners and actual gaps

| Need | Existing evidence | Remaining question or gap |
| --- | --- | --- |
| Search and reference animations | `src/editor/semantic-animation-workbench-query.ts`, `semantic-animation-workbench-identity.ts` and `semantic-animation-workbench-index.ts` support IDs, aliases, representations, lifecycle facets and diagnostics | Coverage is animation-centered; no demonstrated common addressing for arbitrary conversation spans, experiments and learner attempts |
| Anchored feedback | `protocols/dev-review-v2.ts` retains rounds and append-only notes; v1 capture fields include build, semantic targets, render context, trace and optional screenshot | Extend through its owner when needed; do not create a competing feedback ledger |
| Point to exact math | `src/dev-review/semantic-target.ts` captures selectors, object/transformation IDs and pointer geometry | Exact code/message ranges, revision-aware relocation and explicit stale-anchor handling need a bounded caller |
| Project/task visibility | `src/project-dashboard/model.ts`, `data.ts`, `theseus-adapter.ts`; workbench Theseus adapters | The inspected workbench data constructor binds three specific historical control nodes, not a general live job monitor; some dashboard claims are manually maintained |
| Motifs and capabilities | `scripts/repertoire-dashboard.ts`, `src/repertoire/`, architecture capability inventories and author-task discovery | Federate existing IDs, scope and maturity evidence; an inventory entry is not executed or pedagogically accepted support |
| GTD | `capture.md`, `next-actions.md`, `waiting-for.md`, `someday.md` | These existed but were not a maintained unified UI; spaced practice still appeared in Someday after the latest priority change |
| Personal practice | Existing flashcard projections, algebra self-check/return and normal-matrix manual rehearsal | Persist actual attempts, question revisions, learner notes and return dates; no completed co-creative SRS product is demonstrated |
| Experiment timing | Authoring repeatability records, runtime cost reports and Theseus evidence | End-to-end authoring minutes were explicitly unmeasured in the inspected trial; browser/checker timings cannot substitute |

There is observable dashboard drift: `src/project-dashboard/data.ts` includes
"No code-domain object implementation exists yet", while current code-domain
authoring/reasoning owners and `llm-generation-entrypoint.md` describe bounded
working code capabilities. This is evidence for derived, source-linked status
with freshness and coverage, not a claim that every dashboard row is stale.

The inspected workbench route is `/?view=animation-workbench`; repertoire uses
`/experiments/repertoire/`. A local HTTP probe of port 8000 failed to connect
during this review, so no present-tense browser usability or working-server claim
is made. Source and existing tests were inspected; browser tests were not rerun.

## Review-log baseline

The `kp-review-logs` workflow was used read-only. `npm run review:logs -- audit`
reported byte-stable replay, stable identity/order, 55 events, 35 lifetime notes
and two synthetic legacy rounds. The current open round is
`review-round.legacy.2.d0920d5fd3c6`: 31 notes, 25 marked new, five fixed and one
verified. Four notes belong to the closed historical round and were not fetched.

Both current-round pages were inspected through the typed query CLI:

```
npm run --silent review:logs -- query --unread codex.main --limit 20
npm run --silent review:logs -- query --unread codex.main --after 24 --limit 20
```

All current-round notes retain their original route, build, phase and checkpoint
when captured. "New" is a workflow status; these are not 25 newly reproduced
defects. No status, grouping or consumer cursor was changed. The summaries and
facets below are this review's interpretations of captured comments, not causes
proven against today's renderer.

| Note ID | Recorded status | Captured observation/request | Initial review facet |
| --- | --- | --- | --- |
| `review-note.5.mruqn4cq` | new | Opposing arcs for the 7 and 3 | Motif choice |
| `review-note.6.mruqp67c` | new | Moving x/equality before active terms creates interference | Accommodation order; attention |
| `review-note.7.mruqq5ie` | new | Zero appears too briefly; omit or give its own step | Explanatory granularity; timing |
| `review-note.8.mruqr363` | new | Header needs depth separation | Visual hierarchy; aesthetics |
| `review-note.9.mruvgde8` | new | Review box obstructs the commented image | Reviewer interaction |
| `review-note.10.mrv9dtnf` | new | Fraction rule moves to the wrong location | Representation fidelity; geometry |
| `review-note.11.mrv9hl2a` | new | Distinguish balanced operations, transfer shorthand and explicit identity | Mathematical framing; learner context |
| `review-note.12.mrw3l77d` | verified | Cancellation should meet at a midpoint | Motif consistency |
| `review-note.13.mrzhovqp` | new | Only active 6 should arc; background should accommodate | Attention; object roles |
| `review-note.14.mrzhpyfl` | new | Explain intermediate steps from 6 to 1/4 | Pedagogical granularity |
| `review-note.15.mrzhrkn1` | new | Factor using meaningful steps, compress when not the focus | Technique selection; granularity |
| `review-note.16.mrzhso4i` | new | Missing continuity before roots/branching | Narrative and mathematical transition |
| `review-note.17.mrzhtbuc` | new | Solution-set representation too complicated for this tutorial | Instructional scope |
| `review-note.18.mrzhv5t8` | new | Substitution should respect background accommodation | Shared choreography |
| `review-note.19.mrzhx526` | new | Evaluate subterms using their own operations | Semantic decomposition; motif routing |
| `review-note.20.mrzhxsef` | new | Root evaluation should use the expected collapse | Motif consistency |
| `review-note.21.ms436j57` | new | Overlap at captured collect-like-terms moment | Perceptual interference |
| `review-note.22.ms436tub` | new | Overlap in a second representation | Cross-view preservation |
| `review-note.23.ms4va7al` | new | Expected cancellation motif absent | Motif consistency |
| `review-note.24.ms4vdyck` | new | Corresponding threes should appear together | Coordinated presence |
| `review-note.25.ms53914l` | new | Duplicate representation | Paint ownership hypothesis |
| `review-note.26.ms5zuj0z` | fixed | Fraction terms vanish instead of showing scaling by 2 | Semantic visibility |
| `review-note.27.ms5zx09s` | fixed | Denominator/fraction-rule merging overlaps | Geometric continuity |
| `review-note.28.ms5zxiwy` | fixed | Evaluation uses a rejected crossfade | Motif routing |
| `review-note.29.ms5zyxmn` | fixed | Synchronization is not perceptible | Cross-view coordination |
| `review-note.30.ms60041c` | fixed | Flicker on native KaTeX return | Paint handoff hypothesis |
| `review-note.31.ms86jzgt` | new | Addends jerk | Geometric continuity |
| `review-note.32.ms86l28n` | new | Plus insertion jerks; plus should persist | Layout and presence |
| `review-note.33.ms86lhtk` | new | Numbers jerk before checkpoint | Geometric continuity |
| `review-note.34.ms86oims` | new | Keep a historical trace; extra squares add little | Representation selection; persistent context |
| `review-note.35.mtb44cqk` | new | Integral has multiple copies | Paint ownership hypothesis |

Repeated themes warrant investigation but not a frequency-based universal rule.
One note may span multiple facets. For example, an identity shown too briefly
could require a different explanatory beat rather than a global duration change.
The existing `principles/animation-design-diagnostic-language.md` already owns
motion vocabulary; extend or map to it instead of inventing a parallel taxonomy.

Two other bounded historical examples show why dimensions must remain separate:

- [Chain-rule decision](../decisions/2026-10-13-learner-context-and-chain-rule.md):
  mathematically checked content combined three instructional purposes and the
  user found it busy and unclear. This is evidence about purpose/context, not a
  failed derivative engine or a proven universal learning effect.
- [Proof-memory thread](../threads/proof-memory-medium.md): source/return
  architecture worked, but read/watch/predict attention was not accepted.
  Architectural validity did not establish a satisfactory learner experience.

## Exposition-study seed

Study ID: `study.kp.dot-product-exposition.v1`
Status: source analysis only; no reconstructed KP explanation or learner trial yet
Candidate learner: familiar with coordinate dot-product arithmetic; unclear why
it measures projection. This is a selected study brief, not a diagnosis of the user.

[Franklin's autobiography](https://www.gutenberg.org/files/148/148-h/148-h.htm)
describes reducing essays to hints, reconstructing later, comparing and correcting,
and rearranging hints to practice order. Our proposed adaptation is to reconstruct
an explanation's reasoning and compare consequential choices across learner
contexts, retaining source attribution and creating original wording/examples.

[Sanderson's dot-product lesson](https://www.3blue1brown.com/lessons/dot-products/),
in the published text adaptation by Kurt Bruns and James Schloss, places the
topic after linear transformations, reviews computation and projection, raises
the connection between them, and develops maps from vectors to scalars.
Our inference: delayed resolution and reuse of an established transformation
language are techniques worth testing. This review did not watch or measure
the original video's timing.

[OpenStax Calculus Volume 3, 2.3](https://openstax.org/books/calculus-volume-3/pages/2-3-the-dot-product)
opens with the problem of force and motion in different directions, then gives
the coordinate definition, worked computations and properties. Our inference:
application-led motivation and explicit procedural practice provide a useful
contrast. Neither source establishes the best explanation for our selected learner.

Proposed original study task: explain why changing a vector perpendicular to a
fixed nonzero measurement direction does not change its scalar dot-product
reading in Euclidean space. Ask for a prediction before revealing the relation.
Compare a geometric-first account and a coordinate-first account, recording what
each assumes and leaves unresolved. Do not claim the geometric choreography is
already supported; absence of a required representation is a capability gap.

The intended learning from this study is a conditional design judgment: which
prior knowledge makes a particular explanatory move useful? Internalization of
expert judgment remains an aspiration, not an outcome inferred from imitation.

## Verification and limits

No new live model experiment, animation, dashboard, scheduler, agent monitor or
grading mechanism was created. Historical source inspection is not runtime
certification. Review-log reads were non-destructive; all displayed statuses
remain owned by the log. Commit and project-memory checks accompany this record.

After recording the workbench direction, `theseus workspace validate` passed
with 1,254 nodes and 33,807 events. `npm run check:promotion-memory` passed and
kept the tabled matrix frontier unchanged; `git diff --check` passed. These are
documentation/control-record checks, not validation of the proposed product.
