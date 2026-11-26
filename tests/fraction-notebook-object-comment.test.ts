import { test } from 'node:test';
import assert from 'node:assert/strict';
import { objectCommentArrival } from '../src/reader/app/object-comment-arrival.ts';
import { projectEquationCheckpointProgress } from '../src/reader/app/equation-checkpoint-progress.ts';

test('object comment settles before reading and withdraws before mathematical action', () => {
  assert.equal(objectCommentArrival(-181, 180, false), undefined);
  assert.deepEqual(objectCommentArrival(-180, 180, false), { emergence: 0, withdrawal: 0 });
  for (const offset of [-20, 0, 40, 72])
    assert.deepEqual(objectCommentArrival(offset, 180, false), { emergence: 1, withdrawal: 0 });
  assert.equal(objectCommentArrival(100, 180, false), undefined);
  const values = [-170, -90, -20, 40, 90];
  const forward = values.map(value => objectCommentArrival(value, 180, false));
  assert.deepEqual(values.reverse().map(value => objectCommentArrival(value, 180, false)), forward.reverse());
});
test('reduced motion presents a stable readable comment and invalid geometry fails closed', () => {
  for (const offset of [-180, -20, 90])
    assert.deepEqual(objectCommentArrival(offset, 180, true), { emergence: 1, withdrawal: 0 });
  assert.throws(() => objectCommentArrival(NaN, 180, false));
  assert.throws(() => objectCommentArrival(0, 20, false));
});
test('rounded reader checkpoints land exactly on semantic endpoints with continuous interiors', () => {
  for (const count of [1, 3, 6, 7, 12, 1000]) {
    let previous = 0;
    for (let i = 0; i <= count; i++) {
      const checkpoint = Math.round(i * 1000 / count) / 1000;
      assert.equal(projectEquationCheckpointProgress(checkpoint, count), i / count);
      if (i > 0) {
        const middle = projectEquationCheckpointProgress((previous + checkpoint) / 2, count);
        assert.ok(Math.abs(middle - (i - .5) / count) < 1e-12);
      }
      previous = checkpoint;
    }
  }
  for (const [progress, count] of [[NaN, 6], [-.1, 6], [1.1, 6], [0, 1001], [0, 1.5]])
    assert.throws(() => projectEquationCheckpointProgress(progress!, count!));
});
