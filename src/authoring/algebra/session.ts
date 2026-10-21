import { createKpPreparedRevisionSession } from '../prepared-revision-session.ts';
import { assertKpComposedAlgebraPresentationV2 } from '../composed-algebra-presentation-v2.ts';
import { check, type Presentation } from './compile.ts';

/** Prepare fully before replacing the displayed issued revision. */
export function session<Surface extends { dispose(): void }>(input: {
  readonly initial: Presentation;
  readonly prepare: (draft: Presentation) => Promise<Surface>;
  readonly commit: (surface: Surface, draft: Presentation) => void;
}) {
  return createKpPreparedRevisionSession({ ...input, assertDraft: assertKpComposedAlgebraPresentationV2, check,
    preparationFailure: error => ({ code: 'composed-algebra.preview', path: '$.states',
      expected: `Keep the last valid revision; preparation failed: ${error instanceof Error ? error.message : String(error)}` }) });
}
