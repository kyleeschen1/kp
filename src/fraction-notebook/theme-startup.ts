import { applyStyles, readStyleSettings } from './styles.ts';

// Bundled as a blocking head script by the development host. Reuse the full
// settings validator so first paint and the mounted editor agree on overrides.
try { applyStyles(readStyleSettings(JSON.parse(localStorage.getItem('kp.notebook.styles.v1') ?? 'null'))); }
catch { applyStyles(readStyleSettings(null)); }
// Only the explicitly window-hosted preview reveals its parent's paper surface.
document.documentElement.toggleAttribute('data-notebook-window-surface', window.parent !== window && new URLSearchParams(location.search).get('surface') === 'window');
