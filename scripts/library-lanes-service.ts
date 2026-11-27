import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, realpathSync, unlinkSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { libraryLanes } from '../src/architecture/library-lanes.ts';

const root = realpathSync(resolve(import.meta.dirname, '..'));
const xml = (value: string) => value.replace(/[<>&"']/g, character =>
  ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character]!);

export function laneServicePlan(checkout: string, node: string) {
  const identity = createHash('sha256').update(checkout).digest('hex').slice(0, 12);
  return libraryLanes.map(lane => {
    const label = `com.kineticpress.lanes.${identity}.${lane.id}`;
    const cwd = resolve(checkout, lane.app), log = resolve(checkout, `logs/library-lanes/${lane.id}.log`);
    const args = [node, resolve(checkout, 'node_modules/vite/bin/vite.js'), '--config', 'vite.config.ts',
      '--host', '127.0.0.1', '--port', String(lane.port), '--strictPort'];
    // KeepAlive belongs to launchd, so finishing a Codex turn does not own the
    // server lifetime. Plists stay local; these jobs do not install login hooks.
    const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${xml(label)}</string>
<key>ProgramArguments</key><array>${args.map(arg => `<string>${xml(arg)}</string>`).join('')}</array>
<key>WorkingDirectory</key><string>${xml(cwd)}</string>
<key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
<key>ThrottleInterval</key><integer>5</integer>
<key>StandardOutPath</key><string>${xml(log)}</string>
<key>StandardErrorPath</key><string>${xml(log)}</string>
</dict></plist>\n`;
    return { ...lane, label, cwd, log, args, plist, filename: resolve(checkout, `.kp/services/${label}.plist`) };
  });
}

function launchctl(args: readonly string[], required = true) {
  const result = spawnSync('/bin/launchctl', args, { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (required && result.status !== 0) throw new Error(`launchctl ${args.join(' ')}: ${result.stderr.trim() || result.stdout.trim()}`);
  return result;
}
function loaded(target: string) {
  const result = launchctl(['print', target], false);
  if (result.status === 0) return result.stdout;
  if (/Could not find service/.test(result.stderr)) return undefined;
  throw new Error(`Cannot inspect ${target}: ${result.stderr.trim()}`);
}
async function portFree(port: number) {
  await new Promise<void>((done, reject) => {
    const server = createServer();
    server.once('error', error => reject(new Error(`Port ${port} occupied; refusing to replace another checkout: ${error.message}`)));
    server.listen(port, '127.0.0.1', () => server.close(error => error ? reject(error) : done()));
  });
}
export function assertSavedLanePlan(filename: string, saved: string | undefined, expected: string) {
  if (saved !== undefined && saved !== expected) throw new Error(`Service plan changed: ${filename}. Stop this checkout's lanes before reinstalling.`);
}
export async function main(action: string | undefined) {
  if (!['start', 'stop', 'status'].includes(action ?? '')) throw new Error('Use lanes:start, lanes:stop or lanes:status.');
  if (process.platform !== 'darwin') throw new Error('Managed lanes use macOS launchd. Elsewhere use each app’s npm run dev command.');
  const domain = `gui/${process.getuid!()}`, services = laneServicePlan(root, process.execPath);
  const states = services.map(service => loaded(`${domain}/${service.label}`));
  if (action === 'start') {
    // Preflight every path and port before registering any process. Never adopt
    // an unknown listener merely because it answers an HTTP health check.
    for (const [index, service] of services.entries()) {
      if (!existsSync(resolve(service.cwd, 'vite.config.ts')) || !existsSync(service.args[1]!)) throw new Error(`Missing lane/dependencies: ${service.cwd}`);
      assertSavedLanePlan(service.filename, existsSync(service.filename) ? readFileSync(service.filename, 'utf8') : undefined, service.plist);
      if (states[index] === undefined) await portFree(service.port);
    }
    const started: typeof services = [];
    try {
      for (const [index, service] of services.entries()) {
        mkdirSync(dirname(service.log), { recursive: true }); mkdirSync(dirname(service.filename), { recursive: true });
        if (!existsSync(service.filename)) writeFileSync(service.filename, service.plist, { flag: 'wx', mode: 0o600 });
        if (states[index] === undefined) { launchctl(['bootstrap', domain, service.filename]); started.push(service); }
      }
    } catch (error) {
      // A partial start only rolls back jobs started here, never preexisting jobs.
      for (const service of started.reverse()) launchctl(['bootout', `${domain}/${service.label}`], false);
      throw error;
    }
  } else if (action === 'stop') {
    for (const [index, service] of services.entries()) {
      if (states[index] !== undefined) launchctl(['bootout', `${domain}/${service.label}`]);
      if (existsSync(service.filename)) unlinkSync(service.filename);
    }
  }
  console.log(`Checkout: ${root}`);
  for (const service of services) {
    const state = loaded(`${domain}/${service.label}`);
    console.log(`${service.id}: ${state?.match(/\bstate = (.+)/)?.[1] ?? 'stopped'}; PID ${state?.match(/\bpid = (\d+)/)?.[1] ?? 'none'}; http://127.0.0.1:${service.port}/; ${service.log}`);
  }
  if (action === 'start') console.log('Jobs restart on exit until lanes:stop or logout. No login startup was installed.');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  main(process.argv[2]).catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
