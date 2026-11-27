import { readNotebook, readSteps, type FractionNotebook, type Step } from './model.ts';
import { array, exact, fail, object, text } from './json.ts';
import { fractionObjectId, sourceLimit, type ObjectDescriptor } from './object-protocol.ts';
import { readEndpointCommentary, type CommentaryStop } from '../reader/document/endpoint-commentary.ts';

/** The browser consumes editorial output only. Compiler implementation and
 * mathematical validation stay on the server behind the existing endpoint. */
export interface CompiledFractionRevision {
  readonly notebook: FractionNotebook;
  readonly notes: readonly CommentaryStop[];
  readonly beats: readonly (Step & { readonly id: string; readonly progressPermille: number })[];
}

function named(value: unknown, limit = 300): string {
  const result = text(value, limit);
  if (!result.trim()) fail('Expected nonempty revision text.');
  return result;
}

export function readRevisionDescriptor(raw: unknown): ObjectDescriptor {
  const value = object(raw);
  exact(value, ['id', 'revision', 'title', 'language', 'source', 'capabilities']);
  const capabilities = array(value['capabilities'], 1);
  const revision = text(value['revision'], 64);
  if (value['id'] !== fractionObjectId || value['language'] !== 'json'
    || capabilities.length !== 1 || capabilities[0] !== 'preview' || !/^[a-f0-9]{64}$/.test(revision))
    fail('Expected the supported fraction annotation descriptor and exact source revision.');
  return { id: fractionObjectId, revision, title: named(value['title']), language: 'json',
    source: text(value['source'], sourceLimit), capabilities: ['preview'] };
}

export function readCompiledRevision(raw: unknown): CompiledFractionRevision {
  const value = object(raw); exact(value, ['notebook', 'notes', 'beats']);
  const notebook = readNotebook(value['notebook']);
  const ids = new Set<string>(); let previousProgress = -1;
  const beats = array(value['beats'], 100).map(rawBeat => {
    const beat = object(rawBeat); exact(beat, ['id', 'title', 'content', 'focusRefs', 'progressPermille']);
    const id = named(beat['id']), progressPermille = beat['progressPermille'];
    if (ids.has(id) || typeof progressPermille !== 'number' || !Number.isSafeInteger(progressPermille)
      || progressPermille < previousProgress || progressPermille > 1000 || progressPermille < 0)
      return fail('Expected unique fraction moments in checkpoint order.');
    ids.add(id); previousProgress = progressPermille;
    const focusRefs = array(beat['focusRefs'], 24).map(ref => named(ref));
    if (!focusRefs.length || new Set(focusRefs).size !== focusRefs.length) fail('Expected unique annotation targets.');
    return { id, progressPermille, title: named(beat['title']), content: named(beat['content'], 30000), focusRefs };
  });
  const story = notebook.cells.find(cell => cell.type === 'story');
  if (!story || !beats.length) return fail('Expected a fraction story with checked moments.');
  const steps = readSteps(story.source, beats.length, story.caption.text);
  for (const [index, beat] of beats.entries()) {
    const step = steps[index]!;
    if (step.title !== beat.title || step.content !== beat.content || JSON.stringify(step.focusRefs) !== JSON.stringify(beat.focusRefs))
      fail('Compiled annotation wording differs from its notebook source.');
  }
  // Preserve the existing note parser's semantic shape checks, adding bounded
  // strict JSON admission before passing values to that shared owner.
  const rawNotes = array(value['notes'], 100).map(rawStop => {
    const stop = object(rawStop); exact(stop, ['stateId', 'notes']);
    const stateId = named(stop['stateId']);
    if (!ids.has(stateId)) fail('Commentary must refer to a checked moment.');
    const notes = array(stop['notes'], 100).map(rawNote => {
      const note = object(rawNote); exact(note, ['id', 'text', 'detail', 'side', 'views']);
      const views = object(note['views']);
      if (Object.keys(views).length > 100) fail('Too many commentary views.');
      return { id: named(note['id']), text: named(note['text'], 30000), detail: text(note['detail']), side: note['side'],
        views: Object.fromEntries(Object.entries(views).map(([id, refs]) => [named(id), array(refs, 24).map(ref => named(ref))])) };
    });
    return { stateId, notes };
  });
  return { notebook, beats, notes: readEndpointCommentary(rawNotes) };
}
