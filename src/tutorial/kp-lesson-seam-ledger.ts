export type KpLessonSeamCaller = "economics" | "lisp" | "reader-document";

export type KpLessonSeamDisposition =
  | "reuse-existing"
  | "extract-shared"
  | "adapt-document"
  | "domain-local";

export interface KpLessonSeamEvidence {
  readonly caller: KpLessonSeamCaller;
  readonly paths: readonly string[];
}

export interface KpLessonSeamLedgerEntry {
  readonly id: string;
  readonly disposition: KpLessonSeamDisposition;
  readonly lifecycle: string;
  readonly evidence: readonly KpLessonSeamEvidence[];
  readonly extractionSlice?: "s21" | "s22" | "s23" | "s24" | "s25" | undefined;
  readonly boundary: string;
}

export type KpLessonDocumentFieldDisposition =
  | "retain"
  | "adapt"
  | "domain-extension"
  | "exclude";

export interface KpLessonDocumentFieldLedgerEntry {
  readonly path: string;
  readonly disposition: KpLessonDocumentFieldDisposition;
  readonly economics: string;
  readonly lisp: string;
  readonly decision: string;
}

export type KpLessonApiTier =
  | "shared-internal"
  | "replaceable-first-party-host"
  | "domain-internal"
  | "experimental-domain";

export interface KpLessonApiTierEntry {
  readonly id: string;
  readonly tier: KpLessonApiTier;
  readonly ownerPaths: readonly string[];
  readonly callers: readonly KpLessonSeamCaller[];
  readonly boundary: string;
  readonly promotionCondition?: string | undefined;
}

const economics = (...paths: readonly string[]): KpLessonSeamEvidence =>
  Object.freeze({ caller: "economics", paths: Object.freeze(paths) });
const lisp = (...paths: readonly string[]): KpLessonSeamEvidence =>
  Object.freeze({ caller: "lisp", paths: Object.freeze(paths) });
const readerDocument = (...paths: readonly string[]): KpLessonSeamEvidence =>
  Object.freeze({ caller: "reader-document", paths: Object.freeze(paths) });

/**
 * This inventory is the extraction gate. A similar shape is insufficient:
 * shared candidates need the same ownership and browser lifecycle in two
 * independent tutorials, while domain projection stays behind callbacks.
 */
export const kpLessonSeamLedger: readonly KpLessonSeamLedgerEntry[] =
  Object.freeze([
    seam({
      id: "semantic-destination-url",
      disposition: "reuse-existing",
      lifecycle: "serialize and parse section, block, and checkpoint destinations",
      evidence: [
        economics(
          "src/tutorial/economics-demand-shift/economics-demand-shift-deep-link.ts",
          "src/tutorial/economics-demand-shift/economics-demand-shift-publication.ts"
        ),
        lisp("src/tutorial/lisp-function-application/lisp-function-application-publication.ts")
      ],
      boundary: "The URL carries semantic identity, never animation progress."
    }),
    seam({
      id: "static-toc-and-scrubber-renderers",
      disposition: "reuse-existing",
      lifecycle: "emit final pre-upgrade geometry and meaningful fallback links",
      evidence: [
        economics("src/tutorial/economics-demand-shift/economics-demand-shift-publication.ts"),
        lisp("src/tutorial/lisp-function-application/lisp-function-application-publication.ts")
      ],
      boundary: "Authors supply models; generated custom-element internals are not authoring syntax."
    }),
    seam({
      id: "lesson-publication-document",
      disposition: "adapt-document",
      lifecycle: "compile ordered sections, passages, and motion references from canonical prose",
      evidence: [
        economics("src/tutorial/economics-demand-shift/economics-demand-shift-lesson-compiler.ts"),
        lisp("src/tutorial/lisp-function-application/lisp-function-application-lesson-compiler.ts"),
        readerDocument("src/reader/document/lesson-document.ts")
      ],
      extractionSlice: "s21",
      boundary: "Reconcile with KpLessonDocument; do not create a peer document authority."
    }),
    seam({
      id: "motion-block-metadata",
      disposition: "extract-shared",
      lifecycle: "declare ordered blocks, labeled checkpoints, and viewport corridors",
      evidence: [
        economics("src/tutorial/economics-demand-shift/economics-demand-shift-motion-blocks.ts"),
        lisp("src/tutorial/lisp-function-application/lisp-function-application-motion-blocks.ts")
      ],
      extractionSlice: "s22",
      boundary: "Metadata is shared; graph scenes and Lisp runtime frames are not."
    }),
    seam({
      id: "corridor-projection-and-rebase",
      disposition: "extract-shared",
      lifecycle: "map viewport travel through authored holds and resume smoothly after manual control",
      evidence: [
        economics(
          "src/tutorial/economics-demand-shift/KpEconomicsDemandShiftTutorial.svelte"
        ),
        lisp("src/tutorial/lisp-function-application/lisp-function-application-scroll.ts")
      ],
      extractionSlice: "s22",
      boundary: "Pure numeric projection cannot import a domain model, renderer, DOM, or Svelte."
    }),
    seam({
      id: "one-owner-scroll-coordination",
      disposition: "extract-shared",
      lifecycle: "sample registered anchors once per animation frame and choose one reading-band owner",
      evidence: [
        economics(
          "src/tutorial/economics-demand-shift/KpEconomicsDemandShiftTutorial.svelte"
        ),
        lisp("src/tutorial/lisp-function-application/lisp-function-application-scroll.ts")
      ],
      extractionSlice: "s22",
      boundary: "The coordinator reports progress and intent; callers own semantic projection and paint."
    }),
    seam({
      id: "cumulative-motion-projection",
      disposition: "extract-shared",
      lifecycle: "settle earlier blocks, sample one active block, and leave later blocks inactive",
      evidence: [
        economics("src/tutorial/economics-demand-shift/economics-demand-shift-motion-blocks.ts"),
        lisp("src/tutorial/lisp-function-application/lisp-function-application-motion-controller.ts")
      ],
      extractionSlice: "s22",
      boundary: "Shared status/progress never decides economics scenes or Lisp material lineage."
    }),
    seam({
      id: "navigation-transaction",
      disposition: "extract-shared",
      lifecycle: "resolve destination, restore semantic state, update history and TOC, then scroll",
      evidence: [
        economics(
          "src/tutorial/economics-demand-shift/economics-demand-shift-deep-link.ts",
          "src/tutorial/economics-demand-shift/KpEconomicsDemandShiftTutorial.svelte"
        ),
        lisp("src/tutorial/lisp-function-application/lisp-function-application-navigation.ts")
      ],
      extractionSlice: "s23",
      boundary: "Callers resolve destinations and restore state; the shared transaction owns ordering and listeners."
    }),
    seam({
      id: "publication-control-compilation",
      disposition: "extract-shared",
      lifecycle: "derive TOC and per-block static controls from one lesson projection",
      evidence: [
        economics("src/tutorial/economics-demand-shift/economics-demand-shift-publication.ts"),
        lisp("src/tutorial/lisp-function-application/lisp-function-application-publication.ts")
      ],
      extractionSlice: "s24",
      boundary: "Domain publication may append surfaces, but cannot fork shared control markup."
    }),
    seam({
      id: "reader-shell-and-tokens",
      disposition: "extract-shared",
      lifecycle: "compose fixed TOC, prose, persistent stage, reading pointer, salience wash, and phone projection",
      evidence: [
        economics(
          "src/tutorial/economics-demand-shift/KpEconomicsDemandShiftTutorial.svelte",
          "src/tutorial/economics-demand-shift/economics-demand-shift-tutorial.css"
        ),
        lisp(
          "src/tutorial/lisp-function-application/KpLispFunctionApplicationTutorial.svelte",
          "src/tutorial/lisp-function-application/lisp-function-application-tutorial.css"
        )
      ],
      extractionSlice: "s25",
      boundary: "The replaceable host owns layout only; domain stages, focus targets, and clocks remain slotted callers."
    }),
    seam({
      id: "inline-content-rendering",
      disposition: "domain-local",
      lifecycle: "render trusted inline authoring syntax into static HTML",
      evidence: [
        economics("src/tutorial/economics-demand-shift/economics-demand-shift-lesson-compiler.ts"),
        lisp("src/tutorial/lisp-function-application/lisp-function-application-lesson-compiler.ts")
      ],
      boundary: "KaTeX math and native Lisp code need distinct renderers behind a document adapter."
    }),
    seam({
      id: "semantic-stage-projection",
      disposition: "domain-local",
      lifecycle: "project canonical domain state into visible stage material and salience",
      evidence: [
        economics("src/tutorial/economics-demand-shift/economics-demand-shift-stage-composition.ts"),
        lisp("src/tutorial/lisp-function-application/lisp-function-application-salience.ts")
      ],
      boundary: "No shared scene graph, motif vocabulary, focus geometry, or renderer switch."
    }),
    seam({
      id: "domain-runtime-and-parameters",
      disposition: "domain-local",
      lifecycle: "derive semantic frames and optional learner-controlled domain parameters",
      evidence: [
        economics("src/domain/economics/equilibrium-model.ts"),
        lisp("src/domain/programming/lisp/lambda-application-evaluator.ts")
      ],
      boundary: "The shared lesson layer consumes projections and never becomes semantic truth."
    })
  ]);

/** Every public field in KpLessonDocument and its nested block vocabulary. */
export const kpLessonDocumentFieldLedger: readonly KpLessonDocumentFieldLedgerEntry[] =
  Object.freeze([
    field("kind", "retain", "implicit lesson publication", "implicit lesson publication", "Keep the lesson-document discriminator."),
    field("id", "retain", "derive from route/source", "derive from route/source", "Require a stable publication identity."),
    field("version", "retain", "adapter supplies", "adapter supplies", "Keep artifact versioning independent of route releases."),
    field("title", "retain", "title", "title", "Map directly."),
    field("blocks", "adapt", "sections contain passages with optional motion", "sections contain ordered passage or motion blocks", "Project both into one ordered block stream without changing source authoring."),
    field("source", "retain", "canonical Markdown source", "canonical Markdown source", "Attach the lesson-source artifact when available."),
    field("language", "retain", "publication language", "publication language", "Default in the adapter rather than each compiler."),
    field("blocks[].id", "retain", "section and passage ids", "section, passage, and motion ids", "Preserve semantic destination ids."),
    field("blocks[].source", "retain", "compiler can project source ranges", "compiler can project source ranges", "Keep optional provenance."),
    field("heading.level", "retain", "h3-scale section heading", "h3-scale section heading", "Use level 3 for tutorial sections."),
    field("heading.content", "adapt", "plain heading text", "plain heading text", "Adapt to structured inline text."),
    field("paragraph.content", "adapt", "static KaTeX HTML", "escaped text plus native code HTML", "Store semantic inline nodes before rendering; HTML is a compiler output, not document truth."),
    field("inline.text", "retain", "ordinary prose spans", "ordinary prose spans", "Use KpLessonText."),
    field("inline.semantic-link", "retain", "claim/focus references", "binding/material references", "Retain semantic object references without prescribing focus paint."),
    field("inline.source", "retain", "Markdown location", "Markdown location", "Preserve optional source location."),
    field("animation-story.asset", "adapt", "economics animation asset", "botanical Lisp animation asset", "Keep a typed asset reference while adapting local motion metadata."),
    field("animation-story.presentation", "retain", "scroll-scrub", "scroll-scrub", "Both callers use the existing presentation value."),
    field("animation-story.beats", "adapt", "motion checkpoints plus economics cues", "motion checkpoints plus Lisp semantic selectors", "Map labels/checkpoints into beats; retain domain focus in adapter payloads."),
    field("beat.id", "retain", "checkpoint identity", "checkpoint identity", "Keep globally unique semantic ids."),
    field("beat.title", "retain", "checkpoint label", "checkpoint label", "Map directly."),
    field("beat.content", "adapt", "surrounding prose owns explanation", "surrounding prose owns explanation", "Permit concise non-changing accessibility content; do not duplicate live captions."),
    field("beat.checkpoint", "adapt", "unit progress", "unit progress", "Convert unit progress to integer permille at the document boundary."),
    field("beat.focusRefs", "domain-extension", "economics attention targets", "Lisp occurrence/material selectors", "Preserve opaque semantic refs; shared mechanics must not interpret them."),
    field("beat.source", "retain", "Markdown marker location", "Markdown marker location", "Preserve optional provenance."),
    field("attention.kind", "retain", "phased-attention-v1 when authored", "phased-attention-v1 when authored", "Keep the existing versioned plan kind."),
    field("attention.phases", "domain-extension", "graph/passage focus phases", "code/material focus phases", "Validate timing generically and project appearance locally."),
    field("attention.phase.id", "retain", "stable phase id", "stable phase id", "Map directly."),
    field("attention.phase.kind", "retain", "orient/act/settle/inspect", "orient/act/settle/inspect", "Retain the established cadence vocabulary."),
    field("attention.phase.beatId", "retain", "economics beat", "Lisp beat", "Keep referential integrity."),
    field("attention.phase.checkpointId", "retain", "economics checkpoint", "Lisp checkpoint", "Keep referential integrity."),
    field("attention.phase.progress", "adapt", "unit interval", "unit interval", "Convert start/end progress to permille."),
    field("attention.phase.cue", "exclude", "prose remains outside controls", "prose remains outside controls", "Do not surface changing cue text; retain only for accessibility/editor metadata if supplied."),
    field("attention.phase.focusRefs", "domain-extension", "graph selectors", "Lisp semantic selectors", "Opaque references only."),
    field("tutorial.kicker", "domain-extension", "required local metadata", "required local metadata", "Add as optional publication metadata rather than a competing document root."),
    field("tutorial.assumption", "domain-extension", "required local metadata", "required local metadata", "Add as optional publication metadata rather than a competing document root.")
  ]);

/**
 * Two callers justify shared internal ownership, not a public package promise.
 * The tiers keep the reusable lesson mechanics distinct from the replaceable
 * Svelte host and from presentation language that still awaits human review.
 */
export const kpLessonApiTierLedger: readonly KpLessonApiTierEntry[] =
  Object.freeze([
    apiTier({
      id: "lesson-document-adapter",
      tier: "shared-internal",
      ownerPaths: ["src/tutorial/kp-tutorial-lesson-document.ts"],
      callers: ["economics", "lisp", "reader-document"],
      boundary: "KpLessonDocument is the ordered content authority; domain compilers only adapt it."
    }),
    apiTier({
      id: "lesson-motion",
      tier: "shared-internal",
      ownerPaths: ["src/tutorial/kp-tutorial-motion.ts"],
      callers: ["economics", "lisp"],
      boundary: "Projection, corridors, rebase, and one-rAF ownership never select a domain scene or renderer."
    }),
    apiTier({
      id: "lesson-navigation",
      tier: "shared-internal",
      ownerPaths: ["src/tutorial/kp-tutorial-navigation.ts"],
      callers: ["economics", "lisp"],
      boundary: "The transaction owns restore-before-scroll ordering while callers resolve semantic state."
    }),
    apiTier({
      id: "lesson-publication-controls",
      tier: "shared-internal",
      ownerPaths: [
        "src/tutorial/kp-tutorial-publication-controls.ts",
        "src/tutorial/kp-tutorial-toc.ts",
        "src/tutorial/kp-tutorial-scrub-bar-renderer.ts"
      ],
      callers: ["economics", "lisp"],
      boundary: "Static final geometry and meaningful links precede optional custom-element enhancement."
    }),
    apiTier({
      id: "lesson-progressive-elements",
      tier: "shared-internal",
      ownerPaths: [
        "src/tutorial/kp-tutorial-toc-element.ts",
        "src/tutorial/kp-tutorial-scrub-bar.ts"
      ],
      callers: ["economics", "lisp"],
      boundary: "Light-DOM elements enhance server-rendered controls in place and do not own lesson truth."
    }),
    apiTier({
      id: "lesson-svelte-shell",
      tier: "replaceable-first-party-host",
      ownerPaths: [
        "src/tutorial/KpTutorialLessonShell.svelte",
        "src/tutorial/kp-tutorial-lesson-shell.css"
      ],
      callers: ["economics", "lisp"],
      boundary: "Svelte owns first-party layout composition only; static publication and animation authority remain framework-neutral."
    }),
    apiTier({
      id: "economics-lesson-presentation",
      tier: "domain-internal",
      ownerPaths: ["src/tutorial/economics-demand-shift/KpEconomicsDemandShiftTutorial.svelte"],
      callers: ["economics"],
      boundary: "Graph composition, equilibrium verification, parameters, spotlight geometry, and focus targets remain economics-owned."
    }),
    apiTier({
      id: "lisp-botanical-presentation",
      tier: "experimental-domain",
      ownerPaths: [
        "src/animation/lisp-botanical-presentation-plan.ts",
        "src/rendering/lisp-botanical-stage-html.ts",
        "src/tutorial/lisp-function-application/lisp-function-application-salience.ts",
        "src/tutorial/lisp-function-application/lisp-function-application-motion-controller.ts"
      ],
      callers: ["lisp"],
      boundary: "The metaphor, stage paint, salience, and choreography remain one reversible tutorial-local treatment.",
      promotionCondition: "Human approval plus a structurally different approved botanical caller."
    })
  ]);

export function validateKpLessonSeamLedger(): readonly string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const entry of kpLessonSeamLedger) {
    if (ids.has(entry.id)) issues.push(`duplicate seam ${entry.id}`);
    ids.add(entry.id);
    const callers = new Set(entry.evidence.map(({ caller }) => caller));
    if (
      (entry.disposition === "reuse-existing" || entry.disposition === "extract-shared") &&
      (!callers.has("economics") || !callers.has("lisp"))
    ) issues.push(`shared seam ${entry.id} lacks two tutorial callers`);
    if (entry.disposition === "adapt-document" && !callers.has("reader-document")) {
      issues.push(`document adapter ${entry.id} lacks KpLessonDocument evidence`);
    }
    if (entry.disposition === "domain-local" && entry.extractionSlice !== undefined) {
      issues.push(`domain-local seam ${entry.id} has an extraction slice`);
    }
    if (entry.evidence.some(({ paths }) => paths.length === 0)) {
      issues.push(`seam ${entry.id} has an empty caller inventory`);
    }
  }
  const fieldPaths = new Set<string>();
  for (const entry of kpLessonDocumentFieldLedger) {
    if (fieldPaths.has(entry.path)) issues.push(`duplicate document field ${entry.path}`);
    fieldPaths.add(entry.path);
  }
  const apiIds = new Set<string>();
  for (const entry of kpLessonApiTierLedger) {
    if (apiIds.has(entry.id)) issues.push(`duplicate lesson API tier ${entry.id}`);
    apiIds.add(entry.id);
    const callers = new Set(entry.callers);
    if (
      (entry.tier === "shared-internal" ||
        entry.tier === "replaceable-first-party-host") &&
      (!callers.has("economics") || !callers.has("lisp"))
    ) issues.push(`shared lesson API ${entry.id} lacks two tutorial callers`);
    if (entry.tier === "experimental-domain" && entry.promotionCondition === undefined) {
      issues.push(`experimental lesson API ${entry.id} lacks a promotion condition`);
    }
  }
  return Object.freeze(issues);
}

function seam(entry: KpLessonSeamLedgerEntry): KpLessonSeamLedgerEntry {
  return Object.freeze({ ...entry, evidence: Object.freeze([...entry.evidence]) });
}

function apiTier(entry: KpLessonApiTierEntry): KpLessonApiTierEntry {
  return Object.freeze({
    ...entry,
    ownerPaths: Object.freeze([...entry.ownerPaths]),
    callers: Object.freeze([...entry.callers])
  });
}

function field(
  path: string,
  disposition: KpLessonDocumentFieldDisposition,
  economicsValue: string,
  lispValue: string,
  decision: string
): KpLessonDocumentFieldLedgerEntry {
  return Object.freeze({
    path,
    disposition,
    economics: economicsValue,
    lisp: lispValue,
    decision
  });
}
