import type {
  KpArticleDocument,
  KpArticleDocumentReference,
  KpArticleFocusBlock,
  KpArticleMotionBlock,
  KpArticlePassageBlock
} from "../../article/kp-article-document.ts";
import {
  createKpFractionCompositionArticleRuntimeCheckpoints,
  createKpFractionCompositionArticleRuntimeRanges
} from "./fraction-composition-runtime-ranges.ts";

export const kpFractionCompositionAttentionMatrixSchema =
  "kp.fraction-composition-attention-matrix.v1" as const;

export type KpFractionCompositionAttentionFraming =
  | "inspect"
  | "demonstrate"
  | "interpret"
  | "verify";

export type KpFractionCompositionAttentionAnchor =
  | Readonly<{
      kind: "checkpoint";
      path: string;
      progress: number;
    }>
  | Readonly<{
      kind: "range";
      path: string;
      start: number;
      end: number;
    }>;

export interface KpFractionCompositionAttentionBeat {
  readonly id: string;
  readonly sourceBlockId: string;
  readonly sourceSlot: "body" | "after";
  readonly stageId: "solve";
  readonly framing: KpFractionCompositionAttentionFraming;
  readonly passageMarkdown: string;
  readonly anchor: KpFractionCompositionAttentionAnchor;
  readonly primaryAddresses: readonly string[];
  readonly contextAddresses: readonly string[];
  /** Semantic references can request attention but never own timeline state. */
  readonly timelineAuthority: "none";
}

export interface KpFractionCompositionAttentionMatrix {
  readonly kind: "kp-fraction-composition-attention-matrix";
  readonly schemaVersion: typeof kpFractionCompositionAttentionMatrixSchema;
  readonly documentId: string;
  readonly stageId: "solve";
  readonly beats: readonly KpFractionCompositionAttentionBeat[];
}

const documentId = "lesson.algebra.fraction-composition.article";
const stageId = "solve" as const;
const equationAddress = "solve/equation";

/**
 * This is an exemplar-local semantic projection of existing Article IR. It
 * names attention and temporal anchors, while leaving geometry to later views.
 */
export function createKpFractionCompositionAttentionMatrix(
  document: KpArticleDocument
): KpFractionCompositionAttentionMatrix {
  if (document.id !== documentId) {
    throw new Error(`Unexpected fraction composition article ${document.id}.`);
  }
  const references = new Map(document.references.map((reference) => [
    reference.id,
    reference
  ]));
  const checkpoints = createKpFractionCompositionArticleRuntimeCheckpoints();
  const ranges = createKpFractionCompositionArticleRuntimeRanges();
  const rangeByPath = new Map(ranges.map((range) => [range.path, range]));
  const initialCheckpoint = checkpoints[0];
  const terminalCheckpoint = checkpoints.at(-1);
  if (initialCheckpoint === undefined || terminalCheckpoint === undefined) {
    throw new Error("Fraction composition attention matrix requires endpoint checkpoints.");
  }

  const beats: KpFractionCompositionAttentionBeat[] = [];
  const focusBlocks = document.blocks.filter(
    (block): block is KpArticleFocusBlock => block.kind === "focus"
  );
  if (focusBlocks.length !== 1) {
    throw new Error("Fraction composition attention matrix requires one opening focus.");
  }
  const focus = focusBlocks[0]!;
  beats.push(beat({
    id: focus.id,
    sourceBlockId: focus.id,
    sourceSlot: "body",
    framing: "inspect",
    passageMarkdown: focus.markdown,
    anchor: checkpointAnchor(initialCheckpoint),
    primaryAddresses: focus.targets.map(articleAddress),
    contextAddresses: focus.context.map(articleAddress)
  }));

  const motions = document.blocks.filter(
    (block): block is KpArticleMotionBlock => block.kind === "motion"
  );
  for (const motion of motions) {
    if (motion.transition.kind !== "run") {
      throw new Error(`Fraction composition motion ${motion.id} must use a named run.`);
    }
    const rangePath = objectPath(motion.transition.path);
    const range = rangeByPath.get(rangePath);
    if (range === undefined) {
      throw new Error(`Unknown fraction composition motion ${motion.transition.path}.`);
    }
    const linkedAddresses = addressesForReferences(motion.referenceIds, references);
    const primaryAddresses = linkedAddresses.length === 0
      ? [equationAddress]
      : linkedAddresses;
    beats.push(beat({
      id: `${motion.id}:motion`,
      sourceBlockId: motion.id,
      sourceSlot: "body",
      framing: "demonstrate",
      passageMarkdown: motion.beforeMarkdown,
      anchor: Object.freeze({
        kind: "range" as const,
        path: range.path,
        start: range.start,
        end: range.end
      }),
      primaryAddresses,
      contextAddresses: contextFor(primaryAddresses)
    }));
    if (motion.afterMarkdown === undefined) {
      throw new Error(`Fraction composition motion ${motion.id} lacks its settled interpretation.`);
    }
    // A motion and its held endpoint are one attentional scene. The complete
    // Article retains the after prose without turning it into another UI step.
  }

  const verification = document.blocks.find(
    (block): block is KpArticlePassageBlock =>
      block.kind === "passage" && block.intent === "verification"
  );
  if (verification === undefined) {
    throw new Error("Fraction composition attention matrix requires verification prose.");
  }
  beats.push(beat({
    id: verification.id,
    sourceBlockId: verification.id,
    sourceSlot: "body",
    framing: "verify",
    passageMarkdown: verification.markdown,
    anchor: checkpointAnchor(terminalCheckpoint),
    primaryAddresses: ["solve/solution"],
    contextAddresses: [equationAddress]
  }));

  return Object.freeze({
    kind: "kp-fraction-composition-attention-matrix" as const,
    schemaVersion: kpFractionCompositionAttentionMatrixSchema,
    documentId: document.id,
    stageId,
    beats: Object.freeze(beats)
  });
}

function beat(
  input: Omit<KpFractionCompositionAttentionBeat, "stageId" | "timelineAuthority">
): KpFractionCompositionAttentionBeat {
  return Object.freeze({
    ...input,
    primaryAddresses: Object.freeze(unique(input.primaryAddresses)),
    contextAddresses: Object.freeze(unique(input.contextAddresses)),
    stageId,
    timelineAuthority: "none" as const
  });
}

function checkpointAnchor(checkpoint: Readonly<{ path: string; progress: number }> ):
KpFractionCompositionAttentionAnchor {
  return Object.freeze({
    kind: "checkpoint" as const,
    path: checkpoint.path,
    progress: checkpoint.progress
  });
}

function addressesForReferences(
  referenceIds: readonly string[],
  references: ReadonlyMap<string, KpArticleDocumentReference>
): readonly string[] {
  return unique(referenceIds.flatMap((id) => {
    const reference = references.get(id);
    if (reference === undefined) {
      throw new Error(`Unknown fraction composition article reference ${id}.`);
    }
    return reference.origin === "inline-link" ? [reference.address] : [];
  }));
}

function contextFor(primaryAddresses: readonly string[]): readonly string[] {
  return primaryAddresses.includes(equationAddress) ? [] : [equationAddress];
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function objectPath(fullId: string): string {
  return fullId.slice(fullId.lastIndexOf("/") + 1);
}

function articleAddress(fullId: string): string {
  const hash = fullId.indexOf("#");
  if (hash < 0 || hash === fullId.length - 1) {
    throw new Error(`Invalid fraction composition semantic identity ${fullId}.`);
  }
  return fullId.slice(hash + 1);
}
