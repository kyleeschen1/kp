# Momentum–energy reader: first visual checkpoint

## Current review: algebra-grounded orientation

The user accepted the demos' clarity, then requested a broader, algebra-grounded
entry point. The page now begins with the relationship between force, momentum
and energy. Read the starting definitions and law, scan the compact relationship
map, then use its links to inspect substitution, differentiation or accumulation.
The existing particle figures follow as examples. The original packet below is
historical evidence for the earlier narrow opening, not the new review question.

Please judge whether the mathematical relationships now feel connected and
motivated, whether each deduction makes its assumptions and reasons clear, and
whether scanning the chain versus reading a step's explanation feels natural.
No new symbolic manipulation or vector-calculus animation is claimed. This
revision adds source content and a small passage-anchor/title projection repair,
not new browser runtime, styling or physics. The full controls/no-JavaScript
checks remain; the new browser check traverses the links in both editions.

The first revised browser run caught a test-only mismatch between innerText and
textContent once the cue contained KaTeX. The held-prose check now compares the
same representation before and after playback; no accessibility math was removed.

The revised discovery checks pass: eight focused tests and four scoped Chromium
checks, including link closure in both editions and the narrow differentiation
layout. Full type checking also passes. These checks establish implementation
behavior, not whether the explanation teaches at the right level; that remains
the current human checkpoint.

Canonical interactive host: <http://localhost:8000/experiments/mechanics-relations/>.
Static host: <http://localhost:8000/experiments/mechanics-relations/static.html>.
Both use the existing shared development server, not an additional server.

Source and mathematical rationale are in the
[authoring evidence](2026-09-13-momentum-energy-authoring-evidence.md).
The [approved proposal](2026-09-13-relational-reader-delivery-proposal.md) owns
scope; `run-contract.kp.relational-reader-v2` owns live status and the review gate.

## What to judge

Read normally, then play or scrub each example. Does the turning case make it
clear that the momentum arrow changes while kinetic energy does not? Does the
preceding prose tell you where to look, and can you return to reading without
feeling that you missed a timed explanation? Compare the static edition: does
motion add useful continuous direction/perpendicularity tracking?

This is the first treatment, not a claim that the visual language is final.
Each Article stage remains in ordinary page flow and retains its locally explored
state. It is not a sticky full-page dashboard or a new card deck. The explanatory
paragraphs do not disappear when playback starts; scrolling never consumes a
step. Slowed playback is labeled, and the slider still measures physical seconds.
The short reasoning excursion, exact return, authored overview and reconstruction
are subsequent approved work, not features claimed at this checkpoint.

## Programmatically established

- Physics fixtures, governed lineage, reference closure, locked Article imports,
  static math, runtime manifest rejection and coordinate separation are checked
  by `node --disable-warning=ExperimentalWarning --test tests/momentum-energy.test.ts`.
- `npm run visual:mechanics-relations` checks visible intermediate playback,
  real pointer dragging, native keyboard adjustment, exact reverse, held prose,
  scrolling independent of motion, pause offscreen, decoded standalone SVG,
  no-JavaScript starting figures, narrow layout and reduced-motion endpoints.
- The reader uses the existing timeline clock, attention projector, lesson
  document validation and Graph2D session lifecycle. The new adapter is a bounded
  candidate for these two analytical cases, not a promoted cross-domain renderer.
- Full types, architecture checks and the production build are part of the
  recorded evidence. No supported-browser release claim follows from Chromium
  discovery; the representative release matrix remains in the approved last gate.

The first browser run exposed invalid standalone SVG shorthand attributes and a
stale server configuration during reload. Explicit XML attributes repair the
shared output; actual no-JavaScript image decoding now guards that boundary.
A subsequent run lost the shared server; its ports were empty and the normal
`npm run dev` server was restarted. A complete scoped rerun then passed. These
earlier failures are not relabeled as passes.

## Cost and reuse limits

The initial production measurement is approximately 25 KB gzip for the complete
reachable JavaScript/CSS closure, plus 5 KB HTML. The static edition has no module
script, about 9.4 KB CSS and 4.1 KB HTML plus four sub-kilobyte SVGs. These figures
exclude font downloads, HTTP overhead and device CPU cost. About 10 KB of the
interactive closure is the existing shared reader-clock chunk; about 8 KB is
KaTeX CSS. KaTeX's runtime, the authoring compiler, editors and WebGL are absent
from this reader's dependency closure. Other application chunks retain their
existing build size warnings; this work does not resolve them.

Authoring/build code owns the checked model binding and compilation. The browser
loads a revision-checked bounded physics manifest and derives every quantity from
one physical time. SVG/HTML only project it. Both editions share the same source,
endpoint generator and typography policy. Source-only encounter reuse and the
cost of authoring a second explanation remain to be demonstrated, not assumed.

On acceptance, resume the same contract at the reasoning-and-return package;
do not reopen the old motion loop or promote the candidate across domains.
The CLI has no blocked slice status, so the contract and target are paused with
their supported `blocked` status while the review slice stays in progress. After
the user accepts, restore both to `ready`, record r2 complete, then start tracked
context for r3. For bounded retrieval use:

```sh
npm run theseus -- work context next-action.kp.relational-reader --mode brief
```

The generic workspace-handoff helper also reported a source-reference privacy
warning. Graph validation passed; that unrelated Theseus helper was not changed
under this delivery scope. Use the canonical proposal and this bounded retrieval
rather than treating a generic “continue” recommendation as visual approval.
