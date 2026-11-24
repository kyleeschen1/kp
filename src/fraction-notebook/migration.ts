import { uuid } from '../notebook/model.ts';
import { array, exact, fail, object, text } from './json.ts';
import { proseText } from './types.ts';

/** Deterministic migration keeps identities stable when a recovery copy and the
 * database are read independently. The original v1 database remains untouched. */
export function migrateV1(value: unknown): unknown {
  const data = object(value); exact(data, ['schemaVersion', 'id', 'revision', 'cells']);
  const docId = uuid(data['id']);
  const cells = array(data['cells'], 200).map(object);
  const used = new Set([docId, ...cells.map(c => uuid(c['id']))]);
  let next = BigInt(`0x${docId.slice(-12)}`);
  const allocate = () => {
    for (;;) {
      next = (next + 1n) % (1n << 48n);
      const id = uuid(`${docId.slice(0, 14)}8${docId.slice(15, 24)}${next.toString(16).padStart(12, '0')}`);
      if (!used.has(id)) { used.add(id); return id; }
    }
  };
  const migrated = cells.map((c, index) => {
    const id = uuid(c['id']);
    if (c['type'] === 'story') {
      exact(c, ['id', 'type', 'source']); let source = text(c['source'], 100000), caption = '';
      try {
        const spec = object(JSON.parse(source));
        const steps = array(spec['steps'], 100), first = object(steps[0]);
        if (typeof first['content'] === 'string') {
          caption = first['content'];
          const { content: _content, ...rest } = first;
          source = JSON.stringify({ ...spec, steps: [rest, ...steps.slice(1)] }, null, 2);
        }
      } catch { /* Invalid source is still a recoverable draft, never discarded. */ }
      return { ...c, metadata: {}, source, caption: { id: allocate(), type: 'caption', metadata: {}, text: caption } };
    }
    exact(c, ['id', 'type', 'content']);
    if (c['type'] !== 'paragraph' && c['type'] !== 'heading') return fail('Unsupported version-1 cell.');
    const content = array(c['content'], 2000).map(raw => {
      const inline = object(raw); exact(inline, ['text', 'marks']);
      return { ...proseText(text(inline['text'])), marks: inline['marks'] };
    });
    if (c['type'] === 'heading') {
      if (index !== 0) return fail('Version-1 title must be first.');
      return { id: allocate(), type: 'articleHeader', metadata: {}, title: { id, type: 'title', metadata: {}, content },
        authors: [{ id: allocate(), type: 'authorCredit', metadata: {}, name: 'Codex', role: 'author' }] };
    }
    return { ...c, metadata: {}, content };
  });
  return { ...data, schemaVersion: 2, cells: migrated };
}
