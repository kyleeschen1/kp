# Checked revision without manual archive bookkeeping

This continues the approved authoring-to-practice programme after the bounded
reader performance repair. Its beneficiary is an author revising prose against
already supported mathematics. The concrete friction was manual copying of old
Articles, registry versions and source pins. Earlier saved links demonstrated
why replacing selected prose without retaining its exact revision is unsafe.

Canonical artifact: the separate count-versus-quantity candidate, edited in
`content/authoring/algebra/what-counts-product.article.md`. Host:
`http://localhost:8011/reader/what-counts/?reading=product`. Checked math remains
`what-counts.json` at revision
`7b2d98b4554f80a3456ee6891df12dfdf069f76c11af05471b727908e37f2c61`;
the accepted document theater/native KaTeX compositor retains rendering and
attention authority. The accepted default, manuscript prose, motion and annotation
treatment are unchanged. The candidate's explanatory quality remains unreviewed.

## Delivered workflow

`npm run author:what-counts -- --reading product --source
content/authoring/algebra/what-counts-product.article.md` checks through the existing
reader compiler and returns a proposed version, source digest, URL and `basis`.
Repeating with `--apply --expect <basis>` saves the checked revision. The basis
binds both selected sources and proposed bytes/metadata; a changed draft or
concurrent edit requires another check. Checking alone does not make a URL live.

The operation snapshots exact old/new bytes, pins hashes, validates both addresses,
then atomically replaces the existing registry. All snapshot paths remain under
`content/authoring/algebra/readings/<reading>/`. Identical bytes/metadata are
idempotent; restoring a previously saved revision keeps both addresses available.
The working draft remains editable independently of the selected snapshot.
Invalid drafts, missing operation passages, wrong checkpoints, unknown semantic
references, changed archives, stale proposals and concurrent writers cannot
silently replace the valid selection through this path. Those semantic repairs
already belonged to the existing compiler; no second validator was invented.

The rollback unit is the CLI/revision helper, its tests and the candidate registry
snapshot. It adds no browser code, CSS, renderer, editor application, network write
endpoint, model service or publication mechanism. The accepted default is still
version 2, with its original version 1 retained. A lock left by a forcibly killed
writer requires verifying that writer has stopped before cleanup; the operation
does not claim to serialize arbitrary manual filesystem edits or survive every
possible storage failure.

The accepted whole and zero readings were mechanically frozen into snapshots
without changing their versions (2 and zero.1) or source bytes. Their editable
Articles remain working drafts. Exact-HTML comparison guards anchors, prose and
hydration during this move; selected-registry checks require a pinned snapshot
for every current reading. This closes the legacy editable-path loophole before
authors use the new workflow on those readings.

## Executed trial and limits

The actual candidate was saved without changing its text. Its source SHA-256 is
`d72df53ca3268e7f36e92e04393f5f484ab0f625048d76e419111f13558a6135`;
the selected version is
`product.b130949d00f38714205b2d60e694a03642a51e236a3ec377e176abcae85afa22`.
`product.1` still selects its retained source. This is an exact application proof,
not a newly generated explanation or editorial acceptance.

The first check took 38 ms inside the operation and about 0.61 seconds for the
CLI process. Apply took 41 ms inside the operation and about 0.47 seconds for the
process, including about 39 ms for validation. These single local measurements
exclude model drafting, human judgment, browser enhancement and cross-browser
verification. They establish that local checking/saving does not inherently
require a many-minute loop; they do not establish live conversational latency.
Later idempotent checks during browser validation still spent about 35–37 ms
inside the operation, while full CLI process times varied up to 2.83 seconds.
Process startup and machine contention are therefore separate costs, not hidden
inside a subsecond latency promise. The shared 8011 request returned the expected
new version with HTTP 200 in 68 ms; that is server response, not ready-to-read time.

Nine transaction/preservation tests exercise a second changed draft, idempotence,
old-version restoration, metadata changes, invalid drafts, stale proposals,
snapshot corruption, writer exclusion and a failure after the new file is staged.
Nine existing reading tests preserve accepted baselines, exact saved v1 and
focused return. Chromium and Firefox open/reopen both actual candidate revisions,
retain native endpoints and share the correct version; the reported saved-v1 URL
also passes in both engines (four browser cases total). Commands:

```sh
node --disable-warning=ExperimentalWarning --test tests/what-counts-revision.test.ts tests/anchored-algebra.test.ts
npm run visual:anchored-algebra -- --project=firefox --grep 'checked manuscript snapshots|saved version-1'
```

Final integration also runs the complete `npm run visual:anchored-algebra --
--project=firefox`: 35 passed, one intentional Chromium diagnostic skip. It
includes both engines, fallback/delayed enhancement, startup geometry, saved
locations, focus, fades, static reading, phone fitting and situated return. Node
and test type checks and all 75 project-vision checks pass. The earlier performance
slice separately records its unavailable historical capture; this is not a claim
that every repository test or legacy host has passed.

## Next product judgment

Read the candidate through the comparison of 30 with 11. Judge whether explaining
the separate roles of count and quantity clarifies why the groups multiply, and
whether the handoff to the existing annotations helps. The asynchronous review
question is pending; no prior acceptance of the default explanation is reused
as acceptance of this new prose.

The remaining proof is a substantive accepted revision and another useful edit
through the real workflow, with model/editor effort measured separately. The
parallel native-workbench integration was not exercised or changed. Use the
[authoring packet](../authoring/what-counts-reader-packet.md) for the exact supported
edits. Theseus retains partial programme state rather than marking that larger
product proof complete because the file operation passes.

Handoff outcome: `HUMAN_CHECKPOINT`. Resume the named task with
`npm run --silent theseus -- work start task.kp.authoring-to-practice-20261108 --mode brief`
after the editorial response, then continue the approved revision/iteration
outcomes. Existing global Theseus autonomy-readiness metadata issues remain
outside this bounded repair; graph validation does not certify that global
dispatcher as ready. The parallel task owner retains that integration work.

## 2026-11-09 continuation: clear reasoning, bounded reading refinement

The user now judges the reasoning clear, but questions the topic as a main
teaching exemplar. They accept keeping What counts as a technical reference,
using a stronger learner question next, and orienting the theater immediately.
They also request paragraph indentation and shorter prose per beat. This closes
the earlier editorial question at its actual scope; it does not certify featured
quality. The [reading defaults](../principles/document-theater-reading.md) and
[fractional-equation draft](../authoring/fractional-equation-teaching-brief.md)
record the accepted direction and the next argument without replacing its
current version-1 reader.

The second substantive manuscript revision is selected at:
`http://localhost:8011/reader/what-counts/?reading=product&kpVersion=product.20e4bac959b5497fbdfa06841833c31b117c66a90f471989fdebd7e3c109bd61`.
Its source hash is
`d740103c8121862fb55c2d707ad861b4178f71d220b83ba44441b2f1bd2dcf03`.
The prior product versions, default reading and saved version 1 still select
their original bytes. The revision uses the checked save operation above,
without manual archive/version edits. Ten beats now contain 17–27 words each,
compared with eleven beats and a 93-word maximum before (whitespace-separated
word counts). The count-versus-quantity example, distributive argument,
qualifications and changed-case reasoning survive in ordinary prose. This makes
the introduction longer; it is a bounded presentation candidate, not a claim
that moving text outside a theater automatically improves pedagogy.

The opening state-named annotation is now the first authored beat. The shared
attention sampler previously required approaching its reading line before it
could appear, leaving the entering native frame without orientation. It now
gives an explicitly authored opening note full presence before that line, with
the existing deterministic withdrawal afterward. No new timer or author setting
was added. Prose-led historical versions keep their own openings; Read all and
selection retain precedence. Unit tests cover entry, reversal, direct seek,
essential motion, selection and withdrawal. Browser checks cover actual native
ink, anchored fit, exclusive prose/note ownership and indented paragraphs. These
guards prevent the reported opening class within this shared attention path;
they do not make an unauthored annotation appear or implement new anchor topology.

Paragraphs use the shared document stylesheet's 1.25em first-line indent;
bylines and anchored labels keep their alignment. No lesson-local font, style,
mathematics, compositor or motion timing changes were made. The browser capture
was inspected at desktop and phone widths in Firefox. The existing annotation
font and fade treatment remain; only opening presence changes.

Measured costs: check took 60 ms; apply took 44 ms including 42 ms checking,
and the apply CLI process took approximately 0.53 s. The exact shared-server
URL returned HTTP 200 in 79 ms. Context receipt was issued at 17:12:02 UTC and
the selected registry was written at 17:17:35: about 5m33s of mixed reading,
drafting, shared opening/style edits and tool use. That is an upper envelope for
this mixed implementation trial, not an isolated model generation measurement.
Separate drafting/editor latency remains unmeasured, and the native workbench
was not exercised. The revision operation is fast; the whole product loop is
not yet demonstrated to be fast.

Focused verification:

- 23 reading/revision/attention tests pass. The invalid-reference fixture now
  changes `focusRefs` explicitly; a new first annotation ID made the old
  first-string replacement target a valid arbitrary beat name instead.
- Ten Chromium/Firefox browser cases pass for opening, old/new snapshots,
  saved-v1 restoration, fades and startup geometry, at desktop/phone widths.
  The product reading was then added to the startup cohort for its own handoff;
  both expanded browser tests pass. Chromium reports zero startup layout shift
  in these local cases; this is not field Core Web Vitals evidence.
- App and test TypeScript checks pass; all 75 project-vision checks pass.

Commands:

```sh
node --disable-warning=ExperimentalWarning --test tests/anchored-algebra.test.ts tests/what-counts-revision.test.ts tests/document-reading-attention.test.ts
npm run visual:anchored-algebra -- --project=firefox --grep 'authored opening annotation|checked manuscript snapshots|saved version-1 link|annotation fades|startup keeps'
npm run visual:anchored-algebra -- --project=firefox --grep 'startup keeps'
node --max-old-space-size=3072 node_modules/typescript/bin/tsc --project config/typescript/tsconfig.app.json --noEmit
npm run typecheck:tests
npm run test:project-vision
```

Review the product URL from its introduction into the first annotation and then
the first prose beat. Judge whether entry is self-explanatory and the shorter,
indented prose has the right rhythm; Options → Read all retains the argument.
The current candidate's aesthetic judgment remains pending before using this
opening on the structurally different fractional caller. The fractional brief
can be prepared independently; it identifies version preservation and native
annotation binding as actual translation gaps. No catalogue rollout is underway.

Current handoff: `HUMAN_CHECKPOINT`, 4/15 outcomes complete. The substantive
revision is closed at technical-reference scope. Responsive iteration stays
partial pending separated drafting/editor latency evidence; attention stays
partial pending the bounded visual judgment. Theseus workspace validation passes
(1283 nodes, 34236 events before final receipts), while the previously documented
global autonomy-readiness metadata gaps remain outside this work. Continue the
approved programme after review; do not repeat unchanged visual checks or treat
this checkpoint as approval for a new campaign.
