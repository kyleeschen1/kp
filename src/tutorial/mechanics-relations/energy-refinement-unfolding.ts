/** Exemplar-only DOM continuity. Publication supplies checked row membership;
 * equation equality and proportional rail positions cannot create correspondence. */
export function createEnergyRefinementUnfolding(root: HTMLElement) {
  const rows = [...root.querySelectorAll<HTMLElement>('[data-derivation-row]')];
  if (root.dataset['derivationNamespace'] !== 'energy') throw new Error('Expected energy exemplar');
  const equations = rows.map(row => row.querySelector<HTMLElement>('.energy-derivation-equation')!);
  const explanations = rows.map(row => row.querySelector<HTMLElement>('.energy-derivation-interleave-text'));
  const handle = root.querySelector<HTMLElement>('[data-derivation-handle]')!;
  let parent = -1, parentId = '';
  return (next: HTMLElement) => {
    const fine = next.dataset['derivationDetail'] === 'mass-refinement';
    if (fine) {
      parentId = next.dataset['refinementParentId']!;
      parent = explanations.findIndex(text => text?.querySelector<HTMLButtonElement>('[data-refinement-expand]')?.dataset['refinementExpand'] === parentId);
    }
    if (parent < 0) throw new Error('Missing checked refinement parent');
    const explanation = explanations[parent]!;
    const control = explanation.querySelector<HTMLButtonElement>('[data-refinement-expand], [data-refinement-collapse]')!;
    const nextRows = [...next.querySelectorAll<HTMLElement>('[data-derivation-row]')];
    const retainedRows = nextRows.filter(row => row.hasAttribute('data-coarse-row'));
    // Validate before moving live nodes, including when restoring after a repair.
    if (retainedRows.length !== rows.length || retainedRows.some((row, i) => Number(row.dataset['coarseRow']) !== i))
      throw new Error('Incomplete checked row correspondence');
    for (const [i, row] of retainedRows.entries()) {
      row.querySelector('.energy-derivation-equation')!.replaceWith(equations[i]!);
      if (i !== parent && explanations[i]) row.querySelector('.energy-derivation-interleave-text')!.replaceWith(explanations[i]!);
    }
    control.removeAttribute(fine ? 'data-refinement-expand' : 'data-refinement-collapse');
    control.setAttribute(fine ? 'data-refinement-collapse' : 'data-refinement-expand', parentId);
    control.setAttribute('aria-expanded', String(fine));
    control.textContent = fine ? 'Collapse smaller steps' : 'Inspect smaller steps';
    const parentRow = retainedRows[parent]!;
    if (fine) {
      const context = parentRow.querySelector<HTMLElement>('[data-nested-context]')!;
      const retained = document.createElement('div');
      retained.className = 'energy-derivation-interleave energy-derivation-reason energy-refinement-parent';
      retained.dataset['refinementParent'] = '';
      const access = root.querySelector<HTMLElement>(`[data-coarse-row="${parent}"] .energy-derivation-local-access`);
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
      parentRow.querySelector('[data-derivation-interleave]')!.before(retained);
      context.remove();
    } else {
      parentRow.querySelector('.energy-derivation-interleave-text')!.replaceWith(explanation);
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
