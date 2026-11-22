# Persistent local development server

From the product checkout (`.worktrees/kp-product`):

```sh
npm run dev:service:start
npm run dev:service:status
npm run dev:service:stop
```

Start installs two user LaunchAgents and returns immediately. Open
http://127.0.0.1:8000/?view=dashboard#project-vision or
http://127.0.0.1:8000/reader/solve-fractional-linear/?reading=reasoning.
The API is local to port 8001; Vite proxies `/api/health` to it.
Logs are in `logs/dev-service/api.log` and `logs/dev-service/web.log`.

macOS launchd owns both processes. Closing Codex or a terminal does not own
their shutdown. Exited jobs restart with a five-second throttle; the jobs load
again at login after a reboot. The computer must be awake and the user logged
in to serve pages. Removing/moving the checkout or Node installation can still
break startup; inspect logs, stop, then reinstall from the valid checkout.
No reboot or logout was performed during verification.

Stop unloads both jobs and deletes their exact LaunchAgent files, preventing
automatic restart and startup at the next login. Killing a PID alone is not a
stop command: launchd restarts it. Repeated start/stop are safe. Service names
are derived from the real checkout path. An occupied unmanaged port is refused;
the tool never kills or adopts another checkout's server and Vite cannot silently
select a different port. `status` reports service state, not HTTP health.

The foreground `npm run dev` and Playwright's isolated server lifecycle remain
available. They are appropriate for terminal-owned or test-owned work, not a
preview that must remain available between Codex sessions. Earlier review links
on port 8011 refer to the previous manually launched product server; use 8000
for the persistent service installed here.

## Regression evidence — November 21, 2026

The previous November 13 startup was a long-running Codex exec session. It
answered HTTP 200 then, but no durable service registration existed on return.
The exact event that terminated that process is unknown. The violated invariant
was lifecycle ownership: a persistent human preview depended on a temporary
agent command session. No earlier committed launchd fix was found in this lane.

`npm run test:dev-service` covers checkout isolation, fixed loopback ports,
restart/login policy, escaped paths and refusal to disturb an occupied port.
`npm run test:dev-service:lifecycle` is an explicit integration check: it forces
each owned process to exit, waits for a new PID and healthy reader/proxied API,
verifies repeated start does not restart healthy jobs, stops both, waits beyond
the restart throttle, checks ports and login-file removal, checks repeated stop,
then leaves the services running again. Both checks passed on this machine.

The integration check briefly interrupts this checkout's preview; do not run
it while someone is reviewing motion. Required OS permission is confined to
these scoped npm commands. No renderer, reading content, or product colors
change as part of this lifecycle repair.
