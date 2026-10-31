import type { ProjectVision } from "./vision-model.ts";

// Review with the roadmap at a milestone handoff or pivot; append the reason for
// changes. Task progress belongs to Theseus, not this source-linked horizon map.
export const projectVision: ProjectVision = {
  reviewedOn: "2026-10-30",
  northStar: "Build and revisit mathematical understanding with an LLM.",
  productProof: "Revise a question, attempt it, record a mistake or uncertainty, and return later to its exact mathematical context.",
  productSource: { label: "Personal practice direction", href: "docs/project/decisions/2026-10-28-co-creative-practice-priority.md" },
  areas: [
    {
      id: "architecture", title: "Architecture & retirement", horizon: "later",
      destination: "Replace a part without rebuilding its neighbors. Finish migrations and remove obsolete paths.",
      established: "One obsolete algebra facade has been retired. Shared mounting and cross-example style dependencies remain.",
      evidence: { label: "Retirement evidence", href: "docs/project/reviews/2026-10-29-algebra-api-retirement.md" },
      outcome: {
        id: "shared-algebra-mount", title: "Two examples share an independently owned mount",
        finish: "Composed algebra and distribute/collect use the same validated mounting owner; superseded import paths are removed, and behavior and lifecycle checks remain stable.",
        excludes: "A new renderer, a repository-wide migration, or visual redesign.",
        source: { label: "Repair roadmap · outcome 1", href: "docs/project/reviews/2026-10-29-next-step-review.md" }
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
      id: "representations", title: "Mathematical representations", horizon: "later",
      destination: "Reuse fine-grained mathematical objects across explanations, transformations and questions.",
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
      destination: "Reading and mathematical inspection feel coherent in documents and smaller learning interactions.",
      established: "The latest fractional theater pacing is accepted locally. This does not establish a shared layout for every lesson.",
      evidence: { label: "Accepted reader treatment", href: "docs/project/2026-10-29-document-theater-ui.md" },
      outcome: {
        id: "owned-document-theater", title: "Give the accepted theater its own layout and style owners",
        finish: "The accepted document compiles directly through explicit projection inputs; its HTML rewrite and selected cross-example style inheritance are removed. Search, reverse, direct jumps and native math remain intact.",
        excludes: "New choreography, global typography changes or migration of all reader families.",
        source: { label: "Repair roadmap · outcomes 2–3", href: "docs/project/reviews/2026-10-29-next-step-review.md" }
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
      id: "learning", title: "Experiments & workbench", horizon: "next",
      destination: "Learn systematically from examples, recover useful findings, and keep unfinished commitments visible.",
      established: "The first editor-host rich reader, exact capture and real-project preview is visually accepted locally. It uses labeled fixtures; live session integration and durable practice remain follow-up work.",
      evidence: { label: "Accepted editor host and boundaries", href: "docs/project/decisions/2026-10-30-editor-workbench-host.md" },
      outcome: {
        id: "workbench-live-conversation", title: "Use one real conversation while improving the workbench",
        finish: "Start or resume one compatible native thread through the rich reader, send and interrupt with visible status and approvals, capture an exact completed response, and reopen with thread identity, unsent draft and capture intact. Reuse existing session ownership; verify durable storage instead of relying on the temporary candidate profile. Proposed, not an approved run.",
        excludes: "A full conversation archive, multiple active agents, a complete GTD system, a completed practice loop, automatic resend or changes to KP rendering.",
        source: { label: "First acceptance and proposed successor", href: "docs/project/decisions/2026-10-30-editor-workbench-host.md" }
      }
    }
  ],
  completed: [
    {
      title: "First workbench reader and preview accepted",
      scope: "Rich fixture reading, exact captures, shared programmable commands and real local website previews accepted visually. Live conversations, archive search and durable native capture are not delivered by this milestone; editor backup remains pending authorization.",
      source: { label: "Scoped workbench acceptance", href: "docs/project/decisions/2026-10-30-editor-workbench-host.md" }
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
      id: "native-codex-workbench", on: "2026-10-30",
      before: "The first workbench interaction exported context to an external assistant.",
      after: "Prove a native Codex session inside the local UI first, then connect exact-reference collaboration and practice. Export remains a fallback; the forecast does not start a multiweek run.",
      reason: "The user wants the assistant beside the artifact while retaining Codex session/context affordances and intended existing-plan usage. Plain text is enough to test that integration.",
      source: { label: "Native Codex constraint", href: "docs/project/decisions/2026-10-30-native-codex-workbench.md" }
    },
    {
      id: "editor-workbench-host", on: "2026-10-30",
      before: "Propose a new independent workspace from KP, beginning with a native-session proof and then exact-reference collaboration and practice.",
      after: "Evolve the existing editor instead. Start with one approved rich reader/capture/project-preview candidate over its shared SCI commands; preserve native-session integration and personal practice as successor outcomes.",
      reason: "Reuse the working programmable editor while allowing richer non-text views, rapid UI iteration and independent KP development. The earlier proposal's destination survives; its immediate host and sequence are superseded.",
      source: { label: "Editor-host decision", href: "docs/project/decisions/2026-10-30-editor-workbench-host.md" }
    },
    {
      id: "workbench-first-acceptance", on: "2026-10-30",
      before: "Review the first reader/capture/project-preview candidate over the editor's commands.",
      after: "Preserve the user's local visual acceptance and propose one native conversation with durable capture as a separate successor.",
      reason: "The next useful test is working in the interface while improving it. Existing native session machinery can be reused, but its editor assumptions and temporary candidate storage still need bounded integration work.",
      source: { label: "Accepted first interface and next recommendation", href: "docs/project/decisions/2026-10-30-editor-workbench-host.md" }
    }
  ]
};
