import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { libraryLanes } from '../src/architecture/library-lanes.ts';

const root = resolve(import.meta.dirname, '..');
function run(command: string, args: readonly string[]) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run(process.execPath, ['--disable-warning=ExperimentalWarning', '--test', 'tests/library-lanes.test.ts', 'tests/library-lanes-service.test.ts']);
for (const lane of libraryLanes) {
  for (const command of ['test', 'typecheck', 'build']) run('npm', ['run', '--prefix', lane.app, command]);
}
