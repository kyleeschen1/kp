# Concept Room Architecture Walking Skeleton Closeout

Date: 2026-07-19
Status: architecture accepted on 2026-07-19
Run contract: `run-contract.kp.concept-room.architecture-walking-skeleton-v1`
Canonical plan: `docs/project/reviews/2026-07-19-linear-equation-architecture-stabilization-proposal.md`

Architecture review decision:
`docs/project/decisions/2026-07-19-kp-concept-room-architecture-review.md`

## Outcome

The approved 27-slice architecture loop is complete. KP now has one plain,
end-to-end `2x + 3 = 8` concept room that proves the intended ownership model
without claiming visual completion or general platform promotion.

The published content artifact owns prose, checkpoints, semantic references,
capability and provider requirements, routes, Review metadata, and provenance.
The exact-rational provider independently generates the canonical problem and
verifies both intermediate steps and the final solution through a versioned
JSON protocol. One anti-corruption mapper turns that evidence into a KP-owned
exact trace. Symbolic KaTeX, exemplar-local balance SVG, URL state, and Review
HTML all project from that shared trace and clock.

The browser can mount direct canonical and snapshot-identity URLs, switch
between symbolic and balance views, move among checkpoints, enter Touch or
Review, rewind through browser history, and dispose cleanly. The server can
serve meaningful searchable Review HTML with no JavaScript. Missing provider,
Ask, artifact, capability, or renderer dependencies retain Review content and
emit structured diagnostic codes instead of leaving a blank shell.

## Delivered Boundaries

- Eight declared boundaries—content, protocols, kernel, domains, authoring,
  integrations, projections, and app adapters—form an acyclic dependency graph
  with one public entrypoint each.
- The architecture gate covers 40 files and keeps the seven pre-existing legacy
  exceptions frozen rather than normalizing new work around them.
- Protocol DTOs and runtime schemas are neutral; the provider compiles and tests
  independently of KP, DOM, KaTeX, SVG, and Three.js.
- Authoring APIs preserve literal inference without mandatory user generics and
  reject unavailable handles, executable callbacks, raw style values, stale
  catalogs, tampered artifacts, incompatible provider versions, and unsupported
  capability majors.
- Room state, reducer commands, replay, snapshots, and URLs are deterministic
  and serializable. Hover and measured layout remain outside durable state.
- Provider, URL, persistence, and lazy-load effects are room-scoped, cancellable,
  revision-anchored, and disposable; no global event bus was introduced.
- The canonical provider input is a deterministic seed that generates exactly
  `2x + 3 = 8`; intermediate subtraction, division, and substitution are
  externally verified before KP maps or renders them.
- Symbolic and balance projections use one sampler, exact rational values,
  persistent semantic identities, KaTeX labels, accessible names, and common
  typed theme/focus roles. The balance contract remains exemplar-local.
- Review publication is deterministic, searchable, printable, checkpoint-linked,
  and inspectable through a runtime-validated machine capsule. It does not
  scrape hydrated DOM.
- One human-readable plan and one Theseus run contract own the work. Slice
  status, verification, and evidence live in Theseus rather than a duplicate
  execution plan.

## Closeout Evidence

- `npm test`: 1,510 tests passed, 0 failed. The first closeout run exposed that
  the boundary inventory test omitted the declared content entrypoint; the test
  was corrected and the full suite then passed.
- `npm run build`: application, Node, test, and independent domain typechecks
  pass; production build passes with only the pre-existing large-chunk warning.
- `npm run smoke:linear-equation`: 2 Chromium scenarios pass. They cover the
  generated-provider path, step and solution verification, direct snapshot URL,
  symbolic/balance frame parity, mode and checkpoint switching, no-WebGL
  operation, disposal, and the structured failure matrix.
- Focused server/runtime integration: 9 tests pass across existing API routes,
  canonical no-JS Review delivery, deterministic generation, strict trace
  mapping, both render contracts, and provider/capability/renderer failures.
- Adjacent Chromium regression cohort: 5 scenarios pass across legacy routing,
  concept navigation and rewind, KaTeX seek/rewind, SVG identity/theme parity,
  no-JS Review, and browser Find.
- Architecture, inference-cost, generated-catalog freshness, and Theseus
  workspace validation gates pass.

## Architecture Assessment

The loop was directionally right. Doing the neutral protocol, exact provider,
publication, URL, reducer, and anti-corruption boundaries before visual work
made the final browser wiring small enough to diagnose honestly. In particular,
the same external verification evidence now drives both algebra and geometry,
and Review is a first-class publication rather than a screenshot or hydrated
DOM afterthought.

The slice count was high, but the commit cadence produced independently
reversible boundaries and caught two useful design issues before polish: term
identity had to persist across equation frames, and the full boundary audit was
not actually importing its content entrypoint. No broad legacy migration was
needed to establish the new path.

## Honest Residual Risks

- The room is intentionally structurally plain. Typography, palette, spacing,
  focus-ring appearance, equation choreography, hover-linked prose, and balance
  aesthetics have not been reviewed or implemented.
- The deterministic provider seed and canonical verified step requests live at
  the app-composition edge because the current content manifest cannot declare
  typed provider inputs. Before a second generated concept uses this pattern,
  decide whether provider input belongs in a versioned content data reference or
  remains exemplar-specific composition.
- The server Review route and browser runtime are intentionally specific to the
  linear-equation exemplar. A second independent concept must prove the seam
  before creating a general runtime or Review registry.
- When interactive dependencies fail in the browser, the fallback preserves all
  checkpoint prose but does not reconstruct the server's full KaTeX and static
  SVG publication. It is meaningful and searchable, not presentation-equivalent.
- Snapshot identity round-trips through URLs and state, but no remote snapshot
  store is connected. The smoke proves direct snapshot-addressed mounting, not
  collaborative snapshot retrieval.
- Ask is intentionally explicit but unavailable. No LLM execution, correction,
  or conversational choreography was added in this architecture loop.
- The existing seven legacy exceptions and the pre-existing production
  large-chunk warning remain. Neither was widened by the concept-room work.

## Resolved Stop And Review Questions

The mandatory stop was honored. Human review accepted the recommended answer to
all four questions on 2026-07-19:

1. Is the provider-input placement acceptable for the first exemplar, with a
   second-concept gate before formalizing it?
2. Is the content-specific server/runtime composition an acceptable strangler
   seam until another subject proves a registry abstraction?
3. Does the failure fallback need full static KaTeX/SVG parity before visual
   work, or is searchable checkpoint prose plus the canonical server Review
   sufficient for this stage?
4. If the boundaries are accepted, should the next plan polish exactly this one
   linear-equation exemplar—without generalizing—under the exemplar-first visual
   review protocol?

The accepted answers are yes: retain the first-exemplar seams, accept the
searchable fallback at this stage, and propose one visual-exemplar loop. This
acceptance authorizes planning only; implementation still requires approval of
the new loop, and visual work must stop for human review before generalization.
