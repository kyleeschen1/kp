export interface ShortcutKey { key: string; code?: string; ctrlKey: boolean; altKey: boolean; metaKey: boolean; shiftKey: boolean; repeat: boolean; isComposing: boolean }
/** A prefix is consumed once, never replayed as Cut into an editor. Any unrelated
 * key, focus change, composition or expiry cancels it and keeps ordinary input. */
export class CommandShortcut {
  private pending = false;
  private began = 0;
  reset() { this.pending = false; }
  next(event: ShortcutKey, now: number): 'open' | 'prefix' | 'pass' {
    if (event.isComposing) { this.reset(); return 'pass'; }
    if (['Control', 'Alt', 'Meta', 'Shift'].includes(event.key)) return 'pass';
    const x = event.code === 'KeyX' || event.key.toLowerCase() === 'x';
    if (x && event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.repeat) { this.reset(); return 'open'; }
    if (x && event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey) {
      if (event.repeat) return 'prefix';
      if (this.pending && now - this.began <= 1800) { this.reset(); return 'open'; }
      this.pending = true; this.began = now; return 'prefix';
    }
    this.reset(); return 'pass';
  }
}
