import { mountRowPicker } from '../interaction/row-picker.ts';
import type { Row } from '../editor-rows/model.ts';
import type { UUID } from '../notebook/model.ts';
import { selectedCard, type ReferenceCard, type ReferenceShelf } from './shelf.ts';
import type { ImportChoice, PendingImport } from './session.ts';
import '../interaction/style.css';

interface ShelfActions {
  select(id: UUID): Promise<void>;
  rename(id: UUID, name: string): Promise<void>;
  confirm(choice: ImportChoice): Promise<void>;
  cancel(): void;
}
export function mountShelfControls(host: HTMLElement, actions: ShelfActions) {
  host.innerHTML = `<fieldset disabled><legend>Saved explanations</legend>
    <button type="button" data-find>Find a card</button><span data-count></span>
    <form><label>Card name<input name="card-name" maxlength="120" required autocomplete="off"></label><button type="submit">Save name</button></form>
    <p class="shelf-current" aria-live="polite"></p></fieldset>`;
  const find = host.querySelector<HTMLButtonElement>('[data-find]')!, name = host.querySelector<HTMLInputElement>('input')!;
  const form = host.querySelector('form')!;
  let current: ReferenceShelf | undefined, previousName = '', previousId: UUID | undefined;
  const rows = (): readonly Row<UUID>[] => current?.cards.map(card => ({
    id: card.id, resource: card.id, actions: ['open'], facets: {}, fields: {
      name: { text: card.name, display: 'primary', search: 'fuzzy' },
      file: { text: card.view.filename, display: 'secondary', search: 'none' },
      position: { text: `${Math.round(card.view.progress * 100)}% · ${card.id.slice(0, 8)}`, display: 'annotation', search: 'none' }
    }
  })) ?? [];
  const picker = mountRowPicker(host, { id: 'reference-card-picker', label: 'Saved cards', rows,
    execute: async row => { await actions.select(row.resource); return { ok: true }; } });
  find.onclick = () => picker.open();
  form.onsubmit = event => { event.preventDefault(); if (current) void actions.rename(current.selected, name.value); };

  const dialog = document.createElement('dialog'); dialog.className = 'shelf-import'; dialog.setAttribute('aria-label', 'Existing source');
  dialog.innerHTML = `<h2>This source is already on your shelf</h2><p data-import-file></p>
    <label>Card to update<select></select></label><p>Updating keeps that card’s name and playback position. A separate card keeps the same source IDs and starts at the beginning.</p>
    <div><button data-update>Update this card</button><button data-copy>Save as separate card</button><button data-cancel>Cancel</button></div>`;
  host.append(dialog);
  const targets = dialog.querySelector('select')!; let matches: readonly ReferenceCard[] = [];
  dialog.querySelector<HTMLButtonElement>('[data-update]')!.onclick = () => {
    const card = matches.find(card => card.id === targets.value); if (card) void actions.confirm({ kind: 'update', cardId: card.id });
  };
  dialog.querySelector<HTMLButtonElement>('[data-copy]')!.onclick = () => { void actions.confirm({ kind: 'copy' }); };
  dialog.querySelector<HTMLButtonElement>('[data-cancel]')!.onclick = actions.cancel;
  dialog.addEventListener('cancel', event => { event.preventDefault(); actions.cancel(); });
  return {
    update(shelf: ReferenceShelf) {
      current = shelf; const card = selectedCard(shelf);
      host.querySelector('fieldset')!.disabled = false;
      host.querySelector('[data-count]')!.textContent = `${shelf.cards.length} saved`;
      host.querySelector('.shelf-current')!.textContent = `Viewing ${card.name}`;
      // Playback saves cannot replace an unfinished rename draft.
      if (previousId !== card.id || previousName !== card.name) name.value = card.name;
      previousId = card.id; previousName = card.name;
    },
    offer(pending: PendingImport | undefined, cards: readonly ReferenceCard[]) {
      if (!pending) { if (dialog.open) dialog.close(); matches = []; return; }
      matches = cards; targets.replaceChildren();
      for (const card of cards) { const option = document.createElement('option'); option.value = card.id;
        option.textContent = `${card.name} · ${card.id.slice(0, 8)}`; targets.append(option); }
      if (current && cards.some(card => card.id === current!.selected)) targets.value = current.selected;
      dialog.querySelector('[data-import-file]')!.textContent = pending.filename;
      dialog.showModal();
    },
    dispose() { picker.dispose(); dialog.remove(); host.replaceChildren(); }
  };
}
