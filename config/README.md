# Tooling configuration

Keep conventional discovery entrypoints (`playwright.config.ts`, `vite.config.ts`
and `tsconfig.json`) at the repository root. Specialized configurations belong
under `config/playwright/`, `config/vite/` and `config/typescript/`; migrations
arrive one family at a time. Their basenames and normal npm command names stay
stable. Use package scripts to avoid coupling a caller to configuration paths.

Configuration-relative paths are behavior: test discovery, server working
directories, build inputs, output locations and compiler coverage must resolve
to the same repository locations after a move. Prefer existing shared helpers;
preserve suite-specific ports, browsers and lifecycle policies.

`npm run test:tooling-configs` guards ownership and command references.
`npm run check:playwright-configs` resolves all Playwright configurations using
the installed runner, checks actual file discovery, and compares behavior with
the reviewed baseline. It starts no browser or server. A dependency upgrade or
intended test/config change needs an explained baseline update, not automatic
refresh. Run the affected real browser checks separately.

The editor/workbench session owns its application checkout. KP configuration
changes are integrated in the KP maintenance worktree; keep its preview URL and
normal command interface stable and coordinate any shared-contract changes.
