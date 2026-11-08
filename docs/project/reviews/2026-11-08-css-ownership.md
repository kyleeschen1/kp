# CSS ownership inventory

Baseline: `779a34ee4`, before the bounded algebra conversion.
Reproduce the complete per-file inventory with `npm run audit:css`.
The command writes an ignored JSON report containing every stylesheet, source
bytes/declarations, literal consumers with lines, CSS import edges, unresolved
references, and repeated declaration groups with their selector locations.
It includes uncommitted new owners during a conversion and excludes removed files.

## Complete source scope

There are **124 tracked `.css` files**, all under `src/`, totaling **691,424
source bytes**. The historical count of 96 has no recovered equivalent scope.
These are source costs, not shipped payload measurements. Inline Svelte styles,
generated CSS, dependencies and runtime-assigned styles are outside this count.

| Directory owner | Files | Source bytes | Declarations |
| --- | ---: | ---: | ---: |
| tutorial | 47 | 241,494 | 4,452 |
| experiments | 34 | 123,470 | 2,781 |
| editor | 16 | 106,200 | 1,793 |
| reader | 13 | 68,042 | 1,406 |
| rendering | 4 | 37,466 | 853 |
| public-web | 4 | 30,385 | 653 |
| foundation (`styles.css`, `document-base.css`) | 2 | 63,006 | 1,668 |
| dev-toolbar | 1 | 9,092 | 159 |
| project-dashboard | 1 | 5,738 | 142 |
| repertoire | 1 | 3,355 | 134 |
| article | 1 | 3,176 | 75 |

The scanner found **142 repeated multi-declaration groups**. It preserves
declaration order, importance and enclosing conditions; one-property matches
are omitted as weak evidence. Equal declarations do not establish equal
responsibility, interchangeable selectors, unused CSS or safe source-order changes.
Literal references include code imports, HTML and packaging strings; computed
paths and runtime reachability still require source inspection.

## What the inventory supports

1. **Algebra ownership is the selected conversion.** Four example-owned styles
   are consumed by other examples and by preview/export tooling. Common-factor
   and composed-algebra repeat seven reading/control rules (13 declarations).
   The native equation card, reusable reasoning presentation and algebra reading
   rules have existing rendering/reader boundaries to own them. Preserve the
   composed text-first opt-in; this inventory does not make it a global default.
2. **Editor surfaces contain the largest repeated groups.** Six stage shells
   share ten declarations; accessible status treatments repeat across several
   surfaces. These are useful candidates for the editor owner to investigate,
   with native ownership and accessibility preservation. No editor file changes
   are authorized by this maintenance run.
3. **Tutorial families have plausible narrow shared owners.** Log/exponent and
   TypeScript focus cards repeat control/layout groups; the scaffold and lesson
   shell repeat seven control declarations. Inspect actual cascade/consumer
   boundaries before extraction. Similar values across domains do not justify
   one global stylesheet.
4. **Global/economics graph declarations overlap.** Several groups occur both
   in `src/styles.css` and the economics graph owner. Determine which host still
   needs the global copy before removing it. Existing route-owned CSS tests are
   a useful preservation boundary, not proof that every overlap is redundant.
5. **Two files have no detected runtime literal consumer:**
   `src/tutorial/kp-tutorial-motion-stage-reservation.css` and
   `src/tutorial/mechanics-relations/equation-rail.css`. The former is referenced
   by a contract test. Neither is declared dead or removed: computed consumers,
   historical obligations and current generated output need a separate audit.

## Complete selected consumer set

The native-card stylesheet is used by the originating distribution entry,
reusable reasoning, common factor, composed algebra, algebra intuition and
distribute/collect. Reusable reasoning CSS also serves its code entry.
Common-factor CSS serves its originating entry and all three composed callers;
composed CSS serves the three composed callers.

The conversion must also update `scripts/vite-authoring-structural-preview.ts`,
`scripts/algebra-interactive-edition.ts`, `scripts/build-common-factor-edition.ts`
and `scripts/build-composed-algebra-edition.ts`. Preview strings are consumed
before JavaScript hydration; exported CSS is traversed and copied by
`scripts/local-stylesheet-closure.ts`. Replacing only TypeScript entry imports
would leave those complete consumers behind.

This inventory is evidence for the approved proposal, not a second execution
queue. Theseus owns execution; wider consolidation candidates remain follow-up
work. The separate maintenance evidence records measured conversion results.
