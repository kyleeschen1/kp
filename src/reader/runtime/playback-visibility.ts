type Registration = { pause(): void; since: number; active: boolean };
type VisibilityOwner = {
  targets: Map<Element, Set<Registration>>;
  observer: IntersectionObserver;
  hidden(): void;
  notify(registration: Registration): void;
};

// Documents own browser visibility resources; individual sessions retain their
// clocks and disposal. A WeakMap also keeps iframe documents independent.
const owners = new WeakMap<Document, VisibilityOwner>();

/** Pause on viewport exit or document hiding. Reentry never resumes or seeks.
 * This observes visibility changes, not permission to start hidden playback. */
export function watchPlayback(target: Element, pause: () => void, signal: AbortSignal): void {
  if (signal.aborted) return;
  const document = target.ownerDocument;
  const view = document.defaultView;
  if (!view) throw new Error("Playback visibility requires an attached document");
  let owner = owners.get(document);
  if (!owner) {
    const targets = new Map<Element, Set<Registration>>();
    const notify = (registration: Registration) => {
      if (!registration.active) return;
      // Separate DOM listeners used to isolate caller failures. Sharing their
      // delivery must still pause the other cards and report the original error.
      try { registration.pause(); }
      catch (error) { view.reportError(error); }
    };
    const hidden = () => {
      if (document.hidden) {
        for (const registrations of [...targets.values()]) {
          for (const registration of [...registrations]) notify(registration);
        }
      }
    };
    const observer = new view.IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) continue;
        for (const registration of [...(targets.get(entry.target) ?? [])]) {
          // A queued exit from an earlier binding must not pause a new owner.
          if (entry.time >= registration.since) notify(registration);
        }
      }
    });
    owner = { targets, observer, hidden, notify };
    owners.set(document, owner);
    document.addEventListener("visibilitychange", hidden);
  }
  const registration: Registration = { pause, since: view.performance.now(), active: true };
  let registrations = owner.targets.get(target);
  if (!registrations) {
    registrations = new Set();
    owner.targets.set(target, registrations);
    owner.observer.observe(target);
  }
  registrations.add(registration);
  const current = owner;
  signal.addEventListener("abort", () => {
    registration.active = false;
    registrations.delete(registration);
    if (!registrations.size) {
      current.observer.unobserve(target);
      current.targets.delete(target);
    }
    if (!current.targets.size) {
      current.observer.disconnect();
      document.removeEventListener("visibilitychange", current.hidden);
      owners.delete(document);
    }
  }, { once: true });
  // Registration while hidden has the same error isolation as later events.
  if (document.hidden) owner.notify(registration);
}
