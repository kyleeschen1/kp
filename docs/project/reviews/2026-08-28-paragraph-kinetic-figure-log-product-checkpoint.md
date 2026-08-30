# Paragraph Kinetic Figure: Log-Product Checkpoint

Date: 2026-08-28
Status: human checkpoint
Revision: 13

## Candidate

The **Paragraph Kinetic Figure** is a local, stateful figure attached to one
ordinary explanatory paragraph inside a larger lesson passage. Its numbered
controls select conceptual reading states, while linked phrases and semantic
figure entities exchange salience in both directions.

The first exemplar is available at:

`/experiments/kinetic-figure/log-product/`

It reuses the canonical
`animation.algebra.log-product.product-to-sum` artifact and its existing
Native KaTeX compositor. The experiment owns only the paragraph, the four
reading-state projections, and their quiet document-scale styling.

The current candidate uses a **local split projection** at reading widths:
compact continuous prose and its stage occupy one visual band, while the
surrounding lesson remains an ordinary scrolling document. Narrow viewports
project the same passage as a stack. This preserves document primacy without
requiring the reader to make a large gaze shift between a phrase and its
mathematical referent.

An opt-in **Micro Station** comparison is available at:

`/experiments/kinetic-figure/log-product/?projection=micro-station`

It preserves the same paragraph, stage, states, links, and Native KaTeX owner.
One bounded scroll corridor adds short read and locate plateaus, continuously
scrubs the canonical rewrite, holds its introduced structure for inspection,
then settles on the result. Normal document position is the only automatic
playhead authority; reverse scroll samples the same frames. The Local Split
remains the default and the responsive/reduced-motion fallback.

An opt-in **Glance-Coupled Scrollytelling** comparison is available at:

`/experiments/kinetic-figure/log-product/?projection=glance-scrollytelling`

It replaces the single linked paragraph with four complete prose passages in
a narrow right-hand narrative column beside one compact sticky stage. The DOM
retains prose-first source order while the reading-width grid places the stage
on the left; narrow layouts retain the ordinary source-order stack. Passage geometry
selects four semantic nodes whose paragraph tops share a stable reading line
with the equation's optical center at 36 percent of the viewport. Three
measured inter-paragraph edges connect those nodes. The first two transfer the
rust focus rail—and, when relevant, the product underline—without moving the
equation. The third passage presents the product law as one atomic inline
KaTeX unit while the equation remains at its source; its longer approach to
the result releases prose focus, holds the source, scrubs the existing rewrite,
holds the target, and receives result focus in a 20/10/40/10/20 sequence.
Neighboring paragraphs and the equation retain stable ink throughout. Scroll
reversal reconstructs the same Native KaTeX frame. Visible stage controls are
absent; the numbered ordinals remain semantic paragraph links. This is a
bounded projection comparison, not a new lesson schema or shared
scrollytelling API.

An opt-in **Stacked Station** comparison is available at:

`/experiments/kinetic-figure/log-product/?projection=stacked-station`

It keeps the same four passages, semantic IDs, URL contract, salience frames,
and canonical Native KaTeX rewrite as Glance-Coupled Scrollytelling, but changes
only the physical reading projection. The content-sized stage first approaches
in ordinary flow, then docks when its measured bottom edge reaches the
viewport midpoint. Each active paragraph lands at 58 percent, keeping the
equation and prose inside one glance without making the stage itself 50 percent
tall. Once narrative reaches the dock, only its departing paint clips at the
stage's bottom seam; earlier article context remains visible during approach.
This prevents prose fragments above the active station without a viewport-sized
backing sheet. All four passages remain one visible, selectable, searchable DOM
sequence. A fifth real-text block—`Apply the product law`—marks the physical
rule-to-result transition corridor. Its visible runway maps onto the existing
armed, rewrite, and settled phases before the result passage receives focus.
The same projection now runs at phone widths; reduced motion still selects the
stable Local Split endpoint. This is a reversible exemplar for comparing gaze
behavior, not a replacement for Glance or authorization for a shared stacked-
passage schema.

## Canonical Declaration

- **Artifact:** canonical binary log-product animation.
- **Host:** isolated ordinary-document experiment route.
- **Renderers:** DOM prose salience and the canonical Native KaTeX
  log-product surface.
- **Semantic source of truth:** stable reading-state IDs plus the existing
  log-product semantic entities and transformation.

## Observable Acceptance Criteria

- Four numbered conceptual states remain directly revisitable.
- States 1 and 2 share the source equation while expressing different
  attentional intent.
- The rewrite is an entry transition rather than a resting state: entering
  state 3 replays the canonical transformation and settles on valid target
  notation with introduced logarithm syntax and the connector emphasized.
- States 3 and 4 share the target equation while expressing change-focused
  and whole-result attention respectively.
- Selecting a state focuses its linked prose phrase; activating a prose phrase
  selects or replays the same state.
- Hover previews prose/control correspondence without moving the semantic
  playhead or changing the URL.
- Linked prose remains one natural paragraph at ordinary reading size; its
  sentence structure does not mirror the four state boundaries.
- At reading widths, the paragraph and figure are top-aligned in one local
  split passage. On narrow screens, paragraph and figure stack in source order.
- Prose focus uses a quiet field and underline, conceptual-state controls use
  neutral selected chrome, and the warm mathematical accent is reserved for a
  localized object or introduced structure. The whole settled result returns
  to normal ink.
- In the Micro Station comparison, the complete local split pins only during
  its bounded corridor, a quiet progress rail makes scroll ownership visible,
  and ordinary document flow resumes immediately after release.
- Scroll directly samples the existing log-product playhead. It does not
  trigger delayed playback, smooth through another clock, intercept wheel
  input, or use scroll snap.
- State and prose links remain direct semantic navigation: in Micro Station
  they move to the state’s canonical corridor position; in Local Split they
  retain the existing state-selection behavior.
- The Micro Station falls back to Local Split for reduced motion and narrow
  viewports rather than compressing the prose or requiring scroll motion.
- Glance-Coupled Scrollytelling uses four genuine paragraphs rather than
  fragmenting one sentence into cue-like lines; the prose and stage fit inside
  one compact visual field.
- Its orient and locate passages change focus without inventing motion. The
  first two inter-paragraph edges continuously transfer only the rust rail and
  localized product underline. The product-law passage lands on the source
  equation; the following edge alone controls equation motion, and the result
  passage owns the settled target.
- During the rewrite, both adjacent passages remain present while the absence
  of a prose rail and the equation's motion identify stage ownership. Focus
  release, armed hold, rewrite, settled hold, and result reception occupy
  20/10/40/10/20 percent of the measured rule-to-result interval. Extra
  document runway on that edge slows the rewrite without moving either node.
- Glance prose and display KaTeX retain stable ink across every phase; no glyph
  color or opacity is interpolated. The rust left rail changes length during
  handoff, and a paint-only rust underline marks the product in the locate
  state. No internal column divider is introduced.
- Glance display KaTeX uses a restrained `1.65rem–2.1rem` responsive range and
  an `8rem` stage block; passage line height is `1.71`. All four passages land
  at one 36-percent reading line. These remain provisional exemplar geometry.
- The Glance stage has no visible state buttons, progress rail, scroll label,
  or product-law disclosure. The rule is one non-wrapping inline KaTeX unit in
  passage 3, and the four ordinals remain direct paragraph links.
- Glance hashes use semantic paragraph IDs such as
  `#passage.log-product.rule`; the retained internal `transform` ID does not
  leak into newly projected URLs.
- Direct links land on deterministic source or target endpoints without
  replaying the transition; narrow and reduced-motion contexts retain Local
  Split.
- Stacked Station changes layout geometry only: its four semantic nodes and
  three interpolated edges are exactly the Glance projections. The figure
  precedes the narrative in visible and DOM order, both share one centered
  lane, and no duplicate semantic or animation clock is introduced.
- Stacked Station keeps prose at stable ink but does not paint paragraph rails
  or a stage-ownership accent. Muted ordinals become normal ink only for the
  passage that owns attention; the localized product underline remains the
  sole rust cue. During the rule-to-result interval, no paragraph ordinal is
  active and the explicit operation marker plus equation motion identify stage
  ownership.
- Its provisional geometry maps the measured stage bottom to the 50-percent
  viewport line and lands prose or the operation label at 58 percent. The stage
  remains intrinsically sized, approaches that dock in normal flow, and
  releases with its containing passage. A presentation-only narrative crop
  follows the stage seam, preserving one searchable DOM sequence while keeping
  departing passages out of the stage plane. It does not add another clock or
  opacity transition. The relationship, semantic nodes, and explicit trigger
  grammar remain the same on phones; reduced-motion contexts fall back to Local
  Split while preserving semantic passage hashes such as
  `#passage.log-product.rule`.
- Every explanatory passage and the `Apply the product law` operation marker
  exists once in normal DOM order with visible ink. No sticky prose copy,
  hidden inactive passage, or accessibility-only duplicate is introduced;
  native selection and find-in-page can address the same text the learner
  reads.
- A quiet, optional disclosure exposes the product-law template and domain
  conditions without making it permanent stage content.
- The paragraph text and layout remain constant.
- Reduced motion reaches the same endpoints directly.
- The figure is embedded between ordinary surrounding lesson paragraphs and
  followed by a non-example that pressures structural reading.

## Preservation and Rollback

- Preserve the animation asset, Native KaTeX ownership path, frozen
  `kp.article.v1` contract, catalogue, and Rule Ledger Passage candidate.
- The smallest rollback unit is the experiment route, its local state model,
  stylesheet, tests, and bootstrap branch.
- This checkpoint does not authorize a shared Kinetic Figure schema, Markdown
  DSL, global focus store, or caller migration.

## Review Question

Does this feel like an expert “look here, now see this change” gesture embedded
in a readable document, or does operating the paragraph still interrupt the
act of reading? In particular, does Stacked Station's sequential vertical
handoff and 50/50 stage allocation reduce split attention enough to justify
its additional page height relative to the compact Glance projection, and is
the operation marker sufficiently explicit without becoming interface chrome?
