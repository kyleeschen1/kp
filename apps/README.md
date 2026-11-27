# Independent technical-interface labs

These are separately runnable consumers of the library entrypoints. They do not
boot the notebook, Codex backend or full KP application. Install dependencies at
the repository root; each app uses that checkout's installation.

| Lane | API | Standalone development | Default URL |
| --- | --- | --- | --- |
| Interaction | `src/interaction/public-api.ts` | `npm run --prefix apps/interaction-lab dev` | http://127.0.0.1:8011/ |
| Mathematics | `src/math-resources/public-api.ts` | `npm run --prefix apps/mathematics-lab dev` | http://127.0.0.1:8012/ |
| Player | `src/animation-player/public-api.ts` | `npm run --prefix apps/player-lab dev` | http://127.0.0.1:8013/ |

Each app also has `test`, `typecheck` and `build` scripts. Builds go into the
app's ignored `dist/` directory. No root application build or API service is
needed. Read each app's README for its API, fixture and remaining limitations.

## Managed previews

On macOS, from the integration checkout:

```sh
npm run lanes:start
npm run lanes:status
npm run lanes:stop
```

Launchd owns these processes after the starting terminal exits and restarts a
crashed process. They run until explicitly stopped or the login session ends;
no automatic login service is installed. Logs are in `logs/library-lanes/`.
The existing KP service at port 8000 is independent and remains untouched.

Ports are strict: these commands refuse to replace another checkout's listener.
Before moving a lane to a worker checkout, stop the integration previews using
`lanes:stop`, then run that lane's `dev` command in its worker checkout. Do not
kill someone else's process to obtain its port. Browser origins and the math
fixture's own storage key isolate fixture state from the product.

## Verification and parallel ownership

```sh
npm run check:library-lanes
npm run lanes:start
npm run visual:library-lanes
npm run visual:library-lanes -- --project=firefox
npm run check:architecture
```

The aggregate check verifies transitive API boundaries, service plans, each
lane's unit/type checks and complete standalone builds. Browser checks use the
running managed hosts. The optional Firefox argument runs both Chromium and
Firefox. Screenshots and traces stay under ignored `tmp/codex/`.

Use a separate branch/worktree per worker. The integrator owns root dependencies,
architecture policy, shared contracts and product wiring. Workers own their
lane paths and fixtures; they request shared changes through the integrator.
Start subsequent work from the latest verified integration commit, not a stale
main branch. No separate package release or repository is implied.

The [approved lane plan](../docs/project/2026-11-27-parallel-library-lanes.md)
records ownership and preservation boundaries. The new player shares its GPU
pipeline with the original graph experiment; that consumer needs regression
checks when the pipeline changes. Existing notebook commands and mathematical
owners remain preservation consumers of their respective shared mechanisms.
