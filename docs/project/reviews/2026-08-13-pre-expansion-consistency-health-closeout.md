# Pre-Expansion Consistency And Health Closeout

Date: 2026-08-13  
Baseline revision: `f7de634d`  
Run: `run-contract.kp.pre-expansion-consistency-and-health-baseline-v2`  
Verdict: expansion-ready for bounded work through established vocabulary

## Outcome

KP is healthier and materially easier for an LLM to extend when the requested
work uses an established semantic operation. This tranche did not make novel
animation design automatic, and it did not shrink the repository dramatically.
It reduced the effective decision surface: one canonical authoring route,
typed presentation choices, explicit capability loading, classified runtime
owners, typed failures, and executable health gates now displace several
ambiguous or hidden paths.

Expansion should stay exemplar-first. New content may use existing governed
operations now; a new motif, renderer seam, or choreography still needs one
human-approved exemplar and a structurally different second caller.

## Material Changes

- Reconciled LLM instructions around
  `src/authoring/canonical-animation-public-api.ts`; the older LLM draft
  schemas are explicitly compatibility/research inputs rather than a competing
  production entrypoint.
- Migrated all 25 concrete equation-target catalogue assets to typed
  presentation profiles.
- Deleted the 466-line legacy equation-profile decoder, its 200-line test
  suite, nine obsolete compatibility paths, and three import-time registration
  shims.
- Made all catalogue packs data-only and moved renderer registration behind
  explicit, injected, retryable capability loading.
- Added typed catalogue, capability, and selection-preparation failures while
  preserving the last valid stage during replacement and failure.
- Classified 12 runtime authorities, strengthened compatibility retirement
  evidence, moved neutral equation policy to its canonical owner, and rejected
  a dependency-reversing payload move.
- Fixed equation and narrow graph catalogue CLS through shared font
  reservation and stylesheet ordering, preserving the existing visual
  choreography and `< 0.001` threshold.
- Added change-impact routing, synthetic negative health fixtures, and stable
  `health:pre-expansion` / `health:pre-expansion:release` commands.

## Complexity Delta

The source-language line count moved from 318,521 to 318,499: a net reduction
of 22 lines under `src/` despite adding health validators, typed errors, and
explicit capability boundaries. The source diff itself is 766 additions and
788 deletions. This is consolidation rather than cosmetic pruning.

| Measure | Baseline | Closeout | Interpretation |
| --- | ---: | ---: | --- |
| Files under `src/` | 1,392 | 1,395 | Explicit owners replaced hidden side effects. |
| Test files under `tests/` | 1,227 | 1,232 | Added negative and benchmark evidence; removed the obsolete decoder suite. |
| Source-language lines | 318,521 | 318,499 | Net −22 while adding executable health policy. |
| Named `public-api.ts` modules | 13 | 13 | No new competing public facade. |
| Classified compatibility paths | 15 | 7 | Eight retired; the remaining seven are explicitly governed. |
| Built files | 374 | 381 | More lazy capability chunks, not route closure growth. |
| Built bytes | 7,797,606 | 8,326,474 | Mostly chunk/file accounting; route budgets remain the authority. |
| Catalogue route script gzip | ≤190,000 budget | 112,449 | Pass with 77,551 bytes of headroom. |

The generated build-directory total is not a user-download metric because it
adds all mutually exclusive routes, fonts, and lazy chunks. Route-specific
closure and browser checks remain the meaningful performance gates.

## Fresh Bounded-Context LLM Benchmark

Three independent ephemeral Codex processes received no conversation history,
read-only access, structured JSON output, and no more than six named files.
Their generated TypeScript was then typechecked and executed locally. The
committed fixture records observed outcomes; its test replays the semantic
laws rather than trusting model self-report.

| Case | Result | Files | API symbols | Caller lines | Wall time | Preview | Fallbacks |
| --- | --- | ---: | ---: | ---: | ---: | --- | ---: |
| Existing fraction variation | Valid after one typed repair | 6 | 6 | 48 | ~60 s | static JS + static step | 0 |
| Multi-operation composition | Valid first pass | 5 | 2 | 30 | ~25 s | governed compound route | 0 |
| Unsupported operation | Typed repair gap first pass | 5 | 5 | 42 | ~29 s | not applicable | 0 |

All three selected zero obsolete APIs. The composition preserved every child
operation on one canonical causal clock and passed endpoint and state-
independent direct-seek checks. The unsupported request threw
`KpGovernedConstructionVerificationError` and returned
`choose-approved-operation`; it produced no replacement animation or generic
fallback.

The variation trial found one real usability defect: it called a validator
with the compiled value instead of its `{ request, authority }` input. The
TypeScript diagnostic was precise, and one bounded repair produced code that
typechecked and ran. The repair process also hallucinated three source-file
names in its self-reported metadata even though it was told not to read more
files. Durable evidence therefore treats model-reported provenance as
untrusted and separately validates behavior. A future small API ergonomics
pass could add a clearly named assertion over a verified compilation, but that
is not an expansion blocker.

These results support “materially easier,” not “airtight” or “automatic.” They
prove established-operation reuse, composition, preview selection, direct
seek/rewind, and honest rejection within a bounded context. They do not prove
that a fresh model can invent a novel motif or produce human-approved visual
choreography without review.

## Release Evidence

- `npm run health:pre-expansion` — passes architecture, typecheck, 252 semantic
  convergence tests, 37 Svelte catalogue tests, negative health fixtures, LLM
  benchmark laws, bundle boundaries, and Article publication parity.
- `npm run test:browser:animation-equation-capability` — 5/5 pass, including
  both `< 0.001` CLS reservations.
- `npm test` — 4,147/4,147 pass.
- `npm run build` — passes; Svelte reports zero errors and zero warnings.
- `npm run theseus -- workspace validate` — valid, 937 nodes.

## Remaining Work

The repository is ready for a deliberately bounded TypeScript or Python
exemplar using established animation vocabulary. Remaining infrastructure is
incremental rather than prerequisite:

1. Add a convenience assertion for already-verified constructions if the
   validator-input mistake recurs in a second fresh-model trial.
2. Continue retiring the seven classified compatibility paths only when their
   live callers and sunset tests prove deletion safe.
3. Keep visual choreography behind the human exemplar checkpoint; no health
   gate can decide timing, salience, or pedagogy aesthetically.
4. Track route-specific closure, active-frame work, CLS, and long tasks rather
   than the aggregate `dist/` directory.
5. Run the bounded benchmark again after a new operation family or public
   authoring seam is introduced; do not infer novel-motif generation from this
   established-vocabulary result.

## Preservation

The pre-existing edits to the economics Article source and generated
publication were not staged or changed by this run. Unrelated untracked
project documents remain outside the run.
