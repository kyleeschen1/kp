import type { PreparedCommand } from '../editor-commands/registry.ts';
import type { Row } from '../editor-rows/model.ts';

/** Adapt an already captured registry snapshot; discovery does not execute it. */
export function commandRows(commands: readonly PreparedCommand[]): readonly Row<PreparedCommand>[] {
  return commands.map(command => ({
    id: command.id, resource: command, actions: [command.id], facets: { category: [command.category] },
    fields: {
      title: { text: command.title, display: 'primary', search: 'fuzzy' },
      category: { text: command.category, display: 'secondary', search: 'literal' },
      keys: { text: command.keys?.join(' · ') ?? '', display: 'annotation', search: 'literal' },
      aliases: { text: command.keywords?.join(' ') ?? '', display: 'hidden', search: 'fuzzy', label: 'Alias' }
    }
  }));
}
