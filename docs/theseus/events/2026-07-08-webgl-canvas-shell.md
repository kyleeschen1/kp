# 2026-07-08 WebGL canvas shell

## Slice

- Added a 3D graph WebGL shell that advertises the Three.js backend, mounts a hidden canvas, and keeps the existing SVG renderer as the visible fallback.
- Routed initial editor rendering and live 3D graph preview updates through the shell so controls no longer replace the shell with raw SVG.
- Added minimal CSS for the pending fallback state and the future ready canvas state.

## Evidence

- Red test before implementation: `node --disable-warning=ExperimentalWarning --test tests/editor.test.ts` failed on missing `class="graph-webgl"`.
- Focused verification: `node --disable-warning=ExperimentalWarning --test tests/editor.test.ts tests/graph-webgl.test.ts`.
- Full verification: `npm test`.
- Static/build verification: `npm run typecheck`, `npm run build`, `git diff --check`.

## Notes

- This is still a shell checkpoint. The SVG fallback remains the rendered graph until the Three.js scene is hydrated into the canvas.
