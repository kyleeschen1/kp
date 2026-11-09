import { closeSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { AnchoredAlgebraGap } from '../src/reader/app/what-counts-commentary.ts';
import { compileWhatCountsLesson } from './what-counts-reader-page.ts';
import { readWhatCountsArticle, readingDigest, registerWhatCountsReadings, whatCountsReadingsPath,
  whatCountsRoot, type ReadingRevision } from './what-counts-readings.ts';

type RevisionMode = { readonly kind: 'check' } | { readonly kind: 'apply'; readonly expectedBasis: string };
interface RevisionInput {
  readonly reading: string;
  readonly markdown: string;
  readonly title?: string;
  readonly description?: string;
  readonly mode: RevisionMode;
}
export const whatCountsDraftLimit = 100_000;
const gap = (path: string, message: string) => new AnchoredAlgebraGap(`revision.${path}`, message);
export interface AlgebraReadingRevisionOwner {
  readonly registryPath: string;
  readonly route: string;
  readonly archiveDirectory: string;
  readonly compile: (url: string, registrations: unknown, read: (revision: ReadingRevision) => string) => string;
}
const whatCountsOwner: AlgebraReadingRevisionOwner = {
  registryPath: whatCountsReadingsPath, route: '/reader/what-counts/', archiveDirectory: 'content/authoring/algebra/readings',
  compile: compileWhatCountsLesson
};

function readState(root: string, owner: AlgebraReadingRevisionOwner) {
  const raw = readFileSync(resolve(root, owner.registryPath), 'utf8');
  const registry = registerWhatCountsReadings(JSON.parse(raw));
  const sources = new Map<string, string>();
  for (const current of registry.values()) for (const revision of [current, ...current.previous ?? []])
    sources.set(revision.articlePath, readWhatCountsArticle(revision, root));
  // A proposal depends on source bytes as well as registry metadata. Even a
  // legacy unpinned manuscript edit must invalidate an outstanding apply.
  const basis = readingDigest(JSON.stringify([raw, [...sources].map(([path, text]) => [path, readingDigest(text)])]));
  return { raw, registry, sources, basis };
}

/** Check the actual reader before replacing its one registry pointer. Immutable
 * snapshots preserve saved coordinates; a failed draft never becomes selected.
 * This is local source revision, not publication or editorial approval. */
export function reviseWhatCountsReading(input: RevisionInput, root = whatCountsRoot) {
  return reviseAlgebraReading(input, whatCountsOwner, root);
}

/** The second reader reuses only the file transaction. Its own compiler still
 * checks every source, semantic target, operation and archived address. */
export function reviseAlgebraReading(input: RevisionInput, owner: AlgebraReadingRevisionOwner, root = whatCountsRoot) {
  const bounded = (path: string) => /^content\/authoring\/algebra\/[a-zA-Z0-9./_-]+$/.test(path)
    && path.split('/').every(part => part && part !== '.' && part !== '..');
  if (!bounded(owner.registryPath) || !owner.registryPath.endsWith('.json') || !bounded(owner.archiveDirectory)
    || !/^\/reader\/[a-z-]+\/$/.test(owner.route)) throw gap('owner', 'Use a bounded local algebra reading owner.');
  const href = (reading: string, version: string) => owner.route + '?' + new URLSearchParams({ reading, kpVersion: version });
  const snapshotPath = (reading: string, sha256: string) => `${owner.archiveDirectory}/${reading}/${sha256}.article.md`;
  if (Buffer.byteLength(input.markdown, 'utf8') > whatCountsDraftLimit)
    throw gap('draft', `Use an Article within ${whatCountsDraftLimit} UTF-8 bytes.`);
  const startedAt = performance.now();
  const registryPath = resolve(root, owner.registryPath);
  const lockPath = `${registryPath}.lock`;
  let lock: number | undefined;
  let temporary: string | undefined;
  let committed = false;
  const created: string[] = [];
  try {
    if (input.mode.kind === 'apply') {
      try {
        lock = openSync(lockPath, 'wx');
        writeFileSync(lock, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }));
      }
      catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'EEXIST')
          throw gap('busy', 'Another revision owns the registry lock. Retry after it finishes; verify a stopped writer before removing a stale lock.');
        throw error;
      }
    }
    const state = readState(root, owner);
    const current = state.registry.get(input.reading);
    if (!current) throw gap('reading', 'Choose an existing registered reading.');
    const oldText = state.sources.get(current.articlePath)!;
    const sha256 = readingDigest(input.markdown);
    const title = input.title ?? current.title;
    const description = input.description ?? current.description;
    const version = `${input.reading}.${readingDigest(JSON.stringify([input.markdown, title, description]))}`;
    const basis = readingDigest(JSON.stringify([state.basis, version]));
    if (input.mode.kind === 'apply' && input.mode.expectedBasis !== basis)
      throw gap('stale', 'The selected sources or proposed draft changed since the check. Check again before applying.');
    const next = { articlePath: snapshotPath(input.reading, sha256), version, title, description, sha256 };
    const previous = { articlePath: snapshotPath(input.reading, readingDigest(oldText)), version: current.version,
      title: current.title, description: current.description, sha256: readingDigest(oldText) };
    const unchanged = current.version === version && current.sha256 === sha256;
    const proposed = Object.fromEntries(state.registry);
    proposed[input.reading] = unchanged ? current : { ...next,
      previous: [...current.previous ?? []].filter(revision => revision.version !== version).concat(previous) };
    const sources = new Map(state.sources).set(next.articlePath, input.markdown).set(previous.articlePath, oldText);
    const read = (revision: ReadingRevision) => {
      const text = sources.get(revision.articlePath);
      if (text === undefined || (revision.sha256 && readingDigest(text) !== revision.sha256))
        throw gap('source', 'The proposed reading does not retain its exact source.');
      return text;
    };
    const previewPath = href(input.reading, version);
    const previousPath = href(input.reading, current.version);
    // Both future selection and the old address traverse the existing compiler.
    // No new renderer, schema, preview server or fallback is introduced here.
    try {
      owner.compile(previewPath, proposed, read);
      if (!unchanged) owner.compile(previousPath, proposed, read);
    } catch (error) {
      if (error instanceof AnchoredAlgebraGap) throw error;
      throw gap('draft', error instanceof Error ? error.message : String(error));
    }
    const checkMs = performance.now() - startedAt;
    if (input.mode.kind === 'apply' && !unchanged) {
      for (const [path, text] of new Map([[next.articlePath, input.markdown], [previous.articlePath, oldText]])) {
        const file = resolve(root, path);
        mkdirSync(dirname(file), { recursive: true });
        let descriptor: number;
        try { descriptor = openSync(file, 'wx'); }
        catch (error) {
          if (!(error instanceof Error && 'code' in error && error.code === 'EEXIST')) throw error;
          if (readFileSync(file, 'utf8') !== text) throw gap('snapshot', 'An immutable snapshot changed; restore its exact bytes.');
          continue;
        }
        // Track ownership before writing: even a partial write must be removed
        // if preparation fails before the registry commit.
        created.push(file);
        try { writeFileSync(descriptor, text); } finally { closeSync(descriptor); }
      }
      temporary = `${registryPath}.${randomUUID()}.tmp`;
      writeFileSync(temporary, JSON.stringify(proposed, null, 2) + '\n', { flag: 'wx' });
      if (readState(root, owner).basis !== state.basis) throw gap('stale', 'A source changed during preparation. Check again before applying.');
      // Cooperating writers are serialized. The old registry remains intact up
      // to this rename; all referenced snapshots already exist and were checked.
      renameSync(temporary, registryPath);
      committed = true;
    }
    return { status: unchanged ? 'unchanged' as const : input.mode.kind === 'apply' ? 'applied' as const : 'checked' as const,
      reading: input.reading, version, sourceSha256: sha256, basis, previewPath, previousPath,
      checkMs, operationMs: performance.now() - startedAt };
  } finally {
    try {
      if (temporary) rmSync(temporary, { force: true });
      if (!committed) for (const file of created) rmSync(file, { force: true });
    } finally {
      if (lock !== undefined) { closeSync(lock); rmSync(lockPath); }
    }
  }
}
