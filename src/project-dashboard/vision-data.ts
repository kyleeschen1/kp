import type { ProjectVision } from "./vision-model.ts";

// Review with the roadmap at a milestone handoff or pivot; append the reason for
// changes. Task progress belongs to Theseus, not this source-linked horizon map.
export const projectVision: ProjectVision = {
  directionId: "authoring-expert-attention-v1",
  commitment: {
    id: "workbench-kp-object",
    title: "Edit one KP object from the independent workbench",
    approval: "approved",
    contractId: "run-contract.kp.workbench-object-20261125",
    finish: "Open a revisioned fraction object in Workbench, preview an admitted annotation change in KP, retain the last result after rejection, and recover an unsent draft after reconnect. Review before broader extraction.",
    source: { label: "Approved object boundary", href: "docs/project/reviews/2026-11-25-workbench-kp-object-boundary.md" }
  },
  uncertainty: "We have accepted explanations and bounded reuse. A live, fast authoring-and-revision loop and independent learner transfer remain unproved. Featured content's marketing value is a hypothesis.",
  nextJudgment: "The proposed next outcome is one real LLM-assisted fraction revision in the native workbench: attach exact object context, receive a proposed change, inspect its diff and checked preview, then follow up and reconnect. The browser adapter remains available at http://127.0.0.1:1426/; it cannot open a native session. This successor is not yet approved for implementation.",
  progression: [
    { title: "Create and revise", outcome: "Authors develop exceptional explanations and attention choreography through a responsive workflow." },
    { title: "Adapt and interpret", outcome: "Learners customize an explanation and show what they understand with context intact." },
    { title: "Practice and retrieve", outcome: "Connected problems, feedback and flashcards develop the same instructional distinctions." },
    { title: "Grow the library", outcome: "Curated adaptive material becomes easier to reuse, embed and maintain across domains." }
  ],
  reviewedOn: "2026-11-25",
  northStar: "Help authors create extraordinary explanations that teach people what to notice.",
  productProof: "Learners can question, adapt, practice and revisit that material while preserving its important reasoning and relationships. Exceptional featured content demonstrates the medium; authoring is the first product center.",
  productSource: { label: "Product charter", href: "docs/project/strategy.md" },
  areas: [
    {
      id: "architecture", title: "Architecture & retirement", horizon: "later",
      destination: "Replace a part without rebuilding its neighbors. Finish migrations and remove obsolete paths.",
      established: "Specialized configs and selected algebra styles have explicit owners. The shared algebra card now releases browser callbacks before disposing its clock; native and edition lifecycle checks pass. Broader consolidation remains separate.",
      evidence: { label: "Teardown repair and preservation evidence", href: "docs/project/reviews/2026-11-08-algebra-teardown.md" },
      outcome: {
        authority: "proposed",
        id: "remove-authoring-blocker", title: "Remove a demonstrated obstacle to authoring",
        finish: "The selected authoring proof identifies a concrete boundary or cost; a bounded repair removes it and preserves complete existing consumers.",
        excludes: "A speculative architecture campaign, new task queue or unrelated CSS rollout.",
        source: { label: "Infrastructure admission criteria", href: "docs/project/strategy.md" }
      }
    },
    {
      id: "authoring", title: "Authoring & the LLM loop", horizon: "next",
      destination: "Compose useful explanations quickly through a small, discoverable API with precise repair feedback.",
      established: "The fraction notebook's structure, focused workflow and style refinement are accepted. The approved successor tests an independent workbench source buffer with KP-owned validation and preview. General authoring speed, extraction and learning remain unproved.",
      evidence: { label: "Accepted notebook and bounded successor", href: "docs/project/reviews/2026-11-25-workbench-kp-object-boundary.md" },
      outcome: {
        authority: "proposed",
        id: "contextual-llm-revision", title: "Make one real contextual revision with an LLM",
        finish: "The existing native conversation receives exact object and draft context, returns a reviewable proposal, and reaches a checked KP preview. A real follow-up and reconnect retain context without replaying uncertain sends.",
        excludes: "A new chat backend, broad rich-editor extraction, arbitrary new choreography, canonical publication or whole-book infrastructure.",
        source: { label: "Proposed LLM authoring outcome", href: "docs/project/reviews/2026-11-25-llm-authoring-next-step.md" }
      }
    },
    {
      id: "representations", title: "Domain representations", horizon: "later",
      destination: "Refer precisely to domain objects and relationships across explanations, transformations and questions. Each domain retains its own meaning and validity rules.",
      established: "Matrix selections retain entry identity and product provenance. Mathematical coverage and presentation coverage remain distinct.",
      evidence: { label: "Matrix identity and scope", href: "docs/project/authoring/concise-domain-api.md" },
      outcome: {
        authority: "proposed",
        id: "reuse-math-in-practice", title: "Reuse one checked presentation in explanation and practice",
        finish: "Both uses refer to the same mathematical source and checked presentation, with exact return to its context and no copied mathematical or animation implementation.",
        excludes: "A universal knowledge graph or automatic coverage of every mathematical domain.",
        source: { label: "Repair roadmap · practice proof", href: "docs/project/reviews/2026-10-29-next-step-review.md" }
      }
    },
    {
      id: "reader", title: "Reader & presentation", horizon: "later",
      destination: "Rich explanations and precise inspection work together, with prose and annotations each receiving a clear moment of attention.",
      established: "The accepted algebra reader preserves a full explanation, independent readings and a scripted focused return. Physics still uses its separate rail host. Existing authoring and return foundations were integrated or rechecked, not newly invented; live conversation and learning outcomes remain unproved.",
      evidence: { label: "Accepted explanation and preservation evidence", href: "docs/project/reviews/2026-11-08-explanation-first.md" },
      outcome: {
        authority: "proposed",
        id: "situated-adaptation", title: "Adapt material while preserving its reasoning and referents",
        finish: "One learner-requested variation retains important authored relationships and a precise return to context. Physics-host consolidation is deferred unless this proof needs it.",
        excludes: "A universal schema, automatic host migration, catalogue rollout or claims of learning efficacy.",
        source: { label: "Accepted direction and deferred host proposal", href: "docs/project/decisions/2026-11-08-authoring-expert-attention.md" }
      }
    },
    {
      id: "practice", title: "Personal practice", horizon: "later",
      destination: "Use contextual questions to develop understanding over time, retaining mistakes and partial knowledge.",
      established: "Question projections and rehearsal experiments provide ingredients. The durable co-creative practice loop is still a product milestone.",
      evidence: { label: "Practice milestone", href: "docs/project/threads/co-creative-practice.md" },
      outcome: {
        authority: "proposed",
        id: "durable-practice-loop", title: "One question survives an attempt, revision and later return",
        finish: "After a reload, retrieve the exact question version, assistance conditions and mistake or uncertainty note from an attempt, then reopen the mathematical context. Preserve the old attempt when revising the question.",
        excludes: "A scheduling algorithm, automatic learner model or embedded chatbot.",
        source: { label: "Practice proposal", href: "docs/project/reviews/2026-10-28-next-step-review.md" }
      }
    },
    {
      id: "learning", title: "Experiments & workbench", horizon: "later",
      destination: "Learn systematically from examples, recover useful findings, and keep unfinished commitments visible.",
      established: "Source inspection finds an editor-owned native-conversation, exact-response capture, quoted follow-up and website-preview candidate. Its recorded end-to-end human acceptance remains pending; no live inference was run by this inspection. KP retains its independent source/compiler/reader.",
      evidence: { label: "Source inspection and handoff", href: "docs/project/reviews/2026-11-08-project-orientation.md" },
      outcome: {
        authority: "proposed",
        id: "independent-workbench-v1", title: "Preserve exact discussion and practice return in the independently owned workbench",
        finish: "Save anchored commentary and a question/attempt at exact source revisions, compare a candidate, export assistant context, and return after reload. One live KP adapter and isolated fixtures pass bounded failure/recovery checks; review the complete workflow before expansion.",
        excludes: "A repository split, new renderer, full GTD platform, scheduler algorithm, embedded model service or autonomous background agents.",
        source: { label: "Retained horizon; host and sequence superseded", href: "docs/project/2026-10-30-independent-workbench-v1.md" }
      }
    }
  ],
  completed: [
    {
      title: "Fraction notebook style comparison and rhythm accepted",
      scope: "Shared light Paper, named color swatches, object/property style comparison, masthead elevation and parent-owned spacing refine the focused notebook exemplar. This accepts its presentation, not general editor extraction.",
      source: { label: "Accepted refinement and preserved scope", href: "docs/project/reviews/2026-11-25-workbench-kp-object-boundary.md" }
    },
    {
      title: "Unified fraction notebook surface accepted",
      scope: "One masthead, matching prose fonts, reversible split motion and red modal cursors preserve the native player. Universal typography, exposed styles and a focused-buffer workflow remain successor work.",
      source: { label: "User acceptance and checked candidate", href: "docs/project/reviews/2026-11-24-unified-notebook-surface.md" }
    },
    {
      title: "Nested fraction structure editing accepted",
      scope: "One split-view exemplar supports optional titles, metadata, nested main text, list/outline presentation, folding and reversible block operations. V1/V2 drafts remain recoverable and the native player is preserved. This does not establish a general editor or whole-book performance.",
      source: { label: "User acceptance and bounded evidence", href: "docs/project/reviews/2026-11-24-structure-editor.md" }
    },
    {
      title: "A short orientation surface is accepted",
      scope: "The user accepts the dashboard and continuity workflow. Initial reconciliation reduced the three entrypoints from 22,754 to 1,544 words; checked budgets keep them short as direction changes. Earlier commitments remain in labeled history.",
      source: { label: "Orientation scope and preservation evidence", href: "docs/project/reviews/2026-11-08-project-orientation.md" }
    },
    {
      title: "A repeatable briefing checks direction and reads actual progress",
      scope: "The orientation command checks source agreement, approval boundaries and reading budgets, then reads the selected Theseus contract. It reports unavailable data explicitly. Human judgment still owns the dashboard's clarity and strategic interpretation.",
      source: { label: "Workflow, checks and remaining judgment", href: "docs/project/reviews/2026-11-08-project-orientation.md" }
    },
    {
      title: "Independent readings and focused return in the accepted reader",
      scope: "Two questions share one checked algebra source with distinct reading versions; a scripted follow-up returns to the original referent and reading position. This integrates existing foundations into this host. It is not a live conversational generation system; the physics content reused an already-existing authoring path.",
      source: { label: "Bounded result and effort critique", href: "docs/project/reviews/2026-11-08-explanation-first.md" }
    },
    {
      title: "One complete explanation preserved and accepted",
      scope: "The first explanation-first reader proof retains thirteen baseline paragraphs, separates six prose units from four mathematical states, and preserves the accepted attention treatment. The user accepts the explanation. No novice outcome, universal authoring support or general speedup is claimed.",
      source: { label: "Explanation acceptance and measured limits", href: "docs/project/reviews/2026-11-08-explanation-first.md" }
    },
    {
      title: "Annotations integrated into the accepted document reader",
      scope: "The same checked algebra explanation uses the accepted reader; prose and annotations have distinct reading moments, the fractional reader is preserved and the standalone shell is retired. The user accepts the integrated candidate after its typography and attention refinements. Wider promotion remains separate.",
      source: { label: "Integration and subsequent visual acceptance", href: "docs/project/reviews/2026-10-31-annotation-reader.md" }
    },
    {
      title: "Two-reader attention lifecycle accepted",
      scope: "Annotation presence follows reading position; story and restored focus release to neutral through one presentation owner. Both readers pass desktop/phone Chromium and Firefox checks, and the user accepts the treatment. Several-target comments and catalogue promotion remain separate.",
      source: { label: "Attention behavior, safeguards and costs", href: "docs/project/reviews/2026-11-08-reader-attention.md" }
    },
    {
      title: "Algebra card teardown releases callbacks before the clock",
      scope: "The Firefox disposed-clock diagnostic is reproduced and the shared owner repaired. Three native card hosts and both production edition sources pass lifecycle checks, including visibility ordering and retained-page restoration. No visual redesign or broader lifecycle framework.",
      source: { label: "Lifecycle regression and integration evidence", href: "docs/project/reviews/2026-11-08-algebra-teardown.md" }
    },
    {
      title: "Root tooling and selected algebra styles organized",
      scope: "87 specialized configs moved; tracked root entries fall from 120 to 34. All 124 CSS files are inventoried and four private algebra style paths are retired with complete consumers and automatic preservation evidence. Broader CSS cleanup, editor work and the reader's visual judgment remain separate.",
      source: { label: "Maintenance scope, verification and costs", href: "docs/project/reviews/2026-11-08-maintenance.md" }
    },
    {
      title: "Anchored annotation treatment accepted",
      scope: "The user accepts commentary beside the mathematical parts it explains. This closes the local visual experiment; prose coordination, document-reader integration and several-target comments remain separate work.",
      source: { label: "Scoped acceptance and successor", href: "docs/project/decisions/2026-10-31-annotation-attention-and-reader-consolidation.md" }
    },
    {
      title: "Shared algebra mounting converted",
      scope: "Composed algebra and distribute/collect share a validated reader owner. Old experiment mount and endpoint paths are removed; native lifecycle checks and complete consumer costs are preserved. Style ownership was deliberately left to a separate successor.",
      source: { label: "Mount conversion evidence", href: "docs/project/reviews/2026-10-30-shared-algebra-mount.md" }
    },
    {
      title: "Readable passage handoffs accepted",
      scope: "The fractional reader keeps generous spacing and readable explanations through exchange. Local acceptance; other layouts remain separate.",
      source: { label: "Acceptance and checks", href: "docs/project/2026-10-29-document-theater-ui.md" }
    },
    {
      title: "Obsolete algebra facade removed",
      scope: "Nine importers and two aliases converted. Saved source formats preserved. A finished bounded retirement; broader coupling remains.",
      source: { label: "Retirement closeout", href: "docs/project/reviews/2026-10-29-algebra-api-retirement.md" }
    }
  ],
  changes: [
    {
      id: "practice-priority", on: "2026-10-28",
      before: "Reader refinement and further explanation production.",
      after: "Co-creative personal practice becomes the leading product direction.",
      reason: "Questions, mistake context and repeated return are the user's primary interest. Explanations serve as experiments for the medium.",
      source: { label: "Priority decision", href: "docs/project/decisions/2026-10-28-co-creative-practice-priority.md" }
    },
    {
      id: "bounded-repair", on: "2026-10-29",
      before: "One facade retirement completed; broader host and style coupling remains.",
      after: "Propose bounded ownership repairs, then return to the practice proof. The broader workbench stays deferred; the repair campaign has not been approved.",
      reason: "Make reuse demonstrable and finish conversions without allowing infrastructure work to indefinitely displace the product goal.",
      source: { label: "Repair roadmap", href: "docs/project/reviews/2026-10-29-next-step-review.md" }
    },
    {
      id: "visible-continuity", on: "2026-10-29",
      before: "Direction and closure are spread across documents and historical dashboard entries.",
      after: "Add this bounded vision view; retain the repair recommendation and deferred horizons.",
      reason: "Repeated starts need visible finish lines and an honest record of changed commitments.",
      source: { label: "Vision UI contract", href: "docs/project/2026-10-29-project-vision-ui.md" }
    },
    {
      id: "independent-workbench-proposal", on: "2026-10-30",
      before: "Shared mounting was the recommended next delivery; the workbench horizon was one complete experiment with retained findings.",
      after: "Propose an independent collaboration workspace with exact references, revision comparison and a durable practice return. Shared mounting retains its original finish line as the first KP engine repair; neither new run is approved.",
      reason: "The user wants parallel development, rapid improvement of the tools used to build UI, and recoverable experiments that produce lasting lessons. Test that value in one usable workflow before expanding the platform.",
      source: { label: "Bounded workbench proposal", href: "docs/project/2026-10-30-independent-workbench-v1.md" }
    },
    {
      id: "shared-mount-closure", on: "2026-10-30",
      before: "Shared algebra mounting remained the first proposed KP engine repair.",
      after: "The approved mount conversion is complete. Selected-family style ownership is a separate successor; anchored explanation remains the next KP product proposal.",
      reason: "The original two-consumer finish line passed its preservation and integration checks. Retain that completion rather than expanding it into an indefinite architecture task; the workbench lane remains independent.",
      source: { label: "Bounded engine closeout", href: "docs/project/reviews/2026-10-30-shared-algebra-mount.md" }
    },
    {
      id: "anchored-algebra-candidate", on: "2026-10-30",
      before: "The next KP product proposal was anchored explanation; document projection and style ownership remained future repairs.",
      after: "The user approved one bounded algebra candidate. Review its situated commentary before reuse; retain document theater ownership as a later repair, with its accepted behavior preserved.",
      reason: "The repaired native mount can support a visible teaching experiment now. Test whether proximity makes the explanation useful before building shared annotation infrastructure; the independent workbench retains its separate direction.",
      source: { label: "Canonical review packet", href: "docs/project/reviews/2026-10-30-anchored-algebra.md" }
    },
    {
      id: "annotation-acceptance-and-consolidation", on: "2026-10-31",
      before: "A separate card-hosted annotation candidate awaited review while document projection remained a later repair.",
      after: "The annotation treatment is accepted. This KP lane next consolidates it into the accepted document reader, with its own moment of attention and retirement of the replaced shell. Several-target comments remain future work; no successor contract has started.",
      reason: "The user values annotations as explanations but objects to format sprawl and competition with normal prose. Keep the useful treatment and complete its integration; the editor workbench remains separately owned.",
      source: { label: "Accepted reader direction", href: "docs/project/decisions/2026-10-31-annotation-attention-and-reader-consolidation.md" }
    },
    {
      id: "annotation-reader-candidate", on: "2026-10-31",
      before: "The annotation treatment was accepted and consolidation into the document reader was the proposed successor.",
      after: "The user approved consolidation. Review the integrated reader's distinct annotation moments; the shared document projection replaces the separate card shell while preserving the fractional reference.",
      reason: "Complete the accepted format rather than adding another host. The implementation is a visual candidate, not shared annotation promotion; several-target comments and the separate workbench retain their boundaries.",
      source: { label: "Integrated candidate and preservation evidence", href: "docs/project/reviews/2026-10-31-annotation-reader.md" }
    },
    {
      id: "joint-attention-goal-clarification", on: "2026-11-04",
      before: "The visible north star described mathematical practice; recent work foregrounded local reader and algebra repairs.",
      after: "Restore the broader goal of human/LLM-authored explanations and precise joint attention across symbolic domains. Retain mathematical practice as the first proving ground, the reader checkpoint and all existing finite finish lines.",
      reason: "The user asks how local work leads to developing an eye for what matters. The proposed successor tests one complete explanation, situated follow-up and revision; it is not a new implementation commitment or a claim of general domain support.",
      source: { label: "Capability progression and proposed successor", href: "docs/project/reviews/2026-11-04-next-step-review.md" }
    },
    {
      id: "maintenance-with-limited-human-review", on: "2026-11-08",
      before: "The integrated annotation reader's visual judgment was the recommended next action.",
      after: "Recommend the existing bounded algebra style-ownership conversion while human-review availability is limited. The reader checkpoint stays pending, and the explanation-first successor remains the product direction; no new run has started.",
      reason: "Current sources show cross-example CSS imports and preview/edition dependencies. Complete one ownership repair with automatic preservation checks, retaining the original finish line and deferring new visual decisions.",
      source: { label: "Consolidation scope and evidence", href: "docs/project/reviews/2026-11-08-next-step-review.md" }
    },
    {
      id: "root-scope-and-parallel-editor-clarification", on: "2026-11-08",
      before: "Algebra style ownership was the proposed first maintenance outcome, with directory cleanup described mainly through source ownership.",
      after: "First group specialized root tooling configs. Inventory the full CSS set, then retain the algebra ownership conversion with its original finish line. Coordinate explicit KP/editor ownership before implementation; no new run has started.",
      reason: "The user clarifies that the clutter is in the project root and confirms a parallel editor session. Source inspection finds 91 root configs and 124 tracked CSS files in this checkout; the earlier 96-file count has no recovered counting scope.",
      source: { label: "Clarified scope and handoff", href: "docs/project/reviews/2026-11-08-next-step-review.md" }
    },
    {
      id: "maintenance-delivery-and-lifecycle-follow-up", on: "2026-11-08",
      before: "Root configuration ownership and a complete CSS inventory preceded the proposed algebra style conversion; implementation had not begun.",
      after: "The user approved sustained maintenance. Root organization and the bounded algebra style conversion now have preservation evidence and finite closure. A pre-existing Firefox teardown diagnostic supplies the next nonvisual repair candidate; the reader checkpoint and explanation-first product direction remain.",
      reason: "Reduce accidental coupling while human review is scarce. Preserve distinct static/initial CSS consumers instead of broadening their styles to reduce file count; record measured costs and the independent editor boundary.",
      source: { label: "Maintenance evidence and retained limitations", href: "docs/project/reviews/2026-11-08-maintenance.md" }
    },
    {
      id: "algebra-teardown-closure", on: "2026-11-08",
      before: "A pre-existing Firefox teardown diagnostic was the next bounded nonvisual repair candidate after maintenance.",
      after: "The user approved that successor and its shared-owner repair now has native and production-edition evidence. Return the next product action to the pending integrated reader review; retain the explanation-first successor and separately proposed navigation cleanup.",
      reason: "Close the observed reliability failure without letting maintenance indefinitely replace the teaching interaction. The completed repair retains its finite boundary and unchanged visual behavior.",
      source: { label: "Bounded repair closeout", href: "docs/project/reviews/2026-11-08-algebra-teardown.md" }
    },
    {
      id: "reader-attention-lifecycle", on: "2026-11-08",
      before: "The integrated reader had separate annotation moments, but presence was binary and restored focus could outlive its purpose.",
      after: "The user approved the full two-reader attention successor: reversible note fades, bounded story and URL focus, and one replaceable presentation policy. Review the candidate in the existing reader; retain the explanation-first experiment afterward.",
      reason: "Improve shared attention without creating another format or content-specific styling path. Preserve semantic sources, native paint and the earlier integration finish line; keep exact visual judgment and broader promotion distinct.",
      source: { label: "Approved scope and implemented evidence", href: "docs/project/reviews/2026-11-08-reader-attention.md" }
    },
    {
      id: "reader-accepted-explanation-proof-next", on: "2026-11-08",
      before: "The integrated reader and attention-lifecycle candidate awaited human visual judgment; explanation-first translation remained a retained successor proposal.",
      after: "The user approves the current two-reader treatment. Close those finite checkpoints and recommend one rich explanation translated into the same host, followed by repeatable authoring and precise revision. No new implementation run is approved.",
      reason: "The immediate ownership repairs make the next product proof viable, while example-specific assembly and unmeasured authoring costs remain. Let useful explanations identify the next abstraction instead of continuing broad CSS cleanup by default.",
      source: { label: "Approval and medium-term assessment", href: "docs/project/reviews/2026-11-08-medium-term-progression.md" }
    },
    {
      id: "explanation-accepted-reuse-next", on: "2026-11-08",
      before: "The reader treatment was accepted, but preserving a rich explanation through it remained a proposal.",
      after: "The user approves the progression and accepts its first complete explanation. Close that finite proof and pressure repeatable authoring next, with situated revision as the reader successor.",
      reason: "The accepted manuscript preserves the argument with no shared runtime or CSS change. A second question can now reveal actual assembly friction before a broader abstraction is promoted.",
      source: { label: "Accepted explanation and next boundary", href: "docs/project/reviews/2026-11-08-explanation-first.md" }
    },
    {
      id: "existing-capability-versus-missing-host", on: "2026-11-08",
      before: "The approved progression sought explanation preservation, reuse, situated return and a structurally different caller.",
      after: "Those bounded experiments are closed. The user accepts the physics content but challenges the cost of demonstrating an already-existing workflow. Recommend the concrete missing host integration instead of more confirmation of existing capability.",
      reason: "The algebra work adds local wiring; the physics compiler and rail already worked. Source reuse does not establish shared reader presentation, conversational generation or learner transfer. Preserve the completed finite scope and require a new bounded proposal for host convergence.",
      source: { label: "User critique and remaining boundary", href: "docs/project/reviews/2026-11-08-explanation-first.md" }
    },
    {
      id: "authoring-direction-and-orientation", on: "2026-11-08",
      before: "Co-creative practice was the leading product priority. A physics-reader migration was recommended after the explanation experiment.",
      after: "Authoring exceptional reusable material becomes the first product center; adaptation, practice and the library remain the horizon. Orientation infrastructure is approved now. A live authoring/revision proof is proposed next; physics migration is deferred.",
      reason: "The user wants responsive customization and exceptional featured content, and names getting lost as the main blocker. Preserve completed work while making approval boundaries and the product progression explicit.",
      source: { label: "Accepted direction and disposition of prior commitments", href: "docs/project/decisions/2026-11-08-authoring-expert-attention.md" }
    },
    {
      id: "technical-reference-and-teaching-exemplar", on: "2026-11-09",
      before: "What counts was the first real revision source and a possible main teaching exemplar.",
      after: "Keep it as a technical reference; develop the fractional-equation reader around a more consequential learner question. Guided theaters orient entry immediately, paragraphs use shared indentation, and beats carry one small instructional job while ordinary prose preserves the argument.",
      reason: "The user finds the reasoning clear but the topic contrived, and identifies unannotated entry and long beats as obstacles to reading. Technical reuse does not establish featured teaching quality.",
      source: { label: "Accepted exemplar and reading refinement", href: "docs/project/principles/document-theater-reading.md" }
    },
    {
      id: "notebook-requirements-and-approval", on: "2026-11-24",
      before: "Authoring-to-practice is approved; the fractional reasoning candidate awaits editorial review. A Markdown-backed authoring pilot was recommended during notebook exploration.",
      after: "The user clarifies persistent identity, nested scope and cross-notebook reuse, then approves sustained implementation of one two-notebook JSON proof. Retain the earlier programme and dashboard discussion as return paths.",
      reason: "An easier Markdown editor would not test the requested document ownership and scoped composition. Reuse the existing matrix scene and review one exemplar before generalization.",
      source: { label: "Clarified requirements and approved proof", href: "docs/project/reviews/2026-11-24-next-step-review.md" }
    },
    {
      id: "direct-fraction-notebook", on: "2026-11-24",
      before: "The matrix notebook proved identity, nesting and scoped reuse through an inspector-style composition surface; its writing experience was unaccepted.",
      after: "The user chooses direct Jupyter-like editing, accepts ProseMirror with embedded CodeMirror and selective metadata, then approves one fraction split-editor exemplar. The earlier proof and broader programme remain preserved.",
      reason: "The user prefers the fraction layout and wants to edit the notebook itself beside its rendered reading. This tests the interaction without replacing the semantic model or generalizing the editor across domains.",
      source: { label: "Accepted interaction direction and bounded trial", href: "docs/project/reviews/2026-11-24-fraction-notebook-editor.md" }
    },
    {
      id: "typed-article-and-inline-source", on: "2026-11-24",
      before: "The first split editor proves direct prose, checked specifications, UUID persistence and browser recovery; the byline is fixed and inline links/math are not editable objects.",
      after: "The user approves typed title/authors, contextual metadata, link-source reveal, inline KaTeX, one local caption and lighter serif typography in the same fraction exemplar, with frequent progress updates.",
      reason: "The user wants rich article writing with selectively exposed structure. Preserve the earlier checkpoint and existing reader authority while testing the specific interactions before a general component system.",
      source: { label: "Approved six-part successor scope", href: "docs/project/reviews/2026-11-24-rich-fraction-editor.md" }
    },
    {
      id: "nested-content-split-editor", on: "2026-11-24",
      before: "The rich editor candidate supplies typed article fields and inline source editing; its typography remains unaccepted and ordinary blocks are flat.",
      after: "The user approves agenda items 1–3: reader-like editing, nested content blocks and direct structure operations, retaining the split view and starting in Vim Normal mode. The earlier candidate stays recoverable.",
      reason: "Content may be composed into articles or reused separately. Optional titles and child structure test that direction in one exemplar. MathML is declined; the wider style, search, transclusion and authoring agenda remains deferred.",
      source: { label: "Approved structure-editing successor", href: "docs/project/reviews/2026-11-24-structure-editor.md" }
    },
    {
      id: "unified-notebook-presentation", on: "2026-11-24",
      before: "The nested structure editor is accepted, but duplicate mastheads and pane toolbars divide the experience; the reader and editor use different fonts.",
      after: "The user approves one masthead, editor serif typography in the preview, a sliding split transition and red block/line cursors. Structural editing remains accepted and preserved.",
      reason: "The writing workspace should open around the reading without losing context or adding another layer of headers. This is a presentation refinement in one exemplar, not a model or public-reader migration.",
      source: { label: "Approved unified-surface scope", href: "docs/project/reviews/2026-11-24-unified-notebook-surface.md" }
    },
    {
      id: "focused-animation-buffer", on: "2026-11-24",
      before: "The accepted split shows similar prose twice, while special-object editors have inconsistent keyboard behavior.",
      after: "The accepted direction is one rich document with focused source beside the current animation, optional full Preview, and separate Save/Run semantics. Styles and help/basic Ex follow; custom motions and text objects are parked.",
      reason: "Spend screen space on feedback for the object being edited and preserve the return path. The subsequent go approves the focused workflow, styles and help/basic Ex in one exemplar.",
      source: { label: "Focused-buffer next-step review", href: "docs/project/reviews/2026-11-24-focused-buffer-next-step-review.md" }
    },
    {
      id: "notebook-style-refinement", on: "2026-11-24",
      before: "The focused notebook candidate exposes styles in a flat list, with differing light backgrounds and separate paragraph/stage spacing.",
      after: "The user approves one presentation refinement: shared beige, named swatches, object/property search and grouping, masthead shadow and parent-owned gaps. The checked focused candidate remains recoverable.",
      reason: "Authors need to compare related styles and control document rhythm without deciphering hex values. This refines the exemplar; it does not accept broader promotion or change content and animation authority.",
      source: { label: "Approved style refinement", href: "docs/project/reviews/2026-11-24-notebook-style-comparison.md" }
    },
    {
      id: "separate-workbench-kp-object", on: "2026-11-25",
      before: "The accepted notebook combines general editing with KP-specific authoring, and the conversation explores a broader Codex workbench.",
      after: "The user approves one workbench object adapter: general source drafts and commands remain independent; KP retains domain validation and native rendering. The accepted notebook remains available.",
      reason: "Test the ownership boundary through an actual useful edit before extracting the rich editor or building more conversation infrastructure. The authoring-to-practice programme remains the return path.",
      source: { label: "Approved bounded integration", href: "docs/project/reviews/2026-11-25-workbench-kp-object-boundary.md" }
    },
    {
      id: "propose-real-llm-revision", on: "2026-11-25",
      before: "The separate object adapter proves manual source editing and KP-owned preview; the existing native conversation has not been joined to object proposals.",
      after: "Recommend one real contextual LLM revision next, using the existing session and domain owners. The user asks when LLMs enter the workflow; implementation approval is not inferred from that question.",
      reason: "Test the actual authoring benefit now rather than extending manual editor infrastructure. Retain the bounded adapter, accepted notebook and broader programme as separate foundations and return paths.",
      source: { label: "LLM authoring next-step review", href: "docs/project/reviews/2026-11-25-llm-authoring-next-step.md" }
    }
  ]
};
