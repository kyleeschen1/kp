# Tooling configuration

Keep conventional discovery entrypoints (`playwright.config.ts`, `vite.config.ts`
and `tsconfig.json`) at the repository root. Specialized configurations belong
under `config/playwright/`, `config/vite/` and `config/typescript/`.
Their basenames and normal npm command names stay
stable. Use package scripts to avoid coupling a caller to configuration paths.

Configuration-relative paths are behavior: test discovery, server working
directories, build inputs, output locations and compiler coverage must resolve
to the same repository locations after a move. Prefer existing shared helpers;
preserve suite-specific ports, browsers and lifecycle policies.

`npm run test:tooling-configs` guards ownership and command references.
`npm run check:playwright-configs` resolves all Playwright configurations using
the installed runner, checks actual file discovery, and compares behavior with
the reviewed configuration-policy baseline. It starts no browser or server.
Ordinary test additions do not change that baseline: every project must discover
files, and a synthetic nested-worktree probe exercises the real runner matcher.
`--capture-details <path>` captures complete discovery for before/after moves.
A dependency upgrade or intended configuration change needs an explained baseline
update, not automatic refresh. Run affected real browser checks separately.

`config/playwright/shared.ts` owns desktop device definitions and the anchored
nested-worktree exclusion. Each suite still chooses its browsers explicitly.
Never use `**/.worktrees/**` as a test exclusion: it also matches the checkout's
ancestors when running inside a worktree. `visual:tooling-configs` checks actual
root, concept and tutorial routes; append `-- --project=firefox` for both browsers.

`npm run check:vite-configs` compares all 13 Vite configurations in serve and
build modes and verifies their declared input paths. Plugin declarations are
checked, but hook behavior still needs the representative actual builds.

`npm run check:typescript-configs` parses every root/specialized compiler config
and checks explicit inputs and project references. During relocation its
`--capture`/`--compare` options compare complete inputs and no-emit options before
and after; that temporary snapshot does not freeze ordinary future source-file
additions. Shared `tsconfig.base.json` stays at root for domain/protocol consumers.
Tools that parse a config must resolve paths relative to that config's directory.

Run `npm run check:tooling-configs` for all three configuration guards plus
the ownership/command tests.

For a deliberate algebra style migration, run
`npm run visual:algebra-styles -- --update-snapshots=all` before editing and
`npm run visual:algebra-styles` afterward. It compares disposable computed-style
and geometry captures; it does not create approved screenshot goldens. Ordinary
`visual:algebra-mount` preservation needs no saved baseline. Algebra mount,
style and edition checks share isolated port 8013 and should run sequentially.
The retained reader checks own port 8012; the product preview stays on 8011.

The editor/workbench session owns its application checkout. KP configuration
changes are integrated in the KP maintenance worktree; keep its preview URL and
normal command interface stable and coordinate any shared-contract changes.
