import { allowsObjectParent, objectProtocol, readObjectRequest, type ObjectDescriptor } from './object-protocol.ts';
import type { compileFractionNotebook } from './compile.ts';
import './object-host.css';

const frame = document.querySelector<HTMLIFrameElement>('#object-player')!;
let session = '', origin = '', generation = 0, sequence = 0, ready = false;
let descriptor: ObjectDescriptor | undefined;
let controller: AbortController | undefined;
let pending: { request: number; revision: number } | undefined;
const native = (message: object) => frame.contentWindow?.postMessage({ protocol: 'kp.fraction-notebook.v1', ...message }, location.origin);
const reply = (message: object) => { if (session) window.parent.postMessage({ protocol: objectProtocol, session, ...message }, origin); };
const opened = () => { if (ready && descriptor) reply({ kind: 'opened', object: descriptor }); };
const invalidate = () => { generation++; controller?.abort(); controller = undefined; pending = undefined; };

window.addEventListener('message', async event => {
  if (event.source === frame.contentWindow && event.origin === location.origin) {
    const data = event.data;
    if (!data || data.protocol !== 'kp.fraction-notebook.v1') return;
    if (data.kind === 'ready') { ready = true; native({ kind: 'presentation', animationOnly: true }); opened(); }
    if (data.kind === 'applied' && pending && pending.revision === data.revision) {
      reply({ kind: 'accepted', request: pending.request }); pending = undefined;
    }
    if (data.kind === 'error' && pending) { reply({ kind: 'rejected', request: pending.request, message: data.message }); pending = undefined; }
    return;
  }
  if (event.source !== window.parent || !allowsObjectParent(event.origin)) return;
  const message = readObjectRequest(event.data);
  if (!message) return;
  if (message.kind === 'open') {
    invalidate(); session = message.session; origin = event.origin; descriptor = undefined; sequence = 0;
    const current = generation;
    controller = new AbortController();
    try {
      const response = await fetch('/api/dev/fraction-object', { signal: controller.signal });
      if (!response.ok) throw new Error('KP object is unavailable.');
      const data: ObjectDescriptor = await response.json();
      if (current !== generation) return;
      descriptor = data; opened();
    } catch (error) { if (current === generation) reply({ kind: 'error', message: String(error) }); }
    return;
  }
  if (message.session !== session || event.origin !== origin || message.request <= sequence) return;
  sequence = message.request; invalidate();
  if (message.kind === 'cancel') return;
  const current = generation;
  controller = new AbortController();
  try {
    if (!ready || !descriptor) throw new Error('Reconnect before previewing.');
    const response = await fetch('/api/dev/fraction-object', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: message.id, revision: message.revision, source: message.source }), signal: controller.signal });
    const data: ReturnType<typeof compileFractionNotebook> & { error?: string } = await response.json();
    if (current !== generation) return;
    if (!response.ok) throw new Error(data.error ?? 'KP rejected the preview.');
    // Revision is an acknowledgement token, not a published notebook revision.
    const revision = generation;
    pending = { request: message.request, revision };
    native({ kind: 'apply', value: { ...data, notebook: { ...data.notebook, revision } } });
  } catch (error) { if (current === generation) reply({ kind: 'rejected', request: message.request, message: String(error) }); }
});
window.addEventListener('pagehide', invalidate);
// Install the receiver before navigation: a warm child must not report ready
// before the host is listening, leaving the parent permanently disconnected.
frame.src = '/reader/fraction-notebook-preview/';
