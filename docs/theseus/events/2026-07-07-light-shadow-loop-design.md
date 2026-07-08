# Light and Shadow Loop Design

Recorded: 2026-07-07

Started the approved light/shadow renderer loop. Theseus CLI remains unavailable
because `package.json` has no `theseus` script, so this run continues to use
manual event records under `docs/theseus/events`.

Design direction:
- keep SVG as the semantic/event surface;
- use explicit semantic light settings before adding new visuals;
- keep surface cells opaque and let light affect color, not clipping;
- add projected ground-plane shadows before any debug self-shadow map;
- keep performance budget metadata visible for any extra renderer work.

Primary design record:
- `docs/design-decisions/2026-07-07-svg-light-and-shadow-rendering.md`

Verification:
- `git diff --check`
