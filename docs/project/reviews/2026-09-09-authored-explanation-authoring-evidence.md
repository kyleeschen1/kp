# Authored spam-filter explanation: provenance and repair evidence

This is repository authorship by the implementing assistant, not an independent
model trial, a human authoring study or a comprehension result. The canonical
source is `content/authoring/r4b-spam-filter.bayes.json`; its target is the existing
Bayesian Focus Card, with the existing probability model and motion mechanisms.

The initial model-only source was pinned before implementation. The first full
editorial source was then written directly in the new bounded v2 envelope. It
contains the title/setup, seven stop-linked passages, full/compact paragraphs,
denominator explanation and two prompt wordings. There are no authored answers,
coordinates, timing, salience or renderer instructions.

Observed source-authoring repair: the first lesson test rejected
`$.editorial.setup[3].fact` because `detection-rate` was not yet in the fact
vocabulary. A specialist implementation intervention added only the two
conditional facts needed by the task: `likelihood.a` and `likelihood.not-a`, both
resolved by the existing probability query owner. The names describe P(B|A) and
P(B|not A), rather than importing classifier-specific meaning into an urn lesson.
They express detection and false-alarm rates in this exemplar. Undefined conditional rates
remain located repair gaps when requested; valid zero-support models without
those references remain accepted. The follow-up zero-support test initially used
unsupported `0` instead of the existing rational syntax `0/1`; corrected the test,
not the probability parser. These are distinct source-design and test repairs,
not a claimed model-generation success rate.

Loading the source reuses the editor's existing draft/Apply mechanism. It does
not replace v1 defaults, create a file-write API or add another renderer. One
button loads the committed JSON into the draft; explicit Apply selects it.

Facts update with source parameters. Free editorial assertions such as “raises
suspicion” still require review when parameters or the teaching goal change.
Binding exact numbers is not a proof of unrestricted prose, good pedagogy or
empirical filter performance. Human editorial/visual review remains required.

Repeatable evidence: `tests/bayesian-reasoning-editorial-lesson.test.ts` and
`npm run visual:authoring-entrypoints -- --grep R4B`. Screenshots are disposable;
source and executable checks, not captured pixels, own durable evidence.

## Post-Apply practice ownership repair

The authored browser scenario first failed when opening practice after Apply:
the prompt title stayed empty. Inspection found that delayed practice handlers
queried the preparation wrapper after its children had moved into the live host.
This was an existing shared lifecycle defect, not new probability semantics;
the same code path serves v1 source edits.

The repair resolves and validates the retained revision element at the mount
boundary, then passes only that element into a separate runtime scope. Event
handlers cannot capture the disposable outer container in that scope. Browser
regressions exercise post-Apply practice/reveal/return for the authored lesson and
the existing v1 urn source. The authored scenario was observed failing before
repair; the legacy risk was identified by shared-path inspection, not a claimed
separate pre-repair legacy browser run.

## Accepted exemplar and second lesson

The user accepted the primary exemplar with “approve, and resume” on September 9.
The urn explanation is `content/authoring/r4b-urn-explanation.bayes.json`: 6,273
UTF-8 bytes in one source file, compared with the spam lesson's 6,607 bytes.
Both have seven passages, two readings, denominator wording and two prompts.
The urn uses the already supported sampling model, red-first order and 1/7
posterior. Its first authored-source test and first Chromium Apply workflow
passed: no source-repair turn or new fact was needed. Commit `8eddb9b22` adds
only source, tests and execution evidence—zero runtime/renderer files or
caller-specific branches. The shared CLI later adds named examples, not paint.

The primary required the previously described vocabulary intervention and
host-practice repair. The urn is cheaper in this observed implementation, but
the author also implemented the framework and knew its constraints. No claim
of independent first-pass generation, time-to-author, or learner benefit follows.

`npm run check:authored-bayes-workflows` replays both actual sources, prose-only
revisioning, prior edits to 1/2 (posteriors 18/19 and 1/4), an explicitly injected
unknown-fact rejection and one repair, and three byte-reproduced publication
variants per lesson. Its injected repairs are not historical model mistakes.
The R4B browser edit/replacement scenario additionally verifies real Apply,
readings, invalid-replacement preservation and displayed-source download/restore.
Bound numbers update; free prose may need revision when parameters change.

The v1 default remains intentional compatibility, not a duplicate new lesson.
Card and edition share one domain-local projection assembly after both callers
passed. Pre-cleanup byte hashes protect both v2 cards and publication payloads;
separate tests retain the original v1 outputs. Fact formatting no longer loads
SVG paint, reducing core inference cost without deleting consumer fixtures.
