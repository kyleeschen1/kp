# Reader attention: arrival, hold and release

The user approved the [two-reader delivery](../2026-11-08-reader-attention-delivery.md)
after design feedback. Both consumers are implemented and verified. Theseus owns
execution in `run-contract.kp.reader-attention-20261108`; exact fade feel remains
a human judgment, without authorizing a catalogue rollout.

## Behavior and ownership

The canonical hosts remain `/reader/what-counts/` and
`/reader/solve-fractional-linear/`, using the document theater and native KaTeX
compositor. Checked algebra source, fractional lesson text, semantic identities,
mathematical choreography and the accepted typography remain unchanged.

`document-theater-attention.ts` now samples a discriminated prose-or-annotation
presence from reading position. Prose withdraws before a note arrives; notes and
their connectors fade together, remain readable while paused, and withdraw before
incoming prose or mathematical transit. Reversal and direct seeks sample the same
function. Reduced/static motion uses endpoints. Selection and Read all reclaim
the real prose. The native adapter still rejects missing, duplicate or unpassed
anchors rather than fading stale geometry through a transformation.

The existing semantic focus service continues to own refs and input precedence.
The document theater bounds story focus to its passage hold. Manual reading,
outline navigation and controls release restored URL focus; pointer and keyboard
focus retain their own existing enter/leave lifetimes. Semantic links return to
their surrounding prose color while retaining an underline affordance.

`src/reader/app/semantic-focus.css` is the shared presentation owner for prose,
native equation focus and legacy material focus. Its story/direct color tokens
resolve against the host theme; the fractional exemplar retains flat focus.
Changing this policy needs no source-equation, beat or selector edits. Native
colors update synchronously with compositor sampling: the old independent
120 ms glyph color transition could expose intermediate paint after focus had
already changed, so it is retired. This is a reader policy, not a new global
salience store, authoring schema or universal renderer contract.

## Observed regressions and prevention

- URL focus previously remained above story focus indefinitely. Both readers'
  browser regressions restore an exact target, navigate by scroll and outline,
  and compare actual native color against neutral paint. A central token override
  must change actual native paint in both desktop and phone consumers.
- Late native height reservation in Firefox reset the reader to the beginning
  of its current passage, losing a partially restored fade. Layout invalidation
  now retains the position within that passage when it preserves mathematical
  progress; otherwise the existing semantic operation seek remains authoritative.
  Fresh-link restoration and explicit resize during a fade exercise this boundary.
- Annotation presence was binary. Pure sampling checks now cover entry, full
  hold, departure, final withdrawal, reversal, selection, reduced motion and
  inadequate layout room. The typed reading owner prevents simultaneous prose
  and annotation presence; native geometry and browser timing remain runtime laws.
- The production closure check found existing developer-toolbar rules in
  `document-theater.css`. Those rules now live in the development-only toolbar
  stylesheet. Their selectors and declarations retain the same menu behavior;
  the production marker gate remains intact.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/document-reading-attention.test.ts tests/fractional-theater-focus.test.ts tests/canonical-equation-semantic-focus.test.ts tests/semantic-reader-semantic-focus.test.ts tests/semantic-reader-semantic-focus-bindings.test.ts`: 22 tests pass.
- `npm run visual:anchored-algebra -- --project=firefox`: all 14 Chromium/Firefox
  checks pass. Both readers' central paint substitution and navigation release
  run at desktop and phone widths. Annotation reversal, partial restoration,
  layout interruption, selection, reduced motion, missing/duplicate targets,
  reload paint, static reading and legacy links are exercised. Screenshots show
  the annotation-only interval and inherited prose family. Near-one opacity
  assertions tolerate browser scroll quantization; pure endpoint laws stay exact.
- `npm run visual:fractional-linear-equation -- --rising --base-url=http://127.0.0.1:8011`
  passes desktop/phone centering, held mathematics, reversal, font reflow, native
  find, selection, Read all, print and Options/review keyboard return.
- The same command with `--passage-boundaries` passes first/last passage
  transitions, reversed samples and retained equation visibility at both widths.
- `npm run typecheck` and the final `npm run typecheck:tests` pass. Svelte has
  zero errors or warnings. `npm run check:architecture` passes dependency,
  framework, reader, semantic, compiler-authority and conformance gates.
- `npm run build:bundle`, `npm run check:reader-production`,
  `npm run check:reader-budgets` and `npm run check:dev-review-production` pass.
  The production check covers all 12 manifest routes; the dev-only closure
  rejects 12 markers across 627 built files. Existing large-chunk build warnings
  remain; no budget or gate was relaxed.

The five affected existing stylesheets plus the new focus owner total 44,101
source bytes versus 43,364 before this change (+737); the shared owner is 2,046
bytes. One explicit owner replaces focus rules split across geometry, palette
and prose files; fewer files is not the claimed outcome. The fractional route's
measured runtime closure is 148,648 gzip bytes and passes the existing 5% growth
gate. This is an absolute measurement, not a measured speedup or a comparison
against the immediately preceding commit. The annotation route remains a local
candidate outside the production manifest; no publication was added.

## Review

Open `http://localhost:8011/reader/what-counts/`. Use Options to choose a Notice
step, then scroll slowly backward and forward: prose should withdraw first,
notes and connectors should arrive together, pause at readable strength, and
withdraw before the next explanation. Repeat on a narrow window and with
reduced motion. Source prose remains available through Read all.

Open `http://localhost:8011/reader/solve-fractional-linear/`. Follow a highlighted
step past its hold, then reverse; focus should release to neutral and reconstruct
when returning. Hover or keyboard-focus the linked x, then leave it. The equation
and linked prose should release together. A focused URL is an initial attention
request that yields when reading resumes.

The detached development server is a live review convenience, not a supervised
service. No editor interface, publication, merge or deployment is included.
