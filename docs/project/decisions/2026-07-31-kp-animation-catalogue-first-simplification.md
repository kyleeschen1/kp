# Animation Catalogue-First Simplification

Date: 2026-07-31
Status: accepted

## Decision

KP remains a learner-facing product in the long term. Its first learner offer
should deepen understanding for people who have already encountered the
notation; it is not yet a complete curriculum. The immediate product priority,
however, is an internal Animation Catalogue that makes the existing animation
library simple to inspect, compare, tune, and review across domains.

This catalogue is a pressure lab for the durable semantic animation artifact.
It replaces the project dashboard, Editor/API Outline, nested workbenches, and
representation choosers as the default internal home. Those surfaces may remain
temporarily available as diagnostic routes while useful controls and evidence
are migrated or retired.

The catalogue follows these identity and data rules:

1. Its primary index is derived from the loadable `KpAnimationAsset` registry,
   with exactly one top-level row per animation asset ID.
2. Only concrete, inspectable animations appear. Planned work, roadmap rows,
   Theseus actions, and abstract ontology entries do not become catalogue
   artifacts.
3. Reader, lesson, card, review, editor, export, and diagnostic uses are related
   contexts under Details, not peer representations or default choices.
4. Motifs, transformations, semantic objects, renderers, domains, and
   capabilities are searchable metadata. A motif becomes a top-level item only
   when it has an intentional playable harness.
5. One standard host contract may dispatch to equation, graph, diagram,
   programming, and composite adapters. This is one host contract, not one
   universal renderer. A missing adapter produces an honest capability gap and
   `Broken` health; it never falls back to an iframe.

The default desktop composition is:

- a left rail with fuzzy search, a flat result list, and an always-visible
  review capture box at the lower left;
- a frameless center stage that stays visible, with only Play/Pause and a
  scrubber in the universal toolbar; and
- one right inspector that shows Details, Parameters, or Tuning, one at a time.

The page does not vertically scroll. The rail and inspector may scroll
independently. Empty search shows recent, pinned, or review-needed items rather
than a domain ontology. Result rows show only title, a small domain label, and
one derived health state: `Ready`, `Review`, or `Broken`. Detailed maturity,
promotion, compatibility, and verification remain in Details.

Details is one linear inspector rather than tabs, nested menus, or cards. Its
stable order is summary and human disposition; semantics and transformations;
motifs, render targets, and capabilities; health, verification, and review;
then related contexts. Empty sections disappear. Human disposition is distinct
from derived health and is searchable metadata with these initial values:
`Unreviewed`, `Keep`, `Repair`, `Canonical port`, `Merge`, and `Retire`.

Semantic Parameters are durable artifact inputs. Presentation Tuning is
artifact-local review tooling that starts from defaults and becomes canonical
only through explicit promotion. Bespoke controls are permitted when an
artifact exposes useful quantities, but they stay behind the single compact
Parameters or Tuning inspector. Direct manipulation remains inside the stage.

Review capture remains visible in the lower-left rail. Its compact field,
Capture action, current-time indicator, and Command/Control+Enter shortcut
automatically attach the artifact ID, playhead, parameters, tuning, viewport,
screenshot, and build identity. It does not ask the reviewer to select a
representation or complete a metadata form.

Mathematical text uses inline KaTeX by default. Visible headings begin at the
`h3` visual scale while preserving a semantic document outline, including a
visually hidden `h1` when needed. The shell has no “Animation Studio” title or
prominent masthead. Narrow layouts use overlay rail and inspector behavior for
functional accessibility; phone polish and the full browser matrix wait until
the desktop exemplar is approved.

The default route is `/`, with `/?artifact=<id>` for a selected artifact and an
optional shareable playhead. Search text, open inspector, and temporary tuning
remain transient; review capture records the complete state.

## Reason

KP has accumulated several overlapping ways to find and view the same
animation: dashboard entries, workbench identities, editor descriptors, cards,
lessons, review surfaces, and exports. Their controls, nested searches, large
headings, cards, iframes, ontology trees, and peer “representations” obscure the
artifact itself. This makes it hard to see what exists, identify false
playability claims, compare domains, or decide which implementations should be
kept, repaired, merged, canonically ported, or retired.

A single asset-indexed catalogue gives those differences a common inspection
surface without erasing renderer-specific behavior. Expanding it across the
existing library will reveal which seams are real through concrete hosting
pressure. It also supplies the inventory needed to choose a canonical port
order from evidence instead of roadmap prestige or domain quotas.

## Consequences

- Catalogue expansion precedes the next economics exemplar, public website,
  full curriculum, learner accounts, teacher tools, and broad LLM editorial
  work.
- Domain breadth is experimental. Add an artifact when it creates new
  structural pressure or validates a seam with a distinct caller.
- `animation.linear-solve.solve-x` is the canonical shell exemplar because it
  currently has the broadest representation/context sprawl. Its semantics,
  choreography, timing, accessibility, and player behavior are preservation
  constraints; the first change is shell-only and independently reversible.
- The shell stops for desktop human review before it is generalized.
- After approval, KP performs a fast catalogue-wide hosting pass. A catalogue
  port hosts and classifies existing behavior; it does not imply a canonical
  port or promoted product quality.
- A canonical port remains deliberate: repair or build the renderer, verify
  semantics, seek/rewind, presentation, and accessibility, retire the
  superseded path, and promote only from evidence.
- Port order is chosen after the inventory by information gained per effort:
  prefer cheap, concrete, structurally distinct work that tests an abstraction
  or removes duplication.
- The catalogue does not own the roadmap, priority, approval, or execution
  state. Docs and Theseus retain those responsibilities. Derived catalogue
  searches such as `disposition:canonical-port` and `health:broken` are allowed.

## Alternatives Considered

- **Launch a small public site now:** rejected for the immediate tranche. A
  three-artifact public launch would select presentation before KP understands
  its catalogue and hosting seams.
- **Continue directly to economics:** deferred. Economics remains the first
  unresolved promotion in the stable domain order, but that order is paused
  while catalogue pressure clarifies the platform.
- **Clean up the existing dashboard and workbench hierarchy:** rejected. This
  would preserve the mixed ontology, roadmap, representation, and asset model
  that is causing the sprawl.
- **Choose programming execution trace as the second canonical port now:**
  rejected. It has a semantic fixture and timeline, but its external port still
  declares a placeholder contract and the default editor host has no registered
  programming surface adapter. That makes it useful inventory evidence, not a
  predetermined verified second caller.
- **Use one universal renderer:** rejected. The desired abstraction is a shared
  hosting and inspection contract over honest domain adapters.

## Follow-Ups

1. Retain the completed release-baseline recovery and its green matrix as the
   starting baseline for catalogue work.
2. Use the materialized successor
   `run-contract.kp.animation-catalogue-simplification-v1`, sourced from the
   approved next-step review.
3. Build and visually approve the solve-x shell exemplar as one rollback unit.
4. After exemplar approval, host the loadable registry catalogue-wide and
   capture honest health/capability gaps.
5. Review the resulting inventory together, assign human dispositions, and
   derive the canonical port order only then.

## Links

- `docs/project/threads/animation-catalogue.md`
- `docs/project/reviews/2026-07-31-animation-catalogue-simplification-next-step-review.md`
- `docs/project/decisions/2026-07-31-kp-exemplar-first-visual-verification-cadence.md`
- `src/editor/semantic-animation-preservation-manifest.ts`
- `src/editor/animation-surface-adapter-registry.ts`
- `src/animation/catalog-loader.ts`
