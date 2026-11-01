import type { KpLessonDocument } from "../document/public-api.ts";

export interface DocumentPassageOperation {
  readonly transformationId: string;
  readonly start: number;
  readonly end: number;
}

/** Layout consumes checked story bindings; it never infers mathematical moves. */
export interface DocumentTheaterProjection {
  readonly operations: ReadonlyMap<string, DocumentPassageOperation>;
  readonly annotations?: ReadonlyMap<string, string>;
}

export function assertDocumentTheaterProjection(document: KpLessonDocument, projection: DocumentTheaterProjection): number {
  const stories = document.blocks.filter(block => block.kind === "animation-story");
  const story = stories[0];
  if (stories.length !== 1 || !story || story.beats.length === 0 || story.attention !== undefined)
    throw new Error("Document theater requires one complete flat beat sequence.");
  let previous = 0;
  const ids = new Set(story.beats.map(beat => beat.id));
  for (const [id, state] of projection.annotations ?? []) {
    if (!ids.has(id) || !state || projection.operations.has(id))
      throw new Error(`Document annotation ${id} requires a stationary declared passage.`);
  }
  for (const id of projection.operations.keys()) {
    if (!ids.has(id)) throw new Error(`Document operation refers to missing passage ${id}.`);
  }
  for (const beat of story.beats) {
    const operation = projection.operations.get(beat.id);
    if (operation) {
      if (!operation.transformationId || !Number.isFinite(operation.start) || !Number.isFinite(operation.end)
        || operation.start !== previous || operation.end <= operation.start || operation.end > 1000
        || operation.end !== beat.checkpoint.progressPermille)
        throw new Error(`Document passage ${beat.id} requires its operation's source and result.`);
    } else if (beat.checkpoint.progressPermille !== previous) {
      throw new Error(`Document passage ${beat.id} cannot advance without a checked operation.`);
    }
    previous = beat.checkpoint.progressPermille;
  }
  return document.blocks.indexOf(story);
}

// Inline only inside noscript: an extracted stylesheet would disable the
// interactive projection even when JavaScript is available.
export const documentTheaterStaticStyles = `
body[data-kp-reader-layout] .kp-rising-passage {
  position: static !important; transform: none !important; display: block !important;
  content-visibility: visible !important; opacity: 1 !important;
  width: 100% !important; height: auto !important; overflow: visible !important; padding: 0 24px !important;
}
body[data-kp-reader-layout] .kp-caption-copy { transform: none; max-height: none; width: auto; margin: 0; padding: 0; }
body[data-kp-reader-layout] .kp-caption-frame { display: none; }
body[data-kp-reader-layout] .kp-reader-layout > .kp-lesson-toc { display: block; position: static; }
html body[data-kp-reader-layout] .kp-animation-beats { padding: 0; }
html body[data-kp-reader-layout] .kp-animation-beats > li { min-height: 0; padding-block: 1rem; margin: 0; }
html body[data-kp-reader-layout] .kp-animation-beats > li::after { display: none; }
body[data-kp-reader-layout] :is(.kp-caption-sequence, .kp-caption-pin) { display: block; position: static; height: auto; }
body[data-kp-reader-layout] .kp-lesson { padding: 2rem 0; }
html body[data-kp-reader-layout] .kp-animation-static { position: static; transform: none; width: 100%; height: auto; }
`;
