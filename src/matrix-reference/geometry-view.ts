export { mountLinkedColumnExplanation as mountGeometryExplanation } from '../experiments/matrix-column-combinations/linked-embed.ts';
import { applyMatrixConfig, readMatrixConfig } from '../experiments/matrix-examples/config.ts';
import './candidate.css';

export function mountReferenceTheme() {
  const html = document.documentElement;
  html.dataset['referenceGeometry'] = ''; html.dataset['kpTheme'] = 'light';
  applyMatrixConfig(document, { ...readMatrixConfig(document), theme: 'light' });
  const toggle = document.createElement('button'); toggle.className = 'reference-theme'; toggle.textContent = 'Dark theme';
  toggle.onclick = () => {
    const dark = html.dataset['kpTheme'] !== 'dark'; html.dataset['kpTheme'] = dark ? 'dark' : 'light';
    toggle.textContent = dark ? 'Light theme' : 'Dark theme';
    // Native paint clones cache measured styles; use their existing preparation
    // boundary when the host theme changes, keeping the same playhead.
    applyMatrixConfig(document, { ...readMatrixConfig(document), theme: dark ? 'dark' : 'light' });
  };
  document.querySelector('.reference-tools')!.append(toggle);
  return () => { toggle.onclick = null; toggle.remove(); };
}
