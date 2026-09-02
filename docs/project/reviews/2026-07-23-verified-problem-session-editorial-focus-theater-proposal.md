# Verified problem sessions, editorial quality, and Focus Theater

Date: 2026-07-23

Status: accepted product direction; planning-only handoff

Requested use: preserve the decisions from the 2026-07-23 GM design session and
serve as the human-readable source for a future exemplar-first implementation
proposal after the active semantic-animation convergence loop completes.

This document is not a roadmap revision, a Theseus run contract, or
authorization to interrupt the active architecture loop. It must not create a
second execution tracker. When this direction becomes active, its executable
slice order and evidence belong in one future Theseus run contract that cites
this document.

## Executive recommendation

Make KP's next learner-facing product experiment a teacher- and tutor-led,
verified algebra walkthrough:

1. hand-perfect one `x / 2 + 3 = 7` problem session;
2. preserve the existing verified fractional-linear semantic animation;
3. replace scroll-owned semantic time with a searchable Review Document and an
   explicitly controlled Focus Theater;
4. keep a synchronized Derivation Ledger visible as proof context;
5. make the learner-facing language exceptionally simple;
6. validate the complete experience with a human checkpoint;
7. only then generalize deterministic problem-session and animation generation;
8. add LLM editorial generation after generated sessions are stable.

The characteristic artifact is a **verified problem session**, not a generated
web page, animation clip, or prose response. It owns a versioned problem parse,
solution graph, canonical teaching path, teaching objective, Explanation
Spine, projection-specific text, semantic attention intent, verification
evidence, and references to deterministic animation and rendering
capabilities.

The first product promise is:

> The mathematical world and visual operations are shared and lawful. The
> route through them can be editorially rich, teacher-controlled, and later
> personalized.

## Why this direction exists

KP's current explanatory text is usually correct but less lucid than a strong
conversational explanation. The underlying problem is not simply model
quality. KP's semantic and animation contracts describe mathematical identity,
correspondence, motion, focus, checkpoints, and proof status in much more
detail than they describe explanatory intent.

A current lesson beat can say, in effect:

> At this checkpoint, display this text and focus these semantic references.

It cannot yet say:

> The learner thinks a term literally moves across the equals sign. Establish
> that misconception, make equal changes visible on both sides, and conclude
> that the equation changed while its answer did not.

That missing editorial layer encourages an implementation-oriented model to
fill text slots with mechanically adequate phrases:

- "Read the equation."
- "Divide both sides."
- "Watch the denominator cancel."
- "Read the solution."

Those phrases label operations. They do not necessarily create understanding.
Interestingness, conceptual tension, learner change, representational purpose,
and explanatory payoff are not currently strong authoring obligations.

Scroll-linked semantic time compounds the problem. One gesture tries to own:

1. document navigation;
2. animation time;
3. attentional selection.

The learner scrolls to read, advances motion while reading, shifts attention to
the stage after it has changed, and loses the passage that initiated the
change. Scroll is excellent for reading, search, and retrieval. It is a poor
default performance director.

## Accepted product boundaries

### Trust model

KP will use two visibly distinct lanes:

- **Certified:** confirmed input, verified mathematical transitions, validated
  semantic animation, and explicit provenance.
- **Exploratory:** provisional model or CAS proposals may appear, but they
  never inherit certified status.

For the first algebra workflow, only the Certified lane is in scope.

Trust channels remain independent:

- problem recognition or parse status;
- mathematical verification status;
- animation-conformance status;
- prose authorship and review status.

A teacher edit does not invalidate a proof or animation. It also does not
silently inherit a claim that the prose itself was machine-verified.

### Product wedge

The first gold workflow is teacher- or tutor-led presentation. It precedes:

1. student clarification;
2. student practice;
3. persistent learner modeling;
4. broad bespoke tutorial generation.

This ordering keeps a knowledgeable human in the loop while KP learns what
good generated explanations look like. Student projections should later reuse
the same verified problem-session artifact rather than becoming separate
systems.

### First mathematical domain

The initial domain is a bounded exact-rational linear-equation ladder:

1. `x + a = b`;
2. `a x = b`;
3. `a x + b = c`;
4. `x / d + b = c`;
5. `a(x + b) = c`;
6. `a x + b = c x + d`.

The canonical exemplar is:

```text
x / 2 + 3 = 7
```

It is rich enough to exercise two inverse operations, fractions, equal changes
on both sides, cancellation, exact evaluation, and verification without
requiring a broad CAS.

The first exemplar is equation-native. A synchronized balance representation
is a promising follow-up checkpoint, not part of the initial acceptance
surface.

Word problems, photographs, OCR, arbitrary K-12 input, nonlinear equations,
and universal symbolic manipulation remain out of scope.

## Core artifact: verified problem session

A problem session should eventually carry at least these conceptual sections:

```text
Problem identity and revision
Problem source, parse, and exact normalized form
Provider, verifier, and deterministic seed
Solution graph and proof certificates
Approved canonical and alternative paths
Semantic phases and checkpoints
Teaching objective and declared learner state
Vocabulary contract
Explanation Spine
Projection-specific text
Semantic attention intent
Animation and renderer references
Publication, authorship, verification, and review status
```

The artifact is versioned and replayable. Publishing creates an immutable
revision. Further edits create an explicit successor revision. Playback never
requires an LLM call.

Presenter notes are private by default. Shareable links may open Audience,
Review, or later Practice projections.

## Mathematical construction

### Proof-trace-first generation

Generated problems should be constructed from an intended verified trace, then
checked independently.

For example:

```text
Target solution: x = 8

Teaching operations:
1. remove the added constant on both sides;
2. simplify the difference;
3. multiply both sides by the denominator;
4. cancel the matching factor and denominator;
5. evaluate the remaining product;
6. substitute the result into the original equation.
```

KP reverses those lawful operations to construct the problem. The retained
trace supplies:

- a correctness witness;
- the solution-graph spine;
- semantic phase boundaries;
- animation operations;
- attention targets;
- exact verification obligations.

An independent verifier must still check the finished problem and every
forward transition.

Teacher-entered equations take the opposite route: parse and confirm the
equation, solve it forward, then choose a pedagogical route through the valid
solution graph.

### Solution graph

A session owns a solution graph rather than one immutable step list.

The graph has:

- one reviewed canonical teaching path;
- lazily generated alternatives;
- explicit branch and rejoin points;
- exact intermediate states;
- compressed lawful composites;
- verification and provenance for every edge.

Explanation profiles are projections through this graph:

- **Explain:** exposes identity and cancellation states;
- **Standard:** shows each meaningful equal operation;
- **Fluent:** compresses proved composites without losing their source.

Alternatives are not enumerated eagerly. A valid student or teacher step may
enter a certified branch later, but the first live workflow uses only
precompiled approved paths.

### Teaching objective

Every problem session has one primary teaching objective. The canonical path
serves that objective rather than merely minimizing step count.

For the first exemplar:

> Get `x` by itself by undoing what happened to it, while making the same
> change on both sides so the sides stay equal.

This objective governs:

- problem construction;
- path selection;
- step expansion;
- explanatory framing;
- attention intent;
- animation selection;
- final verification.

### Semantic phases

Mathematical strategy owns phase boundaries. Layout does not invent them.

Generated traces receive phase IDs from the proof constructor. Teacher-entered
problems receive them from the verified forward planner. The editorial layer
may label and summarize a phase, but it does not decide its mathematics.

Candidate phases for the exemplar are:

1. read the problem;
2. remove `+3`;
3. undo division by `2`;
4. check the answer.

### Verification closure

The first exemplar ends by substituting `x = 8` into the original problem:

```text
8 / 2 + 3 = 7
4 + 3 = 7
7 = 7
```

This is a distinct semantic phase. It makes the difference between constructing
a candidate answer and checking that answer visible.

A near-transfer question may later be attached as an optional extension card.
It is not canonical and is not required for the walkthrough to feel complete.

## Editorial architecture

### Explanation Spine

The canonical editorial artifact is a structured Explanation Spine. Neither a
paragraph nor an animation owns explanatory intent over the other.

The Spine records:

```text
Declared learner state
Assumed knowledge
Likely misconception or obstacle
Central question or tension
Primary mathematical claim
Invariant
Mechanism
Representation strategy
Cognitive turns
Conceptual payoff
Optional transfer
```

Long-form prose, presenter notes, audience cues, voice scripts, transcripts,
captions, and animation direction are separate projections from the Spine.

### Declared learner state

Every Spine targets one explicit knowledge state and one intended knowledge
change. It does not target a vague universal audience or a fixed personality
type.

The first audience knows:

- whole-number arithmetic;
- the meanings of `+`, `-`, multiplication, division, and `=`;
- that a letter may stand for an unknown number.

The intended change is:

> The learner sees solving as undoing operations in a useful order while
> making each change on both sides.

Persistent personalization is deferred. The first generator accepts an
authored learner-state object so the future personalization boundary remains
open.

### Vocabulary contract

Internal mathematical language must not leak into learner-facing text.

Each learner state declares:

- familiar words;
- words that may be introduced;
- technical words to avoid;
- preferred readings of notation;
- cue-length guidance;
- sentence-complexity guidance.

Examples:

| Internal language | Early-algebra projection |
| --- | --- |
| additive term | the `+3` |
| isolate the variable | get `x` by itself |
| inverse operation | an operation that undoes another |
| preserve equality | keep both sides equal |
| simplify the expression | work this out |
| verify by substitution | put `8` back in and check |

Technical vocabulary is introduced deliberately:

1. use plain words;
2. show the idea;
3. name the idea;
4. reuse the term consistently.

A deterministic vocabulary linter may flag blocked words, long cues,
terminology used before introduction, and preferred replacements. It does not
pretend to be a complete clarity judge, and it never invokes an LLM while the
teacher edits.

### House voice

The first workflow uses one opinionated KP house voice:

- intellectually serious but not academic;
- warm but not chatty;
- concrete before abstract;
- one important idea at a time;
- simple learner-facing sentences;
- curious without performative enthusiasm;
- respectful of the learner;
- sparse during motion;
- explicit about mechanisms and invariants;
- free from worksheet sludge and unsupported metaphor.

Early algebra should obtain interest from visible structure, not decorative
language. Phrases such as "the numbers dance," "free the unknown," "move it
across," or "peel away the layers" are inappropriate unless an explicit
reviewed representation supports the metaphor.

### Canonical learner-facing spine

The initial editorial target is:

> We want to get `x` by itself.
>
> Undo what happened to `x`, one step at a time.
>
> Make each change on both sides, so the two sides stay equal.

The first operation uses:

```text
Ready:
Take 3 from both sides.

Act:
both sides

Settle:
On the left, +3 and -3 make 0. On the right, 7 - 3 is 4.
```

The second operation uses:

```text
Ready:
Multiply both sides by 2.

Act:
both sides

Settle:
On the left, 2 divided by 2 is 1, so only x is left.
On the right, 2 times 4 is 8.
```

The verification uses:

```text
Ready:
Put 8 back into the first equation.

Settle:
8 divided by 2 is 4. Then 4 + 3 is 7. The answer works.
```

This is a starting editorial target, not final approved copy. Human review may
make it shorter or clearer while preserving the vocabulary boundary.

### Gold exemplar before automation

The complete first package is hand-perfected. LLM drafts may be used during
development, but human selection and direct editing are decisive.

The package includes:

- structural brief;
- three genuinely different editorial treatments;
- selected Explanation Spine;
- durable Review Document;
- presenter notes;
- audience cues;
- attention intent;
- Derivation Ledger labels;
- explicit rejected examples;
- rationale for why each animation earns its place.

Negative examples should cover:

- correct but unilluminating labels;
- prose that competes with motion;
- unnecessary technical language;
- false conceptual drama;
- unsupported metaphor;
- narration that merely describes visible motion.

## Editorial LLM boundary

Automatic editorial generation occurs only after the hand-authored exemplar
and deterministic generated sessions are stable.

### Dedicated editorial service

Editorial generation is a model-agnostic product boundary, not incidental work
performed by a Codex implementation agent.

The service receives only:

- approved structural brief;
- verified claim and solution packet;
- declared learner state;
- vocabulary contract;
- selected editorial treatment;
- available visual arguments;
- Explanation Spine schema;
- a small set of gold examples and negative examples;
- concise house-style guidance.

It does not receive the repository, implementation tasks, test failures,
renderer code, or arbitrary project history.

Model and prompt versions are recorded in provenance.

### Closed-world mathematics, open rhetoric

The editorial model may freely choose organization, rhythm, questions,
contrast, analogy, and voice. Every substantive mathematical assertion must
reference a supplied verified claim, operation, or example.

The output separates:

```text
Referenced verified claims
Editorial language
Requested supporting material
Proposed unverified additions
```

New numerical examples are requested from the deterministic problem generator.
They are not invented inside prose. Proposed new claims remain provisional
until separately verified.

### Candidate treatments

After structural approval, the editorial service generates several short,
substantively different treatments. Each contains:

- conceptual opening;
- misconception addressed;
- explanatory framing;
- proposed visual argument;
- culminating insight;
- sample prose and cue.

The initial system uses deterministic structural filtering and human
selection. No LLM judge silently chooses the winner. Candidate order should
not imply ranking.

The first generator uses versioned prompts and retrieved gold examples. Model
fine-tuning is deferred until KP has a substantial reviewed corpus of teacher
selections and edits.

## Teacher editing contract

Direct editing is local and deterministic:

- typing changes only the selected text;
- locks are explicit;
- locked material survives regeneration;
- save and keystrokes never invoke a model;
- prose edits never mutate the Explanation Spine;
- conceptual changes use explicit structured controls;
- changing the Spine marks dependent projections stale;
- regeneration happens only after an explicit teacher action.

The governing principle is:

> Editing means editing. Generating means generating.

Surface edits change wording. Conceptual edits change the objective,
misconception, mechanism, representation, or payoff and therefore update the
Spine through an explicit approved patch. KP does not infer such changes
silently from arbitrary prose.

## Presentation model

### Three primary projections

One problem session initially projects into:

1. **Presenter:** private notes, objective, misconception, next-step preview,
   controls, verification, and alternative paths.
2. **Audience / Focus Theater:** large live equation, sparse cue, explicit
   controls, and no competing prose.
3. **Review Document:** complete searchable explanation, static checkpoints,
   semantic links, and direct entry into a visual argument.

Teacher narration is authoritative during live presentation. The complete
standalone explanation remains available for later student review.

### Review Document

The Review Document owns:

- ordinary document scrolling;
- complete searchable prose;
- headings and table of contents;
- static equation states;
- semantic links to phases and transitions;
- browser Find;
- durable deep links.

Scroll never owns semantic time.

### Focus Theater

Focus Theater owns:

- one stable, substantial live stage;
- one stable responsive cue dock;
- explicit Ready and Settled stops;
- play, pause, replay, and local scrub;
- direct ledger and search navigation;
- optional semantic callouts;
- deterministic rewind.

On wide screens, the first exemplar uses approximately:

```text
one-third Derivation Ledger
two-thirds Focus Theater
focus card docked beneath the live stage
```

This ratio is exemplar-specific, not a universal layout law.

On phones, the active connector expands inline:

```text
source equation
operation
Focus Theater
focus card
target equation
```

### Focus card behavior

The focus card is stable. Floating boxes and arrows are selective inspection
tools, not the default narration surface.

For each meaningful transformation:

1. **Ready:** frozen stage, complete short cue, and pre-focused objects;
2. **Act:** learner or teacher explicitly triggers motion;
3. **Settle:** result becomes stable and interpretation appears;
4. **Inspect:** semantic links and local scrubbing become available.

During Act, the card contracts to a very short attentional phrase rather than
remaining a paragraph, merely dimming, or disappearing without guidance.

Callouts declare semantic targets and roles such as prediction, notice,
interpretation, or warning. Renderers own placement and leader lines. Authors
and models do not provide coordinates.

### Semantic attention intent

LLMs may propose:

- the learner's perceptual task;
- the intended knowledge change;
- the primary channel;
- pre-cue and post-cue;
- focus references;
- whether silence is preferable.

They do not provide:

- milliseconds;
- progress values;
- easing;
- arbitrary delay;
- coordinates;
- visual intensity.

KP deterministically aligns attention intent with actual animation lifecycle,
validates focus references, prevents new prose from competing with important
motion, and realizes projection-specific schedules.

### Navigation grammar

Controls operate over semantic stops:

- Next and Back move between Ready and Settled states;
- Space plays or pauses the active transition;
- Replay returns to Ready and replays;
- the local scrubber inspects the active transition only;
- ledger selection jumps to a state or connector;
- Home and End jump to the original problem or final verification;
- search results land on a stable checkpoint or Ready state.

Primary controls use meaningful labels:

```text
Prepare: Take away 3
Show the change
Prepare: Multiply by 2
Show the change
Check the answer
```

Wheel, trackpad, and ordinary document scroll do not advance semantic time.

## Derivation Ledger

The Derivation Ledger is the persistent proof-context projection:

```text
x / 2 + 3 = 7
    take 3 from both sides
x / 2 = 4
    multiply both sides by 2
x = 8
```

The ledger answers "Where are we in the argument?" Focus Theater answers "How
did this transition happen?"

Each row includes:

- equation state;
- semantic checkpoint;
- concise optional interpretation;
- verification status;
- controls for omitted intermediate states.

Each connector includes:

- operation name;
- law or justification;
- animation-launch control;
- expansion state.

Rows are proof-state snapshots. Focus Theater owns the live material
transformation. This avoids pretending the same physical token is
simultaneously live in several historical rows.

### Cross-view attention handoff

Ledger and theater do not compete at full salience.

```text
source row -> operation -> live transformation -> target row
```

- Ready emphasizes the source row and connector.
- Act transfers primary attention to Focus Theater and quiets the ledger.
- Settle establishes the target in theater, then the corresponding ledger row.
- Inspect permits bidirectional semantic focus across both projections.

### Progressive disclosure

Every connector supports deterministic local expansion and compression of
certified intermediate states. No LLM call is involved.

For example:

```text
x / 2 = 4
    multiply both sides by 2
x = 8
```

may expand to:

```text
x / 2 = 4
2(x / 2) = 2(4)
(2 / 2)x = 2 * 4
1x = 8
x = 8
```

Global Explain, Standard, and Fluent profiles provide defaults. A teacher may
override one connector without changing the rest of the lesson.

### Long derivations

The fixed split is not used blindly.

Long solutions collapse into named semantic phases. Only the active phase
shows its complete local ledger; completed phases collapse to start state, end
state, and summary. Review Document retains the full searchable chain.

Deterministic layout projections include:

- short: complete side ledger;
- medium: active phase plus neighboring checkpoints;
- long or wide: theater dominant, ledger reduced to outline or drawer.

Math does not wrap at arbitrary glyph boundaries. The response order is:

1. use available width;
2. collapse the ledger;
3. remove optional chrome;
4. scale modestly to a readability floor;
5. use a semantic focus lens;
6. break only at authored mathematical opportunities;
7. use horizontal inspection as a final fallback.

### Semantic focus lens

Oversized expressions preserve the whole equation as quiet context while
magnifying the active semantic subexpression. The operation occurs in the
lens, then reintegrates into the whole.

The lens is a projection tied by correspondence, not an independent copy of
the mathematics.

## Search and deep linking

Review prose remains browser-searchable. KP additionally indexes:

- claims;
- phase labels;
- operation names;
- equation states;
- cues;
- presenter notes;
- explanation prose.

Every result maps to a semantic checkpoint or Ready state, never an arbitrary
scroll offset or mid-animation timestamp.

A durable link may preserve:

```text
problem-session revision
selected path
phase
checkpoint
focus references
presentation projection
```

Selecting a search result prepares the relevant visual state. Playing the
transition remains a separate explicit action.

## Initial generation controls

The first generator uses explicit controls rather than a free-form prompt:

- teaching objective;
- equation family;
- solution kind;
- number-size range;
- sign constraints;
- explanation detail;
- verification visibility;
- deterministic seed.

A later natural-language request may compile into these same controls. It
must not create an unverified parallel generation path.

The generator is validated against a curated structural matrix before broader
random generation:

| Case | Example | Pressure |
| --- | --- | --- |
| Clean positive | `x / 2 + 3 = 7` | Canonical behavior |
| Negative constant | `x / 3 - 2 = 4` | Signs and simple language |
| Negative solution | `x / 4 + 5 = 2` | Negative result |
| Rational solution | `x / 3 + 1 = 5 / 2` | Exact fractions and width |
| Zero solution | `x / 5 + 3 = 3` | Identity and zero |
| Larger values | `x / 12 + 7 = 10` | Layout and readability |

After controlled generation is stable, the first family release may accept
typed or pasted equations inside the same verified grammar. KP shows the parse
for confirmation and refuses unsupported forms clearly. OCR remains deferred.

## Live-session behavior

Live presentation is precompiled and LLM-free.

Before presentation, a teacher may:

- approve the structural brief;
- select the canonical route;
- prepare alternatives;
- choose detail;
- generate, edit, and lock text;
- verify the visual and attention behavior.

During presentation, a teacher may:

- step, rewind, scrub, replay, and inspect;
- expand certified intermediate states;
- switch to a precompiled alternative;
- annotate or focus semantic objects.

An unprepared but valid branch may use deterministic operation labels and
certified animation. It is visibly unscripted and does not trigger background
prose generation.

## Voice: preserved seam, low priority

An optional Narrated Focus Theater is accepted as a future projection but is
not part of the initial critical path.

The preferred eventual design uses short pre-generated audio segments bound to
semantic checkpoints, not one continuous file or word-level synchronization.
Audio may lead the clock within a narrated segment. Captions, transcript,
mute, pause, replay, and text-equivalent content remain mandatory.

Mathematical pronunciation derives from semantic expressions and the
vocabulary contract, never raw LaTeX.

The initial implementation contains:

- no TTS;
- no voice cloning;
- no realtime voice generation;
- no word-level synchronization.

It should avoid architectural choices that would prevent a future
`NarrationSegment` projection from binding spoken text, captions,
pronunciation, semantic marks, focus references, and audio assets to the same
problem session.

## Exemplar-first implementation sequence

The active semantic-animation convergence loop is a hard prerequisite.
Implementation begins only after that loop reaches its authorized terminal
state and the user explicitly makes this direction active.

### Stage A: hand-authored vertical exemplar

Build exactly one hand-authored `x / 2 + 3 = 7` session:

- existing semantic animation preserved;
- one verified solution graph;
- one approved canonical path;
- one hand-approved Explanation Spine;
- one vocabulary contract;
- one Review Document;
- one Focus Theater;
- one Derivation Ledger;
- deterministic attention and navigation;
- final substitution check.

No live model integration, generalized generator, OCR, personalization, TTS,
balance view, or arbitrary equation input belongs in this stage.

Stop for human editorial, visual, and interaction review.

### Stage B: deterministic family generation

After approval:

- construct proof-trace-first instances of `x / d + b = c`;
- compile exact solution graphs and semantic phases;
- project ledger, theater, attention targets, and verification;
- pass the curated conformance matrix;
- prove deterministic seed replay;
- refuse unsupported or unreadable instances.

Stop if family generation requires weakening the accepted exemplar.

### Stage C: typed equation entry

After generated sessions stabilize:

- accept typed or pasted equations within the exact grammar;
- show the normalized parse;
- solve forward;
- choose and verify a teaching path;
- reuse the same session artifact and projections;
- refuse unsupported input without model fallback.

### Stage D: editorial generation

After session shape and animation behavior stabilize:

- add the dedicated editorial boundary;
- generate several compact treatments;
- retain deterministic claim closure;
- let a human choose;
- generate projections from the selected Spine;
- preserve direct deterministic teacher editing;
- record prompt, model, authorship, locks, and review provenance.

Stop for a human comparison against the hand-authored gold exemplar before
expanding the linear ladder.

### Stage E: later projections

Only after the teacher workflow is gold:

1. student clarification branches;
2. practice with hidden future states and verified student steps;
3. broader linear families;
4. balance and cross-representation evidence;
5. optional voice;
6. session-local adaptation;
7. persistent learner-state ledger;
8. broader bespoke tutorials.

## Acceptance criteria for the gold exemplar

### Mathematics

- The original parse is exact and inspectable.
- Every edge is verified using exact rational arithmetic.
- The canonical path serves the declared objective.
- Explain, Standard, and Fluent projections remain lawful.
- The substitution check closes against the original problem.
- Unsupported behavior fails visibly.

### Editorial

- Learner-facing text obeys the vocabulary contract.
- No substantive claim lacks a verified reference.
- The opening states a clear goal in simple language.
- Each cue contains one perceptual task.
- Motion does not merely decorate prose.
- The conclusion says why the answer works.
- Presenter, audience, and review projections each fulfill distinct jobs.
- A human prefers the result to the current mechanically labeled lesson.

### Attention

- The primary target is immediately identifiable at every stop.
- Important motion and new prose never compete.
- Ready state establishes what to watch.
- The focus card contracts during Act and expands after Settle.
- Ledger-to-theater attention transfer is visible but restrained.
- Arrows appear only when highlighting alone is ambiguous.

### Navigation

- Any semantic checkpoint is reachable in at most two direct actions from the
  ledger or search results.
- Back, replay, seek, and rewind are exact.
- Scrubbing never changes the selected mathematical path.
- Search opens a stable semantic stop.
- Review Document returns to the exact originating passage after theater use.
- Semantic time never depends on scroll position.

### Layout

- The canonical desktop split is legible without equation wrapping.
- Phone projection does not require reading distant prose while motion plays.
- The ledger remains context rather than a competing stage.
- Reduced motion, no motion, zoom, and forced colors preserve meaning.
- Static and printable review output retains the complete derivation.

### Performance and durability

- Playback requires no LLM or TTS call.
- Published revisions replay deterministically.
- Initial load does not pull authoring-only or generation-only dependencies.
- The existing semantic animation's endpoint, seek, and rewind laws remain
  intact.

## Preservation boundary and rollback unit

The first exemplar treats the existing fractional-linear semantic animation as
an input. Preserve:

- semantic objects and selectors;
- transformations and proof references;
- correspondence and lineage;
- externally owned clock;
- direct seek and rewind;
- native endpoint behavior;
- reduced and static projections;
- current verified provider behavior.

The initial rollback unit is the new problem-session and presentation
projection for the one exemplar. It must be possible to remove that projection
without reverting the active architecture convergence or rewriting the
fractional-linear semantic asset.

If the existing animation blocks the approved explanation, stop and record the
specific missing capability. Do not broaden a presentation defect into an
animation-architecture rewrite without evidence and a separately approved
scope change.

## Principal risks

### The exemplar becomes a universal framework

Mitigation: keep ratios, phase count, cue wording, and equation-specific
projection policy exemplar-local until later families demonstrate reuse.

### Simple language becomes condescending

Mitigation: prefer short concrete sentences and mathematical precision; avoid
false cheerfulness, artificial questions, and unnecessary praise.

### Generated prose labels motion

Mitigation: require an Explanation Spine, explicit learner change, and an
"animation earns its place" rationale before projection.

### Multiple projections duplicate authority

Mitigation: all projections derive from one problem session, solution graph,
Spine, and attention intent. Projection-specific text remains distinct without
becoming a second mathematical source.

### The ledger becomes another scroller

Mitigation: use semantic phases, active local windows, collapse, and
theater-dominant layouts. Ledger scrolling never controls time.

### Candidate generation homogenizes taste

Mitigation: human selection, gold and negative examples, no initial LLM judge,
and no fine-tuning before a meaningful corpus exists.

### Teacher edits drift from mathematical truth

Mitigation: separate math certification from prose authorship, keep claim
references inspectable, and require human publication review. Do not pretend a
deterministic linter understands arbitrary prose semantics.

### Scope collides with the active convergence loop

Mitigation: no implementation, roadmap, or run-contract changes from this
document. Begin only after the active loop closes and a future exact proposal
is approved.

## Explicit exclusions

The first exemplar does not include:

- OCR or camera input;
- word problems;
- arbitrary equation grammars;
- nonlinear algebra;
- a balance-scale representation;
- generalized authoring dashboards;
- persistent learner profiles;
- points, streaks, or gamification;
- student assessment infrastructure;
- automatic transfer questions;
- LLM calls during editing or playback;
- an LLM editorial judge;
- fine-tuning;
- TTS or realtime audio;
- voice cloning;
- scroll-driven semantic time;
- animation-core refactoring;
- a second manually maintained execution plan.

## Handoff to a future implementation session

When the active semantic-animation convergence loop completes:

1. inspect its terminal evidence and successor architecture rather than
   assuming current file boundaries survived unchanged;
2. confirm that the fractional-linear animation still provides exact
   correspondence, externally driven time, seek, rewind, and endpoint
   settlement;
3. locate the narrowest durable home for the problem-session artifact and its
   projections;
4. derive an exact exemplar-only implementation proposal from this document;
5. name the canonical current route and observable before/after evidence;
6. preserve the semantic animation and authoring boundaries above;
7. define the new presentation projection as the smallest reversible rollback
   unit;
8. stop for human review before any family generalization;
9. use one future Theseus run contract for live slice status and verification.

The first implementation question is not:

> Can KP generate many algebra lessons?

It is:

> Can one verified algebra explanation feel lucid, directed, searchable,
> reversible, and easy to inhabit?

Only a convincing answer to that question authorizes broader generation.
