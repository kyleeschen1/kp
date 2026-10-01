import type { Plugin } from 'vite';

/** Build evidence is emitted alongside assets but never imported by readers. */
export function semanticCostInventory(): Plugin {
  return { name: 'semantic-cost-inventory', generateBundle(_options, bundle) {
    const chunks = Object.values(bundle).filter(chunk => chunk.type === 'chunk').map(chunk => ({
      file: chunk.fileName,
      modules: Object.keys(chunk.modules).map(id => id.replace(process.cwd() + '/', '')).sort(),
    }));
    this.emitFile({ type: 'asset', fileName: 'module-inventory.json', source: JSON.stringify(chunks, null, 2) });
  } };
}
