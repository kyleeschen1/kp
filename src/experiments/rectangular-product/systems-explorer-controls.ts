import { renderLatexToHtml } from '../../rendering/katex-adapter.ts';
import type { SystemProblemRequest } from '../../math/system-generator.ts';
import type { createSystemsExplorer } from './systems-explorer-model.ts';
type Explorer = Extract<ReturnType<typeof createSystemsExplorer>, { status: 'ready' }>;

/** Only the generated-problem route loads these controls; ordinary collection
 * consumers retain the shared player without the generator UI. */
export function form({ size, kind, seed, rank }: SystemProblemRequest) {
  return `<form method="get" class="matrix-controls" aria-label="Generate a linear system">
    <input type="hidden" name="view" value="row-composition"><input type="hidden" name="example" value="generated">
    <label>Size <select name="size" aria-label="System size"><option value="2" ${size === 2 ? 'selected' : ''}>2 × 2</option><option value="3" ${size === 3 ? 'selected' : ''}>3 × 3</option></select></label>
    <label>Solutions <select name="kind" aria-label="Solution type">${[['unique', 'One'], ['infinite', 'Infinitely many'], ['none', 'None']].map(([value, label]) => `<option value="${value}" ${kind === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
    <label>Rank <select name="rank" aria-label="Coefficient rank" ${kind === 'unique' ? 'disabled' : ''}>${Array.from({ length: kind === 'unique' ? 1 : size - 1 }, (_, i) => kind === 'unique' ? size : i + 1).map(r => `<option value="${r}" ${rank === r ? 'selected' : ''}>${r}</option>`).join('')}</select></label>
    <label>Seed <input name="seed" aria-label="Problem seed" type="number" min="0" max="4294967295" step="1" value="${seed}" required></label>
    <button type="submit">Generate</button><button type="button" data-new-problem>New problem</button></form>`;
}
export function details(explorer: Explorer) {
  return `<details data-explorer><summary>Inspect solutions and structure</summary>
      <label>Ask about this system <select data-question aria-label="Question about this system"><option value="">Choose a question</option>${explorer.questions.map(q => `<option value="${q.id}">${q.title}</option>`).join('')}</select></label>
      <div data-answer aria-live="polite"></div><p>Solution set, in the displayed variable order:</p>
      <div class="pour-static">${renderLatexToHtml(explorer.solutionLatex, { output: 'htmlAndMathml' })}</div>
      ${explorer.generated.solution.solution.kind === 'infinite' ? `<p>Vary a free variable. The pivot variables adjust while every original equation remains satisfied.</p>
        ${explorer.generated.solution.solution.freeColumns.map((column, i) => `<label>${['x', 'y', 'z'][column]} = <output data-parameter-value="${i}">0</output><input type="range" min="-3" max="3" step="1" value="0" data-parameter="${i}" aria-label="Free variable ${['x', 'y', 'z'][column]}"></label>`).join('')}
        <div data-parameter-result class="pour-static" aria-live="polite"></div>` : ''}
      <p>Rank of A: ${explorer.generated.solution.rank}. Rank of the augmented matrix: ${explorer.generated.solution.augmentedRank}. Generated seed: ${explorer.generated.request.seed}.</p></details>`;
}
export function mount(root: HTMLElement, explorer: Explorer, go: (milestone: string) => void) {
  const question = root.querySelector<HTMLSelectElement>('[data-question]');
  if (question && explorer) question.onchange = () => {
    const selected = explorer.questions.find(q => q.id === question.value);
    root.querySelector<HTMLElement>('[data-answer]')!.textContent = selected?.answer ?? '';
    if (selected) go(selected.milestone);
  };
  const newProblem = root.querySelector<HTMLButtonElement>('[data-new-problem]');
  const sizeSelect = root.querySelector<HTMLSelectElement>('[name="size"]'), kindSelect = root.querySelector<HTMLSelectElement>('[name="kind"]');
  if (sizeSelect && kindSelect) {
    const updateRank = () => {
      const select = root.querySelector<HTMLSelectElement>('[name="rank"]')!, n = Number(sizeSelect.value), unique = kindSelect.value === 'unique';
      const previous = Math.min(n - 1, Number(select.value));
      select.disabled = unique;
      select.innerHTML = Array.from({ length: unique ? 1 : n - 1 }, (_, i) => unique ? n : i + 1)
        .map(r => `<option value="${r}" ${r === previous ? 'selected' : ''}>${r}</option>`).join('');
    };
    sizeSelect.onchange = kindSelect.onchange = updateRank;
  }
  if (newProblem) newProblem.onclick = () => {
    const input = root.querySelector<HTMLInputElement>('[name="seed"]')!;
    input.value = String((Number(input.value) + 1) >>> 0);
    root.querySelector<HTMLFormElement>('form')!.requestSubmit();
  };
  const parameters = [...root.querySelectorAll<HTMLInputElement>('[data-parameter]')];
  if (explorer && parameters.length) {
    const update = () => {
      const values = parameters.map(input => Number(input.value)), result = explorer.inspectParameters(values);
      parameters.forEach((_, i) => { root.querySelector(`[data-parameter-value="${i}"]`)!.textContent = String(values[i]); });
      root.querySelector('[data-parameter-result]')!.innerHTML = result.status === 'evaluated'
        ? renderLatexToHtml(result.latex, { output: 'htmlAndMathml' }) : '';
    };
    parameters.forEach(input => { input.oninput = update; }); update();
  }

  return () => {
    if (question) question.onchange = null;
    if (newProblem) newProblem.onclick = null;
    if (sizeSelect) sizeSelect.onchange = null;
    if (kindSelect) kindSelect.onchange = null;
    parameters.forEach(input => { input.oninput = null; });
  };
}

