# Independent readings of the same checked algebra

This bounded local path uses the accepted `/reader/what-counts/` document
theater. It is not a new mathematical generator, public edition format or
universal reader schema. Begin with `llm-generation-entrypoint.md`.

## Source and authority

- `content/authoring/algebra/what-counts.json` owns the four checked states.
  Use `equation.algebra-intuition` discovery/checking for its exact mathematical
  scope. The commentary deliberately pins that source revision.
- `what-counts.article.md` is the accepted explanation. `what-counts-zero.article.md`
  asks a different question using exactly the same math. Both live beside it.
- `what-counts-readings.json` registers local Article paths, distinct document
  versions, titles and descriptions. The default key is `whole`; `?reading=zero`
  selects the second reading. Unknown keys produce a located repair.
- `scripts/what-counts-reader-page.ts` assembles both through the existing
  lesson Markdown, reference resolver, static prose and equation page owners.
  No alternate browser entrypoint, clock, native renderer or stylesheet exists.

Edit an Article, update its registered document version when revising published
reading coordinates, then reload the route. Here “version” distinguishes local
readings; it does not imply public publication. The registry rejects duplicate
or empty versions. Existing URLs identify the exact selected reading/version;
they do not archive historical source bytes. Git retains the accepted checkpoint.

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

Include a state-named beat when an existing annotation moment serves the
explanation. Omit it when prose is sufficient; the zero reading demonstrates
two annotation moments instead of four. Keep its static fallback wording aligned
with the notes in `what-counts-commentary.ts`. This remaining duplication has a
parity/preservation check; several-target note design is not implemented here.
New anchor topology or changed mathematics needs its responsible semantic and
presentation owner, not a generic fade or a cleared revision pin.

## Check the actual result

```sh
npm run author:check -- --task equation.algebra-intuition --request content/authoring/algebra/what-counts.json
node --disable-warning=ExperimentalWarning --test tests/anchored-algebra.test.ts
npm run visual:anchored-algebra -- --project=firefox
```

The first command checks math only. The second compiles every registered Article
and checks the two retained baselines, pins and rejection cases. The browser
command checks actual native output, static/Read all access, restoration and
phone fitting. Neither mechanical check proves explanatory quality or learning.

Open `http://localhost:8011/reader/what-counts/` or
`http://localhost:8011/reader/what-counts/?reading=zero`. The server reads the
selected Article on each request; reloading applies its current bytes. A valid
CLI math report alone does not prove that a particular Article reached a host.

Adding another registered reading of these same four states is a content edit.
Changing the mathematics, creating a new choreography or moving this path to a
different domain remains outside this packet. Registration itself does not
approve new autonomous scope.
