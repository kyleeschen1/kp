# Independent readings of the same checked algebra

This bounded local path uses the accepted `/reader/what-counts/` document
theater. It is not a new mathematical generator, public edition format or
universal reader schema. Begin with `llm-generation-entrypoint.md`.

## Source and authority

- `content/authoring/algebra/what-counts.json` owns the four checked states.
  Use `equation.algebra-intuition` discovery/checking for its exact mathematical
  scope. The commentary deliberately pins that source revision.
- `what-counts.article.md` is the working copy of the accepted explanation.
  `what-counts-zero.article.md` asks a different question using exactly the same
  math. Selected bytes are pinned snapshots identified by the registry.
  `what-counts-product.article.md` is the editable count-versus-quantity candidate;
  its reasoning was judged clear on 2026-11-09. It remains a technical reference,
  not the featured teaching exemplar. The shorter-beat, annotated-opening revision
  is a new presentation candidate; see the [reading defaults](../principles/document-theater-reading.md).
- `what-counts-readings.json` registers local Article paths, distinct document
  versions, titles and descriptions. The default key is `whole`; `?reading=zero`
  selects the second reading. Unknown keys produce a located repair.
- `scripts/what-counts-reader-page.ts` assembles registered readings through the existing
  lesson Markdown, reference resolver, static prose and equation page owners.
  No alternate browser entrypoint, clock, native renderer or stylesheet exists.

Use the checked revision command below when changing a selected reading. It
automates version identity and retains exact old bytes before replacing the
registry entry. Here “version” distinguishes local readings, not public
publication. The original version-1 reading is also explicitly archived. Unknown
versions, cross-reading substitutions and changed snapshot bytes are repair gaps.

## Check and save a revision

Edit the working Article, then check it without changing the selected reading:

```sh
npm run author:what-counts -- --reading product --source content/authoring/algebra/what-counts-product.article.md
```

The result contains a `basis`, source digest, proposed version/URL and operation
timings. A checked URL is not available until applied. Repeat the command with
`--apply --expect <basis from the check>` to save it. Optional `--title` and
`--description` participate in revision identity too. Use the returned URL on
the existing server, or reload `?reading=product`. Selecting a candidate is not
editorial acceptance and does not adopt it as the default explanation.

The operation uses this reader's existing compiler. It stores immutable Article
snapshots under `content/authoring/algebra/readings/<reading>/`, pins their hashes,
and replaces the registry atomically after checking the candidate and old address.
An invalid draft leaves the selected source intact. A changed registry, source or
proposed draft invalidates an outstanding `basis`; check again. Cooperating writers use one
registry lock. A process killed while owning that lock needs a verified stale-lock
cleanup; the command does not guess whether another writer has stopped.

The working draft can then change without altering the selected snapshot. Read
the registry to identify selected bytes; do not edit snapshots or manually change
versions. This is a bounded local source workflow, not a new editor, model service,
publication format or proof of live conversational generation. See the
[revision trial](../reviews/2026-11-08-authoring-revision.md) for measured limits.

## What can change without engine edits

Write the explanation first using `explanation-first-worksheet.md`. Keep the
connecting reasons, examples and transfer prompt. The Article supports ordinary
paragraphs and the existing `kp-animation-story` grammar. It has no inline TeX,
arbitrary HTML or general Markdown formatting in this bounded projection; use
native equations in the stage and readable prose for supporting comparisons.

Within the story, keep the pinned asset/version and the three operation passages
`passage.state.what-counts.collected`, `.counted`, and `.opened` at progress
333, 667 and 1000. Keep the first prose state at 0. Additional prose beats may
share an existing checkpoint: prose count is independent of operation count.
Every focus reference must resolve to the checked semantic source.

Start a new guided reading with its opening state-named annotation beat so the
first native frame already has an orientation. An explicit unaided prediction
can justify another opening. Include later state-named beats when an existing
annotation moment serves the explanation. Omit them when prose is sufficient;
the retained zero reading demonstrates
two annotation moments instead of four. Keep its static fallback wording aligned
with the notes in `what-counts-commentary.ts`. This remaining duplication has a
parity/preservation check; several-target note design is not implemented here.
New anchor topology or changed mathematics needs its responsible semantic and
presentation owner, not a generic fade or a cleared revision pin.

## Check the actual result

```sh
npm run author:check -- --task equation.algebra-intuition --request content/authoring/algebra/what-counts.json
node --disable-warning=ExperimentalWarning --test tests/anchored-algebra.test.ts tests/what-counts-revision.test.ts
npm run visual:anchored-algebra -- --project=firefox
```

The first command checks math only. The second compiles every registered Article
and checks the two retained baselines, pins and rejection cases. The browser
command checks actual native output, static/Read all access, restoration and
phone fitting. Neither mechanical check proves explanatory quality or learning.

Open `http://localhost:8011/reader/what-counts/` or
`http://localhost:8011/reader/what-counts/?reading=zero`. The server reads the
selected Article on each request; reloading an applied revision displays its
pinned bytes. A valid CLI math report alone does not prove that a particular
Article reached a host.

Adding another registered reading of these same four states is a content edit.
Changing the mathematics, creating a new choreography or moving this path to a
different domain remains outside this packet. Registration itself does not
approve new autonomous scope.

## One situated follow-up

Keep the original focused Share address with the question. A response reading
can receive `returnTo`, containing the percent-encoded relative original address
(pathname, search and fragment). Retain its lesson/version, progress, `kpReading`
and at least one known `kpFocus`; do not guess a pixel position or remove pins.
The local compiler validates these against the original Article and checked
algebra. Unknown anchors, stale versions, missing focus/position, nested returns
and unrelated paths fail with `location.returnTo`.

The existing Options menu then offers Return to your question. No editor or model
service is involved. The [authored exchange](../reviews/2026-11-08-explanation-first.md#situated-question-and-recovery)
has complete working links and clearly distinguishes this scripted context test
from an actual learner conversation. `visual:anchored-algebra` exercises actual
captured share addresses and their return in both browsers and viewport sizes.
