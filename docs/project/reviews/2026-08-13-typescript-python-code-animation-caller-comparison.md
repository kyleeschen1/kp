# TypeScript and Python code-animation caller comparison

Date: 2026-08-13
Status: approved exemplars compared; bounded extraction justified
Canonical exemplar: TypeScript free-shipping threshold refactor
Second caller: Python free-shipping threshold refactor

## Decision

The two approved callers justify four bounded shared seams, in this order:

1. syntax-role vocabulary and source-token shape;
2. complete source-projection snapshots and fragment composition;
3. settlement and native-paint ownership laws; and
4. explicit exceptions to those laws.

They do not justify a universal code renderer, universal parser, common
language semantic model, shared score, shared geometry, or a Scheme migration
through the imperative-language source theater.

The evidence is structural rather than merely visual. TypeScript obtains
lexical paint evidence from a lightweight language-owned classifier while
Python obtains it from build-time stdlib `tokenize`; both then need the same
immutable offset-bearing token contract. Their AST/compiler models and source
formatting differ, yet both compose complete function fragments into four
settled source projections. Their authored timing and language-specific token
identities differ, yet both enforce travel, full arrival, recognition,
endpoint ownership handoff, and withdrawal on the same deterministic clock.

## Layer-by-layer ledger

| Layer | Demonstrated common contract | Language-owned variation | Classification |
|---|---|---|---|
| Frontend | Deterministic evidence with exact UTF-16 source ranges | TypeScript compiler/lexical path; Python stdlib AST and `tokenize` | Preserve language-owned |
| Syntax paint | Immutable `text`, role, start, and end offsets; common roles for keyword, identifier, function, type, boolean, number, string, comment, operator, and punctuation | TypeScript alone currently needs `property`; classifiers and evidence IDs differ | Extract protocol, retain classifiers |
| Semantic identity | Stable entity IDs and non-crossing source ranges | Entity kinds, scopes, declarations, and compiler records | Preserve language-owned |
| Source projection | Complete valid source, optional endpoint root, exact entity/token ranges, unique IDs, deterministic fragment composition | Projection IDs, function IDs, fragment separator, and token provenance | Extract seam, retain projection recipes |
| Instructional score | One deterministic semantic playhead and authored stage checkpoints | Narration, numeric timing, focus selectors, and pedagogical order | Reuse clock only; preserve scores |
| Motion authority | Validator-minted tracks bound to transformations, correspondences, stages, and entities | Track IDs and language entity IDs | Extract laws, not domain IDs |
| Token theater | Persistent token identity, direct sampling, full arrival before ownership transfer, native endpoint settlement | Token matching, control-point tuning, naming conventions, and language syntax | Extract settlement protocol; migrate later |
| Native endpoint | Exactly one selectable accessible source projection; intermediate motion aria-hidden | Attribute namespace and source renderer | Extract ownership seam, keep language adapters |
| Host lifecycle | Lazy programming capability, one player clock, disposal, direct URL state, rewind, reduced motion, review capture | Adapter IDs and artifact factories | Already shared; no new abstraction |
| Visual treatment | Shared dark optical palette and semantic syntax roles | Language-specific selectors and provisional spacing/timing | Keep theme tokens; do not universalize geometry |

## Proven shared invariants

The following statements hold for both approved callers and are suitable for
shared enforcement:

- source tokens use half-open UTF-16 ranges and reconstruct their source
  exactly when interleaved with untouched text;
- token roles decide paint only and never become semantic identity;
- every moving token is owned by a compiler- or AST-derived semantic entity;
- settled checkpoints contain complete source, never partial animated markup;
- one native projection is the sole selectable and accessible paint owner;
- intermediate token theater is visual-only and aria-hidden;
- direct seek, rewind, interruption, and reduced motion sample the same plan
  without replaying prior transitions;
- material that moves reaches its semantic destination at full size and
  opacity before endpoint paint assumes ownership;
- ordinary deletion, authored cuts, and reduced-motion endpoint jumps must be
  explicit exceptions rather than accidental early fades; and
- numeric timing, paths, coordinates, colors, selectors, and DOM attributes
  remain outside semantic authority.

These are continuity and ownership laws. They are not a claim that every code
transformation should use token trajectories.

## Accidental duplication to remove

The approved callers currently duplicate several mechanisms nearly line for
line:

- source token role unions and offset-bearing token records;
- fragment rebasing and source-projection assembly;
- projection handoff sampling and accessible-owner selection;
- persistent token snapshot geometry and direct interpolation helpers;
- arrival/settlement-handoff phase ordering;
- DOM synchronization for native projections, focus state, narration, and
  token nodes; and
- native endpoint accessibility ownership.

This duplication was appropriate during exemplar discovery because it made
Python independently reversible. It now increases regression risk: a
continuity fix, accessibility fix, or escaping fix can land in one caller and
not the other. The next slices should extract only the first four approved
seams, then migrate callers one at a time.

## Deliberate non-abstractions

Keep the following separate:

- TypeScript and Python tokenizers/frontends;
- compiler/AST semantic records and entity kinds;
- authored before/after fixtures and behavior certificates;
- language-specific projection recipes and whitespace;
- semantic track IDs, entity IDs, correspondence records, and narration;
- numeric timing and trajectory control points until a later, structurally
  different transformation demonstrates common choreography;
- attribute namespaces and local CSS until migrations prove a small binding
  boundary; and
- Scheme parsing, recursive list membranes, binding arcs, branch resolution,
  evaluator influence, and collapse/expand pedagogy.

In particular, normalizing `qualifiesForFreeShipping` and
`qualifies_for_free_shipping` into a shared glyph identity would be wrong.
Both are language-owned spellings of semantic bindings already established by
their respective frontends.

## Extraction and rollback order

The approved order preserves independently reversible boundaries:

1. add a shared syntax-role/token protocol with adapters but no tokenizer
   migration;
2. add a generic complete-source projection seam with caller-owned recipes;
3. encode settlement and endpoint-ownership laws as pure validation;
4. encode typed authored exceptions;
5. migrate TypeScript, preserving it as the canonical visual reference;
6. migrate Python and delete superseded local duplication;
7. pressure both callers together before touching Scheme.

Each migration must preserve exact source bytes, stage and motion IDs, score
timing, trajectories, focus, native ownership, stable URLs, direct seek,
rewind, reduced motion, phone fit, and the approved dark presentation. A shared
seam that requires changing either exemplar's observable choreography has
crossed its authority boundary and should be rolled back.

## Scheme boundary

Scheme is evidence for or against the laws, not a third imperative-language
renderer. It can plausibly adopt language-neutral syntax roles, exact source
identity, deterministic sampling, native/accessibility ownership, and
arrival-before-handoff. It must preserve recursive S-expression containment,
delimiter ownership, branch resolution, binding arcs, evaluator-derived
semantic evidence, and authored pedagogical order.

The Scheme audit should therefore classify every mechanism as `reuse`,
`adapt`, `preserve-specialized`, or `reject`. No Scheme renderer rewrite is
authorized by this comparison.

## Promotion result

The second caller is materially cheaper in architectural invention: it reused
the asset, transformation, correspondence, lineage, score/timeline host,
player, capability pack, catalogue, URL, review, and accessibility lifecycle,
and added no dependency or browser parser. It was not cheap in source volume
because the shared seams were deliberately withheld until visual approval.

That is sufficient evidence to proceed with slices 19-25. Catalogue-wide code
animation, arbitrary refactor generation, new transformation topologies, and
Scheme presentation promotion remain separately governed.
