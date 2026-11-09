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
