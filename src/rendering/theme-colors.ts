export type ThemeRGB = readonly [number, number, number];
export type ThemeColorGapCode = 'detached-host' | 'invalid-token' | 'missing-token' |
  'invalid-color' | 'translucent-color' | 'canvas-unavailable' | 'read-failed';

export class ThemeColorGap extends Error {
  readonly code: ThemeColorGapCode;
  readonly token: string | undefined;
  constructor(code: ThemeColorGapCode, token: string | undefined, message: string) {
    super(message); this.name = 'ThemeColorGap'; this.code = code; this.token = token;
  }
}

// Pixel readback is eight-bit. Reject explicitly fractional computed alpha too,
// so a value such as .9999 cannot round to 255 and masquerade as an opaque role.
function hasFractionalAlpha(color: string): boolean {
  const alpha = color.match(/\/\s*([\d.]+%?)\s*\)$/)?.[1]
    ?? color.match(/^rgba?\([^,]+,[^,]+,[^,]+,\s*([\d.]+%?)\s*\)$/i)?.[1];
  if (alpha === undefined) return false;
  return Number.parseFloat(alpha) / (alpha.endsWith('%') ? 100 : 1) < 1;
}

/** Snapshot host-owned CSS roles when mounting or explicitly changing theme.
 * There is no observer, retained DOM or sampling loop. Browser color parsing
 * handles var(), currentColor and modern color spaces; output is 8-bit sRGB
 * normalized for graphics uniforms, not linear-light or wide-gamut RGB. */
export function readThemeColors<const Key extends string>(host: HTMLElement,
  roles: Readonly<Record<Key, `--${string}`>>): Readonly<Record<Key, ThemeRGB>>;
export function readThemeColors(host: HTMLElement,
  roles: Readonly<Record<string, `--${string}`>>): Readonly<Record<string, ThemeRGB>> {
  const document = host.ownerDocument, window = document.defaultView;
  const requireHost = () => {
    if (!host.isConnected || !window || host.ownerDocument !== document)
      throw new ThemeColorGap('detached-host', undefined, 'Read theme colors from a connected host in its live document.');
  };
  requireHost();
  if (!window) throw new ThemeColorGap('detached-host', undefined, 'The theme host needs a live document window.');
  const probe = document.createElement('span'), canvas = document.createElement('canvas');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.setProperty('display', 'none', 'important');
  probe.style.setProperty('color', 'inherit', 'important');
  canvas.width = 1; canvas.height = 1;
  let token: string | undefined;
  try {
    host.append(probe);
    const context = canvas.getContext('2d', { colorSpace: 'srgb', willReadFrequently: true });
    if (!context) throw new ThemeColorGap('canvas-unavailable', undefined, 'A 2D canvas is required to resolve theme colors to sRGB.');
    const hostStyle = window.getComputedStyle(host), cache = new Map<string, ThemeRGB>();
    const entries = Object.entries(roles).map(([role, variable]): readonly [string, ThemeRGB] => {
      token = variable;
      if (!/^--[-_a-zA-Z0-9]+$/.test(variable))
        throw new ThemeColorGap('invalid-token', token, 'Theme roles must name an ASCII CSS custom property.');
      const cached = cache.get(variable); if (cached) return [role, cached];
      const value = hostStyle.getPropertyValue(variable).trim();
      if (!value) throw new ThemeColorGap('missing-token', token, `Theme color ${variable} is missing or unresolved.`);
      if (!window.CSS.supports('background-color', value))
        throw new ThemeColorGap('invalid-color', token, `Theme value ${variable} is not a supported CSS color.`);
      probe.style.setProperty('background-color', value, 'important');
      const resolved = window.getComputedStyle(probe).backgroundColor;
      // Canvas silently retains its previous fill on unsupported input. Two
      // distinct sentinels detect that without reserving any valid theme color.
      context.fillStyle = '#010203'; context.fillStyle = resolved; const first = context.fillStyle;
      context.fillStyle = '#040506'; context.fillStyle = resolved;
      if (first !== context.fillStyle)
        throw new ThemeColorGap('invalid-color', token, `Canvas cannot represent theme color ${variable}.`);
      context.clearRect(0, 0, 1, 1); context.fillRect(0, 0, 1, 1);
      const rgba = context.getImageData(0, 0, 1, 1).data;
      if (rgba.length !== 4 || [...rgba].some(channel => !Number.isInteger(channel) || channel < 0 || channel > 255))
        throw new ThemeColorGap('read-failed', token, `Could not read sRGB channels for ${variable}.`);
      if (rgba[3] !== 255 || hasFractionalAlpha(resolved) || hasFractionalAlpha(String(context.fillStyle)))
        throw new ThemeColorGap('translucent-color', token, `Theme color ${variable} needs an explicit opaque role before it can be used as RGB.`);
      const rgb: ThemeRGB = Object.freeze([rgba[0]! / 255, rgba[1]! / 255, rgba[2]! / 255]);
      cache.set(variable, rgb); return [role, rgb];
    });
    requireHost();
    return Object.freeze(Object.fromEntries(entries));
  } catch (error) {
    if (error instanceof ThemeColorGap) throw error;
    throw new ThemeColorGap('read-failed', token,
      `Could not resolve theme colors: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    probe.remove();
    // Releasing the backing store also covers context/readback failures.
    canvas.width = 0; canvas.height = 0;
  }
}
