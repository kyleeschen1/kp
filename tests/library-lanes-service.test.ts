import assert from 'node:assert/strict';
import test from 'node:test';
import { laneServicePlan, assertSavedLanePlan } from '../scripts/library-lanes-service.ts';

test('lane service identity, working directory and logs are checkout-local; ports never overlap product services', () => {
  const a = laneServicePlan('/work/one', '/node/bin/node'), b = laneServicePlan('/work/two', '/node/bin/node');
  assert.deepEqual(a.map(value => value.port), [8011, 8012, 8013]);
  assert.equal(new Set(a.map(value => value.label)).size, 3);
  for (const [index, service] of a.entries()) {
    assert.notEqual(service.label, b[index]!.label);
    assert.ok(service.filename.startsWith('/work/one/.kp/services/'));
    assert.ok(service.cwd.startsWith('/work/one/apps/'));
    assert.ok(service.log.startsWith('/work/one/logs/'));
    assert.ok(service.args.includes('--strictPort'));
    assert.match(service.plist, /<key>KeepAlive<\/key><true\/>/);
  }
});
test('saved service changes fail closed and plist paths are escaped', () => {
  assert.doesNotThrow(() => assertSavedLanePlan('local', undefined, 'plan'));
  assert.doesNotThrow(() => assertSavedLanePlan('local', 'plan', 'plan'));
  assert.throws(() => assertSavedLanePlan('local', 'other', 'plan'), /Stop this checkout/);
  assert.match(laneServicePlan('/work/a&b', '/node/bin/node')[0]!.plist, /a&amp;b/);
});
