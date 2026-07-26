# Canonical animation construction guide

Date: 2026-07-26
Status: released reference
Public entry:
`src/authoring/canonical-animation-public-api.ts`

## Purpose

The canonical construction path lets a human or governed model describe an
animation in semantic terms, lets KP verify the mathematics and lineage, and
then lets existing readers, renderers, and exporters project the same verified
artifact. It is the canonical path for new governed equation-animation
construction. It is not a second animation runtime or a replacement semantic
model.

The path has three executable stages:

```text
verified semantic source
  -> immutable canonical construction
  -> ephemeral presentation planning and rendering
```

Authoring requests and output projections sit around those stages. They do not
own another clock, renderer, or copy of the mathematics.

## Authority map

| Concern | Authority |
|---|---|
| Exact states, laws, assumptions, operations, and normal forms | Semantic assets and registered operation packs |
| Object, operation, role, and lineage references | Canonical construction compiler |
| Provider wording and bounded explanation/composition intent | Governed construction request |
| Causal order and shared time | Existing choreography and runtime clock |
| Responsive layout and reader plans | Existing presentation and reader compilers |
| Glyphs, rules, paths, typography, and endpoint geometry | Ephemeral native-KaTeX renderer session |
| Accessibility, focus, annotations, hover, Cloze, and interaction | Native reader DOM |
| Static JavaScript, headless, iframe, static-step, and no-JS output | Existing projection and export compilers |

If a proposed field belongs to a later row, it must not be moved upward into a
provider request or durable construction artifact.

## Construction workflow

1. Select a verified semantic source revision and exact operation-pack pins.
2. Reference approved semantic objects and operations; never infer identity
   from glyph equality or DOM order.
3. Describe explanatory purpose, bounded detail, composition intent, and
   checkpoints without specifying pixels, DOM, timing tables, or renderer
   behavior.
4. Create and validate a
   `KpGovernedCanonicalConstructionRequest`.
5. Compile with `compileKpGovernedCanonicalConstruction`. The compiler resolves
   exact source and target truth, operation definitions and strict laws, role
   bindings, normal forms, correspondence, and lineage.
6. If verification fails, use `planKpGovernedConstructionRepairs`. Provider
   repairs may select only verified choices; compiler-authority gaps must
   escalate. A repair may not invent mathematics or select a fallback
   animation.
7. Project the verified construction through the existing runtime, reader,
   review, static, headless, iframe, or static-step boundary. All outputs
   reference one central artifact set.
8. For product promotion, bind the existing reader render/material plans to
   one ephemeral native-KaTeX session, pass the exemplar checkpoint, and bypass
   that transition's compatibility paint in the same rollback unit.

## Governed model boundary

A model may propose:

- exact refs to approved source objects and registered operations;
- role and lineage intent over those refs;
- explanatory purpose and focus;
- bounded detail or compression;
- composition intent and inspection checkpoints.

A model may not provide:

- target mathematics that has not been verified;
- LaTeX or HTML as mathematical authority;
- DOM, selectors, fragments, glyph matches, or KaTeX classes;
- coordinates, paths, keyframes, timing tables, geometry, or viewport rules;
- CSS, fonts, opacity recipes, renderer modes, or backend state;
- accessibility markup, export code, or serialized renderer sessions.

The recursive presentation-authority firewall rejects normalized and nested
aliases for these fields. The compiler, not provider prose, establishes
mathematical truth.

## Renderer and product rules

- Native source and target DOM own exact settled typography and semantics.
- Moving paint is ephemeral and inert.
- Persisting, fissioning, and fusing lineage-backed material remains opaque;
  split and merge emerge through geometry rather than fades.
- Direct seek is state-independent and rewind samples the same semantic clock.
- Reduced motion preserves causal checkpoints and settles without transit.
- Ambiguous lineage or unsupported geometry uses explicit checkpoint
  settlement; it does not guess.
- A product migration is exemplar-by-exemplar. Canonical and compatibility
  paint may never coexist for the migrated transition.
- A fixture proves architecture; it does not silently authorize a product
  family rollout.

## Composition

Canonical child operations compose through
`createKpGovernedCanonicalCompoundConstruction` and the existing shared clock.
Every child operation remains visible and ordered. Compact presentation may
compress duration but may not hide work. Optional drill-down must restore its
exact paused parent frame and may not create a second scheduler.

## Output parity

`projectKpGovernedCanonicalConstructionCohort` creates reference-only targets
for static JavaScript, headless, iframe, and static-step consumers. The targets
point to the same canonical artifacts and checkpoints. Run
`auditKpGovernedCanonicalProjectionBundle` before serialization; nested DOM or
renderer-session state is rejected regardless of field alias.

## Review entrypoints

- Development gallery: `/canonical-animation-review.html`
- Production build: `dist/canonical-animation-review.html`
- Canonical fraction reader: `/reader/split-merge-fractions/`
- Focused browser matrix:
  `npm run test:browser:canonical-animation-construction`
- Compound wide/phone/reduced visual matrix:
  `npm run visual:canonical-animation-construction`
- Packaged parity:
  `npm run test:browser:canonical-animation-review:packaged`

The gallery is a passive controller over existing live surfaces. It may seek,
play, rewind, resize, and expose diagnostics; it may not compile, author, or
own renderer lifecycle state.

## Promotion checklist

A new product exemplar must demonstrate:

1. verified source, operations, roles, normal forms, and total lineage;
2. no provider presentation or unverified mathematical authority;
3. one renderer session and one visual owner at every sample;
4. exact native endpoints with correct typography after fonts and resize;
5. direct seek, rewind, wide, phone, full, and reduced-motion conformance;
6. native accessibility and interaction authority;
7. static, headless, iframe, and static-step semantic parity;
8. unchanged fixed architecture, inference, payload, performance, and reader
   budgets;
9. a browser-native exemplar review; and
10. one independently reversible migration that bypasses the superseded
    compatibility paint only for that transition.

## Safety utilities

Use `src/tutorial/generated-html-escaping.ts` only for generated tutorial or
export documents and only through its context-specific text, double-quoted
attribute, and script-JSON helpers. Do not turn it into a generic sanitation
module.

Keep these distinct:

- live DOM clone authority stripping in `computed-style-clone.ts`;
- editor/review `innerHTML` escaping;
- SVG/XML serialization;
- capture-script HTML;
- CSS selector escaping;
- domain validators; and
- recursive freezing.

They look similar mechanically but have different authority, lifetime,
failure, or security contracts.

## Required release gates

Run the focused construction suite while iterating. Before product promotion,
run the production build, full architecture and inference gates, reader and
compositor browser matrices, packaged output parity, fixed construction and
reader budgets, production closure, and Theseus workspace validation. Never
raise a gate merely to complete a migration.
