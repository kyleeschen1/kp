import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { loadConfigFromFile } from 'vite';
import { collectKpTypescriptImportGraph } from '../scripts/typescript-import-extractor.ts';
import { auditLibraryLane, libraryLanes } from '../src/architecture/library-lanes.ts';
import { resolveKpModuleOwnershipZone } from '../src/architecture/kp-module-ownership.ts';

const root = resolve(import.meta.dirname, '..');
test('each lane has standalone commands, strict distinct ports and a host-free transitive API', () => {
  const graph = collectKpTypescriptImportGraph(root);
  const seen = new Set<string>(), queue = ['src/math-resources/data-api.ts'];
  while (queue.length) {
    const path = queue.pop()!; if (seen.has(path)) continue; seen.add(path);
    assert.doesNotMatch(path, /semantic-state\/|math-resources\/runtime|rendering\//, 'Data admission cannot import evaluation or paint');
    queue.push(...graph.localEdges.filter(edge => edge.importer === path).map(edge => edge.target));
  }
  assert.equal(new Set(libraryLanes.map(lane => lane.port)).size, libraryLanes.length);
  for (const lane of libraryLanes) {
    assert.deepEqual(auditLibraryLane(graph, lane), [], lane.id);
    for (const filename of ['index.html', 'README.md', 'vite.config.ts']) assert.ok(existsSync(resolve(root, lane.app, filename)));
    const pkg = JSON.parse(readFileSync(resolve(root, lane.app, 'package.json'), 'utf8'));
    for (const command of ['dev', 'build', 'test', 'typecheck']) assert.equal(typeof pkg.scripts[command], 'string');
    assert.equal(pkg.private, true);
    assert.notEqual(resolveKpModuleOwnershipZone(lane.entrypoint)?.id, 'application');
  }
});
test('transitive reexports and type edges cannot hide hosts, sibling lanes or missing imports', () => {
  const lane = libraryLanes[0], helper = `${lane.source}helper.ts`;
  for (const forbidden of ['src/fraction-notebook/vim.ts', 'src/editor-chat/panel.ts', 'src/experiments/graph.ts', 'src/math-resources/model.ts']) {
    const graph = { sourcePaths: [lane.entrypoint, helper, forbidden], unresolvedLocalReferences: [], localEdges: [
      { importer: lane.entrypoint, target: helper }, { importer: helper, target: forbidden }
    ] };
    assert.equal(auditLibraryLane(graph, lane).length, 1, forbidden);
  }
  assert.match(auditLibraryLane({ sourcePaths: [lane.entrypoint], localEdges: [],
    unresolvedLocalReferences: [{ importer: lane.entrypoint, specifier: './missing.ts' }] }, lane)[0]!, /unresolved/);
  assert.match(auditLibraryLane({ sourcePaths: [], localEdges: [], unresolvedLocalReferences: [] }, lane)[0]!, /Missing/);
});
test('effective lab configuration binds only its strict assigned localhost port and local output', async () => {
  for (const lane of libraryLanes) {
    const loaded = await loadConfigFromFile({ command: 'serve', mode: 'development' }, resolve(root, lane.app, 'vite.config.ts'));
    assert.ok(loaded);
    assert.equal(loaded.config.root?.replace(/\/$/, ''), resolve(root, lane.app));
    assert.equal(loaded.config.server?.host, '127.0.0.1');
    assert.equal(loaded.config.server?.port, lane.port);
    assert.equal(loaded.config.server?.strictPort, true);
    assert.equal(loaded.config.build?.outDir, 'dist');
  }
});
test('quadratic data and evaluators are core; notebook application and chat remain hosts', () => {
  for (const path of ['src/notebook/math-model.ts', 'src/notebook/math-runtime.ts', 'src/math-resources/model.ts'])
    assert.equal(resolveKpModuleOwnershipZone(path)?.id, 'neutral-core');
  for (const path of ['src/fraction-notebook/app.ts', 'src/editor-chat/panel.ts'])
    assert.equal(resolveKpModuleOwnershipZone(path)?.id, 'application');
  assert.equal(resolveKpModuleOwnershipZone('src/notebook/view.ts')?.id, 'experiment');
});
test('the bounded column embed cannot pull experiment hosts or notebook state into playback', () => {
  const graph = collectKpTypescriptImportGraph(root), seen = new Set<string>();
  const queue = ['src/experiments/matrix-column-combinations/embed.ts'];
  while (queue.length) {
    const path = queue.pop()!; if (seen.has(path)) continue; seen.add(path);
    assert.notEqual(resolveKpModuleOwnershipZone(path)?.id, 'experiment', path);
    assert.doesNotMatch(path, /src\/(fraction-notebook|editor-chat|math-resources|animation-player)\//, path);
    queue.push(...graph.localEdges.filter(edge => edge.importer === path).map(edge => edge.target));
  }
  for (const host of ['entry.ts', 'reader.ts', 'author.ts', 'page.ts'])
    assert.equal(resolveKpModuleOwnershipZone(`src/experiments/matrix-column-combinations/${host}`)?.id, 'experiment');
});
test('the independent reference card has no transitive editor, chat or 3D host dependency', () => {
  const graph = collectKpTypescriptImportGraph(root), seen = new Set<string>(), queue = ['src/matrix-reference/app.ts'];
  while (queue.length) {
    const path = queue.pop()!; if (seen.has(path)) continue; seen.add(path);
    assert.doesNotMatch(path, /src\/(fraction-notebook|editor-chat|editor|animation-player)\/|graph-3d/, path);
    assert.notEqual(resolveKpModuleOwnershipZone(path)?.id, 'experiment', path);
    queue.push(...graph.localEdges.filter(edge => edge.importer === path).map(edge => edge.target));
  }
  assert.ok(seen.has('src/notebook/atomic-record.ts'));
  assert.ok(seen.has('src/interaction/row-picker.ts'));
  assert.ok(seen.has('src/experiments/matrix-column-combinations/embed.ts'));
});
