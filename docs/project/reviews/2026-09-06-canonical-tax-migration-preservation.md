# Canonical tax migration preservation manifest

Approved scope: `2026-09-05-structural-authoring-canonical-tax-long-loop-proposal.md`.
Theseus owns ordered execution and verification; this is a preservation inventory,
not another slice queue. Baseline: `ac2be16ee`, after explicit G2 acceptance.

## Canonical path and authority

The actual reader URL is `/experiments/kinetic-figure/supply-tax/`, not the
similarly named source directory. Its physical document is
`experiments/kinetic-figure/supply-tax/index.html`; it loads
`src/experiments/kinetic-figure-supply-tax/kinetic-figure-supply-tax-page.ts`.
At the audited baseline, that page called `mountKpSupplyTaxKineticFigure` without a source.
The host is `kinetic-figure-supply-tax-entry.ts` beside it. Existing SVG and
native KaTeX adapters own paint; the existing reader timeline clock owns time.
The migration changes the source to retained semantic-state assembly and verified
tax lowering, never domain legality, exact economics, paint or navigation design.

`rg -n 'mountKpSupplyTaxKineticFigure' src tests scripts` finds exactly two live
callers: the canonical page and `authoring-market/authoring-market-host.ts`.
The latter already supplies its own authority, instruction and frame sampler.
No other caller needs the host's absent-source branch. Retire that branch,
its adjacent default Article/score assembly and its local `exactProgress` helper
in the same commit as the route switch. Keep the injected host usable by both
callers; do not import preview lifecycle code into it.

The original `createKpEconomicsSupplyTaxAnimationAsset` and
`sampleKpEconomicsSupplyTaxAnimationFrame` remain domain-facing owners used by
the standalone Scroll Score and semantic parity tests. Their continued use is
not a second sampler in the migrated page. Preserve these constructors, the
shared score, scene and SVG modules, and the existing Article/import lock.

## Observable parity

| Boundary | Preserve |
| --- | --- |
| Economics | Demand `P=12-Q`, original supply `P=2+Q`, tax `4`; `(Q,P)=(5,7)` before, quantity `3`, buyer/seller prices `9/5` after; private surplus `25/2` to `9/2` each, revenue `12`, loss `4` |
| Instruction | Existing Article wording, eight reference addresses and beat order; existing score titles/claims and stage formulas; one model revision for prose, facts, attention and samples |
| Navigation | Eight semantic stops; only tax-input to supply-translation owns tax motion; hash restoration, history, find, arrows, replay, scrub, native swipe, wheel and interrupted/distant requests |
| Presentation | Existing CSS, protected stage, passage typography, graph geometry, original-supply historical evidence, native labels and attention; no new transition or timing table |
| Siblings | Log/exponent, TypeScript and surface/contour cards remain mounted through their existing owners and clocks |
| Lifecycle | Reduced-motion settlement, resize, pagehide/bfcache behavior, disposal, HMR full-document revision boundary |
| Delivery | Same physical route under ordinary build; no authoring preview HTTP dependency or browser execution of author templates |

The preview's current wording and exact-label mode differ from the canonical
reader. Do not mistake equal economics for visual parity. Prepare the canonical
reference instruction explicitly and preserve its label policy during cutover;
do not attach preview specimen labels, history tables or comparison UI to the
reader. Preview revision replacement and reader page lifetime stay separate.

Canonical instruction preparation reuses the existing literal Article file and
score claims, binds them to the framework-derived reference revision, and checks
that revision against the reviewed domain input before publishing. A different
model returns `kp.authoring.canonical-tax-instruction-gap`; it cannot silently
inherit the reference lesson. This is a bounded parity migration, not automatic
truth verification or parameterization of free prose. The existing parameter-bound
preview remains the place to explore variants. Explicitly authored future
canonical variants need matching instruction and their own review.

The baseline physical document had only an empty `#app` before enhancement.
Build-served verification must distinguish that baseline from any newly supplied
meaningful static source; neither a successful dev endpoint nor a no-JS preview
fact fixture proves ordinary reader delivery.

## Executable preservation surface

`npm run test:economics-supply-tax` covers 81 domain, Article, score, scene, route,
SVG and exact-accounting tests. `npm run test:browser:economics-supply-tax`
covers the real canonical URL, all eight stops, native input, phone geometry,
reduced motion and visual checkpoints. `npm run test:authoring-integration`
covers exact state-derived frame parity, revision isolation, source ownership,
bound facts and preview failures. Extend these owners for cutover-specific
assertions rather than testing a parallel page. Use ordinary production-build
delivery checks for the final reader boundary.

Rollback unit: route source injection plus adjacent default wiring retirement.
The preserved domain constructors and sibling cards are outside that rollback.
G3 remains required before merge or further generalization.

## Adopted source boundary

The canonical page now mounts `canonical-tax-reader.ts`, which owns the existing
host and one revision-local query session from `canonical-tax-source.ts`.
The host requires a supplied source/instruction and no longer imports the raw
Article or constructs a default score, asset, sampler or local progress fraction.
The original domain constructors remain for other callers. Canonical labels
retain their prior formatting; preview labels retain their exact-value policy.

Before cutover, the s22 browser check compared original and prepared paths at the
actual URL across eight stops and reverse/transit samples, with identical graph
markup, prose, accessible labels and progress. After cutover, the same browser
owner exercises the production entry directly; no old/new test flag remains.
All 11 canonical browser checks pass. Reverse-state comparison normalizes only
CSS declaration ordering and equivalent numeric serialization, retaining every
property and value. Exact frames, revision ownership and bounded history remain
covered by the 75-test authoring integration suite. Ordinary build and the 81-test
economics suite pass. Final lifecycle, built-delivery and release checks precede G3.

## Native correction ownership

Supported-browser lifecycle pressure exposed an older deferred snap-restoration
callback overwriting a newer native viewport movement. Instrumented execution
observed snap disabled and position `0.8995`, followed by the old callback restoring
mandatory snap and position `1`. A same-task regression reproduced this before
repair. The existing host now checks whether the viewport still occupies its
settled target before restoring snap; a newer movement continues through the
existing native projection and idle-settlement paths. No clock, gesture threshold,
animation curve or semantic model changed. Temporary trace logging was removed.

The final canonical cohort passes 39/39 across Chromium, Firefox and WebKit,
including the new race, phone interruption/resize, retained-page restoration,
disposal and all prior route checks. The lifecycle fixture uses the existing
hundredth-step slider and holds native scrollend until its explicit checkpoint;
neither test adjustment changes production interaction semantics.

## Ordinary delivery and bounded static reading

Status: partial implementation, blocked at the production ownership boundary.
The generated reading and its freshness/unit checks pass; the built-browser
probe does not. Do not infer shipped delivery from the implementation below.

`compile:canonical-tax-source` emits both checked reference data and a separate
no-JavaScript reading artifact. The latter uses the same prepared eight prose
phrases, existing build-time Markdown/KaTeX renderer, and exact fact table. It
does not invent a graph, animation, editor, or general publication format.
The Vite HTML adapter reads only that generated artifact; it never executes
author code or calls the authoring service. Keeping HTML separate avoids adding
fallback markup to the reader's JavaScript data payload. With JavaScript enabled,
the `noscript` content is not painted and the existing card host still owns layout.

`visual:canonical-tax-production` starts Vite preview against the ordinary build,
not the development server. It checks normal and reduced-motion endpoints,
four-card preservation, accessible slider text, no development/preview requests,
and meaningful no-JavaScript prose, MathML and exact facts. Bundle inspection also
checks the canonical source closure, excluding trusted templates, build-time
instruction binding and preview transport. This is bounded static reading, not
complete static figure publication or durable last-valid publication storage.

The existing default build excludes the canonical URL. Its first built-browser
cohort failed all nine cases because Vite preview served the catalogue fallback.
Adding only that physical input then failed the unchanged production erasure
guard: 36 rendered modules remain development-owned, including the canonical
host, shared scaffold, authored market preparation, and all three sibling cards.
The input addition was removed; no erasure exception was introduced. The earlier
successful ordinary builds did not certify this page's delivery.

This fires the approved s25 stop: normal build cannot deliver the page within
the existing infrastructure. See `2026-09-07-canonical-tax-production-boundary-stop.md`
for the exact evidence and proposed scope decision. Canonical development source
adoption and the 39-browser lifecycle proof remain valid; production delivery,
release completion and G3 readiness are not claimed.
