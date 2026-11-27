import { CommandRegistry, available, commandRows, mountRowPicker, type PreparedCommand, type Row } from '../../src/interaction/public-api.ts';
import '../../src/interaction/style.css';
import './style.css';

const selection = document.querySelector<HTMLElement>('#selection')!;
const mountStatus = document.querySelector<HTMLElement>('#mount-status')!;
const openButton = document.querySelector<HTMLButtonElement>('#open-picker')!;
const remountButton = document.querySelector<HTMLButtonElement>('#remount-picker')!;
const report = (message: string) => { selection.textContent = message; };
const registry = new CommandRegistry(() => ({ scope: 'workspace' }), report);
interface Fruit { readonly id: string; readonly title: string; readonly family: string }
const fruits: readonly Fruit[] = [
  { id: 'fruit.apple', title: 'Apple', family: 'Pome' },
  { id: 'fruit.apricot', title: 'Apricot', family: 'Stone fruit' },
  { id: 'fruit.avocado', title: 'Avocado', family: 'Berry' },
  { id: 'fruit.banana', title: 'Banana', family: 'Berry' },
  { id: 'fruit.blueberry', title: 'Blueberry', family: 'Berry' },
  { id: 'fruit.cherry', title: 'Cherry', family: 'Stone fruit' },
  { id: 'fruit.grape', title: 'Grape', family: 'Berry' },
  { id: 'fruit.lemon', title: 'Lemon', family: 'Citrus' },
  { id: 'fruit.mango', title: 'Mango', family: 'Stone fruit' },
  { id: 'fruit.orange', title: 'Orange', family: 'Citrus' },
  { id: 'fruit.peach', title: 'Peach', family: 'Stone fruit' },
  { id: 'fruit.pear', title: 'Pear', family: 'Pome' }
];
const choose = registry.targeted<Fruit>({ id: 'lab.choose-fruit', title: 'Choose a fruit', category: 'Fruit',
  target: () => ({ found: false, reason: 'Select a fruit row' }), state: () => available(),
  run: fruit => report(`Selected ${fruit.title} · ${fruit.id}`) });
registry.add({ id: 'lab.clear', title: 'Clear selection', category: 'Commands', keywords: ['reset'], run: () => report('Nothing selected yet.') });
registry.add({ id: 'lab.about', title: 'Explain row identity', category: 'Commands', keywords: ['help', 'resource'],
  run: () => report('Labels are display text. The command receives the captured resource, even if the host selection later changes.') });
registry.add({ id: 'lab.reopen', title: 'Reopen picker', category: 'Commands', keywords: ['lifecycle'], run: () => picker.open() });

const rows = (): readonly Row<PreparedCommand>[] => [
  ...fruits.map(fruit => ({ id: fruit.id, resource: choose.forTarget(fruit), actions: [choose.id], facets: { kind: ['fruit'] },
    fields: { title: { text: fruit.title, display: 'primary', search: 'fuzzy' },
      family: { text: fruit.family, display: 'secondary', search: 'literal' },
      identity: { text: fruit.id, display: 'hidden', search: 'literal', label: 'Resource' } }
  } satisfies Row<PreparedCommand>)),
  ...commandRows(registry.snapshot().filter(command => command.id !== choose.id)).map(row => ({ ...row, facets: { ...row.facets, kind: ['command'] } }))
];
const mount = () => mountRowPicker(document.body, {
  id: 'interaction-picker', label: 'fruit and commands', rows, maxVisible: 5,
  state: row => row.resource.state(), execute: row => row.resource.execute(), report,
  facets: [{ id: 'kind', label: 'Kind', values: [{ id: 'fruit', label: 'Fruit', key: 'f' }, { id: 'command', label: 'Commands', key: 'c' }] }]
});
let picker = mount(), mounts = 1;
openButton.onclick = () => picker.open();
remountButton.onclick = () => { picker.dispose(); picker = mount(); mountStatus.textContent = `Picker mount ${++mounts}`; picker.open(); };
const unsubscribe = registry.subscribe(() => picker.refresh());
const onKey = (event: KeyboardEvent) => {
  if (!event.isComposing && !event.repeat && event.altKey && event.code === 'KeyX') { event.preventDefault(); picker.open(); }
};
window.addEventListener('keydown', onKey);
const dispose = () => { unsubscribe(); picker.dispose(); registry.dispose(); window.removeEventListener('keydown', onKey); };
window.addEventListener('pagehide', dispose, { once: true });
if (import.meta.hot) import.meta.hot.dispose(dispose);
