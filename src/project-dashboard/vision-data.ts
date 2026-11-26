import type { ProjectVision } from "./vision-model.ts";

// Review with the roadmap at a milestone handoff or pivot; append the reason for
// changes. Task progress belongs to Theseus, not this source-linked horizon map.
export const projectVision: ProjectVision = {
  directionId: "authoring-expert-attention-v1",
  commitment: {
    id: "kp-graph-sections-planar",
    title: "Follow one saddle section into 2D and back",
    approval: "approved",
    contractId: "run-contract.kp.graph-sections-planar-20261125",
    finish: "A moving saddle section retains its equation and curve identity through planar inspection and exact return to the saved camera. Stop at one visual review packet before another shape or shared renderer promotion.",
    source: { label: "Approved section/planar exemplar", href: "docs/project/2026-11-25-graph-sections-planar-pilot.md" }
  },
  uncertainty: "The accepted quadratic establishes one bounded live mathematical editing loop. Cross-family reuse, LLM-driven substantive revision and independent learner transfer remain unproved. Featured content's marketing value is a hypothesis.",
  nextJudgment: "The section and camera return are accepted. Discuss a reusable animation stage with prepared token layouts, selectable sequences and versioned asset updates. Host isolation and WebGL-versus-native text remain design choices; select bounded scope before implementation. Matrix authoring remains a proposed return path.",
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
      id: "authoring", title: "Authoring & the LLM loop", horizon: "later",
      destination: "Compose useful explanations quickly through a small, discoverable API with precise repair feedback.",
      established: "The notebook, persistent conversation, fruit-picker presentation and workspace frame are accepted. G1 now accepts the quadratic's linked equation, graph, derivative and tangent editing with reload, local views and measured costs. Existing split, focus, command and row/filter work retains its distinct review boundaries.",
      evidence: { label: "Accepted quadratic authoring and bounded evidence", href: "docs/project/reviews/2026-11-25-quadratic-authoring.md" },
      outcome: {
        authority: "proposed",
        id: "matrix-authoring-reuse", title: "Reuse the authoring boundary for one matrix and vector",
        finish: "One matrix/vector caller uses discoverable operations, linked symbolic/geometric views and saved identities through the existing resource, command and persistence boundary. Source edits affect its dependents while preserving the accepted quadratic; review it at G2 before promoting demonstrated common adapters.",
        excludes: "Implementation before bounded scope approval, the full animation portfolio, arbitrary CAS, the tabled matrix Pour treatment, new window infrastructure, exhaustive Vim parity and publication. Existing row/filter review remains separate.",
        source: { label: "Proposed M1 after accepted G1", href: "docs/project/2026-11-25-mathematical-authoring-programme.md" }
      }
    },
    {
      id: "representations", title: "Domain representations", horizon: "later",
      destination: "Refer precisely to domain objects and relationships across explanations, transformations and questions. Each domain retains its own meaning and validity rules.",
      established: "Matrix selections retain entry identity and product provenance. Typed spaces, basis-aware maps, derivatives and versioned caches provide foundations. The quadratic notebook demonstrates one bounded operation-to-view workflow; cross-family reuse remains unproved. Mathematical support and visual acceptance stay distinct.",
      evidence: { label: "Matrix identity and scope", href: "docs/project/authoring/concise-domain-api.md" },
      outcome: {
        authority: "proposed",
        id: "linked-mathematical-authoring", title: "Author linked symbolic and graphical objects",
        finish: "The accepted quadratic is the first caller. A matrix caller must establish reuse before the proposed 24-outcome mathematical portfolio expands; each new family retains its declared support and review gates.",
        excludes: "Implementation before scope review, exhaustive Vim parity, arbitrary CAS or implicit graphing, and automatic visual promotion. The earlier explanation/practice reuse proof remains a later application.",
        source: { label: "Proposed mathematical programme and acceptance gates", href: "docs/project/2026-11-25-mathematical-authoring-programme.md" }
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
      id: "learning", title: "Experiments & workbench", horizon: "next",
      destination: "Learn systematically from examples, recover useful findings, and keep unfinished commitments visible.",
      established: "The grid/saddle and linked section/planar-return exemplars are accepted. Exact mathematical and camera return, retained uploads and lifecycle behavior have bounded evidence. Prepared native notation, compiled publication artifacts and dependency manifests already exist; a unified reusable player and broad device performance remain unproved.",
      evidence: { label: "Section acceptance and reusable-player discussion", href: "docs/project/reviews/2026-11-25-graph-sections-planar.md" },
      outcome: {
        authority: "proposed",
        id: "reusable-animation-stage", title: "Reuse one prepared animation across contexts",
        finish: "After selecting scope and host/renderer boundaries, one existing animation plays chosen sequences in article and compact-card contexts, retains direct returns and measures preparation and loading costs. Reuse existing source, measurement, clock and dependency owners.",
        excludes: "Implicit implementation approval, universal WebGL text or graph conversion, a replacement semantic model, broad iframe rollout, general clipping, matrix authoring and publication.",
        source: { label: "Reusable-stage exploration after acceptance", href: "docs/project/reviews/2026-11-25-graph-sections-planar.md" }
      }
    }
  ],
  completed: [
    {
      title: "Saddle section and planar return accepted",
      scope: "One moving y=c section stays linked to its equation, can be inspected in x/z coordinates and returns to the saved 3D camera. The user accepts its presentation. Reusable player design, true transparency and shared renderer promotion remain separate.",
      source: { label: "Section acceptance and evidence", href: "docs/project/reviews/2026-11-25-graph-sections-planar.md" }
    },
    {
      title: "Direct GPU grid and saddle accepted",
      scope: "The user accepts one isolated coordinate grid and shaded saddle with retained geometry, reversible curvature and explicit Three comparison. Label backing is removed. Shapes, sections, exact planar endpoints and shared renderer promotion remain separate.",
      source: { label: "Pilot acceptance and measured limits", href: "docs/project/reviews/2026-11-25-direct-webgl-graph.md" }
    },
    {
      title: "Linked quadratic authoring accepted",
      scope: "G1 accepts one persistent quadratic with discoverable graph, derivative and tangent operations, reversible tangent motion, local views and reload. This closes M0; matrix reuse, cross-notebook imports, broad mathematical support and LLM-driven editing remain separate work.",
      source: { label: "G1 acceptance, evidence and limits", href: "docs/project/reviews/2026-11-25-quadratic-authoring.md" }
    },
    {
      title: "Refined workspace frame accepted",
      scope: "The quiet padded beige modeline sits above pickers, the editor header is hidden, and the pane retains a neutral edge with accessible focus cues. This closes the bounded frame refinement; mathematical authoring and broader row/filter promotion remain separate successors.",
      source: { label: "Frame acceptance and preservation evidence", href: "docs/project/reviews/2026-11-25-next-step-review.md" }
    },
    {
      title: "Persistent conversation in the KP editor accepted",
      scope: "The user confirmed the local Codex conversation works. Its saved thread, drafts, streaming and explicit recovery remain the foundation. Rich editing and passage notes are a separate successor milestone.",
      source: { label: "Persistent chat and user acceptance", href: "docs/project/reviews/2026-11-25-kp-persistent-chat.md" }
    },
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
    },
    {
      id: "select-kp-persistent-chat", on: "2026-11-25",
      before: "The proposed next step was a contextual object revision through the independent native workbench.",
      after: "The user explicitly selects persistent general chat inside the KP editor and authorizes borrowing existing session/recovery behavior. One local bridge serves the fraction editor exemplar; notebook and rendering authority stay separate.",
      reason: "Establish a durable conversation where the user is already working before narrowing it to automatic object proposals. Preserve the independent adapter and broader authoring-to-practice return path.",
      source: { label: "Approved persistent chat implementation", href: "docs/project/reviews/2026-11-25-kp-persistent-chat.md" }
    },
    {
      id: "select-rich-kp-chat", on: "2026-11-25",
      before: "Persistent chat is accepted. Exploration of Spindle, reusable interaction libraries and queryable records raises broader architecture options.",
      after: "The user returns to the existing KP Chat window for one rich editor exemplar with small notes, passage comments and tags. Share local profiles while keeping storage and model history separate; broader extraction stays a later choice.",
      reason: "Make the current conversation useful for writing and returning to exact context without waiting for a general workspace or library migration. Preserve the accepted chat milestone and wider authoring programme.",
      source: { label: "Approved rich chat scope", href: "docs/project/reviews/2026-11-25-kp-rich-chat.md" }
    },
    {
      id: "select-keyboard-chat", on: "2026-11-25",
      before: "The rich chat and annotation candidate is checked, with permanent controls and separate editor surfaces. Its presentation has not been accepted.",
      after: "The user approves one scrolling column, a retained draft appearing in Insert mode, a Ctrl-C transient, and explicit topic, branch and orientation return paths.",
      reason: "Reduce repeated context reconstruction while preserving native conversation history, independent notes and safe draft recovery. This authorizes the bounded interaction exemplar, not a general workspace or editor-library promotion.",
      source: { label: "Approved keyboard conversation design", href: "docs/project/reviews/2026-11-25-keyboard-chat.md" }
    },
    {
      id: "select-persistent-composition-windows", on: "2026-11-25",
      before: "The checked keyboard chat hides its composer on Escape and shares a global masthead with the notebook.",
      after: "The user keeps the composer permanently visible, moves the masthead into the KP page window, and approves staggered translucent surfaces with stable phone-width columns and animated focus elevation.",
      reason: "Keep the writing place available while consulting output or the KP page. Repair the observed reload flash at theme startup and preserve the existing buffers, player and native sessions.",
      source: { label: "Approved persistent composition and windows", href: "docs/project/reviews/2026-11-25-windowed-chat.md" }
    },
    {
      id: "reject-right-sliding-chat", on: "2026-11-25",
      before: "The user requested a shared masthead, full-width KP and a more transparent chat sliding from the right.",
      after: "The user rejected that visible candidate and requested an earlier layout. Its source changes were removed, restoring the preceding window version while clarifying the exact rollback target.",
      reason: "The result did not match the desired experience. Retain draft, session and theme-startup guarantees; do not continue or promote the rejected presentation.",
      source: { label: "Rejected overlay and rollback checkpoint", href: "docs/project/reviews/2026-11-25-overlay-chat.md" }
    },
    {
      id: "restore-pre-window-text-widths", on: "2026-11-25",
      before: "The first window candidate capped both text columns at 360px, and that narrowing survived removal of the rejected sliding overlay.",
      after: "The user requests restoration of the earlier 440px KP prose and roughly 490px desktop chat text widths.",
      reason: "Restore the identified reading measure without changing the current window behavior, saved content or native conversation sessions.",
      source: { label: "Requested text-width correction", href: "docs/project/reviews/2026-11-25-windowed-chat.md" }
    },
    {
      id: "select-recency-window-stack", on: "2026-11-25",
      before: "The restored candidate uses fixed left/right window positions and a page-owned masthead, with corrected 440px KP and 491px chat text columns.",
      after: "The user explicitly selects 55vw outer windows, recency ordering that moves active work to the upper left, and a stationary global masthead. Keep the restored reading columns centered inside each window.",
      reason: "Give active work a consistent front position while retaining context, drafts and native animation. This replaces the earlier layout candidate without resuming the rejected sliding overlay or authorizing a general window framework.",
      source: { label: "Approved recency stack and preservation boundary", href: "docs/project/reviews/2026-11-25-recency-window-stack.md" }
    },
    {
      id: "reject-recency-stack", on: "2026-11-25",
      before: "The approved 55vw recency stack moved active work to the upper left beneath a global masthead; functional preservation checks passed.",
      after: "The user rejected the visible treatment and requested a fixed split, Codex left and KP right. Discuss Org-based issue tracking without Emacs before implementing that replacement.",
      reason: "The moving window arrangement did not serve the desired experience. Retain data and editing guarantees, stop this visual candidate, and do not interpret an issue-tracking question as authorization to migrate trackers.",
      source: { label: "Rejection and requested fixed split", href: "docs/project/reviews/2026-11-25-fixed-chat-split.md" }
    },
    {
      id: "clarify-equal-static-split", on: "2026-11-25",
      before: "The fixed split was selected after rejecting the moving stack, with implementation held for the Org discussion.",
      after: "The user explicitly clarifies equal side-by-side 50% panes, no animations, and permission to center the solitary pane. Resume that bounded correction.",
      reason: "Remove the overcomplicated moving layout while keeping the existing writing and reading state. The Org discussion remains separate from repository execution ownership.",
      source: { label: "Clarified static split and preservation boundary", href: "docs/project/reviews/2026-11-25-fixed-chat-split.md" }
    },
    {
      id: "select-joined-chat-editors", on: "2026-11-25",
      before: "The fixed split passed preservation checks, with a centered chat column and fixed bottom-third draft.",
      after: "The user approves two independent ProseMirror instances in one full-pane bordered flex column, with internal padding, a growing composer, speaker labels and code/tool folding.",
      reason: "Keep navigation and folding while making the chat simpler to read and write. Native Codex remains authoritative; view preferences and draft state are independent. Preserve the completed static split instead of extending its finished scope.",
      source: { label: "Joined chat discussion and approved refinement", href: "docs/project/reviews/2026-11-25-joined-chat-composer.md" }
    },
    {
      id: "record-multiplexer-and-select-modeline", on: "2026-11-25",
      before: "The joined chat exemplar passed its scoped checks. Discussion expanded to contextual return, coordinated agents, common object operations, MCP and storage.",
      after: "The user asks to preserve the full vision and implement a bounded cosmetic successor: no default line numbers, matching reading spacing, inactive-pane dimming and a bottom mode/pane/time bar.",
      reason: "Make focus and context easier to perceive while preserving the future design without starting a general multiplexer or replacing domain data owners.",
      source: { label: "Recorded vision and finite candidate proofs", href: "docs/project/2026-11-25-multiplexer-vision.md" }
    },
    {
      id: "replace-veil-with-pane-and-line-focus", on: "2026-11-25",
      before: "The checked modeline candidate dimmed inactive panes and retained adjacent chat wrapper borders. The user found cursor-only focus cues confusing.",
      after: "The user approves active-pane shadow, single separators, a default-size modeline and current-line emphasis, explicitly including existing custom block text.",
      reason: "Keep content legible and make the input location easier to find without moving the split or replacing editor state. Web Components and new reusable text components remain future proofs.",
      source: { label: "Approved focus pass and preservation boundary", href: "docs/project/reviews/2026-11-25-workspace-focus-lines.md" }
    },
    {
      id: "select-fruit-picker-exemplar", on: "2026-11-25",
      before: "The focus pass has a checked candidate and remains available for visual judgment. The broader multiplexer design includes common pickers.",
      after: "The user approves a fruit-only floating picker with a small ProseMirror query, five suggestions, fuzzy matching and keyboard selection.",
      reason: "Try the interaction and reliable context return before binding it to files, sessions or other resources. Retain prior focus work without calling it visually accepted or expanding it into a framework.",
      source: { label: "Approved picker walkthrough and finite scope", href: "docs/project/reviews/2026-11-25-fruit-picker.md" }
    },
    {
      id: "select-workspace-command-registry", on: "2026-11-25",
      before: "The fruit picker has an accepted presentation. Toolbar callbacks, chat transients and Ex commands expose overlapping actions separately.",
      after: "The user approves shared command identities and M-x, adding Ctrl-x Ctrl-x as an alternative launcher. Existing buttons remain connected to those commands.",
      reason: "Make current actions discoverable while preserving the pane, selection and object they operate on. The fruit milestone stays finite; broader resource pickers and remote protocols remain separate.",
      source: { label: "Approved workspace command proposal", href: "docs/project/reviews/2026-11-25-workspace-commands.md" }
    },
    {
      id: "select-vim-binding-coverage", on: "2026-11-25",
      before: "Workspace commands have a checked candidate. Prose, source editors and transcript navigation expose different Vim behavior without one complete support reference.",
      after: "The user approves an M-x coverage checklist built from a pinned Vim command index, with explicit implementation states for each surface.",
      reason: "Make missing and partial behavior visible before choosing more bindings to implement. The prior command and focus candidates retain their review status; this inventory does not authorize new Vim behavior.",
      source: { label: "Approved Vim coverage scope", href: "docs/project/reviews/2026-11-25-vim-binding-coverage.md" }
    },
    {
      id: "select-floating-row-picker", on: "2026-11-25",
      before: "Vim coverage has a checked reference/support audit and a full-height panel. Fruit and command pickers render their own row shapes.",
      after: "The user approves a floating Vim exemplar with structured rows, explicit matching fields and a C-h tag-filter transient, followed by human review before M-x adoption.",
      reason: "Make richly annotated results compact and navigable while preserving their metadata, ownership and exact return context. Retain the prior reference and support evidence; replace only its presentation. This does not approve new Vim behavior or a universal domain schema.",
      source: { label: "Approved floating rows and filters", href: "docs/project/reviews/2026-11-25-row-picker.md" }
    },
    {
      id: "vim-priority-and-mathematical-programme-proposal", on: "2026-11-25",
      before: "The floating Vim picker has a checked candidate; broader modal editing and connected mathematical-object authoring were discussion. Representation reuse in explanation and practice was a later proposal.",
      after: "Document the Vim design and accept conventional core plus semantic commands, keeping parity gaps visible. Propose linked mathematical authoring and a finite animation portfolio; retain the row-picker review and earlier practice reuse as separate commitments and horizons.",
      reason: "The user wants major symbolic and graphical capabilities to compose through autocomplete without an exhaustive editor rebuild. Source inspection finds reusable foundations but missing integration. A quadratic and matrix caller must establish the workflow before broad promotion; no mathematical implementation run is approved.",
      source: { label: "Accepted priority and linked review proposals", href: "docs/project/decisions/2026-11-25-vim-core-and-semantic-commands.md" }
    },
    {
      id: "workspace-frame-before-mathematics", on: "2026-11-25",
      before: "The Vim and mathematical programme are documented; the checked row-picker candidate retains its review boundary.",
      after: "The user endorses that direction and requests a larger elevated modeline and temporary editor-header removal first. Recommend one bounded workspace-frame pass, then the saved quadratic and matrix authoring callers. Picker containment already feels right; preserve its placement.",
      reason: "Finish the immediate workspace refinement while keeping the mathematical return path explicit. This records a next-step recommendation, not an implementation result or permission to resume old runs. Broader row/filter acceptance and promotion gates remain separate.",
      source: { label: "Frame request, clarification and recommended sequence", href: "docs/project/reviews/2026-11-25-next-step-review.md" }
    },
    {
      id: "approve-workspace-frame", on: "2026-11-25",
      before: "The workspace frame is the proposed immediate refinement, with the quadratic authoring workflow as the return path.",
      after: "The user approves implementation. Select one frame/header package and a visual checkpoint, preserving the native editor/session owners and picker placement. The older row-picker contract retains its completed implementation and separate review boundary.",
      reason: "Make the workspace boundary and status legible, then resume the mathematical sequence without expanding this presentation slice into a new window system.",
      source: { label: "Approval and bounded implementation", href: "docs/project/reviews/2026-11-25-next-step-review.md" }
    },
    {
      id: "refine-workspace-frame", on: "2026-11-25",
      before: "The first checked frame candidate places pane buttons, Commands and routine save status in an elevated modeline. It still defaults to the dark palette.",
      after: "The user requests a quieter bar with more spacing and end padding, removing those labels and routine save messages. Restore the prior beige surface and correct the rendered reader's startup color before the mathematical return.",
      reason: "Keep workspace orientation through mode, time and keyboard commands without crowding the frame. Reader and editor theme ownership must agree before the delayed editing bridge loads.",
      source: { label: "Requested quiet modeline and beige startup revision", href: "docs/project/reviews/2026-11-25-next-step-review.md" }
    },
    {
      id: "accept-frame-propose-quadratic", on: "2026-11-25",
      before: "The checked frame refinements await review while mathematical authoring remains the intended return path.",
      after: "The user accepts the repaired frame and asks what comes next. Close that bounded outcome and recommend M0: a persistent quadratic with discoverable graph, derivative and tangent operations, followed by a matrix reuse proof.",
      reason: "Return from workspace refinement to useful mathematical authoring. Prove one complete editable relationship before generalizing adapters or expanding the animation portfolio; no mathematical implementation starts with this recommendation.",
      source: { label: "Accepted frame and next-step review", href: "docs/project/reviews/2026-11-25-next-step-review.md" }
    },
    {
      id: "approve-quadratic-exemplar", on: "2026-11-25",
      before: "The frame is accepted and M0 quadratic authoring is the recommended successor.",
      after: "The user approves implementing M0 in the existing notebook: persistent resource, applicable operations, linked equation/graph/derivative/tangent and reload. Keep the matrix caller behind G1 and the wider programme proposed.",
      reason: "Prove the discoverable mathematical object through one complete authoring workflow while preserving the accepted workspace and domain owners.",
      source: { label: "M0 approval and delivery boundary", href: "docs/project/2026-11-25-mathematical-authoring-programme.md" }
    },
    {
      id: "quadratic-ready-for-g1", on: "2026-11-25",
      before: "M0 is approved while mathematical resources are not yet integrated into the notebook.",
      after: "A selected quadratic notebook now exposes persistent source/derived objects, native symbolic and 2D views, captured commands, tangent playback and local occurrences. Deliver the checked candidate for G1 without promoting the adapter or opening M1.",
      reason: "The complete first workflow is now inspectable. Human judgment should select its interaction and visual direction before a matrix caller tests whether the boundary generalizes.",
      source: { label: "G1 exemplar, verification and measured limits", href: "docs/project/reviews/2026-11-25-quadratic-authoring.md" }
    },
    {
      id: "accept-quadratic-propose-matrix-reuse", on: "2026-11-25",
      before: "The checked quadratic authoring exemplar awaits G1 visual and interaction judgment.",
      after: "The user accepts the exemplar and asks what it accomplishes. Close M0 and retain its finite finish; propose the existing M1 matrix/vector caller as a separate successor without starting it.",
      reason: "The first complete object-to-operation-to-view loop now has human acceptance. A structurally different caller is the next useful test of reuse before broader mathematical families or shared adapter promotion.",
      source: { label: "User acceptance and preserved scope", href: "docs/project/reviews/2026-11-25-quadratic-authoring.md" }
    },
    {
      id: "try-direct-webgl-grid-saddle", on: "2026-11-25",
      before: "M0 is accepted and matrix reuse is proposed. The independently owned workbench remains a later horizon in its original proposal.",
      after: "The user requests a direct WebGL coordinate grid and saddle experiment before returning to the mathematical programme. One isolated host tests appearance and cost against the current renderer; promotion requires visual review.",
      reason: "A bounded rendering experiment can test smooth lighting and retained GPU computation without changing semantic owners or presuming a full renderer replacement is worthwhile.",
      source: { label: "User-authorized grid and saddle pilot", href: "docs/project/2026-11-25-direct-webgl-graph-pilot.md" }
    },
    {
      id: "accept-direct-grid-saddle", on: "2026-11-25",
      before: "The isolated grid/saddle is checked and awaiting visual judgment; matrix reuse remains proposed.",
      after: "The user accepts the appearance with a label-background correction and asks about metrics, shapes, sections and 2D return. Close the bounded pilot and propose a linked section/planar-view proof without starting it or retiring Three.",
      reason: "The first visual result is accepted. Different geometry and reversible planar inspection would test whether a bounded direct renderer serves the mathematical programme before accumulating a general rendering engine.",
      source: { label: "Acceptance, label correction and discussion", href: "docs/project/reviews/2026-11-25-direct-webgl-graph.md" }
    },
    {
      id: "approve-saddle-section-return", on: "2026-11-25",
      before: "The accepted grid/saddle suggests a linked cross-section and planar return proof; its implementation is proposed.",
      after: "The user agrees and authorizes that bounded proof. Extend the isolated experiment with a moving section, linked equation, reversible planar inspection and exact saved-camera return, then stop for visual review.",
      reason: "This tests a useful mathematical explanation workflow while preserving numerical authority and renderer optionality. Other shape families and a Three replacement remain unapproved.",
      source: { label: "Section/2D approval and scope", href: "docs/project/2026-11-25-graph-sections-planar-pilot.md" }
    },
    {
      id: "accept-section-explore-reusable-stage", on: "2026-11-25",
      before: "The bounded saddle section and reversible planar inspection await visual judgment.",
      after: "The user accepts the exemplar and proposes controlled reusable stages, prepared token positions, WebGL relationships and selective versioned asset imports. Preserve this as design exploration without starting a renderer migration.",
      reason: "Reuse in articles, flashcards and contextual returns should reduce repeated configuration and preparation. Existing measured native scenes and compiled assets are foundations; iframe ownership and text rendering need separate judgment.",
      source: { label: "Acceptance and new design discussion", href: "docs/project/reviews/2026-11-25-graph-sections-planar.md" }
    }
  ]
};
