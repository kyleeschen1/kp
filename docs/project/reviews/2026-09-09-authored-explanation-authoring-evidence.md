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
