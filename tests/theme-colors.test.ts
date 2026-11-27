import assert from 'node:assert/strict';
import test from 'node:test';
import { readThemeColors, ThemeColorGap, type ThemeRGB } from '../src/rendering/theme-colors.ts';

/** These fakes test ownership and failure boundaries, not browser color parsing.
 * Real CSS/Canvas conversion belongs in the candidate's browser smoke test. */
function fixture(tokens: Record<string, string> = { '--ink': '#182430', '--paper': 'rgb(240, 241, 242)' }) {
  const counts = { style: 0, reads: 0, probes: 0, canvases: 0, removals: 0 };
  const styles = new Map<string, string>();
  const pixels: Record<string, readonly number[]> = {
    '#182430': [24, 36, 48, 255], 'rgb(240, 241, 242)': [240, 241, 242, 255],
    'rgb(18, 52, 86)': [18, 52, 86, 255], '#010203': [1, 2, 3, 255], '#040506': [4, 5, 6, 255],
    'rgba(1, 2, 3, 0.5)': [1, 2, 3, 128], 'rgba(1, 2, 3, 0.9999)': [1, 2, 3, 255],
    'color(srgb 1 0 0 / 99.99%)': [255, 0, 0, 255],
  };
  let fill = '#000000', attached = false, connected = true;
  let contextAvailable = true, failRead = false, failStyle = false, detachOnRead = false;
  const context = {
    get fillStyle() { return fill; },
    set fillStyle(value: string) { if (value in pixels) fill = value; },
    clearRect() {}, fillRect() {},
    getImageData() {
      counts.reads++;
      if (failRead) throw new Error('Readback unavailable');
      if (detachOnRead) connected = false;
      return { data: Uint8ClampedArray.from(pixels[fill]!) };
    },
  };
  const probe = {
    style: { setProperty(key: string, value: string) { styles.set(key, value); } },
    setAttribute() {}, remove() { if (attached) { attached = false; counts.removals++; } },
  };
  const canvas = { width: 0, height: 0, getContext() { return contextAvailable ? context : null; } };
  const window = {
    CSS: { supports(_property: string, value: string) { return value !== '12px'; } },
    getComputedStyle(target: unknown) {
      counts.style++;
      if (failStyle) throw new Error('Style unavailable');
      if (target === host) return { getPropertyValue(token: string) { return tokens[token] ?? ''; } };
      assert.equal(target, probe); assert.equal(attached, true);
      const value = styles.get('background-color');
      return { backgroundColor: value === 'currentColor' ? 'rgb(18, 52, 86)' : value };
    },
  };
  const document = {
    defaultView: window,
    createElement(tag: string) {
      if (tag === 'canvas') { counts.canvases++; return canvas; }
      assert.equal(tag, 'span'); counts.probes++; return probe;
    },
  };
  const host = { ownerDocument: document, get isConnected() { return connected; },
    append(child: unknown) { assert.equal(child, probe); attached = true; } };
  return { host: host as unknown as HTMLElement, counts, canvas, tokens,
    attached: () => attached,
    disconnect: () => { connected = false; },
    noContext: () => { contextAvailable = false; },
    failRead: () => { failRead = true; },
    failStyle: () => { failStyle = true; },
    detachOnRead: () => { detachOnRead = true; },
  };
}
const gap = (code: ThemeColorGap['code'], token?: string) => (error: unknown) => {
  assert.ok(error instanceof ThemeColorGap); assert.equal(error.code, code);
  if (token !== undefined) assert.equal(error.token, token);
  return true;
};
const released = (value: ReturnType<typeof fixture>) => {
  assert.equal(value.attached(), false);
  assert.equal(value.canvas.width, 0); assert.equal(value.canvas.height, 0);
  assert.equal(value.counts.removals, 1);
};

test('a host-owned snapshot resolves each distinct token once and freezes normalized RGB', () => {
  const value = fixture(), colors = readThemeColors(value.host, { ink: '--ink', paper: '--paper', line: '--ink' });
  const rgb: ThemeRGB = colors.ink;
  assert.deepEqual(rgb, [24 / 255, 36 / 255, 48 / 255]);
  assert.deepEqual(colors.paper, [240 / 255, 241 / 255, 242 / 255]);
  assert.equal(colors.line, colors.ink);
  assert.ok(Object.isFrozen(colors) && Object.isFrozen(colors.ink));
  assert.deepEqual(value.counts, { style: 3, reads: 2, probes: 1, canvases: 1, removals: 1 });
  released(value);
});

test('an explicit second snapshot observes a theme change without mutating the previous one', () => {
  const value = fixture(), first = readThemeColors(value.host, { ink: '--ink' });
  value.tokens['--ink'] = 'currentColor';
  const second = readThemeColors(value.host, { ink: '--ink' });
  assert.deepEqual(first.ink, [24 / 255, 36 / 255, 48 / 255]);
  assert.deepEqual(second.ink, [18 / 255, 52 / 255, 86 / 255]);
  assert.equal(value.counts.removals, 2);
});

test('valid colors equal to either rejection sentinel are not rejected', () => {
  const value = fixture({ '--a': '#010203', '--b': '#040506' });
  assert.deepEqual(readThemeColors(value.host, { a: '--a', b: '--b' }),
    { a: [1 / 255, 2 / 255, 3 / 255], b: [4 / 255, 5 / 255, 6 / 255] });
  released(value);
});

test('missing, invalid, unsupported canvas values and invalid property names fail explicitly', () => {
  for (const [tokens, code] of [
    [{}, 'missing-token'], [{ '--ink': '12px' }, 'invalid-color'],
    [{ '--ink': 'future-color(1)' }, 'invalid-color'],
  ] as const) {
    const value = fixture(tokens);
    assert.throws(() => readThemeColors(value.host, { ink: '--ink' }), gap(code, '--ink'));
    released(value);
  }
  const value = fixture();
  assert.throws(() => readThemeColors(value.host, { ink: '--bad;}' }), gap('invalid-token', '--bad;}'));
  released(value);
});

test('fractional alpha is never discarded, including values rounding to opaque pixels', () => {
  for (const color of ['rgba(1, 2, 3, 0.5)', 'rgba(1, 2, 3, 0.9999)', 'color(srgb 1 0 0 / 99.99%)']) {
    const value = fixture({ '--ink': color });
    assert.throws(() => readThemeColors(value.host, { ink: '--ink' }), gap('translucent-color', '--ink'));
    released(value);
  }
});

test('disconnected hosts allocate nothing and detachment during a snapshot cannot publish colors', () => {
  const value = fixture(); value.disconnect();
  assert.throws(() => readThemeColors(value.host, { ink: '--ink' }), gap('detached-host'));
  assert.equal(value.counts.probes, 0); assert.equal(value.counts.canvases, 0);
  const other = fixture(); other.detachOnRead();
  assert.throws(() => readThemeColors(other.host, { ink: '--ink' }), gap('detached-host'));
  released(other);
});

test('unavailable contexts, style errors and readback errors release every temporary resource', () => {
  for (const [fail, code] of [['noContext', 'canvas-unavailable'], ['failStyle', 'read-failed'], ['failRead', 'read-failed']] as const) {
    const value = fixture(); value[fail]();
    assert.throws(() => readThemeColors(value.host, { ink: '--ink' }), gap(code));
    released(value);
  }
});
