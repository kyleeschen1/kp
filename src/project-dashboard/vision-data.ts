import type { ProjectVision } from "./vision-model.ts";

// Review with the roadmap at a milestone handoff or pivot; append the reason for
// changes. Task progress belongs to Theseus, not this source-linked horizon map.
export const projectVision: ProjectVision = {
  reviewedOn: "2026-11-08",
  northStar: "Develop an eye for what matters through rich explanations and precise shared attention across symbolic domains.",
  productProof: "A human or LLM authors an explanation; a learner points to an exact part, asks a question, receives a situated revision, and tries the idea with less guidance. Mathematical practice is the first proving ground; the complete interaction remains unproved.",
  productSource: { label: "Goal clarification and capability progression", href: "docs/project/reviews/2026-11-04-next-step-review.md" },
  areas: [
    {
      id: "architecture", title: "Architecture & retirement", horizon: "next",
      destination: "Replace a part without rebuilding its neighbors. Finish migrations and remove obsolete paths.",
      established: "Specialized configs have one home outside the root. The selected algebra family now consumes rendering/presentation styles directly, including previews and editions. Full CSS ownership evidence is available; broader consolidation remains separate.",
      evidence: { label: "Root and style ownership evidence", href: "docs/project/reviews/2026-11-08-maintenance.md" },
      outcome: {
        id: "algebra-teardown-ownership", title: "Release algebra readers before their clocks are disposed",
        finish: "Reproduce the Firefox teardown diagnostic and repair its owning lifecycle boundary. Closing or replacing a reader leaves no visibility callback using a disposed clock; tests pressure both event orders while preserving source, playhead and native paint.",
        excludes: "A new renderer, broad lifecycle framework, visual changes, editor-interface work or further CSS rollout. This is a proposed successor, not an active run.",
        source: { label: "Observed baseline diagnostic and next bounded repair", href: "docs/project/reviews/2026-11-08-maintenance.md" }
      }
    },
    {
      id: "authoring", title: "Authoring & the LLM loop", horizon: "later",
      destination: "Compose useful explanations quickly through a small, discoverable API with precise repair feedback.",
      established: "Concise matrix and algebra entrypoints exist. Supported generation tasks are bounded; broad rapid authoring is not established.",
      evidence: { label: "Current authoring API", href: "docs/project/authoring/concise-domain-api.md" },
      outcome: {
        id: "one-authoring-path", title: "One clear authoring path for the repaired algebra family",
        finish: "An author can find the supported entrypoint, revise an example, receive a located repair for an unsupported change, and use the checked result in the selected hosts. Record the time and engine intervention required.",
        excludes: "A universal authoring language or a large catalogue of new examples.",
        source: { label: "Repair roadmap · outcome 4", href: "docs/project/reviews/2026-10-29-next-step-review.md" }
      }
    },
    {
      id: "representations", title: "Domain representations", horizon: "later",
      destination: "Refer precisely to domain objects and relationships across explanations, transformations and questions. Each domain retains its own meaning and validity rules.",
      established: "Matrix selections retain entry identity and product provenance. Mathematical coverage and presentation coverage remain distinct.",
      evidence: { label: "Matrix identity and scope", href: "docs/project/authoring/concise-domain-api.md" },
      outcome: {
        id: "reuse-math-in-practice", title: "Reuse one checked presentation in explanation and practice",
        finish: "Both uses refer to the same mathematical source and checked presentation, with exact return to its context and no copied mathematical or animation implementation.",
        excludes: "A universal knowledge graph or automatic coverage of every mathematical domain.",
        source: { label: "Repair roadmap · practice proof", href: "docs/project/reviews/2026-10-29-next-step-review.md" }
      }
    },
    {
      id: "reader", title: "Reader & presentation", horizon: "later",
      destination: "Rich explanations and precise inspection work together, with prose and annotations each receiving a clear moment of attention.",
      established: "The fractional theater and anchored annotation treatment are locally accepted. Their integrated reader candidate now gives annotations separate reading moments and retires the card shell; integrated visual judgment remains open.",
      evidence: { label: "Integrated reader review", href: "docs/project/reviews/2026-10-31-annotation-reader.md" },
      outcome: {
        id: "annotations-in-document-reader", title: "Give annotations their own moment in the accepted reader",
        finish: "Host the same checked algebra explanation in the accepted document-reader experience. Review a clear handoff between narrative prose and situated annotations, preserve the fractional reader, and retire the replaced standalone shell.",
        excludes: "A universal annotation system, several-target implementation, new native choreography, workbench changes or catalogue-wide layout migration.",
        source: { label: "Accepted annotation and consolidation direction", href: "docs/project/decisions/2026-10-31-annotation-attention-and-reader-consolidation.md" }
      }
    },
    {
      id: "practice", title: "Personal practice", horizon: "later",
      destination: "Use contextual questions to develop understanding over time, retaining mistakes and partial knowledge.",
      established: "Question projections and rehearsal experiments provide ingredients. The durable co-creative practice loop is still a product milestone.",
      evidence: { label: "Practice milestone", href: "docs/project/threads/co-creative-practice.md" },
      outcome: {
        id: "durable-practice-loop", title: "One question survives an attempt, revision and later return",
        finish: "After a reload, retrieve the exact question version, assistance conditions and mistake or uncertainty note from an attempt, then reopen the mathematical context. Preserve the old attempt when revising the question.",
        excludes: "A scheduling algorithm, automatic learner model or embedded chatbot.",
        source: { label: "Practice proposal", href: "docs/project/reviews/2026-10-28-next-step-review.md" }
      }
    },
    {
      id: "learning", title: "Experiments & workbench", horizon: "later",
      destination: "Learn systematically from examples, recover useful findings, and keep unfinished commitments visible.",
      established: "The workbench now belongs to the separate editor lane. Its current host and execution records supersede this branch's older KP-hosted proposal; KP preserves independent mathematical and reader ownership.",
      evidence: { label: "Parallel ownership and current source", href: "docs/project/decisions/2026-10-31-annotation-attention-and-reader-consolidation.md" },
      outcome: {
        id: "independent-workbench-v1", title: "Preserve exact discussion and practice return in the independently owned workbench",
        finish: "Save anchored commentary and a question/attempt at exact source revisions, compare a candidate, export assistant context, and return after reload. One live KP adapter and isolated fixtures pass bounded failure/recovery checks; review the complete workflow before expansion.",
        excludes: "A repository split, new renderer, full GTD platform, scheduler algorithm, embedded model service or autonomous background agents.",
        source: { label: "Retained horizon; host and sequence superseded", href: "docs/project/2026-10-30-independent-workbench-v1.md" }
      }
    }
  ],
  completed: [
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
    }
  ]
};
