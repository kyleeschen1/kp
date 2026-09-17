/** Exemplar-only DOM continuity. The checked fine plan still owns the inserted
 * steps; common native records and the parent explanation retain their identity. */
export function createEnergyRefinementUnfolding(root: HTMLElement) {
  const rows = [...root.querySelectorAll<HTMLElement>('[data-derivation-row]')];
  const parent = rows.findIndex(row => row.hasAttribute('data-refinement-anchor'));
  if (root.dataset['derivationNamespace'] !== 'energy' || parent !== rows.length - 2)
    throw new Error('Inline exemplar requires the checked terminal energy refinement');
  const equations = rows.map(row => row.querySelector<HTMLElement>('.energy-derivation-equation')!);
  const explanation = rows[parent]!.querySelector<HTMLElement>('.energy-derivation-interleave-text')!;
  const control = explanation.querySelector<HTMLButtonElement>('[data-refinement-expand]')!;
  const label = control.textContent;
  const handle = root.querySelector<HTMLElement>('[data-derivation-handle]')!;
  return (next: HTMLElement) => {
    const fine = next.dataset['derivationDetail'] === 'mass-refinement';
    const nextRows = [...next.querySelectorAll<HTMLElement>('[data-derivation-row]')];
    // Publication already checks shared outer endpoints. Reuse only those
    // native records, never equate an arbitrary compact pose with a child pose.
    for (let i = 0; i <= parent; i++) {
      nextRows[i]!.querySelector('.energy-derivation-equation')!.replaceWith(equations[i]!);
    }
    nextRows.at(-1)!.querySelector('.energy-derivation-equation')!.replaceWith(equations.at(-1)!);
    control.toggleAttribute('data-refinement-expand', !fine);
    control.toggleAttribute('data-refinement-collapse', fine);
    control.setAttribute('aria-expanded', String(fine));
    control.textContent = fine ? 'Collapse smaller steps' : label;
    if (fine) {
      const context = nextRows[parent]!.querySelector<HTMLElement>('[data-nested-context]')!;
      const retained = document.createElement('div');
      retained.className = 'energy-derivation-interleave energy-derivation-reason energy-refinement-parent';
      retained.dataset['refinementParent'] = '';
      const access = root.querySelector<HTMLElement>('[data-refinement-anchor] .energy-derivation-local-access');
      if (access) {
        const entry = access.querySelector<HTMLButtonElement>('[data-derivation-entry]')!;
        entry.removeAttribute('data-derivation-entry');
        entry.removeAttribute('aria-pressed');
        entry.setAttribute('data-refinement-parent-return', '');
        entry.textContent = 'Return to the whole step';
        access.querySelectorAll<HTMLElement>('[data-derivation-restart], .energy-derivation-mobile-well').forEach(el => el.hidden = true);
        retained.append(access);
      }
      retained.append(explanation);
      nextRows[parent]!.querySelector('[data-derivation-interleave]')!.before(retained);
      context.remove();
    } else {
      nextRows[parent]!.querySelector('.energy-derivation-interleave-text')!.replaceWith(explanation);
    }
    next.querySelector('[data-derivation-handle]')!.replaceWith(handle);
    // Synchronous surgery retains the root, endpoint nodes, explanation and
    // grip; no browser frame observes a removed original section.
    for (const attribute of [...root.attributes]) root.removeAttribute(attribute.name);
    for (const attribute of [...next.attributes]) root.setAttribute(attribute.name, attribute.value);
    root.dataset['refinementUnfolding'] = String(fine);
    root.replaceChildren(...next.childNodes);
    return root;
  };
}
