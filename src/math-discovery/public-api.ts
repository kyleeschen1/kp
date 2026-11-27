import type { Availability, CommandOrigin, CommandRegistry, PreparedCommand } from '../editor-commands/registry.ts';
import type { Row } from '../editor-rows/model.ts';
import { mathCapabilityCatalog, type DiscoverableMathKind, type MathCapabilityMetadata } from './catalog.ts';

export { mathCapabilityCatalog, type DiscoverableMathKind, type MathCapabilityMetadata } from './catalog.ts';

export type MathDiscoverySelection = { readonly kind: 'none' } | {
  readonly kind: DiscoverableMathKind;
  readonly id: string;
  readonly occurrenceId: string;
  /** Immutable owner snapshot identity or a fingerprint including actual source
   * and draft values. A revision counter alone is unsafe after undo/re-edit. */
  readonly revision: object | string;
};
interface CapabilityBase { readonly metadata: MathCapabilityMetadata; readonly title: string }
export type MathCapability = CapabilityBase & (
  | { readonly kind: 'command'; readonly command: PreparedCommand }
  | { readonly kind: 'needs-input' | 'unsupported' | 'unavailable'; readonly reason: string }
);
export type MathCapabilityReadiness = { readonly status: 'available' }
  | { readonly status: 'needs-input' | 'unsupported' | 'unavailable'; readonly reason: string };

export function mathCapabilityReadiness(capability: MathCapability): MathCapabilityReadiness {
  if (capability.kind !== 'command') return { status: capability.kind, reason: capability.reason };
  const state = capability.command.state();
  return state.enabled ? { status: 'available' } : { status: 'unavailable', reason: state.reason };
}
export function mathCapabilityState(capability: MathCapability): Availability {
  const state = mathCapabilityReadiness(capability);
  return state.status === 'available' ? { enabled: true } : { enabled: false, reason: state.reason };
}

/** Capture once before the picker borrows focus. currentSelection must resolve
 * this original occurrence in the current owner document, not inspect DOM focus.
 * The registry retains invocation, disposal, busy-state and history ownership. */
export function captureMathematicalDiscovery(registry: Pick<CommandRegistry, 'snapshot'>, options: {
  readonly origin: CommandOrigin;
  readonly selection: MathDiscoverySelection;
  readonly currentSelection: () => MathDiscoverySelection;
}): readonly Row<MathCapability>[] {
  const selected = Object.freeze({ ...options.selection });
  const previousValid = options.origin.valid;
  const currentSelection = options.currentSelection;
  const valid = (): string | undefined => {
    const invalid = previousValid?.(); if (invalid) return invalid;
    if (selected.kind === 'none') return 'Select a mathematical object, then reopen its capabilities.';
    const current = currentSelection();
    if (current.kind === 'none') return 'The selected mathematical object was removed.';
    if (current.kind !== selected.kind || current.id !== selected.id || current.occurrenceId !== selected.occurrenceId
      || !Object.is(current.revision, selected.revision))
      return 'The selected mathematical object changed; reopen its capabilities.';
    return undefined;
  };
  const commands = new Map(registry.snapshot({ ...options.origin, valid }).map(command => [command.id, command]));
  const family = selected.kind === 'none' ? undefined : selected.kind === 'matrix-vector' ? 'matrix-vector' : selected.kind === 'vector-pair' ? 'vector-pair' : 'quadratic';
  return mathCapabilityCatalog.flatMap(metadata => {
    if (family && metadata.family !== family) return [];
    const command = commands.get(metadata.id);
    // A missing owner is not a new executable capability. Discovery only
    // advertises commands installed by the actual host.
    if (!command) return [];
    const base = { metadata, title: command.title };
    // Workspace commands intentionally bypass origin.valid in the registry.
    // They cannot acquire object mutation authority through this adapter.
    const capability: MathCapability = command.scope === 'workspace'
      ? { ...base, kind: 'unavailable', reason: 'This capability requires an object-scoped command owner.' }
      : selected.kind === 'none'
      ? { ...base, kind: 'needs-input', reason: metadata.requirements[0]! }
      : !metadata.accepts.includes(selected.kind)
        ? { ...base, kind: 'unsupported', reason: 'This operation requires a source quadratic.' }
        : { ...base, kind: 'command', command };
    const state = mathCapabilityReadiness(capability);
    const row: Row<MathCapability> = {
      id: command.id, resource: capability, actions: capability.kind === 'command' ? [command.id] : [],
      facets: { family: [metadata.family], operation: [metadata.operation], availability: [state.status] },
      fields: {
        title: { text: command.title, display: 'primary', search: 'fuzzy' },
        operation: { text: metadata.operation, display: 'annotation', search: 'literal' },
        state: { text: state.status === 'available' ? 'Available' : state.reason, display: 'secondary', search: 'none' },
        description: { text: command.description ?? metadata.example, display: 'hidden', search: 'fuzzy', label: 'About' },
        example: { text: metadata.example, display: 'hidden', search: 'fuzzy', label: 'Example' },
        requirements: { text: metadata.requirements.join(' · '), display: 'hidden', search: 'fuzzy', label: 'Requires' },
        aliases: { text: command.keywords?.join(' ') ?? '', display: 'hidden', search: 'fuzzy', label: 'Alias' }
      }
    };
    return [row];
  });
}
