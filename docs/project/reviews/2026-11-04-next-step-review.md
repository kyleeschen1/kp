# From precise attention to a complete teaching interaction

Date: 2026-11-04
Status: user-stated goal clarification and proposed progression; no new implementation run

## Goal and disposition of earlier work

The user wants humans and LLMs to create custom salience animations inside rich
explanations. Learners should be able to establish precise joint attention and
develop an eye for what matters across symbolic domains, including mathematics,
physics, music and social science. The intended result is an increased ability
to interpret and reason with a representation, including without its scaffolding.

Mathematical practice remains a useful first proving ground and a retained
product commitment. It is not the whole destination. Current examples are
internal experiments in content and system capability, not a public asset
production queue. The independent editor/workbench lane retains its ownership.
Its live implementation was not audited by this KP orientation review.

The accepted local annotation treatment, completed shared mounting conversion
and accepted fractional reader behavior retain their original scope. The
integrated annotation reader's visual judgment remains open. The user's report
that Firefox now works establishes recovery from the reported disappearance;
it does not silently close the broader presentation checkpoint. See the
[reader review](2026-10-31-annotation-reader.md).

## Where the product is

KP has substantial reusable components, with bounded domain and presentation
coverage. A repeatable complete authoring-and-learning interaction is still
unproved. These are capability stages, not a new execution queue:

| Capability | Current evidence and limit | Next observable proof |
| --- | --- | --- |
| Address meaning precisely | Semantic scene identities, correspondence and salience intents exist. Algebra and matrix authoring have bounded checked paths; this is not arbitrary symbolic-domain support. | An explanation can name the exact object or relationship it discusses and retain that reference through supported changes. |
| Embed attention in a strong explanation | The shared document reader and situated annotation candidate provide a host. The current algebra page still assembles a local score around its states. | Preserve the reasons, examples and counterexamples of a strong baseline; use attention for a named perceptual job without competing with prose. |
| Author and revise repeatedly | Supported-task discovery, checks and revision handling exist. General rapid generation and revision without custom glue are not established. | Make a second meaningful draft through the same authoring path; record elapsed time and every engine edit required. |
| Share attention in conversation | Focus, exact location and contextual-return ingredients exist. The full learner-selection, question, response and revision workflow is not established by this reader. | A learner points, asks, receives an anchored explanation, and returns to the same version and context. |
| Develop transferable ways of seeing | Existing examples and visual acceptance demonstrate local capabilities, not learning efficacy or broad domain transfer. | Use the idea in a changed example with less guidance; then test a structurally different domain. |

Evidence: [generation entrypoint](../authoring/llm-generation-entrypoint.md),
[concise domain API](../authoring/concise-domain-api.md),
[explanation-first worksheet](../authoring/explanation-first-worksheet.md),
`src/animation/salience-plan.ts`, `src/semantic/semantic-scene-protocol.ts`,
`src/reader/runtime/semantic-focus.ts`, and
`scripts/what-counts-reader-page.ts`.

## Recommended progression

Retain the current integrated-reader checkpoint before promoting its visual
treatment. The recommended successor is one complete teaching interaction in
a supported domain, beginning with an explanation/translation comparison.
Start with a learner's actual question and write the rich baseline before
allocating animation stops. Bind selected moments to semantic references and
compare the rendered result with the baseline for lost reasoning. Then try one
specific follow-up and revision through the same path. The initial exchange can
use the current assistant and explicit context; an embedded model service is
not a prerequisite. Any workbench integration requires its owner's coordination.

The finite proof is: one question, a coherent explanation, purposeful attention,
one precisely situated follow-up, a revised explanation with recoverable original
context, and a changed-case question that exposes whether the key distinction
was understood. Record authoring time, engine interventions and unresolved
capability gaps. No universal schema, catalogue rollout or public publication is
part of that proof. This is a recommendation, not authorized execution.

Afterward, use a second explanation to discover what genuinely repeats. Promote
only demonstrated shared mechanisms, then pressure them with a different domain.
Keep domain facts and validity separate from explanatory intent and rendering.
Humans and LLMs should use the same supported authoring contracts. Shared
attention can name several targets already in some intent types; a general
several-target commentary experience remains future work and needs its own
presentation and lifecycle evidence.

## Tradeoffs and safeguards

- An explanation-first proof gives direct evidence about the current quality
  gap. Another isolated motion demo would leave that gap unresolved.
- Broad CSS consolidation can reduce inconsistent behavior, but it does not
  itself prove explanation quality or conversational generation speed. Repair
  responsible boundaries when they obstruct the selected interaction.
- Generalizing the reader can remove repeated hosting work. A universal reader
  or semantic language before a second real caller risks freezing the wrong
  assumptions. Preserve domain-specific truth and renderer ownership.
- Conversation brings the product closer to joint attention. Its first test
  should exercise exact references and revision, rather than depend on building
  a complete chat or practice platform.

Track three distinct outcomes: correctness and reference integrity; preservation
of explanatory reasoning; and what a learner can do in a changed case. Attractive
motion, passing renderer tests and LLM critique do not establish comprehension.
Measure supported content edits separately from genuinely new capability work;
no end-to-end latency target has yet been demonstrated here.

## Orientation and next action

Open `/reader/what-counts/` and inspect the transition from prose to its anchored
annotation moment. This shows the current presentation bridge. It does not yet
show arbitrary authoring or a learner-driven conversation. The immediate retained
checkpoint is that integrated handoff; the next proposed experiment evaluates
whether a full explanation survives translation into KP. Existing practice,
style-ownership and authoring outcomes remain visible, with their finish lines
unchanged. Historical workbench proposals are provenance, not this lane's queue.

## Verification of this orientation update

`npm run test:project-vision` passed all 67 vision/dashboard checks, and
`git diff --check` passed. The product development server returned HTTP 200 for
`/reader/what-counts/` on port 8011. This update changes strategic records and
the existing vision view's text; it makes no new renderer, pedagogy or visual
acceptance claim.
